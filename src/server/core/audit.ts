import { randomUUID } from 'node:crypto';
import type { AuditEvent, Session } from '../../shared/contracts.js';
import type { Db } from '../db.js';

type AuditRow = Record<string, unknown> & Omit<AuditEvent, 'createdAt'> & { createdAt: Date | string };
const auditSelect = `SELECT id,company_id AS "companyId",actor_name AS "actorName",action,entity_type AS "entityType",entity_id AS "entityId",before_data AS before,after_data AS after,created_at AS "createdAt" FROM audit_logs`;

/** Use the same transaction as the business mutation. Never pass passwords or session data. */
export async function audit(db: Db, actor: Session['user'], companyId: string | null, action: string, entityType: string, entityId: string | null, before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  await db.query(`INSERT INTO audit_logs(id,company_id,actor_id,actor_name,action,entity_type,entity_id,before_data,after_data)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [randomUUID(), companyId, actor.id, actor.name, action, entityType, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after)]);
}

/** Authorization is the caller's responsibility; all queries are scoped to exactly one company. */
export async function auditEvents(db: Db, companyId: string, options: { limit: number; offset: number; q?: string }) {
  const search = `%${(options.q ?? '').replace(/[\\%_]/g, '\\$&')}%`;
  const where = `WHERE company_id=$1 AND ($2='%%' OR actor_name ILIKE $2 OR action ILIKE $2 OR entity_type ILIKE $2 OR entity_id::text ILIKE $2)`;
  const events = await db.query<AuditRow>(`${auditSelect} ${where} ORDER BY created_at DESC,id DESC LIMIT $3 OFFSET $4`, [companyId, search, options.limit, options.offset]);
  const count = await db.query<{ count: string | number }>(`SELECT count(*) AS count FROM audit_logs ${where}`, [companyId, search]);
  return { events: events.rows.map(row => ({ ...row, createdAt: new Date(row.createdAt).toISOString() })), total: Number(count.rows[0]?.count ?? 0) };
}
