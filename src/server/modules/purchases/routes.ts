import type { FastifyInstance } from 'fastify';
import { authContext } from '../../core/access.js';
import { params, validId } from '../../core/validation.js';
import type { Db } from '../../db.js';
import { purchaseIdempotencyKeySchema, purchaseListSchema, receivePurchaseSchema } from './schemas.js';
import { createPurchaseService } from './service.js';

export function registerPurchaseRoutes(app: FastifyInstance, db: Db) {
  const service = createPurchaseService(db);
  app.get('/api/companies/:companyId/purchases', request => service.list(authContext(request), validId(params(request).companyId), purchaseListSchema.parse(request.query)));
  app.post('/api/companies/:companyId/purchases/receive', async (request, reply) => {
    const key = purchaseIdempotencyKeySchema.parse(request.headers['idempotency-key']);
    const result = await service.receive(authContext(request), validId(params(request).companyId), key, receivePurchaseSchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
}
