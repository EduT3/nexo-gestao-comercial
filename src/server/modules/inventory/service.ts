import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { InventoryItem, InventoryMovement } from '../../../shared/contracts.js';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import type { inventoryQuerySchema, manualMovementSchema, movementQuerySchema } from './schemas.js';

type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
type MovementQuery = z.infer<typeof movementQuerySchema>;
type ManualMovement = z.infer<typeof manualMovementSchema>;
type DateValue = Date | string;
type InventoryRow = Omit<InventoryItem, 'quantity' | 'stockMin'> & { quantity: string | number; stockMin: string | number };
type MovementRow = Omit<InventoryMovement, 'quantity' | 'balanceBefore' | 'balanceAfter' | 'createdAt'> & {
  quantity: string | number; balanceBefore: string | number; balanceAfter: string | number; createdAt: DateValue;
};

const movementSelect = `SELECT m.id,m.company_id AS "companyId",m.product_id AS "productId",p.name AS "productName",
  p.internal_code AS "internalCode",p.unit,m.type,m.direction,m.quantity,m.balance_before AS "balanceBefore",
  m.balance_after AS "balanceAfter",m.notes,m.actor_id AS "actorId",u.name AS "actorName",
  m.idempotency_key AS "idempotencyKey",m.created_at AS "createdAt"
  FROM inventory_movements m JOIN products p ON p.company_id=m.company_id AND p.id=m.product_id
  JOIN users u ON u.id=m.actor_id`;

function decimal(value: string | number): string {
  const [whole = '0', fraction = ''] = String(value).split('.');
  return `${whole}.${fraction.padEnd(3, '0').slice(0, 3)}`;
}
function units(value: string | number): bigint {
  const [whole = '0', fraction = ''] = decimal(value).split('.');
  return BigInt(whole) * 1000n + BigInt(fraction);
}
function fromUnits(value: bigint): string {
  const whole = value / 1000n;
  return `${whole}.${(value % 1000n).toString().padStart(3, '0')}`;
}
function toMovement(row: MovementRow): InventoryMovement {
  return { ...row, quantity: decimal(row.quantity), balanceBefore: decimal(row.balanceBefore), balanceAfter: decimal(row.balanceAfter), createdAt: new Date(row.createdAt).toISOString() };
}
function fingerprint(body: ManualMovement): string {
  return createHash('sha256').update(JSON.stringify({ ...body, quantity: decimal(body.quantity) })).digest('hex');
}
function pattern(value: string): string { return `%${value.replace(/[\\%_]/g, '\\$&')}%`; }

export function createInventoryService(db: Db) {
  return {
    async list(context: AuthContext, companyId: string, query: InventoryQuery) {
      await requireCompany(db, context.user.id, companyId, 'inventory.read');
      const conditions = ['p.company_id=$1', 'p.active', `($2='%%' OR p.name ILIKE $2 OR p.internal_code ILIKE $2 OR p.barcode ILIKE $2)`];
      const values: unknown[] = [companyId, pattern(query.q)];
      if (query.status === 'zero') conditions.push('COALESCE(b.quantity,0)=0');
      if (query.status === 'low') conditions.push('COALESCE(b.quantity,0)>0 AND COALESCE(b.quantity,0)<=p.stock_min');
      if (query.status === 'normal') conditions.push('COALESCE(b.quantity,0)>p.stock_min');
      const where = conditions.join(' AND ');
      const rows = await db.query<InventoryRow>(`SELECT p.id AS "productId",p.company_id AS "companyId",p.name AS "productName",
        p.internal_code AS "internalCode",p.unit,COALESCE(b.quantity,0) AS quantity,p.stock_min AS "stockMin",
        CASE WHEN COALESCE(b.quantity,0)=0 THEN 'ZERO' WHEN COALESCE(b.quantity,0)<=p.stock_min THEN 'LOW' ELSE 'NORMAL' END AS status
        FROM products p LEFT JOIN inventory_balances b ON b.company_id=p.company_id AND b.product_id=p.id
        WHERE ${where} ORDER BY p.name,p.id LIMIT $3 OFFSET $4`, [...values, query.limit, query.offset]);
      const count = await db.query<{ count: string | number }>(`SELECT count(*) AS count FROM products p LEFT JOIN inventory_balances b ON b.company_id=p.company_id AND b.product_id=p.id WHERE ${where}`, values);
      return { inventory: rows.rows.map(row => ({ ...row, quantity: decimal(row.quantity), stockMin: decimal(row.stockMin) })), total: Number(count.rows[0]?.count ?? 0), limit: query.limit, offset: query.offset };
    },

    async listMovements(context: AuthContext, companyId: string, query: MovementQuery) {
      await requireCompany(db, context.user.id, companyId, 'inventory.read');
      const values: unknown[] = [companyId];
      let where = 'm.company_id=$1';
      if (query.productId) { values.push(query.productId); where += ` AND m.product_id=$${values.length}`; }
      const countValues = [...values];
      values.push(query.limit, query.offset);
      const rows = await db.query<MovementRow>(`${movementSelect} WHERE ${where} ORDER BY m.created_at DESC,m.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
      const count = await db.query<{ count: string | number }>(`SELECT count(*) AS count FROM inventory_movements m WHERE ${where}`, countValues);
      return { movements: rows.rows.map(toMovement), total: Number(count.rows[0]?.count ?? 0), limit: query.limit, offset: query.offset };
    },

    async createManualMovement(context: AuthContext, companyId: string, idempotencyKey: string, body: ManualMovement) {
      const commandHash = fingerprint(body);
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'inventory.manage', true);
        const repeated = await tx.query<MovementRow>(`${movementSelect} WHERE m.company_id=$1 AND m.idempotency_key=$2`, [companyId, idempotencyKey]);
        if (repeated.rows[0]) {
          const stored = await tx.query<{ commandHash: string }>('SELECT command_hash AS "commandHash" FROM inventory_movements WHERE company_id=$1 AND idempotency_key=$2', [companyId, idempotencyKey]);
          if (stored.rows[0]?.commandHash !== commandHash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para uma operação diferente.');
          return { movement: toMovement(repeated.rows[0]), replayed: true };
        }
        const product = await tx.query<{ active: boolean }>('SELECT active FROM products WHERE company_id=$1 AND id=$2 FOR UPDATE', [companyId, body.productId]);
        if (!product.rows[0]) notFound();
        if (!product.rows[0].active) throw new HttpError(400, 'INACTIVE_PRODUCT', 'O produto está inativo.');
        await tx.query('INSERT INTO inventory_balances(company_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [companyId, body.productId]);
        const balance = await tx.query<{ quantity: string | number }>('SELECT quantity FROM inventory_balances WHERE company_id=$1 AND product_id=$2 FOR UPDATE', [companyId, body.productId]);
        const before = units(balance.rows[0]?.quantity ?? '0');
        const amount = units(body.quantity);
        const after = body.direction === 'IN' ? before + amount : before - amount;
        if (after < 0n) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Estoque insuficiente para concluir a saída.');
        const id = randomUUID();
        await tx.query('UPDATE inventory_balances SET quantity=$1,updated_at=now() WHERE company_id=$2 AND product_id=$3', [fromUnits(after), companyId, body.productId]);
        await tx.query(`INSERT INTO inventory_movements(id,company_id,product_id,type,direction,quantity,balance_before,balance_after,notes,actor_id,idempotency_key,command_hash)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [id, companyId, body.productId, body.type, body.direction, decimal(body.quantity), fromUnits(before), fromUnits(after), body.notes, context.user.id, idempotencyKey, commandHash]);
        const result = await tx.query<MovementRow>(`${movementSelect} WHERE m.company_id=$1 AND m.id=$2`, [companyId, id]);
        const movement = result.rows[0];
        if (!movement) throw new Error('Inventory movement insert failed');
        const value = toMovement(movement);
        await audit(tx, context.user, companyId, 'inventory.movement_created', 'inventory_movement', id, null, { ...value });
        return { movement: value, replayed: false };
      });
    },
  };
}
