import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createReceivableSchema } from '../server/modules/finance/schemas.js';
import { authorizeLocalCatalog } from './catalog.js';
import { appendCashMovement } from './cash.js';
import type { LocalDatabase } from './sqlite.js';
const paymentSchema = z.object({ method: z.enum(['CASH','PIX','DEBIT','CREDIT']), notes: z.string().trim().max(1000).default('') }).strict();
const reversalSchema = z.object({ reason: z.string().trim().min(2).max(1000) }).strict();
async function cashEffect(tx: LocalDatabase, actor: string, company: string, amount: bigint, id: string) {
  const cash = (await tx.query('SELECT id,actor_id FROM local_cash_sessions WHERE company_id=? AND closed=0', [company]))[0];
  if (!cash) throw new Error('Abra o caixa antes de movimentar dinheiro.');
  if (cash.actor_id !== actor) throw new Error('O caixa aberto pertence a outro operador.');
  await appendCashMovement(tx, { companyId: company, sessionId: String(cash.id), actorId: actor, amountCents: amount, reason: amount < 0n ? 'WITHDRAWAL' : 'REVERSAL', operationId: id });
}
async function audit(tx: LocalDatabase, actor: string, company: string, action: string, id: string, input: unknown) {
  await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, actor, action, id, JSON.stringify(input)]);
}
export async function receiveLocalReceivable(db: LocalDatabase, actor: string, company: string, receivableId: string, key: string, input: unknown) {
  z.string().uuid().parse(receivableId); z.string().uuid().parse(key); const body = paymentSchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,receivable_id,method,notes FROM local_receivable_receipts WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) { if (previous.receivable_id !== receivableId || previous.method !== body.method || previous.notes !== body.notes) throw new Error('Tentativa já usada em outro recebimento.'); return { id: String(previous.id), replayed: true }; }
    const payable = (await tx.query('SELECT amount_cents FROM local_receivables WHERE company_id=? AND id=?', [company, receivableId]))[0];
    if (!payable) throw new Error('Conta a receber não encontrada nesta empresa.');
    const active = await tx.query('SELECT p.id FROM local_receivable_receipts p WHERE p.company_id=? AND p.receivable_id=? AND NOT EXISTS(SELECT 1 FROM local_receivable_reversals r WHERE r.company_id=p.company_id AND r.receipt_id=p.id)', [company, receivableId]);
    if (active.length) throw new Error('Esta conta já está recebida.');
    const id = randomUUID(); const amount = BigInt(String(payable.amount_cents));
    if (body.method === 'CASH') await cashEffect(tx, actor, company, amount, id);
    await tx.query('INSERT INTO local_receivable_receipts(id,company_id,receivable_id,actor_id,method,amount_cents,notes,request_key) VALUES(?,?,?,?,?,?,?,?)', [id, company, receivableId, actor, body.method, amount, body.notes, key]);
    await audit(tx, actor, company, 'receivable.received', id, { receivableId, ...body, amountCents: amount.toString() });
    return { id, replayed: false };
  });
}
export async function reverseLocalReceivableReceipt(db: LocalDatabase, actor: string, company: string, receiptId: string, key: string, input: unknown) {
  z.string().uuid().parse(receiptId); z.string().uuid().parse(key); const body = reversalSchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,receipt_id,reason FROM local_receivable_reversals WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) { if (previous.receipt_id !== receiptId || previous.reason !== body.reason) throw new Error('Tentativa já usada em outro estorno.'); return { id: String(previous.id), replayed: true }; }
    const payment = (await tx.query('SELECT method,amount_cents FROM local_receivable_receipts WHERE company_id=? AND id=?', [company, receiptId]))[0];
    if (!payment) throw new Error('Recebimento não encontrado nesta empresa.');
    if ((await tx.query('SELECT id FROM local_receivable_reversals WHERE company_id=? AND receipt_id=?', [company, receiptId])).length) throw new Error('Recebimento já estornado.');
    const id = randomUUID();
    if (payment.method === 'CASH') await cashEffect(tx, actor, company, -BigInt(String(payment.amount_cents)), id);
    await tx.query('INSERT INTO local_receivable_reversals(id,company_id,receipt_id,actor_id,reason,request_key) VALUES(?,?,?,?,?,?)', [id, company, receiptId, actor, body.reason, key]);
    await audit(tx, actor, company, 'receivable.receipt_reversed', id, { receiptId, ...body });
    return { id, replayed: false };
  });
}
export async function createLocalReceivable(db: LocalDatabase, actor: string, company: string, key: string, input: unknown) {
  z.string().uuid().parse(key); const body = createReceivableSchema.parse(input); const payload = JSON.stringify(body);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,request_payload FROM local_receivables WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) { if (previous.request_payload !== payload) throw new Error('Tentativa já usada em outra conta.'); return { id: String(previous.id), replayed: true }; }
    if (body.customerId) {
      const customer = (await tx.query('SELECT active FROM local_customers WHERE company_id=? AND id=?', [company, body.customerId]))[0];
      if (!customer || customer.active !== 1n) throw new Error('Selecione um cliente ativo desta empresa.');
    }
    const id = randomUUID();
    await tx.query('INSERT INTO local_receivables(id,company_id,customer_id,actor_id,description,category,amount_cents,due_date,notes,request_key,request_payload) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [id, company, body.customerId, actor, body.description, body.category, body.amountCents, body.dueDate, body.notes, key, payload]);
    await audit(tx, actor, company, 'receivable.created', id, body);
    return { id, replayed: false };
  });
}
export async function listLocalReceivables(db: LocalDatabase, actor: string, company: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    return tx.query(`SELECT t.id,t.description,t.amount_cents,t.due_date,c.name AS customer_name,p.id AS receipt_id,CASE WHEN p.id IS NULL THEN 'OPEN' ELSE 'RECEIVED' END AS status FROM local_receivables t LEFT JOIN local_customers c ON c.company_id=t.company_id AND c.id=t.customer_id LEFT JOIN local_receivable_receipts p ON p.company_id=t.company_id AND p.receivable_id=t.id AND NOT EXISTS(SELECT 1 FROM local_receivable_reversals r WHERE r.company_id=p.company_id AND r.receipt_id=p.id) WHERE t.company_id=? ORDER BY t.due_date,t.id`, [company]);
  });
}
