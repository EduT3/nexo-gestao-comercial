import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { saleSchema, operationKeySchema } from '../server/modules/sales/schemas.js';
import { quantityToMilli, itemTotalCents } from '../shared/scaled.js';
import { authorizeLocalCatalog } from './catalog.js';
import { appendStockMovement } from './stock.js';
import { appendCashMovement } from './cash.js';
import type { LocalDatabase } from './sqlite.js';
const localSaleSchema = saleSchema.safeExtend({ receivedCents: z.number().int().min(0).max(9_999_999_999).nullable().default(null) });
export async function confirmLocalSale(db: LocalDatabase, actor: string, company: string, key: string, input: unknown) {
  operationKeySchema.parse(key); const body = localSaleSchema.parse(input); const payload = JSON.stringify(body);
  return db.transaction(async tx => {
    const role = await authorizeLocalCatalog(tx, actor, company, false);
    if (body.discountCents > 0 && role !== 'ADMIN') throw new Error('Seu perfil não permite aplicar desconto.');
    const previous = (await tx.query('SELECT id,request_payload,total_cents FROM local_sales WHERE company_id=? AND request_key=?', [company, key]))[0];
    if (previous) {
      if (previous.request_payload !== payload) throw new Error('Tentativa já usada em outra venda.');
      const payment = (await tx.query('SELECT change_cents FROM local_sale_payments WHERE company_id=? AND sale_id=?', [company, String(previous.id)]))[0];
      return { id: String(previous.id), totalCents: BigInt(String(previous.total_cents)), changeCents: BigInt(String(payment?.change_cents)), replayed: true };
    }
    const session = (await tx.query('SELECT id,actor_id FROM local_cash_sessions WHERE company_id=? AND closed=0', [company]))[0];
    if (!session) throw new Error('Abra o caixa antes de registrar uma venda.');
    if (session.actor_id !== actor) throw new Error('O caixa aberto pertence a outro operador.');
    if (body.customerId) {
      const customer = (await tx.query('SELECT active FROM local_customers WHERE company_id=? AND id=?', [company, body.customerId]))[0];
      if (!customer || customer.active !== 1n) throw new Error('Selecione um cliente ativo desta empresa.');
    }
    let subtotal = 0n; const items = [];
    for (const item of body.items) {
      const product = (await tx.query('SELECT name,active,price_cents,cost_cents FROM local_products WHERE company_id=? AND id=?', [company, item.productId]))[0];
      if (!product || product.active !== 1n) throw new Error('Selecione produtos ativos desta empresa.');
      const quantity = quantityToMilli(item.quantity); const price = BigInt(String(product.price_cents)); const cost = BigInt(String(product.cost_cents));
      const total = itemTotalCents(quantity, price); subtotal += total;
      if (subtotal > 9223372036854775807n) throw new Error('Total acima do limite permitido.');
      items.push({ productId: item.productId, name: String(product.name), quantity, price, cost, total });
    }
    const discount = BigInt(body.discountCents); if (discount > subtotal) throw new Error('O desconto não pode superar o subtotal.');
    const total = subtotal - discount; const received = body.receivedCents === null ? total : BigInt(body.receivedCents);
    if (received < total) throw new Error('O valor recebido não cobre o total da venda.');
    if (body.paymentMethod !== 'CASH' && received !== total) throw new Error('Troco só pode ser calculado para pagamento em dinheiro.');
    const id = randomUUID(); const sessionId = String(session.id);
    await tx.query('INSERT INTO local_sales(id,company_id,session_id,customer_id,actor_id,request_key,request_payload,subtotal_cents,discount_cents,total_cents,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [id, company, sessionId, body.customerId, actor, key, payload, subtotal, discount, total, body.notes]);
    for (const item of items) {
      await tx.query('INSERT INTO local_sale_items VALUES(?,?,?,?,?,?,?,?)', [company, id, item.productId, item.name, item.quantity, item.price, item.cost, item.total]);
      await appendStockMovement(tx, { companyId: company, productId: item.productId, actorId: actor, quantityMilli: -item.quantity, unitCostCents: item.cost, reason: 'SALE', operationId: id });
    }
    await tx.query('INSERT INTO local_sale_payments VALUES(?,?,?,?,?,?)', [company, id, body.paymentMethod, total, received, received-total]);
    // Cash balance represents physical money; electronic payments are recorded separately.
    if (body.paymentMethod === 'CASH' && total > 0n) await appendCashMovement(tx, { companyId: company, sessionId, actorId: actor, amountCents: total, reason: 'SALE', operationId: id });
    await tx.query('INSERT INTO local_sale_revenues VALUES(?,?,?)', [company, id, total]);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, actor, 'sale.confirmed', id, payload]);
    return { id, totalCents: total, changeCents: received-total, replayed: false };
  });
}
export async function listLocalSales(db: LocalDatabase, actor: string, company: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    return tx.query(`SELECT s.id,s.total_cents,s.created_at,p.method,p.change_cents,CASE WHEN c.id IS NULL THEN 'CONFIRMED' ELSE 'CANCELLED' END AS status,c.reason AS cancellation_reason FROM local_sales s JOIN local_sale_payments p ON p.company_id=s.company_id AND p.sale_id=s.id LEFT JOIN local_sale_cancellations c ON c.company_id=s.company_id AND c.sale_id=s.id WHERE s.company_id=? ORDER BY s.created_at DESC,s.id LIMIT 100`, [company]);
  });
}
