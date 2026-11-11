import {localPurchaseInput} from './purchase-input.js';
import { randomUUID } from 'node:crypto';
import { purchaseIdempotencyKeySchema } from '../server/modules/purchases/schemas.js';
import { itemTotalCents, quantityToMilli } from '../shared/scaled.js';
import { authorizeLocalCatalog } from './catalog.js';
import { appendStockMovement } from './stock.js';
import type { LocalDatabase } from './sqlite.js';

export async function listLocalPurchases(db: LocalDatabase, userId: string, companyId: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, true);
    return tx.query(`SELECT p.id,COALESCE(s.name,'Sem fornecedor informado') AS supplier_name,p.total_cents,p.created_at,t.due_date
      FROM local_purchases p LEFT JOIN local_suppliers s ON s.company_id=p.company_id AND s.id=p.supplier_id
      LEFT JOIN local_purchase_payables t ON t.company_id=p.company_id AND t.purchase_id=p.id
      WHERE p.company_id=? ORDER BY p.created_at DESC,p.id LIMIT 100`, [companyId]);
  });
}

export async function receiveLocalPurchase(db: LocalDatabase, userId: string, companyId: string, requestKey: string, input: unknown) {
  const key = purchaseIdempotencyKeySchema.parse(requestKey);
  const body = localPurchaseInput.parse(input);
  const payload = JSON.stringify(body);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, true);
    const previous = (await tx.query('SELECT id,request_payload,total_cents FROM local_purchases WHERE company_id=? AND request_key=?', [companyId, key]))[0];
    if (previous) {
      if (previous.request_payload !== payload) throw new Error('Esta tentativa já foi usada em outra compra.');
      return { id: String(previous.id), totalCents: BigInt(String(previous.total_cents)), replayed: true };
    }
    if(body.supplierId!==null){
    const supplier = (await tx.query('SELECT active FROM local_suppliers WHERE company_id=? AND id=?', [companyId, body.supplierId]))[0];
    if (!supplier || supplier.active !== 1n) throw new Error('Selecione um fornecedor ativo desta empresa.');
    }
    const items = [];
    let total = 0n;
    for (const item of body.items) {
      const product = (await tx.query('SELECT name,active FROM local_products WHERE company_id=? AND id=?', [companyId, item.productId]))[0];
      if (!product || product.active !== 1n) throw new Error('Selecione produtos ativos desta empresa.');
      const quantity = quantityToMilli(item.quantity);
      const cost = BigInt(item.unitCostCents);
      const lineTotal = itemTotalCents(quantity, cost);
      total += lineTotal;
      if (total > 9223372036854775807n) throw new Error('Total acima do limite permitido.');
      items.push({ ...item, name: String(product.name), quantity, cost, lineTotal });
    }
    if (body.payable && total === 0n) throw new Error('Uma conta a pagar precisa ter valor maior que zero.');
    const id = randomUUID();
    await tx.query('INSERT INTO local_purchases(id,company_id,supplier_id,actor_id,request_key,request_payload,total_cents,notes) VALUES(?,?,?,?,?,?,?,?)', [id, companyId, body.supplierId, userId, key, payload, total, body.notes]);
    for (const item of items) {
      await tx.query('INSERT INTO local_purchase_items VALUES(?,?,?,?,?,?,?)', [companyId, id, item.productId, item.name, item.quantity, item.cost, item.lineTotal]);
      await appendStockMovement(tx, { companyId, productId: item.productId, actorId: userId, quantityMilli: item.quantity, unitCostCents: item.cost, reason: 'PURCHASE', operationId: id });
    }
    if (body.payable) await tx.query('INSERT INTO local_purchase_payables VALUES(?,?,?,?,?,?)', [randomUUID(), companyId, id, total, body.payable.dueDate, body.payable.notes]);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), companyId, userId, 'purchase.received', id, payload]);
    return { id, totalCents: total, replayed: false };
  });
}
