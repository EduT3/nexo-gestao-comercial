import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/server/app.js';
import { createDatabase, type Db } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';
import type { Member, Session } from '../src/shared/contracts.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Commerce-test-password-2026!';
type App = Awaited<ReturnType<typeof buildApp>>;
type Login = { cookie: string; session: Session };
let db: Db;
let app: App;
let companyA: string;
let companyB: string;

async function login(email = 'admin@jg.local', secret = password): Promise<Login> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password: secret } });
  expect(response.statusCode, response.body).toBe(200);
  return { cookie: String(response.headers['set-cookie']).split(';')[0]!, session: response.json<Session>() };
}
function headers(auth: Login) { return { origin, cookie: auth.cookie, 'x-csrf-token': auth.session.csrfToken }; }
async function createOperator(auth: Login): Promise<{ email: string; member: Member }> {
  const email = `${randomUUID()}@example.test`;
  const response = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/users`, headers: headers(auth), payload: { name: 'Operador de cadastro', email, password, role: 'OPERADOR' } });
  expect(response.statusCode, response.body).toBe(201);
  return { email, member: response.json<{ user: Member }>().user };
}

describe('Fase 2: catálogo e cadastros por empresa', () => {
  beforeAll(async () => {
    db = await createDatabase({ dataDir: 'memory://' });
    await migrate(db);
    const seeded = await seedDevelopment(db, { password });
    companyA = seeded.companyIds[0]!;
    companyB = seeded.companyIds[1]!;
  });
  beforeEach(async () => { app = await buildApp({ db, origin, demo: true, logger: false }); });
  afterEach(async () => { await app.close(); });
  afterAll(async () => { await db.close(); });

  it('lista somente registros da empresa e impede referência cruzada em produto', async () => {
    const owner = await login();
    const categoriesA = await app.inject({ url: `/api/companies/${companyA}/categories`, headers: headers(owner) });
    const categoriesB = await app.inject({ url: `/api/companies/${companyB}/categories`, headers: headers(owner) });
    expect(categoriesA.statusCode).toBe(200);
    expect(categoriesB.statusCode).toBe(200);
    const categoryA = categoriesA.json<{ categories: { id: string; companyId: string }[] }>().categories[0]!;
    expect(categoryA.companyId).toBe(companyA);
    expect(categoriesB.json<{ categories: { companyId: string }[] }>().categories.every(category => category.companyId === companyB)).toBe(true);

    const cross = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/products`, headers: headers(owner), payload: {
      name: 'Produto com categoria cruzada', internalCode: 'CROSS-CATEGORY', unit: 'UNIT', costCents: 100, priceCents: 150, stockMin: '0', categoryId: categoryA.id,
    } });
    expect(cross.statusCode).toBe(404);
    expect(cross.body).not.toMatch(/constraint|SELECT|companyA/i);
  });

  it('omite custo para operador e nega toda escrita de cadastro', async () => {
    const owner = await login();
    const operator = await createOperator(owner);
    const cashier = await login(operator.email);
    const products = await app.inject({ url: `/api/companies/${companyA}/products`, headers: headers(cashier) });
    expect(products.statusCode).toBe(200);
    const body = products.json<{ products: Record<string, unknown>[] }>();
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products.every(product => !Object.hasOwn(product, 'costCents'))).toBe(true);
    expect(products.body).not.toContain('costCents');

    const deniedCreate = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/categories`, headers: headers(cashier), payload: { name: 'Não autorizado' } });
    expect(deniedCreate.statusCode).toBe(403);
    const productId = body.products[0]!['id'];
    const deniedPatch = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/products/${String(productId)}`, headers: headers(cashier), payload: { priceCents: 1 } });
    expect(deniedPatch.statusCode).toBe(403);
  });

  it('inativa sem apagar e permite consultar inativos explicitamente', async () => {
    const owner = await login();
    const products = (await app.inject({ url: `/api/companies/${companyA}/products`, headers: headers(owner) })).json<{ products: { id: string; active: boolean }[] }>();
    const product = products.products.find(item => item.active)!;
    const changed = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/products/${product.id}`, headers: headers(owner), payload: { active: false } });
    expect(changed.statusCode, changed.body).toBe(200);
    expect(changed.json<{ product: { active: boolean } }>().product.active).toBe(false);
    const active = await app.inject({ url: `/api/companies/${companyA}/products`, headers: headers(owner) });
    expect(active.json<{ products: { id: string }[] }>().products.some(item => item.id === product.id)).toBe(false);
    const all = await app.inject({ url: `/api/companies/${companyA}/products?all=true`, headers: headers(owner) });
    expect(all.json<{ products: { id: string; active: boolean }[] }>().products.some(item => item.id === product.id && !item.active)).toBe(true);
    const restored = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/products/${product.id}`, headers: headers(owner), payload: { active: true } });
    expect(restored.statusCode).toBe(200);
  });

  it('rejeita dinheiro fracionário/negativo e código interno inválido no servidor', async () => {
    const owner = await login();
    const base = { name: 'Produto inválido', internalCode: 'INVALID-BASE', unit: 'UNIT', stockMin: '0' };
    for (const payload of [
      { ...base, costCents: -1, priceCents: 100 },
      { ...base, internalCode: 'código com espaço', costCents: 1, priceCents: 100 },
      { ...base, internalCode: 'INVALID-FRACTION', costCents: 1.5, priceCents: 100 },
    ]) {
      const response = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/products`, headers: headers(owner), payload });
      expect(response.statusCode, response.body).toBe(400);
      expect(response.body).not.toMatch(/INSERT|SELECT|stack|node_modules/i);
    }
  });

  it('cadastra e normaliza pessoas e mantém os campos opcionais sem dados fictícios', async () => {
    const owner = await login();
    const supplier = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/suppliers`, headers: headers(owner), payload: { name: 'Fornecedor de teste', taxId: '12345678901', email: 'compras@example.test' } });
    expect(supplier.statusCode, supplier.body).toBe(201);
    const supplierId = supplier.json<{ supplier: { id: string; taxId: string; phone: null; email: string } }>().supplier.id;
    expect(supplier.json<{ supplier: { taxId: string; phone: null; email: string } }>().supplier).toMatchObject({ taxId: '12345678901', phone: null, email: 'compras@example.test' });
    const customer = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/customers`, headers: headers(owner), payload: { name: 'Cliente de teste', phone: '(11) 99999-0000' } });
    expect(customer.statusCode, customer.body).toBe(201);
    const customerId = customer.json<{ customer: { id: string } }>().customer.id;
    const inactive = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/suppliers/${supplierId}`, headers: headers(owner), payload: { active: false } });
    expect(inactive.statusCode).toBe(200);
    const customerList = await app.inject({ url: `/api/companies/${companyA}/customers?q=Cliente%20de%20teste`, headers: headers(owner) });
    expect(customerList.json<{ customers: { id: string; phone: string }[] }>().customers).toEqual(expect.arrayContaining([expect.objectContaining({ id: customerId, phone: '(11) 99999-0000' })]));
  });

  it('repete o seed sem duplicar o catálogo da demonstração', async () => {
    const before = await Promise.all([
      db.query<{ count: string }>('SELECT count(*) AS count FROM categories'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM products'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM suppliers'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM customers'),
    ]);
    const repeat = await seedDevelopment(db, { password: 'Another-test-password-2026!' });
    expect(repeat.created).toBe(false);
    const after = await Promise.all([
      db.query<{ count: string }>('SELECT count(*) AS count FROM categories'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM products'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM suppliers'),
      db.query<{ count: string }>('SELECT count(*) AS count FROM customers'),
    ]);
    expect(after.map(result => result.rows[0]!.count)).toEqual(before.map(result => result.rows[0]!.count));
  });
});
