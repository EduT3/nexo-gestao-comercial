import type { FastifyInstance, FastifyRequest } from 'fastify';
import { roles, roleLabels, rolePermissions, type Permission } from '../../../shared/contracts.js';
import { authContext, requireCompany } from '../../core/access.js';
import { forbidden } from '../../core/errors.js';
import { params, validId } from '../../core/validation.js';
import type { Db } from '../../db.js';
import { auditQuerySchema, companyPatchSchema, companySchema, createMemberSchema, updateMemberSchema } from './schemas.js';
import { createAdminService } from './service.js';

export function registerAdminRoutes(app: FastifyInstance, db: Db) {
  const service = createAdminService(db);
  // Authorize before parsing body; services recheck in the mutation transaction.
  async function authorize(request: FastifyRequest, permission: Permission) {
    const context = authContext(request);
    const companyId = validId(params(request).companyId);
    await requireCompany(db, context.user.id, companyId, permission);
    return { context, companyId };
  }
  app.get('/api/roles', async () => ({ roles: roles.map(key => ({ key, label: roleLabels[key], permissions: [...rolePermissions[key]] })) }));
  app.get('/api/companies', async request => ({ companies: await service.companies(authContext(request)) }));
  app.post('/api/companies', async (request, reply) => {
    const context = authContext(request);
    if (!context.user.systemAdmin) forbidden();
    const company = await service.createCompany(context, companySchema.parse(request.body));
    return reply.code(201).send({ company });
  });
  app.patch('/api/companies/:companyId', async request => {
    const { context, companyId } = await authorize(request, 'company.update');
    return { company: await service.updateCompany(context, companyId, companyPatchSchema.parse(request.body)) };
  });
  app.get('/api/companies/:companyId/overview', request => service.overview(authContext(request), validId(params(request).companyId)));
  app.get('/api/companies/:companyId/users', async request => ({ users: await service.members(authContext(request), validId(params(request).companyId)) }));
  app.post('/api/companies/:companyId/users', async (request, reply) => {
    const { context, companyId } = await authorize(request, 'users.manage');
    const user = await service.createMember(context, companyId, createMemberSchema.parse(request.body));
    return reply.code(201).send({ user });
  });
  app.patch('/api/companies/:companyId/users/:membershipId', async request => {
    const { context, companyId } = await authorize(request, 'users.manage');
    return { user: await service.updateMember(context, companyId, validId(params(request).membershipId), updateMemberSchema.parse(request.body)) };
  });
  app.get('/api/companies/:companyId/audit', async request => {
    const { context, companyId } = await authorize(request, 'audit.read');
    return service.audit(context, companyId, auditQuerySchema.parse(request.query));
  });
  app.get('/api/consolidated', request => service.consolidated(authContext(request)));
}
