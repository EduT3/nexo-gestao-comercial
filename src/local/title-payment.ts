import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { appendCashMovement } from './cash.js';
import type { LocalDatabase } from './sqlite.js';

export const paymentSchema = z.object({ method: z.enum(['CASH','PIX','DEBIT','CREDIT']), notes: z.string().trim().max(1000).default('') }).strict();
export const reversalSchema = z.object({ reason: z.string().trim().min(2).max(1000) }).strict();
export async function cashEffect(tx: LocalDatabase, actor: string, company: string, amount: bigint, id: string) {
  const cash = (await tx.query('SELECT id,actor_id FROM local_cash_sessions WHERE company_id=? AND closed=0', [company]))[0];
  if (!cash) throw new Error('Abra o caixa antes de movimentar dinheiro.');
  if (cash.actor_id !== actor) throw new Error('O caixa aberto pertence a outro operador.');
  await appendCashMovement(tx, { companyId: company, sessionId: String(cash.id), actorId: actor, amountCents: amount, reason: amount < 0n ? 'WITHDRAWAL' : 'REVERSAL', operationId: id });
}
export async function audit(tx: LocalDatabase, actor: string, company: string, action: string, id: string, input: unknown) {
  await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, actor, action, id, JSON.stringify(input)]);
}
