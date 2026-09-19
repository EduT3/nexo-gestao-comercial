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

  it('estorna lançamento manual por Pix uma vez, preserva original e concilia totais', async () => {
    const auth = await login();
    const created = await app.inject({method:'POST',url:`/api/companies/${companyA}/finance/entries`,headers:headers(auth,randomUUID()),payload:{kind:'EXPENSE',description:'Despesa reversível',category:'Operação',amountCents:345,paymentMethod:'PIX'}});
    expect(created.statusCode,created.body).toBe(201);
    const id=created.json().entryId; const key=randomUUID();
    const original=(await db.query('SELECT * FROM financial_entries WHERE id=$1',[id])).rows[0];
    const before=(await app.inject({url:`/api/companies/${companyA}/finance`,headers:headers(auth)})).json().totals;
    const reverse=(reason='Lançamento incorreto',company=companyA,newKey=key)=>app.inject({method:'POST',url:`/api/companies/${company}/finance/entries/${id}/reverse`,headers:headers(auth,newKey),payload:{reason}});
    expect((await reverse()).statusCode).toBe(201);
    expect((await reverse()).json().replayed).toBe(true);
    expect((await reverse('Motivo divergente')).statusCode).toBe(409);
    expect((await reverse('Lançamento incorreto',companyA,randomUUID())).json().error.code).toBe('ENTRY_ALREADY_REVERSED');
    expect((await reverse('Lançamento incorreto',companyB,randomUUID())).statusCode).toBe(404);
    expect((await db.query('SELECT * FROM financial_entries WHERE id=$1',[id])).rows[0]).toEqual(original);
    const after=(await app.inject({url:`/api/companies/${companyA}/finance`,headers:headers(auth)})).json();
    expect(after.totals.expenseRealizedCents).toBe(before.expenseRealizedCents-345);
    expect(after.entries.find((entry:{id:string})=>entry.id===id)).toMatchObject({reversalReason:'Lançamento incorreto'});
    const reversal=(await db.query<{id:string}>('SELECT id FROM financial_reversals WHERE entry_id=$1',[id])).rows[0]!.id;
    expect((await db.query('SELECT id FROM cash_movements WHERE financial_reversal_id=$1',[reversal])).rows).toHaveLength(0);
    await expect(db.query('DELETE FROM financial_reversals WHERE id=$1',[reversal])).rejects.toThrow();
    await expect(db.query('INSERT INTO financial_reversals(id,company_id,entry_id,reason,actor_id,idempotency_key,command_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),companyB,id,'Origem cruzada',auth.session.user.id,randomUUID(),'a'.repeat(64)])).rejects.toMatchObject({code:'23503'});
  });

  it('liquida conta por Pix uma vez, preserva origem e atualiza os totais financeiros', async () => {
    const auth = await login(); const payableId = await createPayable(auth, companyA, 1234); const key = randomUUID();
    const first = await pay(auth, companyA, payableId, 'PIX', key, 'Pix do fornecedor');
    const replay = await pay(auth, companyA, payableId, 'PIX', key, 'Pix do fornecedor');
    expect(first.statusCode, first.body).toBe(201); expect(replay.statusCode).toBe(200); expect(replay.json().replayed).toBe(true);
    const settlements = await db.query<{ id: string; payable: string; key: string }>('SELECT id,payable_id AS payable,idempotency_key AS key FROM title_settlements WHERE company_id=$1 AND payable_id=$2', [companyA, payableId]);
    expect(settlements.rows).toHaveLength(1);
    expect(settlements.rows[0]).toMatchObject({ payable: payableId, key });
    await expect(db.query('DELETE FROM title_settlements WHERE id=$1', [settlements.rows[0]!.id])).rejects.toThrow();
    await expect(db.query('UPDATE title_settlements SET command_hash=$1 WHERE id=$2', ['a'.repeat(64), settlements.rows[0]!.id])).rejects.toThrow();
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

  it('nega devolução de receita em dinheiro sem saldo e permite retry após reforço', async () => {
    const auth = await login();
    const cash = () => app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) });
    const initial = (await cash()).json().cashRegister.expectedCashCents;
    const created = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/finance/entries`, headers: headers(auth, randomUUID()), payload: { kind: 'REVENUE', description: 'Receita para devolução', category: 'Serviços', amountCents: 400, paymentMethod: 'CASH' } });
    expect(created.statusCode).toBe(201);
    const entryId = created.json().entryId;
    const movement = (type: string, amountCents: number) => app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/movements`, headers: headers(auth, randomUUID()), payload: { type, amountCents, notes: 'Conferência de saldo para estorno' } });
    expect((await movement('EXIT', initial + 400)).statusCode).toBe(201);
    const key = randomUUID();
    const reverse = () => app.inject({ method: 'POST', url: `/api/companies/${companyB}/finance/entries/${entryId}/reverse`, headers: headers(auth, key), payload: { reason: 'Devolução da receita' } });
    const denied = await reverse();
    expect(denied.statusCode).toBe(409);
    expect(denied.json().error.code).toBe('INSUFFICIENT_CASH');
    expect((await cash()).json().cashRegister.expectedCashCents).toBe(0);
    expect((await db.query('SELECT id FROM financial_reversals WHERE entry_id=$1', [entryId])).rows).toHaveLength(0);
    expect((await movement('ENTRY', initial + 400)).statusCode).toBe(201);
    expect((await reverse()).statusCode).toBe(201);
    expect((await reverse()).json().replayed).toBe(true);
    expect((await cash()).json().cashRegister.expectedCashCents).toBe(initial);
    const reversal = (await db.query<{ id: string }>('SELECT id FROM financial_reversals WHERE entry_id=$1', [entryId])).rows[0]!;
    expect((await db.query('SELECT direction,amount_cents::text AS amount FROM cash_movements WHERE financial_reversal_id=$1', [reversal.id])).rows).toEqual([{ direction: 'OUT', amount: '400' }]);
  });

  it('impede estorno manual de título liquidado sem alterar sua origem', async () => {
    const auth = await login();
    const payableId = await createPayable(auth, companyA, 321);
    expect((await pay(auth, companyA, payableId, 'PIX')).statusCode).toBe(201);
    const entry = (await db.query<{ id: string }>('SELECT id FROM financial_entries WHERE payable_id=$1', [payableId])).rows[0]!;
    const response = await app.inject({ method: 'POST', url: `/api/companies/${companyA}/finance/entries/${entry.id}/reverse`, headers: headers(auth, randomUUID()), payload: { reason: 'Correção de pagamento' } });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('LINKED_ENTRY');
    expect((await db.query('SELECT id FROM financial_reversals WHERE entry_id=$1', [entry.id])).rows).toHaveLength(0);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE id=$1', [payableId])).rows[0]!.status).toBe('PAID');
  });

  it('reverte estorno e devolução ao caixa quando auditoria falha; reexecução restaura saldo uma vez', async () => {
    const auth=await login();
    const cash=()=>app.inject({url:`/api/companies/${companyB}/cash/current`,headers:headers(auth)});
    const before=(await cash()).json().cashRegister.expectedCashCents;
    const created=await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/entries`,headers:headers(auth,randomUUID()),payload:{kind:'EXPENSE',description:'Despesa dinheiro reversível',category:'Operação',amountCents:50,paymentMethod:'CASH'}});
    expect(created.statusCode).toBe(201); const id=created.json().entryId; const key=randomUUID();
    expect((await cash()).json().cashRegister.expectedCashCents).toBe(before-50);
    const operatorEmail=(await db.query<{email:string}>("SELECT email FROM users WHERE email LIKE 'finance-op-%' LIMIT 1")).rows[0]!.email;
    const operator=await login(operatorEmail);
    expect((await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/entries/${id}/reverse`,headers:headers(operator,randomUUID()),payload:{reason:'Negado'}})).statusCode).toBe(404);
    expect((await app.inject({method:'POST',url:`/api/companies/${companyA}/finance/entries/${id}/reverse`,headers:headers(operator,randomUUID()),payload:{reason:'Negado'}})).statusCode).toBe(403);
    await app.close();
    const failing:Db={...db,transaction:fn=>db.transaction(tx=>fn({...tx,query:async(sql,params)=>{
      if(sql.includes('INSERT INTO audit_logs') && params?.[4]==='financial_entry.reversed') throw new Error('Falha tardia de auditoria');
      return tx.query(sql,params);
    }}))};
    app=await buildApp({db:failing,origin,demo:true,logger:false});
    const reverse=()=>app.inject({method:'POST',url:`/api/companies/${companyB}/finance/entries/${id}/reverse`,headers:headers(auth,key),payload:{reason:'Correção'}});
    expect((await reverse()).statusCode).toBe(500);
    expect((await db.query('SELECT id FROM financial_reversals WHERE entry_id=$1',[id])).rows).toHaveLength(0);
    expect((await cash()).json().cashRegister.expectedCashCents).toBe(before-50);
    await app.close(); app=await buildApp({db,origin,demo:true,logger:false});
    expect((await reverse()).statusCode).toBe(201); expect((await reverse()).json().replayed).toBe(true);
    expect((await cash()).json().cashRegister.expectedCashCents).toBe(before);
  });
  it('estorna pagamento, reabre título e reliquida preservando replay e histórico', async () => {
    const auth = await login();
    const payableId = await createPayable(auth, companyA, 432);
    const paymentKey = randomUUID();
    expect((await pay(auth, companyA, payableId, 'PIX', paymentKey)).statusCode).toBe(201);
    const entryId = (await db.query<{ id: string }>('SELECT id FROM financial_entries WHERE company_id=$1 AND payable_id=$2', [companyA,payableId])).rows[0]!.id;
    const key = randomUUID();
    const reverse = (company = companyA, reason = 'Meio incorreto') => app.inject({ method: 'POST', url: `/api/companies/${company}/finance/settlements/${entryId}/reverse`, headers: headers(auth,key), payload: { reason } });
    expect((await reverse(companyB)).statusCode).toBe(404);
    expect((await reverse()).statusCode).toBe(201);
    expect((await reverse()).json().replayed).toBe(true);
    expect((await reverse(companyA,'Outro motivo')).statusCode).toBe(409);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE id=$1', [payableId])).rows[0]!.status).toBe('OPEN');
    expect((await pay(auth,companyA,payableId,'PIX',paymentKey)).json().replayed).toBe(true);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE id=$1', [payableId])).rows[0]!.status).toBe('OPEN');
    expect((await pay(auth,companyA,payableId,'DEBIT')).statusCode).toBe(201);
    expect((await reverse()).json().replayed).toBe(true);
    expect((await db.query<{ status: string }>('SELECT status FROM accounts_payable WHERE id=$1', [payableId])).rows[0]!.status).toBe('PAID');
    expect((await db.query('SELECT id FROM title_settlements WHERE payable_id=$1', [payableId])).rows).toHaveLength(2);
    expect((await db.query('SELECT id FROM financial_entries WHERE payable_id=$1', [payableId])).rows).toHaveLength(2);
    const overview = (await app.inject({ url: `/api/companies/${companyA}/finance`, headers: headers(auth) })).json();
    expect(overview.entries.filter((entry: { sourceId: string }) => entry.sourceId === payableId)).toHaveLength(2);
  });

  it('estorna recebimento em dinheiro e permite nova liquidação sem duplicar saldo', async () => {
    const auth = await login();
    const current = () => app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) });
    const initial = (await current()).json().cashRegister.expectedCashCents;
    const created = await app.inject({ method:'POST',url:`/api/companies/${companyB}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{description:'Recebimento reversível',category:'Serviços',amountCents:350,dueDate:'2026-11-01'} });
    expect(created.statusCode).toBe(201);
    const titleId = created.json().receivableId;
    const receiptKey = randomUUID();
    const receive = (method: string, key = receiptKey) => app.inject({ method:'POST',url:`/api/companies/${companyB}/finance/receivables/${titleId}/receive`,headers:headers(auth,key),payload:{paymentMethod:method,notes:''} });
    expect((await receive('CASH')).statusCode).toBe(201);
    expect((await current()).json().cashRegister.expectedCashCents).toBe(initial+350);
    const entryId = (await db.query<{id:string}>('SELECT id FROM financial_entries WHERE receivable_id=$1',[titleId])).rows[0]!.id;
    const key = randomUUID();
    const reverse = () => app.inject({method:'POST',url:`/api/companies/${companyB}/finance/settlements/${entryId}/reverse`,headers:headers(auth,key),payload:{reason:'Recebimento corrigido'}});
    expect((await reverse()).statusCode).toBe(201);
    expect((await current()).json().cashRegister.expectedCashCents).toBe(initial);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_receivable WHERE id=$1',[titleId])).rows[0]!.status).toBe('OPEN');
    expect((await receive('CASH')).json().replayed).toBe(true);
    expect((await current()).json().cashRegister.expectedCashCents).toBe(initial);
    expect((await receive('PIX',randomUUID())).statusCode).toBe(201);
    expect((await reverse()).json().replayed).toBe(true);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_receivable WHERE id=$1',[titleId])).rows[0]!.status).toBe('RECEIVED');
    expect((await current()).json().cashRegister.expectedCashCents).toBe(initial);
    expect((await db.query('SELECT id FROM title_settlements WHERE receivable_id=$1',[titleId])).rows).toHaveLength(2);
  });

  it('rollback tardio do estorno conserva título, original e caixa; retry aplica uma vez', async () => {
    const auth = await login();
    const payableId = await createPayable(auth,companyB,120);
    expect((await pay(auth,companyB,payableId,'CASH')).statusCode).toBe(201);
    const receivable = await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables`,headers:headers(auth,randomUUID()),payload:{description:'Recebível rollback estorno',category:'Serviços',amountCents:180,dueDate:'2026-11-01'}});
    expect(receivable.statusCode).toBe(201);
    const receivableId = receivable.json().receivableId;
    expect((await app.inject({method:'POST',url:`/api/companies/${companyB}/finance/receivables/${receivableId}/receive`,headers:headers(auth,randomUUID()),payload:{paymentMethod:'CASH',notes:''}})).statusCode).toBe(201);
    const entries = (await db.query<{id:string;source:string}>('SELECT id,source_type AS source FROM financial_entries WHERE payable_id=$1 OR receivable_id=$2',[payableId,receivableId])).rows;
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      const table = entry.source==='PAYABLE'?'accounts_payable':'accounts_receivable';
      const titleId = entry.source==='PAYABLE'?payableId:receivableId;
      const beforeTitle = (await db.query(`SELECT * FROM ${table} WHERE id=$1`,[titleId])).rows[0];
      const original = (await db.query('SELECT * FROM financial_entries WHERE id=$1',[entry.id])).rows[0];
      const cash = () => app.inject({url:`/api/companies/${companyB}/cash/current`,headers:headers(auth)});
      const beforeCash = (await cash()).json().cashRegister.expectedCashCents;
      const beforeMovements = (await db.query('SELECT id FROM cash_movements WHERE company_id=$1',[companyB])).rows.length;
      const key = randomUUID();
      await app.close();
      const failing:Db={...db,transaction:fn=>db.transaction(tx=>fn({...tx,query:async(sql,params)=>{
        if(sql.includes('INSERT INTO audit_logs')&&params?.[4]==='financial_entry.reversed')throw new Error('Falha após reabertura do título');
        return tx.query(sql,params);
      }}))};
      app=await buildApp({db:failing,origin,demo:true,logger:false});
      const reverse = () => app.inject({method:'POST',url:`/api/companies/${companyB}/finance/settlements/${entry.id}/reverse`,headers:headers(auth,key),payload:{reason:'Corrigir liquidação'}});
      expect((await reverse()).statusCode).toBe(500);
      expect((await db.query(`SELECT * FROM ${table} WHERE id=$1`,[titleId])).rows[0]).toEqual(beforeTitle);
      expect((await db.query('SELECT * FROM financial_entries WHERE id=$1',[entry.id])).rows[0]).toEqual(original);
      expect((await db.query('SELECT id FROM financial_reversals WHERE entry_id=$1',[entry.id])).rows).toHaveLength(0);
      expect((await db.query('SELECT id FROM cash_movements WHERE company_id=$1',[companyB])).rows).toHaveLength(beforeMovements);
      expect((await cash()).json().cashRegister.expectedCashCents).toBe(beforeCash);
      await app.close();app=await buildApp({db,origin,demo:true,logger:false});
      expect((await reverse()).statusCode).toBe(201);
      expect((await reverse()).json().replayed).toBe(true);
      expect((await db.query<{status:string}>(`SELECT status FROM ${table} WHERE id=$1`,[titleId])).rows[0]!.status).toBe('OPEN');
      expect((await cash()).json().cashRegister.expectedCashCents).toBe(beforeCash+(entry.source==='PAYABLE'?120:-180));
      expect((await db.query('SELECT id FROM cash_movements WHERE company_id=$1',[companyB])).rows).toHaveLength(beforeMovements+1);
    }
  });

  it('exige caixa aberto do responsável para estornar dinheiro de turno anterior', async () => {
    const auth = await login();
    const created = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/finance/entries`, headers: headers(auth, randomUUID()), payload: { kind: 'EXPENSE', description: 'Correção após fechamento', category: 'Operação', amountCents: 25, paymentMethod: 'CASH' } });
    expect(created.statusCode).toBe(201);
    const entryId = created.json().entryId;
    const current = (await app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) })).json().cashRegister;
    const closed = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/close`, headers: headers(auth, randomUUID()), payload: { countedCents: current.expectedCashCents, notes: 'Conferido' } });
    expect(closed.statusCode, closed.body).toBe(200);
    const key = randomUUID();
    const reverse = () => app.inject({ method: 'POST', url: `/api/companies/${companyB}/finance/entries/${entryId}/reverse`, headers: headers(auth, key), payload: { reason: 'Despesa indevida' } });
    expect((await reverse()).json().error.code).toBe('CASH_NOT_OPEN');
    const email = `cash-owner-${randomUUID()}@example.test`;
    const user = await app.inject({ method: 'POST', url: `/api/companies/${companyB}/users`, headers: headers(auth), payload: { name: 'Outro responsável', email, password, role: 'ADMIN' } });
    expect(user.statusCode, user.body).toBe(201);
    const other = await login(email);
    expect((await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/open`, headers: headers(other, randomUUID()), payload: { openingCents: 0, notes: 'Novo turno' } })).statusCode).toBe(201);
    expect((await reverse()).json().error.code).toBe('CASH_OTHER_OPERATOR');
    expect((await db.query('SELECT id FROM financial_reversals WHERE entry_id=$1', [entryId])).rows).toHaveLength(0);
    expect((await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/close`, headers: headers(other, randomUUID()), payload: { countedCents: 0, notes: 'Conferido' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/api/companies/${companyB}/cash/open`, headers: headers(auth, randomUUID()), payload: { openingCents: 0, notes: 'Turno da correção' } })).statusCode).toBe(201);
    expect((await reverse()).statusCode).toBe(201);
    expect((await app.inject({ url: `/api/companies/${companyB}/cash/current`, headers: headers(auth) })).json().cashRegister.expectedCashCents).toBe(25);
    expect((await db.query<{ closing: string }>('SELECT closing_cents::text AS closing FROM cash_registers WHERE id=$1', [current.id])).rows[0]!.closing).toBe(String(current.expectedCashCents));
  });
});
