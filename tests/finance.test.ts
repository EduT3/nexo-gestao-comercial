import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import { createDatabase, type Db } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';
import type { Session } from '../src/shared/contracts.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Finance-test-password-2026!';
type App = Awaited<ReturnType<typeof buildApp>>;
type Login = { cookie: string; session: Session };
let db: Db; let app: App; let companyA: string; let companyB: string;

async function login(email = 'admin@jg.local'): Promise<Login> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password } });
  expect(response.statusCode, response.body).toBe(200);
  return { cookie: String(response.headers['set-cookie']).split(';')[0]!, session: response.json<Session>() };
}
function headers(auth: Login, key?: string) { return { origin, cookie: auth.cookie, 'x-csrf-token': auth.session.csrfToken, ...(key ? { 'idempotency-key': key } : {}) }; }
async function createPayable(auth: Login, companyId: string, amountCents = 1000) {
  const supplier = (await db.query<{ id: string }>('SELECT id FROM suppliers WHERE company_id=$1 ORDER BY name LIMIT 1', [companyId])).rows[0]!.id;
  const product = (await db.query<{ id: string }>('SELECT id FROM products WHERE company_id=$1 ORDER BY name LIMIT 1', [companyId])).rows[0]!.id;
  const response = await app.inject({ method: 'POST', url: `/api/companies/${companyId}/purchases/receive`, headers: headers(auth, randomUUID()), payload: { supplierId: supplier, items: [{ productId: product, quantity: '1.000', unitCostCents: amountCents }], notes: 'Compra financeira', payable: { dueDate: '2026-10-20', notes: 'Título de teste' } } });
  expect(response.statusCode, response.body).toBe(201);
  return response.json().purchase.payable.id as string;
}
function pay(auth: Login, companyId: string, payableId: string, method: string, key = randomUUID(), notes = '') {
  return app.inject({ method: 'POST', url: `/api/companies/${companyId}/finance/payables/${payableId}/pay`, headers: headers(auth, key), payload: { paymentMethod: method, notes } });
}

describe('M5: contas a pagar e financeiro', () => {
  beforeAll(async () => { db = await createDatabase({ dataDir: 'memory://' }); await migrate(db); const seeded = await seedDevelopment(db, { password }); [companyA, companyB] = seeded.companyIds as [string, string]; });
  beforeEach(async () => { app = await buildApp({ db, origin, demo: true, logger: false }); });
  afterEach(async () => { await app.close(); });
  afterAll(async () => { await db.close(); });

  it('liquida conta por Pix uma vez, preserva origem e atualiza os totais financeiros', async () => {
    const auth = await login(); const payableId = await createPayable(auth, companyA, 1234); const key = randomUUID();
    const first = await pay(auth, companyA, payableId, 'PIX', key, 'Pix do fornecedor');
    const replay = await pay(auth, companyA, payableId, 'PIX', key, 'Pix do fornecedor');
    expect(first.statusCode, first.body).toBe(201); expect(replay.statusCode).toBe(200); expect(replay.json().replayed).toBe(true);
    expect(first.json().payable).toMatchObject({ id: payableId, status: 'PAID', amountCents: 1234, paymentMethod: 'PIX', paymentNotes: 'Pix do fornecedor' });
    const purchases = await app.inject({ url: `/api/companies/${companyA}/purchases?limit=50&offset=0`, headers: headers(auth) });
    expect(purchases.statusCode, purchases.body).toBe(200);
    expect(purchases.json().purchases.find((purchase: { payable: { id: string } | null }) => purchase.payable?.id === payableId).payable).toMatchObject({ category: 'Compras', paymentMethod: 'PIX', paymentNotes: 'Pix do fornecedor', paidBy: auth.session.user.id, paidByName: auth.session.user.name });
    expect((await db.query('SELECT id FROM financial_entries WHERE company_id=$1 AND source_type=$2 AND source_id=$3', [companyA, 'PAYABLE', payableId])).rows).toHaveLength(1);
    expect((await db.query('SELECT id FROM cash_movements WHERE company_id=$1 AND financial_entry_id IN (SELECT id FROM financial_entries WHERE company_id=$1 AND source_id=$2)', [companyA, payableId])).rows).toHaveLength(0);
    const list = await app.inject({ url: `/api/companies/${companyA}/finance`, headers: headers(auth) });
    expect(list.statusCode).toBe(200); expect(list.json().payables.find((item: { id: string }) => item.id === payableId).status).toBe('PAID');
    expect(list.json().totals.expenseRealizedCents).toBeGreaterThanOrEqual(1234);
    const divergent = await pay(auth, companyA, payableId, 'CASH', key);
    expect(divergent.statusCode).toBe(409); expect(divergent.json().error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('exige caixa do operador e saldo suficiente para pagar em dinheiro', async () => {
    const auth = await login(); const payableId = await createPayable(auth, companyB, 1500);
    const withoutCash = await pay(auth, companyB, payableId, 'CASH');
    expect(withoutCash.statusCode).toBe(409); expect(withoutCash.json().error.code).toBe('CASH_NOT_OPEN');
    const opening = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/open`, headers: headers(auth, randomUUID()), payload: { openingCents: 1000, notes: 'Caixa financeiro' } });
    expect(opening.statusCode).toBe(201);
    const insufficient = await pay(auth, companyB, payableId, 'CASH');
    expect(insufficient.statusCode).toBe(409); expect(insufficient.json().error.code).toBe('INSUFFICIENT_CASH');
    await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/movements`, headers: headers(auth, randomUUID()), payload: { type: 'ENTRY', amountCents: 1000, notes: 'Reforço para pagamento' } });
    const paid = await pay(auth, companyB, payableId, 'CASH', randomUUID(), 'Pago no balcão');
    expect(paid.statusCode, paid.body).toBe(201);
    const cash = await app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) });
    expect(cash.json().cashRegister).toMatchObject({ openingCents: 1000, entriesCents: 1000, exitsCents: 1500, expectedCashCents: 500 });
  });

  it('nega acesso financeiro ao operador e não liquida títulos de outra empresa', async () => {
    const admin = await login(); const payableId = await createPayable(admin, companyA, 432);
    const email = `finance-op-${randomUUID()}@example.test`;
    const created = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/users`, headers: headers(admin), payload: { name: 'Operador financeiro negado', email, password, role: 'OPERADOR' } });
    expect(created.statusCode).toBe(201);
    const operator = await login(email);
    expect((await app.inject({ url: `/api/companies/${companyA}/finance`, headers: headers(operator) })).statusCode).toBe(403);
    expect((await pay(operator, companyA, payableId, 'PIX')).statusCode).toBe(403);
    expect((await pay(admin, companyB, payableId, 'PIX')).statusCode).toBe(404);
    const other = await app.inject({ url: `/api/companies/${companyB}/finance`, headers: headers(admin) });
    expect(other.json().payables.some((item: { id: string }) => item.id === payableId)).toBe(false);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE company_id=$1 AND id=$2', [companyA, payableId])).rows[0]!.status).toBe('OPEN');
    await expect(db.query(`INSERT INTO financial_entries(id,company_id,kind,status,description,amount_cents,source_type,source_id,payable_id)
      VALUES($1,$2,'EXPENSE','OPEN','Origem cruzada',432,'PAYABLE',$3,$3)`, [randomUUID(), companyB, payableId])).rejects.toMatchObject({ code: '23503' });
  });

  it('reverte título, despesa e caixa quando a auditoria falha', async () => {
    await app.close();
    const normal = await buildApp({ db, origin, demo: true, logger: false }); app = normal;
    const auth = await login(); const payableId = await createPayable(auth, companyA, 777);
    await app.close();
    const failingDb: Db = { query: (sql, params) => db.query(sql, params), exec: sql => db.exec(sql), close: async () => undefined, transaction: fn => db.transaction(tx => fn({ query: async (sql, params) => { if (sql.includes('INSERT INTO audit_logs') && params?.[4] === 'payable.paid') throw new Error('Falha de auditoria injetada'); return tx.query(sql, params); }, exec: sql => tx.exec(sql), transaction: async () => { throw new Error('Transações aninhadas não são permitidas.'); }, close: async () => undefined })) };
    app = await buildApp({ db: failingDb, origin, demo: true, logger: false });
    const failingAuth = await login(); const response = await pay(failingAuth, companyA, payableId, 'PIX');
    expect(response.statusCode).toBe(500);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE company_id=$1 AND id=$2', [companyA, payableId])).rows[0]!.status).toBe('OPEN');
    expect((await db.query('SELECT id FROM financial_entries WHERE company_id=$1 AND source_type=$2 AND source_id=$3', [companyA, 'PAYABLE', payableId])).rows).toHaveLength(0);
  });

  it('protege cliente, valor e estado do título a receber no banco', async () => {
    const customer = (await db.query<{ id: string }>('SELECT id FROM customers WHERE company_id=$1 LIMIT 1', [companyA])).rows[0]!.id;
    const actor = (await login()).session.user.id;
    const insert = (companyId: string, amount: number, status = 'OPEN') => db.query(`INSERT INTO accounts_receivable
      (id,company_id,customer_id,description,category,amount_cents,due_date,actor_id,idempotency_key,command_hash,status)
      VALUES($1,$2,$3,'Recebimento de teste','Outras receitas',$4,'2026-10-25',$5,$6,$7,$8)`, [randomUUID(),companyId,customer,amount,actor,randomUUID(),'a'.repeat(64),status]);
    await expect(insert(companyA,1234)).resolves.toBeDefined();
    await expect(insert(companyB,1234)).rejects.toMatchObject({ code: '23503' });
    await expect(insert(companyA,0)).rejects.toMatchObject({ code: '23514' });
    await expect(insert(companyA,1234,'RECEIVED')).rejects.toMatchObject({ code: '23514' });
  });

  it('cria conta a receber pela API uma vez com auditoria e rejeita cliente cruzado', async () => {
    const auth = await login(); const key = randomUUID();
    const customer = (await db.query<{ id: string }>('SELECT id FROM customers WHERE company_id=$1 LIMIT 1',[companyA])).rows[0]!.id;
    const body = { customerId: customer,description: 'Recebimento API',category: 'Outras receitas',amountCents: 1250,dueDate: '2026-10-30',notes: '' };
    const send = (companyId: string, payload = body) => app.inject({ method: 'POST',url: `/api/companies/${companyId}/finance/receivables`,headers: headers(auth,key),payload });
    const first = await send(companyA); const replay = await send(companyA);
    expect(first.statusCode,first.body).toBe(201); expect(replay.statusCode).toBe(200);
    expect(replay.json()).toMatchObject({ receivableId: first.json().receivableId,replayed: true });
    expect((await send(companyA,{ ...body,amountCents: 1300 })).statusCode).toBe(409);
    expect((await send(companyB)).statusCode).toBe(404);
    expect((await db.query('SELECT id FROM audit_logs WHERE company_id=$1 AND entity_id=$2 AND action=$3',[companyA,first.json().receivableId,'receivable.created'])).rows).toHaveLength(1);
  });

  it('recebe título por Pix uma vez e bloqueia dinheiro sem caixa', async () => {
    const auth = await login();
    const created = await app.inject({ method:'POST',url:`/api/companies/${companyA}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{ description:'Recebimento transacional',category:'Outras receitas',amountCents:2500,dueDate:'2026-10-30' } });
    expect(created.statusCode).toBe(201); const id = created.json().receivableId; const key = randomUUID();
    const receive = (method:string,operationKey=key) => app.inject({ method:'POST',url:`/api/companies/${companyA}/finance/receivables/${id}/receive`,headers:headers(auth,operationKey),payload:{ paymentMethod:method,notes:'' } });
    expect((await receive('CASH',randomUUID())).statusCode).toBe(409);
    expect((await receive('PIX')).statusCode).toBe(201);
    expect((await receive('PIX')).json().replayed).toBe(true);
    expect((await receive('CASH')).statusCode).toBe(409);
    expect((await receive('PIX',randomUUID())).statusCode).toBe(409);
    const entries = await db.query<{ id:string }>('SELECT id FROM financial_entries WHERE company_id=$1 AND receivable_id=$2',[companyA,id]);
    expect(entries.rows).toHaveLength(1);
    expect((await db.query('SELECT id FROM cash_movements WHERE company_id=$1 AND financial_entry_id=$2',[companyA,entries.rows[0]!.id])).rows).toHaveLength(0);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_receivable WHERE company_id=$1 AND id=$2',[companyA,id])).rows[0]!.status).toBe('RECEIVED');
  });

  it('nega recebimento ao operador e por caminho de outra empresa sem efeitos', async () => {
    const auth=await login(); const created=await app.inject({method:'POST',url:`/api/companies/${companyA}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{description:'Título protegido',category:'Outras receitas',amountCents:500,dueDate:'2026-11-01'}});
    const id=created.json().receivableId;
    const email=(await db.query<{email:string}>(`SELECT u.email FROM users u JOIN company_memberships m ON m.user_id=u.id WHERE m.company_id=$1 AND m.role_key='OPERADOR' LIMIT 1`,[companyA])).rows[0]!.email;
    const operator=await login(email);
    const receive=(actor:Login,companyId:string)=>app.inject({method:'POST',url:`/api/companies/${companyId}/finance/receivables/${id}/receive`,headers:headers(actor,randomUUID()),payload:{paymentMethod:'PIX',notes:''}});
    expect((await receive(operator,companyA)).statusCode).toBe(403);
    expect((await receive(auth,companyB)).statusCode).toBe(404);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_receivable WHERE company_id=$1 AND id=$2',[companyA,id])).rows[0]!.status).toBe('OPEN');
    expect((await db.query('SELECT id FROM financial_entries WHERE receivable_id=$1',[id])).rows).toHaveLength(0);
  });

  it('reverte recebimento em dinheiro, receita e movimento quando auditoria falha', async () => {
    const auth=await login(); const created=await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{description:'Rollback recebido',category:'Outras receitas',amountCents:700,dueDate:'2026-11-01'}});
    const id=created.json().receivableId;
    const before=(await db.query<{count:string}>('SELECT count(*)::text AS count FROM cash_movements WHERE company_id=$1',[companyB])).rows[0]!.count;
    await app.close();
    const failingDb:Db={query:(sql,params)=>db.query(sql,params),exec:sql=>db.exec(sql),close:async()=>undefined,transaction:fn=>db.transaction(tx=>fn({query:async(sql,params)=>{if(sql.includes('INSERT INTO audit_logs')&&params?.[4]==='receivable.received')throw new Error('Falha tardia injetada');return tx.query(sql,params);},exec:sql=>tx.exec(sql),transaction:async()=>{throw new Error('Transação aninhada');},close:async()=>undefined}))};
    app=await buildApp({db:failingDb,origin,demo:true,logger:false});
    const actor=await login();const key=randomUUID();
    const response=await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables/${id}/receive`,headers:headers(actor,key),payload:{paymentMethod:'CASH',notes:''}});
    expect(response.statusCode).toBe(500);
    expect((await db.query<{status:string;key:string|null}>('SELECT status,receipt_idempotency_key AS key FROM accounts_receivable WHERE id=$1',[id])).rows[0]).toEqual({status:'OPEN',key:null});
    expect((await db.query('SELECT id FROM financial_entries WHERE receivable_id=$1',[id])).rows).toHaveLength(0);
    expect((await db.query<{count:string}>('SELECT count(*)::text AS count FROM cash_movements WHERE company_id=$1',[companyB])).rows[0]!.count).toBe(before);
    await app.close();app=await buildApp({db,origin,demo:true,logger:false});const retry=await login();
    expect((await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables/${id}/receive`,headers:headers(retry,key),payload:{paymentMethod:'CASH',notes:''}})).statusCode).toBe(201);
  });

  it('consulta títulos reais e recebe dinheiro atualizando receita e caixa uma vez', async () => {
    const auth = await login();
    const created = await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{description:'Dinheiro a receber',category:'Outras receitas',amountCents:900,dueDate:'2026-11-01'}});
    const id = created.json().receivableId;
    const overview = () => app.inject({url:`/api/companies/${companyB}/finance?limit=1`,headers:headers(auth)});
    const before = (await overview()).json().totals;
    const key=randomUUID(); const payload={paymentMethod:'CASH',notes:'Recebido no caixa'};
    const receive=()=>app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables/${id}/receive`,headers:headers(auth,key),payload});
    expect((await receive()).statusCode).toBe(201); expect((await receive()).json().replayed).toBe(true);
    const after=(await overview()).json().totals;
    expect(after.receivableOpenCents).toBe(before.receivableOpenCents-900);
    expect(after.revenueRealizedCents).toBe(before.revenueRealizedCents+900);
    const cash=await app.inject({url:`/api/companies/${companyB}/cash/current`,headers:headers(auth)});
    expect(cash.json().cashRegister.expectedCashCents).toBe(2100);
    const list=await app.inject({url:`/api/companies/${companyB}/finance`,headers:headers(auth)});
    expect(list.json().receivables.find((item:{id:string})=>item.id===id)).toMatchObject({status:'RECEIVED',paymentMethod:'CASH',amountCents:900});
  });

  it('registra receita manual por Pix uma vez sem movimentar dinheiro e isola empresas', async () => {
    const auth = await login(); const key = randomUUID();
    const payload = { kind: 'REVENUE', description: 'Serviço avulso', category: 'Serviços', amountCents: 123, paymentMethod: 'PIX', notes: 'Confirmado' };
    const post = (body = payload) => app.inject({ method: 'POST', url: `/api/companies/${companyA}/finance/entries`, headers: headers(auth, key), payload: body });
    const first = await post(); expect(first.statusCode, first.body).toBe(201);
    expect((await post()).json()).toMatchObject({ entryId: first.json().entryId, replayed: true });
    expect((await post({ ...payload, amountCents: 124 })).statusCode).toBe(409);
    const id = first.json().entryId;
    expect((await db.query('SELECT id FROM cash_movements WHERE financial_entry_id=$1', [id])).rows).toHaveLength(0);
    const other = await app.inject({ url: `/api/companies/${companyB}/finance`, headers: headers(auth) });
    expect(other.json().entries.some((entry: { id: string }) => entry.id === id)).toBe(false);
    const operatorEmail = (await db.query<{ email: string }>("SELECT email FROM users WHERE email LIKE 'finance-op-%' LIMIT 1")).rows[0]!.email;
    const operator = await login(operatorEmail);
    expect((await app.inject({ method: 'POST', url: `/api/companies/${companyA}/finance/entries`, headers: headers(operator, randomUUID()), payload })).statusCode).toBe(403);
  });

  it('exige caixa e saldo para despesa manual em dinheiro e concilia os movimentos', async () => {
    const auth = await login();
    const payload = { kind: 'EXPENSE', description: 'Material de limpeza', category: 'Operação', amountCents: 100, paymentMethod: 'CASH' };
    const post = (company: string, body = payload) => app.inject({ method: 'POST', url: `/api/companies/${company}/finance/entries`, headers: headers(auth, randomUUID()), payload: body });
    expect((await post(companyA)).json().error.code).toBe('CASH_NOT_OPEN');
    expect((await post(companyB, { ...payload, amountCents: 999999 })).json().error.code).toBe('INSUFFICIENT_CASH');
    const paid = await post(companyB); expect(paid.statusCode, paid.body).toBe(201);
    const received = await post(companyB, { ...payload, kind: 'REVENUE', amountCents: 250 }); expect(received.statusCode).toBe(201);
    const cash = await app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) });
    expect(cash.json().cashRegister.expectedCashCents).toBe(2250);
    expect((await db.query('SELECT direction,amount_cents::text AS amount FROM cash_movements WHERE financial_entry_id=$1', [paid.json().entryId])).rows).toEqual([{ direction: 'OUT', amount: '100' }]);
  });

  it('reverte lançamento manual e dinheiro quando auditoria falha e permite reexecução', async () => {
    const auth = await login(); const key = randomUUID();
    const payload = { kind: 'EXPENSE', description: 'Despesa com rollback', category: 'Operação', amountCents: 50, paymentMethod: 'CASH' };
    const before = (await db.query('SELECT id FROM cash_movements WHERE company_id=$1', [companyB])).rows.length;
    await app.close();
    const failing: Db = { ...db, transaction: fn => db.transaction(tx => fn({ ...tx, query: async (sql, params) => {
      if (sql.includes('INSERT INTO audit_logs') && params?.[4] === 'financial_entry.created') throw new Error('Falha de auditoria');
      return tx.query(sql, params);
    } })) };
    app = await buildApp({ db: failing, origin, demo: true, logger: false });
    const post = () => app.inject({ method: 'POST', url: `/api/companies/${companyB}/finance/entries`, headers: headers(auth, key), payload });
    expect((await post()).statusCode).toBe(500);
    expect((await db.query('SELECT id FROM financial_entries WHERE idempotency_key=$1', [key])).rows).toHaveLength(0);
    expect((await db.query('SELECT id FROM cash_movements WHERE company_id=$1', [companyB])).rows).toHaveLength(before);
    await app.close(); app = await buildApp({ db, origin, demo: true, logger: false });
    expect((await post()).statusCode).toBe(201);
    expect((await post()).json().replayed).toBe(true);
  });
});
