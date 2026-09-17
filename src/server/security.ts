import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const params = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, params, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await derive(password, salt)).toString('hex');
  return `scrypt-v1$${salt}$${hash}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [version, salt, hash] = stored.split('$');
  if (version !== 'scrypt-v1' || !salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const computed = await derive(password, salt);
  return timingSafeEqual(computed, Buffer.from(hash, 'hex'));
}
export function newSessionToken(): string { return randomBytes(32).toString('base64url'); }
export function tokenHash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
export function csrfToken(token: string): string { return tokenHash(`jg-erp:csrf:v1:${token}`); }
export function constantEqual(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
