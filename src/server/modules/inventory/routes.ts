import type { FastifyInstance } from 'fastify';
import { authContext } from '../../core/access.js';
import { params, validId } from '../../core/validation.js';
import type { Db } from '../../db.js';
import { idempotencyKeySchema, inventoryQuerySchema, manualMovementSchema, movementQuerySchema } from './schemas.js';
import { createInventoryService } from './service.js';

export function registerInventoryRoutes(app: FastifyInstance, db: Db) {
  const service = createInventoryService(db);
  app.get('/api/companies/:companyId/inventory', request => service.list(authContext(request), validId(params(request).companyId), inventoryQuerySchema.parse(request.query)));
  app.get('/api/companies/:companyId/inventory/movements', request => service.listMovements(authContext(request), validId(params(request).companyId), movementQuerySchema.parse(request.query)));
  app.post('/api/companies/:companyId/inventory/movements', async (request, reply) => {
    const key = idempotencyKeySchema.parse(request.headers['idempotency-key']);
    const result = await service.createManualMovement(authContext(request), validId(params(request).companyId), key, manualMovementSchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
}
