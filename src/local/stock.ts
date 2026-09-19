import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { LocalDatabase } from './sqlite.js';
import { authorizeLocalCatalog } from './catalog.js';

/** Internal transaction primitive: purchase/sale own authorization and audit. */
export async function appendStockMovement(tx: LocalDatabase, input: {
  companyId: string; productId: string; actorId: string; quantityMilli: bigint;
  unitCostCents: bigint; reason: 'OPENING' | 'PURCHASE' | 'SALE' | 'REVERSAL' | 'ADJUSTMENT'; operationId: string;
}) {
  if (input.quantityMilli === 0n || input.unitCostCents < 0n) throw new Error('Quantidade ou custo inválido.');
  const product = (await tx.query('SELECT active FROM local_products WHERE company_id=? AND id=?', [input.companyId, input.productId]))[0];
  if (!product) throw new Error('Produto não encontrado nesta empresa.');
  if (product.active !== 1n && input.reason !== 'REVERSAL') throw new Error('Produto inativo. Reative o cadastro para movimentar.');
  const rows = await tx.query('SELECT quantity_milli FROM local_stock_movements WHERE company_id=? AND product_id=?', [input.companyId, input.productId]);
  const balance = rows.reduce((total, row) => total + BigInt(String(row.quantity_milli)), 0n);
  const next = balance + input.quantityMilli;
  if (next < 0n) throw new Error('Estoque insuficiente para esta operação.');
  if (next > 9223372036854775807n) throw new Error('Saldo de estoque acima do limite permitido.');
  const id = randomUUID();
  await tx.query('INSERT INTO local_stock_movements(id,company_id,product_id,actor_id,quantity_milli,unit_cost_cents,reason,operation_id) VALUES(?,?,?,?,?,?,?,?)',
    [id, input.companyId, input.productId, input.actorId, input.quantityMilli, input.unitCostCents, input.reason, input.operationId]);
  return { id, balanceMilli: next };
}

export async function listLocalStock(db: LocalDatabase, userId: string, companyId: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, false);
    return tx.query(`SELECT p.id,p.name,p.internal_code,p.unit,p.stock_min_milli,COALESCE(SUM(m.quantity_milli),0) AS balance_milli
      FROM local_products p LEFT JOIN local_stock_movements m ON m.company_id=p.company_id AND m.product_id=p.id
      WHERE p.company_id=? GROUP BY p.id ORDER BY p.name,p.id`, [companyId]);
  });
}

const historyFilter = z.object({ productId: z.string().uuid().nullable().default(null), offset: z.number().int().min(0).max(1000000).default(0) }).strict();
export async function listLocalStockHistory(db: LocalDatabase, actor: string, company: string, input: unknown = {}) {
 const filter = historyFilter.parse(input);
 return db.transaction(async tx => {
  await authorizeLocalCatalog(tx, actor, company, false);
  if (filter.productId && !(await tx.query('SELECT id FROM local_products WHERE company_id=? AND id=?', [company, filter.productId])).length) throw new Error('Produto não encontrado nesta empresa.');
  const rows = await tx.query(`SELECT m.id,m.product_id,p.name,p.internal_code,p.unit,m.quantity_milli,m.reason,m.operation_id,m.created_at,u.name AS actor_name FROM local_stock_movements m JOIN local_products p ON p.company_id=m.company_id AND p.id=m.product_id JOIN local_users u ON u.id=m.actor_id WHERE m.company_id=? AND (? IS NULL OR m.product_id=?) ORDER BY m.created_at DESC,m.rowid DESC LIMIT 51 OFFSET ?`, [company, filter.productId, filter.productId, filter.offset]);
  return { rows: rows.slice(0,50), hasMore: rows.length > 50 };
 });
}
