import type { FastifyRequest } from 'fastify';
import { rolePermissions, type Company, type Permission, type Session } from '../../shared/contracts.js';
import type { Db } from '../db.js';
import { forbidden, HttpError, notFound } from './errors.js';

export interface AuthContext { user: Session['user']; sessionId: string; token: string }
const authenticatedRequests = new WeakMap<FastifyRequest, AuthContext>();
export function setAuthContext(request: FastifyRequest, context: AuthContext) { authenticatedRequests.set(request, context); }
export function authContext(request: FastifyRequest): AuthContext {
  const context = authenticatedRequests.get(request);
  if (!context) throw new HttpError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
  return context;
}

type CompanyRow = Record<string, unknown> & Omit<Company, 'permissions'>;
const companySelect = `SELECT c.id,c.name,c.legal_name AS "legalName",c.tax_id AS "taxId",c.kind,c.address,c.timezone,c.active,m.role_key AS role
  FROM companies c JOIN company_memberships m ON m.company_id=c.id JOIN users u ON u.id=m.user_id`;
const toCompany = (row: CompanyRow): Company => ({ ...row, permissions: [...rolePermissions[row.role]] });

export async function companiesFor(db: Db, userId: string): Promise<Company[]> {
  const result = await db.query<CompanyRow>(`${companySelect} WHERE m.user_id=$1 AND m.active AND c.active AND u.active ORDER BY c.name,c.id`, [userId]);
  return result.rows.map(toCompany);
}

/** Mutations pass their transaction and lock=true, then write and audit within that transaction. */
export async function requireCompany(db: Db, userId: string, companyId: string, permission: Permission, lock = false): Promise<Company> {
  if (lock) await db.query('SELECT id FROM companies WHERE id=$1 FOR UPDATE', [companyId]);
  const result = await db.query<CompanyRow>(`${companySelect} WHERE c.id=$1 AND m.user_id=$2 AND m.active AND c.active AND u.active`, [companyId, userId]);
  const row = result.rows[0];
  if (!row) notFound();
  const company = toCompany(row);
  if (!company.permissions.includes(permission)) forbidden();
  return company;
}
