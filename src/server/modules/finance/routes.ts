import type { FastifyInstance } from 'fastify';
import { authContext } from '../../core/access.js';
import { params, validId } from '../../core/validation.js';
import type { Db } from '../../db.js';
import { createReceivableSchema, financeIdempotencyKeySchema, financeListSchema, settlePayableSchema } from './schemas.js';
import { createReceivable, receiveReceivable } from './receivables.js';
import { createFinanceService } from './service.js';
import { createManualEntrySchema } from './schemas.js';
import { createManualEntry } from './manual.js';
import { reverseEntrySchema } from './schemas.js';
import { reverseManualEntry } from './reversals.js';

export function registerFinanceRoutes(app: FastifyInstance, db: Db) {
  const service = createFinanceService(db);
  app.post('/api/companies/:companyId/finance/settlements/:entryId/reverse', async (request, reply) => {
    const result = await reverseManualEntry(db, authContext(request), validId(params(request).companyId), validId(params(request).entryId), financeIdempotencyKeySchema.parse(request.headers['idempotency-key']), reverseEntrySchema.parse(request.body), 'TITLE');
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.post('/api/companies/:companyId/finance/entries/:entryId/reverse', async (request, reply) => {
    const result = await reverseManualEntry(db, authContext(request), validId(params(request).companyId), validId(params(request).entryId), financeIdempotencyKeySchema.parse(request.headers['idempotency-key']), reverseEntrySchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.post('/api/companies/:companyId/finance/entries', async (request, reply) => {
    const result = await createManualEntry(db, authContext(request), validId(params(request).companyId), financeIdempotencyKeySchema.parse(request.headers['idempotency-key']), createManualEntrySchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.post('/api/companies/:companyId/finance/receivables/:receivableId/receive', async (request, reply) => {
    const result = await receiveReceivable(db,authContext(request),validId(params(request).companyId),validId(params(request).receivableId),financeIdempotencyKeySchema.parse(request.headers['idempotency-key']),settlePayableSchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.post('/api/companies/:companyId/finance/receivables', async (request, reply) => {
    const result = await createReceivable(db,authContext(request),validId(params(request).companyId),financeIdempotencyKeySchema.parse(request.headers['idempotency-key']),createReceivableSchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.get('/api/companies/:companyId/finance', request => service.overview(authContext(request), validId(params(request).companyId), financeListSchema.parse(request.query)));
  app.post('/api/companies/:companyId/finance/payables/:payableId/pay', async (request, reply) => {
    const result = await service.payPayable(authContext(request), validId(params(request).companyId), validId(params(request).payableId), financeIdempotencyKeySchema.parse(request.headers['idempotency-key']), settlePayableSchema.parse(request.body));
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
}
