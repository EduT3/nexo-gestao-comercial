import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { rolePermissions, type Company, type CompanyOverview, type Member, type Store } from '../../../shared/contracts.js';
import { companiesFor, requireCompany, type AuthContext } from '../../core/access.js';
import { audit, auditEvents } from '../../core/audit.js';
import { forbidden, HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import { hashPassword } from '../../security.js';
import type { auditQuerySchema, companyPatchSchema, companySchema, createMemberSchema, updateMemberSchema } from './schemas.js';

type MemberRow = Record<string, unknown> & Omit<Member, 'createdAt'> & { createdAt: Date | string };
const memberSelect = `SELECT m.id,m.user_id AS "userId",u.name,u.email,m.role_key AS role,m.active,m.created_at AS "createdAt"
  FROM company_memberships m JOIN users u ON u.id=m.user_id`;
const toMember = (row: MemberRow): Member => ({ ...row, createdAt: new Date(row.createdAt).toISOString() });
function safeCompany(company: Company): Record<string, unknown> {
  return { name: company.name, legalName: company.legalName, taxId: company.taxId, kind: company.kind, address: company.address, timezone: company.timezone, active: company.active };
}

export function createAdminService(db: Db) {
  return {
    companies: (context: AuthContext) => companiesFor(db, context.user.id),
    async createCompany(context: AuthContext, body: z.infer<typeof companySchema>) {
      if (!context.user.systemAdmin) forbidden();
      const companyId = randomUUID();
      return db.transaction(async tx => {
        await tx.query('INSERT INTO companies(id,name,legal_name,tax_id,kind,address) VALUES($1,$2,$3,$4,$5,$6)', [companyId, body.name, body.legalName, body.taxId ?? null, body.kind, body.address ?? '']);
        await tx.query('INSERT INTO stores(id,company_id,name,address) VALUES($1,$2,$3,$4)', [randomUUID(), companyId, 'Unidade principal', body.address ?? '']);
        await tx.query('INSERT INTO company_memberships(id,company_id,user_id,role_key) VALUES($1,$2,$3,$4)', [randomUUID(), companyId, context.user.id, 'ADMIN']);
        const created = await requireCompany(tx, context.user.id, companyId, 'company.read');
        await audit(tx, context.user, companyId, 'company.created', 'company', companyId, null, safeCompany(created));
        return created;
      });
    },
    async updateCompany(context: AuthContext, companyId: string, body: z.infer<typeof companyPatchSchema>) {
      return db.transaction(async tx => {
        const before = await requireCompany(tx, context.user.id, companyId, 'company.update', true);
        const next = { ...before, ...body };
        await tx.query('UPDATE companies SET name=$1,legal_name=$2,tax_id=$3,kind=$4,address=$5,timezone=$6,updated_at=now() WHERE id=$7', [next.name, next.legalName, next.taxId ?? null, next.kind, next.address, next.timezone, companyId]);
        const updated = await requireCompany(tx, context.user.id, companyId, 'company.read');
        await audit(tx, context.user, companyId, 'company.updated', 'company', companyId, safeCompany(before), safeCompany(updated));
        return updated;
      });
    },
    async overview(context: AuthContext, companyId: string): Promise<CompanyOverview> {
      const company = await requireCompany(db, context.user.id, companyId, 'company.read');
      const stores = await db.query<Record<string, unknown> & Store>('SELECT id,company_id AS "companyId",name,address,active FROM stores WHERE company_id=$1 ORDER BY name,id', [companyId]);
      const users = await db.query<{ count: string | number }>('SELECT count(*) AS count FROM company_memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=$1 AND m.active AND u.active', [companyId]);
      const recent = company.permissions.includes('audit.read') ? await auditEvents(db, companyId, { limit: 6, offset: 0 }) : { events: [] };
      return { company, stores: stores.rows, activeUsers: Number(users.rows[0]?.count ?? 0), recentAudit: recent.events };
    },
    async members(context: AuthContext, companyId: string) {
      await requireCompany(db, context.user.id, companyId, 'users.read');
      const result = await db.query<MemberRow>(`${memberSelect} WHERE m.company_id=$1 ORDER BY u.name,m.id`, [companyId]);
      return result.rows.map(toMember);
    },
    async createMember(context: AuthContext, companyId: string, body: z.infer<typeof createMemberSchema>) {
      const passwordHash = await hashPassword(body.password);
      const userId = randomUUID();
      const membershipId = randomUUID();
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'users.manage', true);
        await tx.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [userId, body.name, body.email, passwordHash]);
        await tx.query('INSERT INTO company_memberships(id,company_id,user_id,role_key) VALUES($1,$2,$3,$4)', [membershipId, companyId, userId, body.role]);
        const found = await tx.query<MemberRow>(`${memberSelect} WHERE m.company_id=$1 AND m.id=$2`, [companyId, membershipId]);
        const created = found.rows[0];
        if (!created) throw new Error('Membership insert failed');
        await audit(tx, context.user, companyId, 'user.created', 'membership', membershipId, null, { name: body.name, email: body.email, role: body.role, active: true });
        return toMember(created);
      });
    },
    async updateMember(context: AuthContext, companyId: string, membershipId: string, body: z.infer<typeof updateMemberSchema>) {
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'users.manage', true);
        const found = await tx.query<MemberRow>(`${memberSelect} WHERE m.company_id=$1 AND m.id=$2`, [companyId, membershipId]);
        const before = found.rows[0];
        if (!before) notFound();
        if (before.userId === context.user.id && (!body.active || !rolePermissions[body.role].includes('users.manage'))) throw new HttpError(409, 'SELF_ACCESS_PROTECTED', 'Você não pode remover seu próprio acesso administrativo.');
        if (before.active && before.role === 'ADMIN' && (!body.active || body.role !== 'ADMIN')) {
          const count = await tx.query<{ count: string | number }>(`SELECT count(*) AS count FROM company_memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=$1 AND m.active AND m.role_key='ADMIN' AND u.active`, [companyId]);
          if (Number(count.rows[0]?.count ?? 0) <= 1) throw new HttpError(409, 'LAST_ADMIN_PROTECTED', 'A empresa deve manter ao menos um administrador ativo.');
        }
        await tx.query('UPDATE company_memberships SET role_key=$1,active=$2,updated_at=now() WHERE company_id=$3 AND id=$4', [body.role, body.active, companyId, membershipId]);
        const result = await tx.query<MemberRow>(`${memberSelect} WHERE m.company_id=$1 AND m.id=$2`, [companyId, membershipId]);
        const updated = result.rows[0];
        if (!updated) throw new Error('Membership update failed');
        await audit(tx, context.user, companyId, 'membership.updated', 'membership', membershipId, { role: before.role, active: before.active }, { role: updated.role, active: updated.active });
        return toMember(updated);
      });
    },
    async audit(context: AuthContext, companyId: string, query: z.infer<typeof auditQuerySchema>) {
      await requireCompany(db, context.user.id, companyId, 'audit.read');
      return auditEvents(db, companyId, query);
    },
    async consolidated(context: AuthContext) {
      const allowed = (await companiesFor(db, context.user.id)).filter(company => company.permissions.includes('consolidated.read'));
      if (allowed.length === 0) forbidden();
      const result = await db.query<Record<string, unknown> & { id: string; name: string; kind: Company['kind']; stores: string | number; activeUsers: string | number }>(
        `SELECT c.id,c.name,c.kind,(SELECT count(*) FROM stores s WHERE s.company_id=c.id AND s.active) AS stores,
         (SELECT count(*) FROM company_memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=c.id AND m.active AND u.active) AS "activeUsers"
         FROM companies c WHERE c.id=ANY($1::uuid[]) ORDER BY c.name,c.id`, [allowed.map(company => company.id)]);
      return { scope: 'authorized_companies' as const, companies: result.rows.map(row => ({ ...row, stores: Number(row.stores), activeUsers: Number(row.activeUsers) })) };
    },
  };
}
