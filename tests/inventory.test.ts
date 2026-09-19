import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import { createDatabase, type Db } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';
import type { Session } from '../src/shared/contracts.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Inventory-test-password-2026!';
type App = Awaited<ReturnType<typeof buildApp>>;
type Login = { cookie: string; session: Session };
let db: Db;
let app: App;
let companyA: string;
let companyB: string;
let productA: string;
let productB: string;

async function login(): Promise<Login> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: 'admin@jg.local', password } });
  expect(response.statusCode, response.body).toBe(200);
  return { cookie: String(response.headers['set-cookie']).split(';')[0]!, session: response.json<Session>() };
}
function headers(auth: Login, key?: string) {
  return { origin, cookie: auth.cookie, 'x-csrf-token': auth.session.csrfToken, ...(key ? { 'idempotency-key': key } : {}) };
}
function movement(auth: Login, companyId: string, payload: Record<string, unknown>, key = randomUUID()) {
  return app.inject({ method: 'POST', url: `/api/companies/${companyId}/inventory/movements`, headers: headers(auth, key), payload });
}

describe('M3: núcleo transacional de estoque', () => {
  beforeAll(async () => {
    db = await createDatabase({ dataDir: 'memory://' });
    await migrate(db);
    const seeded = await seedDevelopment(db, { password });
    companyA = seeded.companyIds[0]!;
    companyB = seeded.companyIds[1]!;
    productA = (await db.query<{ id: string }>('SELECT id FROM products WHERE company_id=$1 ORDER BY name LIMIT 1', [companyA])).rows[0]!.id;
    productB = (await db.query<{ id: string }>('SELECT id FROM products WHERE company_id=$1 ORDER BY name LIMIT 1', [companyB])).rows[0]!.id;
  });
  beforeEach(async () => { app = await buildApp({ db, origin, demo: true, logger: false }); });
  afterEach(async () => { await app.close(); });
  afterAll(async () => { await db.close(); });

  it('registra entrada, perda e ajuste preservando saldos exatos e histórico', async () => {
    const auth = await login();
    const entry = await movement(auth, companyA, { productId: productA, type: 'ENTRY_MANUAL', direction: 'IN', quantity: '10.125', notes: 'Contagem inicial validada' });
    expect(entry.statusCode, entry.body).toBe(201);
    expect(entry.json().movement).toMatchObject({ balanceBefore: '0.000', balanceAfter: '10.125', quantity: '10.125' });
    const loss = await movement(auth, companyA, { productId: productA, type: 'LOSS', direction: 'OUT', quantity: '0.125', notes: 'Avaria registrada' });
    expect(loss.statusCode, loss.body).toBe(201);
    expect(loss.json().movement).toMatchObject({ balanceBefore: '10.125', balanceAfter: '10.000' });
    const adjustment = await movement(auth, companyA, { productId: productA, type: 'ADJUSTMENT', direction: 'IN', quantity: '0.001', notes: 'Diferença de inventário' });
    expect(adjustment.statusCode, adjustment.body).toBe(201);
    expect(adjustment.json().movement.balanceAfter).toBe('10.001');

    const inventory = await app.inject({ url: `/api/companies/${companyA}/inventory`, headers: headers(auth) });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.json().inventory).toEqual(expect.arrayContaining([expect.objectContaining({ productId: productA, quantity: '10.001' })]));
    const history = await app.inject({ url: `/api/companies/${companyA}/inventory/movements?productId=${productA}`, headers: headers(auth) });
    expect(history.json().movements).toHaveLength(3);
    expect(history.json().movements.map((item: { balanceAfter: string }) => item.balanceAfter)).toEqual(['10.001', '10.000', '10.125']);
  });

  it('repete a mesma chave sem duplicar e rejeita comando divergente', async () => {
    const auth = await login();
    const key = randomUUID();
    const payload = { productId: productB, type: 'ENTRY_MANUAL', direction: 'IN', quantity: '2.500', notes: 'Entrada idempotente' };
    const first = await movement(auth, companyB, payload, key);
    const replay = await movement(auth, companyB, payload, key);
    expect(first.statusCode).toBe(201);
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toMatchObject({ replayed: true, movement: { id: first.json().movement.id, balanceAfter: first.json().movement.balanceAfter } });
    const conflict = await movement(auth, companyB, { ...payload, quantity: '3.000' }, key);
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json().error.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(Number((await db.query<{ count: string }>('SELECT count(*) AS count FROM inventory_movements WHERE company_id=$1 AND idempotency_key=$2', [companyB, key])).rows[0]!.count)).toBe(1);
  });

  it('rejeita saldo negativo, produto cruzado e comandos inválidos sem efeito parcial', async () => {
    const auth = await login();
    const before = await db.query<{ movements: string; audits: string }>(`SELECT
      (SELECT count(*) FROM inventory_movements WHERE company_id=$1) AS movements,
      (SELECT count(*) FROM audit_logs WHERE company_id=$1 AND action='inventory.movement_created') AS audits`, [companyA]);
    const insufficient = await movement(auth, companyA, { productId: productA, type: 'LOSS', direction: 'OUT', quantity: '999999.000', notes: '' });
    expect(insufficient.statusCode).toBe(409);
    expect(insufficient.json().error.code).toBe('INSUFFICIENT_STOCK');
    const crossed = await movement(auth, companyA, { productId: productB, type: 'ENTRY_MANUAL', direction: 'IN', quantity: '1.000', notes: '' });
    expect(crossed.statusCode).toBe(404);
    const invalid = await movement(auth, companyA, { productId: productA, type: 'LOSS', direction: 'IN', quantity: '1.000', notes: '' });
    expect(invalid.statusCode).toBe(400);
    const after = await db.query<{ movements: string; audits: string }>(`SELECT
      (SELECT count(*) FROM inventory_movements WHERE company_id=$1) AS movements,
      (SELECT count(*) FROM audit_logs WHERE company_id=$1 AND action='inventory.movement_created') AS audits`, [companyA]);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it('mantém movimento e auditoria na mesma transação e torna o histórico imutável', async () => {
    const auth = await login();
    const created = await movement(auth, companyA, { productId: productA, type: 'ADJUSTMENT', direction: 'IN', quantity: '1.000', notes: 'Conferência' });
    expect(created.statusCode).toBe(201);
    const id = created.json().movement.id as string;
    const audit = await db.query<{ entityId: string; after: { balanceAfter: string } }>(`SELECT entity_id AS "entityId",after_data AS after FROM audit_logs WHERE company_id=$1 AND action='inventory.movement_created' AND entity_id=$2`, [companyA, id]);
    expect(audit.rows[0]).toMatchObject({ entityId: id, after: { balanceAfter: created.json().movement.balanceAfter } });
    await expect(db.query('UPDATE inventory_movements SET notes=$1 WHERE id=$2', ['alterado', id])).rejects.toThrow();
    await expect(db.query('DELETE FROM inventory_movements WHERE id=$1', [id])).rejects.toThrow();
  });

  it('exige permissão, chave idempotente e semântica coerente do movimento', async () => {
    const auth = await login();
    const missingKey = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/inventory/movements`, headers: headers(auth), payload: { productId: productA, type: 'ENTRY_MANUAL', direction: 'IN', quantity: '1.000', notes: '' } });
    expect(missingKey.statusCode).toBe(400);
    for (const payload of [
      { productId: productA, type: 'ENTRY_MANUAL', direction: 'OUT', quantity: '1.000', notes: '' },
      { productId: productA, type: 'LOSS', direction: 'IN', quantity: '1.000', notes: '' },
      { productId: productA, type: 'ADJUSTMENT', direction: 'IN', quantity: '0', notes: '' },
    ]) expect((await movement(auth, companyA, payload)).statusCode).toBe(400);
  });
});
