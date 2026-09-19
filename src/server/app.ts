import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticPlugin from '@fastify/static';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Db } from './db.js';
import { HttpError, registerErrorHandler } from './core/errors.js';
import { registerAdminRoutes } from './modules/admin/routes.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerCommerceRoutes } from './modules/commerce/routes.js';
import { registerInventoryRoutes } from './modules/inventory/routes.js';
import { registerPurchaseRoutes } from './modules/purchases/routes.js';
import { registerSalesRoutes } from './modules/sales/routes.js';
import { registerFinanceRoutes } from './modules/finance/routes.js';

export { SESSION_COOKIE } from './modules/auth/routes.js';
export interface AppOptions { db: Db; origin: string; production?: boolean; demo?: boolean; logger?: boolean; rateLimitMax?: number; loginRateLimitMax?: number }

/** The caller owns the injected database and closes it after the application. */
export async function buildApp({ db, origin, production = false, demo = false, logger = false, rateLimitMax = 300, loginRateLimitMax = 10 }: AppOptions) {
  const configuredOrigin = new URL(origin);
  if (configuredOrigin.origin !== origin || !['http:', 'https:'].includes(configuredOrigin.protocol) || (production && configuredOrigin.protocol !== 'https:')) throw new Error('APP_ORIGIN deve ser uma origem válida e usar HTTPS em produção.');
  const app = Fastify({ logger: logger ? { level: 'info', redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]', 'res.headers["set-cookie"]', 'password', 'currentPassword', 'newPassword'] } : false, bodyLimit: 32 * 1024, trustProxy: false });
  await app.register(cookie);
  await app.register(helmet, { contentSecurityPolicy: production ? undefined : false });
  // The plugin throws this value: use our typed error so the handler preserves HTTP 429.
  await app.register(rateLimit, { max: production ? 300 : rateLimitMax, timeWindow: '1 minute', errorResponseBuilder: () => new HttpError(429, 'RATE_LIMITED', 'Muitas tentativas. Aguarde e tente novamente.') });
  registerErrorHandler(app);
  await registerAuthRoutes(app, { db, origin, production, demo, loginRateLimitMax });
  app.get('/api/health', async () => { await db.query('SELECT 1'); return { status: 'ok' as const }; });
  registerAdminRoutes(app, db);
  registerCommerceRoutes(app, db);
  registerInventoryRoutes(app, db);
  registerPurchaseRoutes(app, db);
  registerSalesRoutes(app, db);
  registerFinanceRoutes(app, db);

  if (production) {
    const clientRoot = fileURLToPath(new URL('../client/', import.meta.url));
    await access(clientRoot);
    await app.register(staticPlugin, { root: clientRoot, prefix: '/', wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      if (request.url === '/api' || request.url.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.', requestId: request.id } });
      return reply.type('text/html').sendFile('index.html');
    });
  } else app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.', requestId: request.id } }));
  return app;
}
