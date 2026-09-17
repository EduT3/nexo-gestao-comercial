import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/server/app.js';
import { createDatabase, type Db } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';
import type { Member, Session } from '../src/shared/contracts.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Test-only-JG-2026!';
type App = Awaited<ReturnType<typeof buildApp>>;
type Login = { cookie: string; session: Session };
let db: Db;
let app: App;
let companyA: string;
let companyB: string;

async function login(email = 'admin@jg.local', secret = password): Promise<Login> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password: secret } });
  expect(response.statusCode, response.body).toBe(200);
  const cookie = String(response.headers['set-cookie']).split(';')[0]!;
  return { cookie, session: response.json<Session>() };
}
function headers(auth: Login) { return { origin, cookie: auth.cookie, 'x-csrf-token': auth.session.csrfToken }; }
async function createMember(auth: Login, role: Member['role'] = 'OPERADOR', company = companyA) {
  const email = `${randomUUID()}@example.test`;
  const response = await app.inject({ method: 'POST', url: `/api/companies/${company}/users`, headers: headers(auth), payload: { name: 'Operador de teste', email, password, role } });
  expect(response.statusCode, response.body).toBe(201);
  return { member: response.json<{ user: Member }>().user, email };
}

describe('Fundação: autenticação, RBAC, multiempresa e auditoria', () => {
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

  it('executa migrations e seed novamente sem duplicar empresas nem trocar a senha', async () => {
    await migrate(db);
    const repeat = await seedDevelopment(db, { password: 'Another-test-only-pass!' });
    expect(repeat.created).toBe(false);
    expect(repeat.password).toBeNull();
    const auth = await login();
    expect(auth.session.companies.map(c => c.name).sort()).toEqual(['Adega JG', 'Depósito JG']);
  });

  it('consulta banco no health e impede acesso sem autenticação', async () => {
    expect((await app.inject('/api/health')).statusCode).toBe(200);
    for (const url of ['/api/auth/session', '/api/companies', '/api/roles', '/api/consolidated', `/api/companies/${companyA}/overview`]) {
      expect((await app.inject(url)).statusCode, url).toBe(401);
    }
  });

  it('usa cookie HttpOnly e SameSite Strict, sem hash/senha no payload', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: 'admin@jg.local', password } });
    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toContain('HttpOnly');
    expect(response.headers['set-cookie']).toContain('SameSite=Strict');
    expect(response.body).not.toMatch(/password|password_hash|token_hash|scrypt/i);
    const auth = await login();
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: auth.cookie } })).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: `${auth.cookie}tampered` } })).statusCode).toBe(401);
  });

  it('não distingue usuário inexistente de senha inválida', async () => {
    const attempt = (email: string) => app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password: 'Invalid-password-123' } });
    const [wrong, absent] = await Promise.all([attempt('admin@jg.local'), attempt('missing@example.test')]);
    expect(wrong.statusCode).toBe(401);
    expect(absent.statusCode).toBe(401);
    expect(wrong.json().error.message).toBe(absent.json().error.message);
  });

  it('bloqueia Origin externo/ausente no login e CSRF inválido nas mutações', async () => {
    for (const requestHeaders of [{ origin: 'https://evil.example' }, {}]) {
      const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: requestHeaders, payload: { email: 'admin@jg.local', password } });
      expect(response.statusCode).toBe(403);
    }
    const auth = await login();
    for (const requestHeaders of [{ cookie: auth.cookie, origin }, { ...headers(auth), 'x-csrf-token': 'invalid' }, { ...headers(auth), origin: 'https://evil.example' }]) {
      expect((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: requestHeaders })).statusCode).toBe(403);
    }
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: auth.cookie } })).statusCode).toBe(200);
  });

  it('revoga efetivamente a sessão no logout', async () => {
    const auth = await login();
    expect((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: headers(auth) })).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: auth.cookie } })).statusCode).toBe(401);
  });

  it('nega alterações administrativas ao caixa diretamente na API', async () => {
    const owner = await login();
    const created = await createMember(owner);
    const cashier = await login(created.email);
    expect(cashier.session.companies.map(c => c.id)).toEqual([companyA]);
    expect((await app.inject({ url: `/api/companies/${companyA}/overview`, headers: headers(cashier) })).statusCode).toBe(200);
    for (const url of [`/api/companies/${companyA}/users`, `/api/companies/${companyA}/audit`, '/api/consolidated']) {
      expect((await app.inject({ url, headers: headers(cashier) })).statusCode, url).toBe(403);
    }
    expect((await app.inject({ method: 'POST', url: `/api/companies/${companyA}/users`, headers: headers(cashier), payload: { name: 'Ataque', email: 'attack@example.test', password, role: 'ADMIN' } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}`, headers: headers(cashier), payload: { name: 'Invasão', legalName: '', taxId: null, kind: 'DEPOSITO', address: '', timezone: 'America/Sao_Paulo' } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/companies', headers: headers(cashier), payload: { name: 'Invasão', legalName: 'Invasão', kind: 'ADEGA' } })).statusCode).toBe(403);
  });

  it('isola empresa e protege contra IDOR em leitura e mudança de vínculo', async () => {
    const owner = await login();
    const created = await createMember(owner);
    const cashier = await login(created.email);
    for (const suffix of ['overview', 'users', 'audit']) {
      expect((await app.inject({ url: `/api/companies/${companyB}/${suffix}`, headers: headers(cashier) })).statusCode).toBe(404);
    }
    const cross = await app.inject({ method: 'PATCH', url: `/api/companies/${companyB}/users/${created.member.id}`, headers: headers(owner), payload: { role: 'ADMIN', active: true } });
    expect(cross.statusCode).toBe(404);
    expect((await login(created.email)).session.companies[0]?.role).toBe('OPERADOR');
  });

  it('não expõe auditoria administrativa no overview de um operador', async () => {
    const owner = await login();
    const created = await createMember(owner);
    const cashier = await login(created.email);
    const response = await app.inject({ url: `/api/companies/${companyA}/overview`, headers: headers(cashier) });
    expect(response.json().recentAudit).toEqual([]);
    expect(response.body).not.toContain('password');
  });

  it('aplica alteração e inativação de vínculo em sessões já abertas', async () => {
    const owner = await login();
    const created = await createMember(owner, 'ADMIN');
    const manager = await login(created.email);
    expect((await app.inject({ url: `/api/companies/${companyA}/audit`, headers: headers(manager) })).statusCode).toBe(200);
    let changed = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/users/${created.member.id}`, headers: headers(owner), payload: { role: 'OPERADOR', active: true } });
    expect(changed.statusCode).toBe(200);
    expect((await app.inject({ url: `/api/companies/${companyA}/audit`, headers: headers(manager) })).statusCode).toBe(403);
    changed = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/users/${created.member.id}`, headers: headers(owner), payload: { role: 'OPERADOR', active: false } });
    expect(changed.statusCode).toBe(200);
    expect((await app.inject({ url: `/api/companies/${companyA}/overview`, headers: headers(manager) })).statusCode).toBe(404);
  });

  it('protege o próprio administrador contra perda acidental de acesso', async () => {
    const owner = await login();
    const response = await app.inject({ url: `/api/companies/${companyA}/users`, headers: headers(owner) });
    const own = response.json<{ users: Member[] }>().users.find(u => u.userId === owner.session.user.id)!;
    for (const payload of [{ role: 'OPERADOR', active: true }, { role: 'ADMIN', active: false }]) {
      const change = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}/users/${own.id}`, headers: headers(owner), payload });
      expect([403, 409]).toContain(change.statusCode);
    }
  });

  it('cria empresas com unidade e vínculo e consolida só empresas autorizadas', async () => {
    const owner = await login();
    const response = await app.inject({ method: 'POST', url: '/api/companies', headers: headers(owner), payload: { name: 'Unidade teste', legalName: 'JG Testes', kind: 'DEPOSITO', address: 'Endereço de demonstração' } });
    expect(response.statusCode, response.body).toBe(201);
    const id: string = response.json().company.id;
    const overview = await app.inject({ url: `/api/companies/${id}/overview`, headers: headers(owner) });
    expect(overview.json().stores).toHaveLength(1);
    expect(overview.json().activeUsers).toBe(1);
    const consolidated = await app.inject({ url: '/api/consolidated', headers: headers(owner) });
    expect(consolidated.statusCode).toBe(200);
    expect(consolidated.json().scope).toBe('authorized_companies');
    expect(consolidated.json().companies.map((c: { id: string }) => c.id)).toContain(id);
  });

  it('gera histórico anterior/posterior sem vazar registros de outra empresa', async () => {
    const owner = await login();
    const before = owner.session.companies.find(c => c.id === companyA)!;
    const payload = { name: 'Depósito JG atualizado', legalName: before.legalName, taxId: before.taxId, kind: before.kind, address: 'Rua de teste, 15', timezone: before.timezone };
    const response = await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}`, headers: headers(owner), payload });
    expect(response.statusCode, response.body).toBe(200);
    const audit = (await app.inject({ url: `/api/companies/${companyA}/audit`, headers: headers(owner) })).json();
    expect(audit.events.length).toBeGreaterThan(0);
    expect(audit.events.every((e: { companyId: string }) => e.companyId === companyA)).toBe(true);
    expect(audit.events.some((e: { before: { name?: string } | null; after: { name?: string } | null }) => e.before?.name === before.name && e.after?.name === payload.name)).toBe(true);
    expect(JSON.stringify(audit)).not.toMatch(/password|csrf|token_hash|scrypt/i);
    const other = (await app.inject({ url: `/api/companies/${companyB}/audit`, headers: headers(owner) })).json();
    expect(other.events.every((e: { companyId: string }) => e.companyId === companyB)).toBe(true);
    await app.inject({ method: 'PATCH', url: `/api/companies/${companyA}`, headers: headers(owner), payload: { ...payload, name: before.name } });
  });

  it('valida entrada e não retorna detalhes SQL em erros', async () => {
    const owner = await login();
    for (const payload of [{ name: '', email: 'bad', password: '123', role: 'ADMIN' }, { name: 'Nome', email: 'valid@example.test', password, role: 'ROOT' }]) {
      const response = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/users`, headers: headers(owner), payload });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.message).toBeTruthy();
      expect(response.body).not.toMatch(/stack|SELECT |INSERT |node_modules/);
    }
    const created = await createMember(owner);
    const conflict = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/users`, headers: headers(owner), payload: { name: 'Duplicate', email: created.email, password, role: 'OPERADOR' } });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.body).not.toMatch(/constraint|INSERT |password_hash/);
  });

  it('limita tentativas de login', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 16; i++) {
      const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: 'admin@jg.local', password: 'Wrong-password-123!' } });
      statuses.push(response.statusCode);
    }
    expect(statuses).toContain(429);
  });

  it('troca senha e invalida todas as sessões anteriores', async () => {
    const owner = await login();
    const created = await createMember(owner);
    const user = await login(created.email);
    const otherSession = await login(created.email);
    const newPassword = 'Test-only-new-password-2026!';
    const bad = await app.inject({ method: 'POST', url: '/api/auth/password', headers: headers(user), payload: { currentPassword: 'invalid-password', newPassword } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe('INVALID_PASSWORD');
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: user.cookie } })).statusCode).toBe(200);
    const changed = await app.inject({ method: 'POST', url: '/api/auth/password', headers: headers(user), payload: { currentPassword: password, newPassword } });
    expect(changed.statusCode, changed.body).toBe(200);
    for (const session of [user, otherSession]) {
      expect((await app.inject({ url: '/api/auth/session', headers: { cookie: session.cookie } })).statusCode).toBe(401);
    }
    await login(created.email, newPassword);
  });

  it('rejeita escrita destrutiva na auditoria no próprio banco', async () => {
    await expect(db.query('UPDATE audit_logs SET action = $1', ['tampered'])).rejects.toThrow();
    await expect(db.query('DELETE FROM audit_logs')).rejects.toThrow();
    await expect(db.query('TRUNCATE audit_logs')).rejects.toThrow();
  });

  it('cancela alteração de negócio quando a gravação da auditoria falha', async () => {
    const owner = await login();
    const before = (await db.query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [companyA])).rows[0]!.name;
    const failingAuditDb: Db = {
      ...db,
      transaction: fn => db.transaction(tx => fn({
        ...tx,
        query: (sql, values) => {
          if (/INSERT INTO audit_logs/i.test(sql)) throw new Error('Simulated audit storage failure');
          return tx.query(sql, values);
        },
      })),
    };
    const failingApp = await buildApp({ db: failingAuditDb, origin, demo: true });
    try {
      const response = await failingApp.inject({ method: 'PATCH', url: `/api/companies/${companyA}`, headers: headers(owner), payload: { name: 'Should never commit' } });
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('Simulated');
      expect((await db.query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [companyA])).rows[0]!.name).toBe(before);
    } finally { await failingApp.close(); }
  });

  it('persiste CNPJ alfanumérico normalizado e rejeita dígitos incorretos', async () => {
    const owner = await login();
    const saved = await app.inject({ method: 'PATCH', url: `/api/companies/${companyB}`, headers: headers(owner), payload: { taxId: '12.abc.345/01de-35' } });
    expect(saved.statusCode, saved.body).toBe(200);
    expect(saved.json().company.taxId).toBe('12ABC34501DE35');
    const invalid = await app.inject({ method: 'PATCH', url: `/api/companies/${companyB}`, headers: headers(owner), payload: { taxId: '12ABC34501DE36' } });
    expect(invalid.statusCode).toBe(400);
    const persisted = await app.inject({ url: `/api/companies/${companyB}/overview`, headers: headers(owner) });
    expect(persisted.json().company.taxId).toBe('12ABC34501DE35');
  });

  it('recusa sessão expirada e usuário globalmente inativo', async () => {
    const owner = await login();
    const created = await createMember(owner);
    const user = await login(created.email);
    await db.query("UPDATE sessions SET created_at=now()-interval '9 hours',expires_at=now()-interval '1 hour' WHERE user_id=$1", [user.session.user.id]);
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: user.cookie } })).statusCode).toBe(401);
    const fresh = await login(created.email);
    await db.query('UPDATE users SET active=false WHERE id=$1', [user.session.user.id]);
    expect((await app.inject({ url: `/api/companies/${companyA}/overview`, headers: headers(fresh) })).statusCode).toBe(401);
  });

  it('reverte transação inteira em falha e preserva FK da unidade', async () => {
    const before = (await db.query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [companyA])).rows[0]!.name;
    await expect(db.transaction(async tx => {
      await tx.query('UPDATE companies SET name = $1 WHERE id = $2', ['Must roll back', companyA]);
      await tx.query('INSERT INTO stores (id, company_id, name, address) VALUES ($1, $2, $3, $4)', [randomUUID(), randomUUID(), 'Invalid company', '']);
    })).rejects.toThrow();
    expect((await db.query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [companyA])).rows[0]!.name).toBe(before);
  });
});

describe('Persistência relacional local', () => {
  it('recupera os dados após fechar e reabrir o banco de desenvolvimento', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'jg-erp-persistence-'));
    let database: Db | undefined;
    try {
      database = await createDatabase({ dataDir: directory });
      await migrate(database);
      const seed = await seedDevelopment(database, { password });
      await database.close();
      database = await createDatabase({ dataDir: directory });
      const company = await database.query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [seed.companyIds[0]]);
      expect(company.rows).toHaveLength(1);
      expect(company.rows[0]!.name).toBe('Depósito JG');
    } finally {
      await database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
