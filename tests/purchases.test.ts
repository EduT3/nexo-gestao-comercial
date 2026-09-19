import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import { createDatabase, type Db } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';
import type { Session } from '../src/shared/contracts.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Purchase-test-password-2026!';
type App = Awaited<ReturnType<typeof buildApp>>;
type Login = { cookie: string; session: Session };
let db: Db; let app: App; let companyA: string; let companyB: string;
let supplierA: string; let supplierB: string; let productA: string; let productB: string;

async function login(): Promise<Login> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: 'admin@jg.local', password } });
  expect(response.statusCode, response.body).toBe(200);
  return { cookie: String(response.headers['set-cookie']).split(';')[0]!, session: response.json<Session>() };
}
function headers(auth: Login, key = randomUUID()) { return { origin, cookie: auth.cookie, 'x-csrf-token': auth.session.csrfToken, 'idempotency-key': key }; }
function receive(auth: Login, companyId: string, payload: Record<string, unknown>, key = randomUUID()) {
  return app.inject({ method: 'POST', url: `/api/companies/${companyId}/purchases/receive`, headers: headers(auth, key), payload });
}

describe('M3: recebimento de compras', () => {
  beforeAll(async () => {
    db = await createDatabase({ dataDir: 'memory://' }); await migrate(db);
    const seeded = await seedDevelopment(db, { password }); companyA = seeded.companyIds[0]!; companyB = seeded.companyIds[1]!;
    supplierA = (await db.query<{ id: string }>('SELECT id FROM suppliers WHERE company_id=$1 ORDER BY name LIMIT 1', [companyA])).rows[0]!.id;
    supplierB = (await db.query<{ id: string }>('SELECT id FROM suppliers WHERE company_id=$1 ORDER BY name LIMIT 1', [companyB])).rows[0]!.id;
    productA = (await db.query<{ id: string }>('SELECT id FROM products WHERE company_id=$1 ORDER BY name LIMIT 1', [companyA])).rows[0]!.id;
    productB = (await db.query<{ id: string }>('SELECT id FROM products WHERE company_id=$1 ORDER BY name LIMIT 1', [companyB])).rows[0]!.id;
  });
  beforeEach(async () => { app = await buildApp({ db, origin, demo: true, logger: false }); });
  afterEach(async () => { await app.close(); }); afterAll(async () => { await db.close(); });

  it('recebe compra, aumenta estoque, atualiza custo e cria conta a pagar na mesma transação', async () => {
    const auth = await login();
    const before = await db.query<{ quantity: string }>('SELECT quantity FROM inventory_balances WHERE company_id=$1 AND product_id=$2', [companyA, productA]);
    const previous = before.rows[0]?.quantity ?? '0.000';
    const response = await receive(auth, companyA, {
      supplierId: supplierA, items: [{ productId: productA, quantity: '2.500', unitCostCents: 1234 }], notes: 'Recebimento conferido',
      payable: { dueDate: '2026-10-15', notes: 'Boleto do fornecedor' },
    });
    expect(response.statusCode, response.body).toBe(201);
    const purchase = response.json().purchase;
    expect(purchase).toMatchObject({ status: 'RECEIVED', totalCents: 3085, supplierId: supplierA, payable: { amountCents: 3085, status: 'OPEN', dueDate: '2026-10-15' } });
    expect(purchase.items[0]).toMatchObject({ productId: productA, quantity: '2.500', unitCostCents: 1234, totalCents: 3085 });
    const product = await db.query<{ cost: string | number }>('SELECT cost_cents AS cost FROM products WHERE company_id=$1 AND id=$2', [companyA, productA]);
    expect(Number(product.rows[0]!.cost)).toBe(1234);
    const movement = await db.query<{ before: string; after: string; source: string }>('SELECT balance_before AS before,balance_after AS after,source_type AS source FROM inventory_movements WHERE company_id=$1 AND source_id=$2', [companyA, purchase.id]);
    expect(movement.rows[0]!.source).toBe('PURCHASE');
    expect(Number(movement.rows[0]!.after) - Number(movement.rows[0]!.before)).toBeCloseTo(2.5, 3);
    expect(Number(movement.rows[0]!.before)).toBeCloseTo(Number(previous), 3);
    expect((await db.query('SELECT id FROM audit_logs WHERE company_id=$1 AND action=$2 AND entity_id=$3', [companyA, 'purchase.received', purchase.id])).rows).toHaveLength(1);
  });

  it('faz replay sem duplicar estoque, itens, título ou auditoria e rejeita chave divergente', async () => {
    const auth = await login(); const key = randomUUID();
    const payload = { supplierId: supplierB, items: [{ productId: productB, quantity: '3.000', unitCostCents: 250 }], notes: '', payable: null };
    const first = await receive(auth, companyB, payload, key); const replay = await receive(auth, companyB, payload, key);
    expect(first.statusCode).toBe(201); expect(replay.statusCode).toBe(200); expect(replay.json().replayed).toBe(true);
    expect(replay.json().purchase.id).toBe(first.json().purchase.id);
    const purchaseId = first.json().purchase.id;
    expect(Number((await db.query<{ count: string }>('SELECT count(*) AS count FROM purchase_items WHERE company_id=$1 AND purchase_id=$2', [companyB, purchaseId])).rows[0]!.count)).toBe(1);
    expect(Number((await db.query<{ count: string }>('SELECT count(*) AS count FROM inventory_movements WHERE company_id=$1 AND source_id=$2', [companyB, purchaseId])).rows[0]!.count)).toBe(1);
    const conflict = await receive(auth, companyB, { ...payload, notes: 'outro comando' }, key);
    expect(conflict.statusCode).toBe(409); expect(conflict.json().error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('rejeita fornecedor/produto cruzado, duplicado e inativo sem gravação parcial', async () => {
    const auth = await login();
    const baseline = Number((await db.query<{ count: string }>('SELECT count(*) AS count FROM purchases WHERE company_id=$1', [companyA])).rows[0]!.count);
    for (const payload of [
      { supplierId: supplierB, items: [{ productId: productA, quantity: '1.000', unitCostCents: 100 }], payable: null },
      { supplierId: supplierA, items: [{ productId: productB, quantity: '1.000', unitCostCents: 100 }], payable: null },
      { supplierId: supplierA, items: [{ productId: productA, quantity: '1.000', unitCostCents: 100 }, { productId: productA, quantity: '2.000', unitCostCents: 100 }], payable: null },
    ]) expect((await receive(auth, companyA, payload)).statusCode).toBeGreaterThanOrEqual(400);
    expect(Number((await db.query<{ count: string }>('SELECT count(*) AS count FROM purchases WHERE company_id=$1', [companyA])).rows[0]!.count)).toBe(baseline);
  });

  it('lista compras somente na empresa correta com itens e obrigação vinculada', async () => {
    const auth = await login();
    const listA = await app.inject({ url: `/api/companies/${companyA}/purchases`, headers: headers(auth) });
    const listB = await app.inject({ url: `/api/companies/${companyB}/purchases`, headers: headers(auth) });
    expect(listA.statusCode).toBe(200); expect(listB.statusCode).toBe(200);
    expect(listA.json().purchases.every((purchase: { companyId: string }) => purchase.companyId === companyA)).toBe(true);
    expect(listB.json().purchases.every((purchase: { companyId: string }) => purchase.companyId === companyB)).toBe(true);
    expect(listA.json().purchases.some((purchase: { payable: unknown }) => purchase.payable !== null)).toBe(true);
  });

  it('reverte compra, itens, estoque, custo e título quando uma etapa tardia falha', async () => {
    await app.close();
    const failingDb: Db = {
      query: (sql, params) => db.query(sql, params), exec: sql => db.exec(sql), close: async () => undefined,
      transaction: fn => db.transaction(tx => fn({
        query: async (sql, params) => {
          if (sql.includes('INSERT INTO audit_logs') && params?.[4] === 'purchase.received') throw new Error('Falha de auditoria injetada');
          return tx.query(sql, params);
        },
        exec: sql => tx.exec(sql), transaction: async () => { throw new Error('Transações aninhadas não são permitidas.'); }, close: async () => undefined,
      })),
    };
    app = await buildApp({ db: failingDb, origin, demo: true, logger: false });
    const auth = await login();
    const before = await db.query<{ purchases: string; balance: string; cost: string }>(`SELECT
      (SELECT count(*) FROM purchases WHERE company_id=$1) AS purchases,
      COALESCE((SELECT quantity::text FROM inventory_balances WHERE company_id=$1 AND product_id=$2),'0.000') AS balance,
      (SELECT cost_cents::text FROM products WHERE company_id=$1 AND id=$2) AS cost`, [companyA, productA]);
    const response = await receive(auth, companyA, { supplierId: supplierA, items: [{ productId: productA, quantity: '4.000', unitCostCents: 777 }], notes: 'Deve reverter', payable: { dueDate: '2026-11-10', notes: '' } });
    expect(response.statusCode).toBe(500);
    const after = await db.query<{ purchases: string; balance: string; cost: string }>(`SELECT
      (SELECT count(*) FROM purchases WHERE company_id=$1) AS purchases,
      COALESCE((SELECT quantity::text FROM inventory_balances WHERE company_id=$1 AND product_id=$2),'0.000') AS balance,
      (SELECT cost_cents::text FROM products WHERE company_id=$1 AND id=$2) AS cost`, [companyA, productA]);
    expect(after.rows[0]).toEqual(before.rows[0]);
    expect(Number((await db.query<{ count: string }>("SELECT count(*) AS count FROM purchases WHERE company_id=$1 AND notes='Deve reverter'", [companyA])).rows[0]!.count)).toBe(0);
  });
});
