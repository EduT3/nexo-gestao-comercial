import { randomUUID } from 'node:crypto';
import { z } from 'zod';
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
export async function payLocalPayable(db: LocalDatabase, actor: string, company: string, payableId: string, key: string, input: unknown) {
  z.string().uuid().parse(payableId); z.string().uuid().parse(key); const body = paymentSchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,payable_id,method,notes FROM local_payable_payments WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) { if (previous.payable_id !== payableId || previous.method !== body.method || previous.notes !== body.notes) throw new Error('Tentativa já usada em outro pagamento.'); return { id: String(previous.id), replayed: true }; }
    const payable = (await tx.query('SELECT amount_cents FROM local_purchase_payables WHERE company_id=? AND id=?', [company, payableId]))[0];
    if (!payable) throw new Error('Conta a pagar não encontrada nesta empresa.');
    const active = await tx.query('SELECT p.id FROM local_payable_payments p WHERE p.company_id=? AND p.payable_id=? AND NOT EXISTS(SELECT 1 FROM local_payable_reversals r WHERE r.company_id=p.company_id AND r.payment_id=p.id)', [company, payableId]);
    if (active.length) throw new Error('Esta conta já está paga.');
    const id = randomUUID(); const amount = BigInt(String(payable.amount_cents));
    if (body.method === 'CASH') await cashEffect(tx, actor, company, -amount, id);
    await tx.query('INSERT INTO local_payable_payments(id,company_id,payable_id,actor_id,method,amount_cents,notes,request_key) VALUES(?,?,?,?,?,?,?,?)', [id, company, payableId, actor, body.method, amount, body.notes, key]);
    await audit(tx, actor, company, 'payable.paid', id, { payableId, ...body, amountCents: amount.toString() });
    return { id, replayed: false };
  });
}
export async function reverseLocalPayablePayment(db: LocalDatabase, actor: string, company: string, paymentId: string, key: string, input: unknown) {
  z.string().uuid().parse(paymentId); z.string().uuid().parse(key); const body = reversalSchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,payment_id,reason FROM local_payable_reversals WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) { if (previous.payment_id !== paymentId || previous.reason !== body.reason) throw new Error('Tentativa já usada em outro estorno.'); return { id: String(previous.id), replayed: true }; }
    const payment = (await tx.query('SELECT method,amount_cents FROM local_payable_payments WHERE company_id=? AND id=?', [company, paymentId]))[0];
    if (!payment) throw new Error('Pagamento não encontrado nesta empresa.');
    if ((await tx.query('SELECT id FROM local_payable_reversals WHERE company_id=? AND payment_id=?', [company, paymentId])).length) throw new Error('Pagamento já estornado.');
    const id = randomUUID();
    if (payment.method === 'CASH') await cashEffect(tx, actor, company, BigInt(String(payment.amount_cents)), id);
    await tx.query('INSERT INTO local_payable_reversals(id,company_id,payment_id,actor_id,reason,request_key) VALUES(?,?,?,?,?,?)', [id, company, paymentId, actor, body.reason, key]);
    await audit(tx, actor, company, 'payable.payment_reversed', id, { paymentId, ...body });
    return { id, replayed: false };
  });
}