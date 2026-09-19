import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function notFound(): never { throw new HttpError(404, 'NOT_FOUND', 'Recurso não encontrado.'); }
export function forbidden(): never { throw new HttpError(403, 'FORBIDDEN', 'Você não possui permissão para esta ação.'); }

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) return reply.code(error.status).send({ error: { code: error.code, message: error.message, requestId: request.id } });
    if (error instanceof z.ZodError) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: error.issues.map((issue) => `${issue.path.join('.') || 'dados'}: ${issue.message}`).join('; '), requestId: request.id } });
    const detail = error as { code?: string; statusCode?: number };
    if (detail.code === '23505') return reply.code(409).send({ error: { code: 'CONFLICT', message: 'Já existe um registro com os dados únicos informados.', requestId: request.id } });
    if (detail.code === '23503' || detail.code === '23514' || detail.code === '22P02') return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Os dados informados são inválidos.', requestId: request.id } });
    if (detail.statusCode && detail.statusCode >= 400 && detail.statusCode < 500) return reply.code(detail.statusCode).send({ error: { code: detail.statusCode === 429 ? 'RATE_LIMITED' : 'BAD_REQUEST', message: detail.statusCode === 429 ? 'Muitas tentativas. Aguarde e tente novamente.' : 'Requisição inválida.', requestId: request.id } });
    request.log.error({ code: detail.code ?? 'INTERNAL_ERROR', requestId: request.id }, 'Falha ao processar requisição');
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a operação.', requestId: request.id } });
  });
}
