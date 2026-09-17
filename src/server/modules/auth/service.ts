import { randomUUID } from 'node:crypto';
import type { Session } from '../../../shared/contracts.js';
import { companiesFor, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError } from '../../core/errors.js';
import type { Db } from '../../db.js';
import { csrfToken, hashPassword, newSessionToken, tokenHash, verifyPassword } from '../../security.js';

type UserRow = Record<string, unknown> & { id: string; name: string; email: string; systemAdmin: boolean; passwordHash: string; active: boolean };

export async function createAuthService(db: Db, demo: boolean) {
  const dummyPasswordHash = await hashPassword(newSessionToken());
  return {
    async session(context: AuthContext): Promise<Session> {
      return { user: context.user, csrfToken: csrfToken(context.token), companies: await companiesFor(db, context.user.id), demo };
    },
    async authenticate(token: string): Promise<AuthContext | null> {
      const result = await db.query<Record<string, unknown> & { sessionId: string; id: string; name: string; email: string; systemAdmin: boolean }>(
        `SELECT s.id AS "sessionId",u.id,u.name,u.email,u.system_admin AS "systemAdmin" FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`, [tokenHash(token)]);
      const row = result.rows[0];
      return row ? { user: { id: row.id, name: row.name, email: row.email, systemAdmin: row.systemAdmin }, sessionId: row.sessionId, token } : null;
    },
    async login(body: { email: string; password: string }): Promise<AuthContext> {
      const found = await db.query<UserRow>('SELECT id,name,email,password_hash AS "passwordHash",active,system_admin AS "systemAdmin" FROM users WHERE email=$1', [body.email]);
      const user = found.rows[0];
      const valid = await verifyPassword(body.password, user?.passwordHash ?? dummyPasswordHash);
      if (!user || !user.active || !valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
      const token = newSessionToken();
      const sessionId = randomUUID();
      await db.transaction(async (tx) => {
        const current = await tx.query<{ password_hash: string; active: boolean }>('SELECT password_hash,active FROM users WHERE id=$1 FOR UPDATE', [user.id]);
        if (!current.rows[0]?.active || current.rows[0].password_hash !== user.passwordHash) throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
        await tx.query('DELETE FROM sessions WHERE user_id=$1 AND expires_at<=now()', [user.id]);
        await tx.query(`INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`, [sessionId, user.id, tokenHash(token)]);
        await audit(tx, user, null, 'auth.login', 'session', sessionId, null, null);
      });
      return { user: { id: user.id, name: user.name, email: user.email, systemAdmin: user.systemAdmin }, token, sessionId };
    },
    async logout(context: AuthContext) {
      await db.transaction(async (tx) => {
        await tx.query('DELETE FROM sessions WHERE id=$1', [context.sessionId]);
        await audit(tx, context.user, null, 'auth.logout', 'session', context.sessionId, null, null);
      });
    },
    async changePassword(context: AuthContext, body: { currentPassword: string; newPassword: string }) {
      if (body.currentPassword === body.newPassword) throw new HttpError(400, 'VALIDATION_ERROR', 'A nova senha deve ser diferente da atual.');
      await db.transaction(async (tx) => {
        const found = await tx.query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE', [context.user.id]);
        if (!found.rows[0] || !await verifyPassword(body.currentPassword, found.rows[0].password_hash)) throw new HttpError(400, 'INVALID_PASSWORD', 'Senha atual inválida.');
        await tx.query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2', [await hashPassword(body.newPassword), context.user.id]);
        await tx.query('DELETE FROM sessions WHERE user_id=$1', [context.user.id]);
        await audit(tx, context.user, null, 'auth.password_changed', 'user', context.user.id, null, null);
      });
    },
  };
}
