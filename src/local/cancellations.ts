import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { operationKeySchema } from '../server/modules/sales/schemas.js';
import { authorizeLocalCatalog } from './catalog.js';
import { appendStockMovement } from './stock.js';
import { appendCashMovement } from './cash.js';
import type { LocalDatabase } from './sqlite.js';
const cancellation = z.object({ reason: z.string().trim().min(2).max(1000) }).strict();
export async function cancelLocalSale(db: LocalDatabase, actor: string, company: string, saleId: string, key: string, input: unknown) {
  operationKeySchema.parse(key); z.string().uuid().parse(saleId); const body = cancellation.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const previous = (await tx.query('SELECT id,sale_id,reason FROM local_sale_cancellations WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) {
      if (previous.sale_id !== saleId || previous.reason !== body.reason) throw new Error('Tentativa já usada em outro cancelamento.');
      return { id: String(previous.id), replayed: true };
    }
    const sale = (await tx.query('SELECT total_cents FROM local_sales WHERE company_id=? AND id=?', [company, saleId]))[0];
    if (!sale) throw new Error('Venda não encontrada nesta empresa.');
    if ((await tx.query('SELECT id FROM local_sale_cancellations WHERE company_id=? AND sale_id=?', [company, saleId])).length) throw new Error('Venda já cancelada.');
    const payment = (await tx.query('SELECT method,amount_cents FROM local_sale_payments WHERE company_id=? AND sale_id=?', [company, saleId]))[0];
    const revenue = (await tx.query('SELECT amount_cents FROM local_sale_revenues WHERE company_id=? AND sale_id=?', [company, saleId]))[0];
    const items = await tx.query('SELECT product_id,quantity_milli,unit_cost_cents FROM local_sale_items WHERE company_id=? AND sale_id=?', [company, saleId]);
    if (!payment || !revenue || !items.length || payment.amount_cents !== sale.total_cents || revenue.amount_cents !== sale.total_cents) throw new Error('Os registros da venda estão incompletos. Recupere uma cópia de segurança válida.');
    const id = randomUUID(); const amount = BigInt(String(sale.total_cents));
    // Refund uses today's open cash; never modifies an already closed cash session.
    if (payment.method === 'CASH' && amount > 0n) {
      const cash = (await tx.query('SELECT id,actor_id FROM local_cash_sessions WHERE company_id=? AND closed=0', [company]))[0];
      if (!cash) throw new Error('Abra o caixa antes de devolver dinheiro.');
      if (cash.actor_id !== actor) throw new Error('O caixa aberto pertence a outro operador.');
      await appendCashMovement(tx, { companyId: company, sessionId: String(cash.id), actorId: actor, amountCents: -amount, reason: 'REVERSAL', operationId: id });
    }
    for (const item of items) await appendStockMovement(tx, { companyId: company, productId: String(item.product_id), actorId: actor, quantityMilli: BigInt(String(item.quantity_milli)), unitCostCents: BigInt(String(item.unit_cost_cents)), reason: 'REVERSAL', operationId: id });
    await tx.query('INSERT INTO local_sale_cancellations(id,company_id,sale_id,actor_id,reason,request_key,amount_cents) VALUES(?,?,?,?,?,?,?)', [id, company, saleId, actor, body.reason, key, amount]);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, actor, 'sale.cancelled', saleId, JSON.stringify({ cancellationId: id, reason: body.reason, amountCents: amount.toString() })]);
    return { id, replayed: false };
  });
}