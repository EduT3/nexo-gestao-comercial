import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
const passwordSchema = z.string().min(6).max(128);
const operatorSchema = z.object({ name: z.string().trim().min(2).max(100), password: passwordSchema, companies: z.array(z.enum(['adega-jg','deposito-jg'])).min(1).max(2).refine(values => new Set(values).size === values.length, 'Não repita empresas.') }).strict();
function credential(password: string) { const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 32).toString('hex'); return { salt, hash }; }
/** One-time upgrade of an installation without credentials; no bypass after setup. */
export async function setInitialLocalPassword(db: LocalDatabase, ownerId: string, input: unknown) {
 const password = passwordSchema.parse(input);
 return db.transaction(async tx => {
  if ((await tx.query('SELECT user_id FROM local_credentials LIMIT 1')).length) throw new Error('A senha inicial já foi configurada. Entre com sua senha.');
  const users = await tx.query('SELECT id FROM local_users WHERE active=1');
  if (users.length !== 1 || users[0]?.id !== ownerId) throw new Error('O responsável inicial não foi identificado.');
  const memberships = await tx.query("SELECT company_id FROM local_memberships WHERE user_id=? AND role='ADMIN' AND active=1", [ownerId]);
  if (memberships.length !== 2) throw new Error('O responsável precisa administrar as duas empresas.');
  const record = credential(password);
  await tx.query('INSERT INTO local_credentials VALUES(?,?,?,?)', [ownerId, record.salt, record.hash, 'SCRYPT']);
  for (const membership of memberships) await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), String(membership.company_id), ownerId, 'access.initialized', ownerId, '{}']);
 });
}
export async function createLocalOperator(db: LocalDatabase, adminId: string, input: unknown) {
 const body = operatorSchema.parse(input);
 return db.transaction(async tx => {
  for (const company of body.companies) await authorizeLocalCatalog(tx, adminId, company, true);
  if (!(await tx.query('SELECT user_id FROM local_credentials WHERE user_id=?', [adminId])).length) throw new Error('Configure a senha do administrador antes de cadastrar operadores.');
  if ((await tx.query('SELECT id FROM local_users WHERE lower(name)=lower(?)', [body.name])).length) throw new Error('Já existe um usuário com este nome.');
  const id = randomUUID(); const record = credential(body.password);
  await tx.query('INSERT INTO local_users VALUES(?,?,1)', [id, body.name]);
  await tx.query('INSERT INTO local_credentials VALUES(?,?,?,?)', [id, record.salt, record.hash, 'SCRYPT']);
  for (const company of body.companies) {
   await tx.query("INSERT INTO local_memberships VALUES(?,?,'OPERADOR',1)", [company, id]);
   await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)', [randomUUID(), company, adminId, 'operator.created', id, JSON.stringify({ name: body.name, role: 'OPERADOR' })]);
  }
  return { id, name: body.name };
 });
}
export async function authenticateLocalUser(db: LocalDatabase, userId: string, input: unknown) {
 const password = passwordSchema.parse(input);
 return db.transaction(async tx => {
  const user = (await tx.query('SELECT u.id,u.name,u.active,c.salt,c.password_hash,c.algorithm FROM local_users u LEFT JOIN local_credentials c ON c.user_id=u.id WHERE u.id=?', [userId]))[0];
  const valid = user && user.active === 1n && user.algorithm === 'SCRYPT' && typeof user.salt === 'string' && /^[a-f0-9]{32}$/.test(user.salt) && typeof user.password_hash === 'string' && /^[a-f0-9]{64}$/.test(user.password_hash);
  const actual = scryptSync(password, valid ? String(user.salt) : '00000000000000000000000000000000', 32);
  const expected = Buffer.from(valid ? String(user.password_hash) : '0'.repeat(64), 'hex');
  if (!timingSafeEqual(actual, expected) || !valid) throw new Error('Usuário ou senha inválidos.');
  if (!(await tx.query('SELECT company_id FROM local_memberships WHERE user_id=? AND active=1', [userId])).length) throw new Error('Este usuário não possui acesso ativo a uma empresa.');
  return { id: String(user.id), name: String(user.name) };
 });
}