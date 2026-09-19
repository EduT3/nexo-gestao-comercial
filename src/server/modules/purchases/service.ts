import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { AccountPayable, Purchase, PurchaseItem } from '../../../shared/contracts.js';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import type { purchaseListSchema, receivePurchaseSchema } from './schemas.js';

type PurchaseInput = z.infer<typeof receivePurchaseSchema>;
type ListQuery = z.infer<typeof purchaseListSchema>;
type DateValue = Date | string;
type PurchaseRow = Omit<Purchase, 'totalCents' | 'receivedAt' | 'createdAt' | 'items' | 'payable'> & { totalCents: string | number; receivedAt: DateValue; createdAt: DateValue; supplierName: string; actorName: string };
type ItemRow = Omit<PurchaseItem, 'quantity' | 'unitCostCents' | 'totalCents'> & { quantity: string | number; unitCostCents: string | number; totalCents: string | number };
type PayableRow = Omit<AccountPayable, 'amountCents' | 'dueDate' | 'paidAt' | 'createdAt'> & { amountCents: string | number; dueDate: DateValue; paidAt: DateValue | null; createdAt: DateValue };

const purchaseSelect = `SELECT p.id,p.company_id AS "companyId",p.supplier_id AS "supplierId",s.name AS "supplierName",p.status,
  p.total_cents AS "totalCents",p.notes,p.received_at AS "receivedAt",p.actor_id AS "actorId",u.name AS "actorName",
  p.idempotency_key AS "idempotencyKey",p.created_at AS "createdAt"
  FROM purchases p JOIN suppliers s ON s.company_id=p.company_id AND s.id=p.supplier_id JOIN users u ON u.id=p.actor_id`;
const itemSelect = `SELECT i.id,i.company_id AS "companyId",i.purchase_id AS "purchaseId",i.product_id AS "productId",p.name AS "productName",
  p.internal_code AS "internalCode",p.unit,i.quantity,i.unit_cost_cents AS "unitCostCents",i.total_cents AS "totalCents"
  FROM purchase_items i JOIN products p ON p.company_id=i.company_id AND p.id=i.product_id`;
const payableSelect = `SELECT id,company_id AS "companyId",purchase_id AS "purchaseId",description,category,amount_cents AS "amountCents",due_date AS "dueDate",status,paid_at AS "paidAt",payment_method AS "paymentMethod",paid_by AS "paidBy",(SELECT name FROM users WHERE users.id=accounts_payable.paid_by) AS "paidByName",payment_notes AS "paymentNotes",notes,created_at AS "createdAt" FROM accounts_payable`;

function decimal(value: string | number): string { const [whole = '0', fraction = ''] = String(value).split('.'); return `${whole}.${fraction.padEnd(3, '0').slice(0, 3)}`; }
function units(value: string | number): bigint { const [whole = '0', fraction = ''] = decimal(value).split('.'); return BigInt(whole) * 1000n + BigInt(fraction); }
function fromUnits(value: bigint): string { return `${value / 1000n}.${(value % 1000n).toString().padStart(3, '0')}`; }
function itemTotal(quantity: string, cost: number): number { return Number((units(quantity) * BigInt(cost) + 500n) / 1000n); }
function fingerprint(body: PurchaseInput): string { return createHash('sha256').update(JSON.stringify({ ...body, items: body.items.map(item => ({ ...item, quantity: decimal(item.quantity) })) })).digest('hex'); }
function toItem(row: ItemRow): PurchaseItem { return { ...row, quantity: decimal(row.quantity), unitCostCents: Number(row.unitCostCents), totalCents: Number(row.totalCents) }; }
function toPayable(row: PayableRow): AccountPayable { return { ...row, amountCents: Number(row.amountCents), dueDate: new Date(row.dueDate).toISOString().slice(0, 10), paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null, createdAt: new Date(row.createdAt).toISOString() }; }
async function hydrate(db: Db, row: PurchaseRow): Promise<Purchase> {
  const items = await db.query<ItemRow>(`${itemSelect} WHERE i.company_id=$1 AND i.purchase_id=$2 ORDER BY p.name,i.id`, [row.companyId, row.id]);
  const payable = await db.query<PayableRow>(`${payableSelect} WHERE company_id=$1 AND purchase_id=$2`, [row.companyId, row.id]);
  return { ...row, totalCents: Number(row.totalCents), receivedAt: new Date(row.receivedAt).toISOString(), createdAt: new Date(row.createdAt).toISOString(), items: items.rows.map(toItem), payable: payable.rows[0] ? toPayable(payable.rows[0]) : null };
}

export function createPurchaseService(db: Db) {
  return {
    async list(context: AuthContext, companyId: string, query: ListQuery) {
      await requireCompany(db, context.user.id, companyId, 'purchases.manage');
      const rows = await db.query<PurchaseRow>(`${purchaseSelect} WHERE p.company_id=$1 ORDER BY p.received_at DESC,p.id DESC LIMIT $2 OFFSET $3`, [companyId, query.limit, query.offset]);
      const count = await db.query<{ count: string | number }>('SELECT count(*) AS count FROM purchases WHERE company_id=$1', [companyId]);
      return { purchases: await Promise.all(rows.rows.map(row => hydrate(db, row))), total: Number(count.rows[0]?.count ?? 0), limit: query.limit, offset: query.offset };
    },

    async receive(context: AuthContext, companyId: string, key: string, body: PurchaseInput) {
      const commandHash = fingerprint(body);
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'purchases.manage', true);
        const repeated = await tx.query<PurchaseRow>(`${purchaseSelect} WHERE p.company_id=$1 AND p.idempotency_key=$2`, [companyId, key]);
        if (repeated.rows[0]) {
          const stored = await tx.query<{ commandHash: string }>('SELECT command_hash AS "commandHash" FROM purchases WHERE company_id=$1 AND idempotency_key=$2', [companyId, key]);
          if (stored.rows[0]?.commandHash !== commandHash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para uma compra diferente.');
          return { purchase: await hydrate(tx, repeated.rows[0]), replayed: true };
        }
        const supplier = await tx.query<{ name: string; active: boolean }>('SELECT name,active FROM suppliers WHERE company_id=$1 AND id=$2 FOR UPDATE', [companyId, body.supplierId]);
        if (!supplier.rows[0]) notFound();
        if (!supplier.rows[0].active) throw new HttpError(400, 'INACTIVE_SUPPLIER', 'O fornecedor está inativo.');
        const productIds = body.items.map(item => item.productId);
        const products = await tx.query<{ id: string; name: string; active: boolean }>('SELECT id,name,active FROM products WHERE company_id=$1 AND id=ANY($2::uuid[]) FOR UPDATE', [companyId, productIds]);
        if (products.rows.length !== productIds.length) notFound();
        if (products.rows.some(product => !product.active)) throw new HttpError(400, 'INACTIVE_PRODUCT', 'A compra contém produto inativo.');
        const totals = body.items.map(item => itemTotal(item.quantity, item.unitCostCents));
        const totalCents = totals.reduce((sum, value) => sum + value, 0);
        if (!Number.isSafeInteger(totalCents) || totalCents > 9_999_999_999) throw new HttpError(400, 'VALUE_LIMIT', 'O total da compra excede o limite permitido.');
        const purchaseId = randomUUID();
        await tx.query(`INSERT INTO purchases(id,company_id,supplier_id,status,total_cents,notes,actor_id,idempotency_key,command_hash)
          VALUES($1,$2,$3,'RECEIVED',$4,$5,$6,$7,$8)`, [purchaseId, companyId, body.supplierId, totalCents, body.notes, context.user.id, key, commandHash]);
        for (let index = 0; index < body.items.length; index += 1) {
          const item = body.items[index]!;
          await tx.query('INSERT INTO purchase_items(id,company_id,purchase_id,product_id,quantity,unit_cost_cents,total_cents) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), companyId, purchaseId, item.productId, decimal(item.quantity), item.unitCostCents, totals[index]]);
          await tx.query('INSERT INTO inventory_balances(company_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [companyId, item.productId]);
          const current = await tx.query<{ quantity: string | number }>('SELECT quantity FROM inventory_balances WHERE company_id=$1 AND product_id=$2 FOR UPDATE', [companyId, item.productId]);
          const before = units(current.rows[0]?.quantity ?? '0');
          const after = before + units(item.quantity);
          const movementId = randomUUID();
          await tx.query('UPDATE inventory_balances SET quantity=$1,updated_at=now() WHERE company_id=$2 AND product_id=$3', [fromUnits(after), companyId, item.productId]);
          await tx.query(`INSERT INTO inventory_movements(id,company_id,product_id,type,direction,quantity,balance_before,balance_after,notes,actor_id,idempotency_key,command_hash,source_type,source_id)
            VALUES($1,$2,$3,'PURCHASE','IN',$4,$5,$6,$7,$8,$9,$10,'PURCHASE',$11)`, [movementId, companyId, item.productId, decimal(item.quantity), fromUnits(before), fromUnits(after), `Recebimento da compra ${purchaseId}`, context.user.id, randomUUID(), commandHash, purchaseId]);
          await tx.query('UPDATE products SET cost_cents=$1,updated_at=now() WHERE company_id=$2 AND id=$3', [item.unitCostCents, companyId, item.productId]);
        }
        let payableId: string | null = null;
        if (body.payable && totalCents > 0) {
          payableId = randomUUID();
          await tx.query(`INSERT INTO accounts_payable(id,company_id,purchase_id,description,amount_cents,due_date,notes)
            VALUES($1,$2,$3,$4,$5,$6,$7)`, [payableId, companyId, purchaseId, `Compra de ${supplier.rows[0].name}`, totalCents, body.payable.dueDate, body.payable.notes]);
        }
        await audit(tx, context.user, companyId, 'purchase.received', 'purchase', purchaseId, null, { supplierId: body.supplierId, itemCount: body.items.length, totalCents, payableId, status: 'RECEIVED' });
        const created = await tx.query<PurchaseRow>(`${purchaseSelect} WHERE p.company_id=$1 AND p.id=$2`, [companyId, purchaseId]);
        if (!created.rows[0]) throw new Error('Purchase insert failed');
        return { purchase: await hydrate(tx, created.rows[0]), replayed: false };
      });
    },
  };
}
