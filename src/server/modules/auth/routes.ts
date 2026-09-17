import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authContext, setAuthContext } from '../../core/access.js';
import { HttpError } from '../../core/errors.js';
import { emailSchema, passwordSchema } from '../../core/validation.js';
import type { Db } from '../../db.js';
import { constantEqual, csrfToken } from '../../security.js';
import { createAuthService } from './service.js';

export const SESSION_COOKIE = 'jg_session';
const SESSION_SECONDS = 8 * 60 * 60;

export async function registerAuthRoutes(app: FastifyInstance, options: { db: Db; origin: string; production: boolean; demo: boolean }) {
  const service = await createAuthService(options.db, options.demo);
  const cookieOptions = { httpOnly: true, secure: options.production, sameSite: 'strict', path: '/' } as const;
  const clearSession = (reply: FastifyReply) => reply.clearCookie(SESSION_COOKIE, cookieOptions);
  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    if (!path.startsWith('/api/')) return;
    reply.header('Cache-Control', 'no-store');
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (mutation && request.headers.origin !== options.origin) throw new HttpError(403, 'INVALID_ORIGIN', 'Origem da requisição inválida.');
    if (path === '/api/health' || path === '/api/auth/login') return;
    const token = request.cookies[SESSION_COOKIE];
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new HttpError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
    const context = await service.authenticate(token);
    if (!context) { clearSession(reply); throw new HttpError(401, 'UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.'); }
    setAuthContext(request, context);
    if (mutation) {
      const supplied = request.headers['x-csrf-token'];
      if (typeof supplied !== 'string' || !constantEqual(supplied, csrfToken(token))) throw new HttpError(403, 'INVALID_CSRF', 'Token de proteção inválido. Atualize a sessão.');
    }
  });
  app.post('/api/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict().parse(request.body);
    const context = await service.login(body);
    reply.setCookie(SESSION_COOKIE, context.token, { ...cookieOptions, maxAge: SESSION_SECONDS });
    return service.session(context);
  });
  app.get('/api/auth/session', request => service.session(authContext(request)));
  app.post('/api/auth/logout', async (request, reply) => {
    await service.logout(authContext(request));
    clearSession(reply);
    return { ok: true };
  });
  app.post('/api/auth/password', async (request, reply) => {
    const body = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).strict().parse(request.body);
    await service.changePassword(authContext(request), body);
    clearSession(reply);
    return { ok: true };
  });
}
