import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
const cents = z.number().int().min(0).max(9_999_999_999);
const opening = z.object({ openingCents: cents }).strict();
const closing = z.object({ countedCents: cents, notes: z.string().trim().max(1000).default('') }).strict();
async function audit(tx: LocalDatabase, actor: string, company: string, action: string, id: string, input: unknown) {
  await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, actor, action, id, JSON.stringify(input)]);
}
export async function openLocalCash(db: LocalDatabase, actor: string, company: string, key: string, input: unknown) {
  z.string().uuid().parse(key); const body = opening.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    const previous = (await tx.query('SELECT id,opening_cents FROM local_cash_sessions WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) {
      if (previous.opening_cents !== BigInt(body.openingCents)) throw new Error('Tentativa já usada com outro valor.');
      return { id: String(previous.id), replayed: true };
    }
    if ((await tx.query('SELECT id FROM local_cash_sessions WHERE company_id=? AND closed=0', [company])).length) throw new Error('Já existe um caixa aberto nesta empresa.');
    const id = randomUUID();
    await tx.query('INSERT INTO local_cash_sessions(id,company_id,actor_id,opening_cents,request_key) VALUES(?,?,?,?,?)', [id, company, actor, body.openingCents, key]);
    await audit(tx, actor, company, 'cash.opened', id, body);
    return { id, replayed: false };
  });
}
export async function closeLocalCash(db: LocalDatabase, actor: string, company: string, session: string, input: unknown) {
  const body = closing.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    const cash = (await tx.query('SELECT opening_cents,closed,actor_id FROM local_cash_sessions WHERE company_id=? AND id=?', [company, session]))[0];
    if (!cash) throw new Error('Caixa não encontrado nesta empresa.');
    if (cash.actor_id !== actor) throw new Error('O caixa pertence a outro operador.');
    const previous = (await tx.query('SELECT counted_cents,notes FROM local_cash_closures WHERE company_id=? AND session_id=?', [company, session]))[0];
    if (previous) {
      if (previous.counted_cents !== BigInt(body.countedCents) || previous.notes !== body.notes) throw new Error('Caixa já fechado com outros valores.');
      return { id: session, replayed: true };
    }
    if (cash.closed === 1n) throw new Error('Caixa já fechado.');
    const movements = await tx.query('SELECT amount_cents FROM local_cash_movements WHERE company_id=? AND session_id=?', [company, session]);
    const expected = movements.reduce((sum, row) => sum + BigInt(String(row.amount_cents)), BigInt(String(cash.opening_cents)));
    await tx.query('INSERT INTO local_cash_closures(company_id,session_id,actor_id,expected_cents,counted_cents,notes) VALUES(?,?,?,?,?,?)', [company, session, actor, expected, body.countedCents, body.notes]);
    await tx.query('UPDATE local_cash_sessions SET closed=1 WHERE company_id=? AND id=?', [company, session]);
    await audit(tx, actor, company, 'cash.closed', session, { ...body, expectedCents: expected.toString() });
    return { id: session, replayed: false };
  });
}
const movement = z.object({ sessionId: z.string().uuid(), kind: z.enum(['SUPPLY', 'WITHDRAWAL']), amountCents: cents.min(1), notes: z.string().trim().min(2).max(1000) }).strict();
/** Internal primitive; caller owns business authorization and transaction. */
export async function appendCashMovement(tx: LocalDatabase, input: {
  companyId: string; sessionId: string; actorId: string; amountCents: bigint;
  reason: 'SUPPLY' | 'WITHDRAWAL' | 'SALE' | 'REVERSAL'; operationId: string;
}) {
  const session = (await tx.query('SELECT opening_cents,closed,actor_id FROM local_cash_sessions WHERE company_id=? AND id=?', [input.companyId, input.sessionId]))[0];
  if (!session) throw new Error('Caixa não encontrado nesta empresa.');
  if (session.actor_id !== input.actorId) throw new Error('O caixa pertence a outro operador.');
  if (session.closed === 1n) throw new Error('Caixa fechado. Abra um caixa para movimentar.');
  if (input.amountCents === 0n) throw new Error('Informe um valor maior que zero.');
  if ((input.reason === 'SUPPLY' || input.reason === 'SALE') && input.amountCents < 0n) throw new Error('Entrada de caixa precisa ter valor positivo.');
  if (input.reason === 'WITHDRAWAL' && input.amountCents > 0n) throw new Error('Sangria precisa reduzir o saldo.');
  const rows = await tx.query('SELECT amount_cents FROM local_cash_movements WHERE company_id=? AND session_id=?', [input.companyId, input.sessionId]);
  const balance = rows.reduce((sum, row) => sum + BigInt(String(row.amount_cents)), BigInt(String(session.opening_cents))) + input.amountCents;
  if (balance < 0n) throw new Error('Saldo de caixa insuficiente.');
  if (balance > 9223372036854775807n) throw new Error('Saldo acima do limite permitido.');
  const id = randomUUID();
  await tx.query('INSERT INTO local_cash_movements(id,company_id,session_id,actor_id,amount_cents,reason,operation_id) VALUES(?,?,?,?,?,?,?)', [id, input.companyId, input.sessionId, input.actorId, input.amountCents, input.reason, input.operationId]);
  return { id, balanceCents: balance };
}
export async function moveLocalCash(db: LocalDatabase, actor: string, company: string, key: string, input: unknown) {
  z.string().uuid().parse(key); const body = movement.parse(input);
  return db.transaction(async tx => {
    // Manual adjustments require an administrator; sales use the internal primitive.
    await authorizeLocalCatalog(tx, actor, company, true);
    const amount = BigInt(body.amountCents) * (body.kind === 'WITHDRAWAL' ? -1n : 1n);
    const previous = (await tx.query('SELECT id,session_id,amount_cents,reason FROM local_cash_movements WHERE company_id=? AND operation_id=?', [company, key]))[0];
    if (previous) {
      const entry = (await tx.query("SELECT details FROM local_audit WHERE company_id=? AND action='cash.moved' AND entity_id=?", [company, String(previous.id)]))[0];
      if (previous.session_id !== body.sessionId || previous.amount_cents !== amount || previous.reason !== body.kind || entry?.details !== JSON.stringify(body)) throw new Error('Tentativa já usada em outro movimento.');
      return { id: String(previous.id), replayed: true };
    }
    const result = await appendCashMovement(tx, { companyId: company, sessionId: body.sessionId, actorId: actor, amountCents: amount, reason: body.kind, operationId: key });
    await audit(tx, actor, company, 'cash.moved', result.id, body);
    return { id: result.id, replayed: false };
  });
}
export async function listLocalCash(db: LocalDatabase, actor: string, company: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    const sessions = await tx.query('SELECT s.id,s.actor_id,u.name AS actor_name,s.opening_cents,s.closed,s.created_at FROM local_cash_sessions s JOIN local_users u ON u.id=s.actor_id WHERE s.company_id=? ORDER BY s.closed ASC,s.created_at DESC,s.id LIMIT 100', [company]);
    const movements = await tx.query(`SELECT m.id,m.session_id,m.amount_cents,m.created_at,CASE a.action WHEN 'payable.paid' THEN 'PAYMENT' WHEN 'payable.payment_reversed' THEN 'PAYMENT_REVERSAL' WHEN 'receivable.received' THEN 'RECEIPT' WHEN 'receivable.receipt_reversed' THEN 'RECEIPT_REVERSAL' ELSE m.reason END AS reason FROM local_cash_movements m LEFT JOIN local_audit a ON a.company_id=m.company_id AND a.entity_id=m.operation_id AND a.action IN('payable.paid','payable.payment_reversed','receivable.received','receivable.receipt_reversed') WHERE m.company_id=? ORDER BY m.created_at,m.id`, [company]);
    const closures = await tx.query('SELECT session_id,expected_cents,counted_cents,notes FROM local_cash_closures WHERE company_id=?', [company]);
    return sessions.map(session => ({ ...session, can_operate: session.actor_id === actor, id: String(session.id), closed: BigInt(String(session.closed)),
      balance_cents: movements.filter(row => row.session_id === session.id).reduce((sum, row) => sum + BigInt(String(row.amount_cents)), BigInt(String(session.opening_cents))),
      movements: movements.filter(row => row.session_id === session.id),
      closure: closures.find(row => row.session_id === session.id) ?? null,
    }));
  });
}


/** Read only the open session, independent of the historical list's window. */
export async function getLocalCashAvailability(db: LocalDatabase, actor: string, company: string): Promise<import('../shared/cash-status.js').CashAvailability> {
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,false);
  const row=(await tx.query('SELECT s.id,s.actor_id,s.created_at,s.opening_cents,u.name AS operator_name FROM local_cash_sessions s JOIN local_users u ON u.id=s.actor_id WHERE s.company_id=? AND s.closed=0',[company]))[0];
  if(!row)return {open:false};
  const movements=await tx.query('SELECT amount_cents FROM local_cash_movements WHERE company_id=? AND session_id=?',[company,String(row.id)]);
  return {open:true,canSell:row.actor_id===actor,operatorName:String(row.operator_name),openedAt:String(row.created_at),balanceCents:movements.reduce((total,value)=>total+BigInt(String(value.amount_cents)),BigInt(String(row.opening_cents)))};
 });
}
