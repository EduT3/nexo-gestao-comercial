import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import { createDatabase } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';

it('migra liquidações anteriores, conserva originais e permite reversão e replay', async () => {
  const db = await createDatabase({dataDir:'memory://'});
  const password = 'Migration-only-test-password!';
  const origin = 'http://127.0.0.1:5173';
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  try {
    await migrate(db);
    const seeded = await seedDevelopment(db,{password});
    const companyId = seeded.companyIds[0]!;
    app = await buildApp({db,origin,demo:true,logger:false});
    const login = await app.inject({method:'POST',url:'/api/auth/login',headers:{origin},payload:{email:'admin@jg.local',password}});
    expect(login.statusCode).toBe(200);
    const headers = {origin,cookie:String(login.headers['set-cookie']).split(';')[0]!,'x-csrf-token':login.json().csrfToken};
    const created = await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/receivables`,headers:{...headers,'idempotency-key':randomUUID()},payload:{description:'Título anterior à migração',category:'Serviços',amountCents:700,dueDate:'2026-11-01'}});
    expect(created.statusCode).toBe(201);
    const id = created.json().receivableId;
    const key = randomUUID();
    expect((await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/receivables/${id}/receive`,headers:{...headers,'idempotency-key':key},payload:{paymentMethod:'PIX',notes:'Liquidação anterior'}})).statusCode).toBe(201);
    const original = (await db.query<{id:string}>('SELECT * FROM financial_entries WHERE receivable_id=$1',[id])).rows[0]!;
    const title = (await db.query('SELECT * FROM accounts_receivable WHERE id=$1',[id])).rows[0];
    const supplier = (await db.query<{id:string}>('SELECT id FROM suppliers WHERE company_id=$1 LIMIT 1',[companyId])).rows[0]!.id;
    const product = (await db.query<{id:string}>('SELECT id FROM products WHERE company_id=$1 LIMIT 1',[companyId])).rows[0]!.id;
    const purchase = await app.inject({method:'POST',url:`/api/companies/${companyId}/purchases/receive`,headers:{...headers,'idempotency-key':randomUUID()},payload:{supplierId:supplier,items:[{productId:product,quantity:'1.000',unitCostCents:900}],notes:'Compra anterior',payable:{dueDate:'2026-11-01',notes:''}}});
    expect(purchase.statusCode,purchase.body).toBe(201);
    const payableId = purchase.json().purchase.payable.id;
    const paymentKey = randomUUID();
    expect((await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/payables/${payableId}/pay`,headers:{...headers,'idempotency-key':paymentKey},payload:{paymentMethod:'PIX',notes:'Pagamento anterior'}})).statusCode).toBe(201);
    const expense = (await db.query<{id:string}>('SELECT * FROM financial_entries WHERE payable_id=$1',[payableId])).rows[0]!;
    const payable = (await db.query('SELECT * FROM accounts_payable WHERE id=$1',[payableId])).rows[0];
    // Restore the exact pre-014 structures while keeping the settled business rows.
    await db.transaction(async tx => {
      await tx.exec('DROP TABLE title_settlements; DROP FUNCTION validate_title_settlement_origin(); DROP INDEX financial_entries_single_origin_uq; ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_company_id_source_type_source_id_key UNIQUE(company_id,source_type,source_id)');
      await tx.query("DELETE FROM schema_migrations WHERE name IN ('014_title_settlements.sql','015_title_realization_history.sql')");
    });
    await migrate(db);
    await migrate(db);
    expect((await db.query('SELECT * FROM financial_entries WHERE id=$1',[original.id])).rows[0]).toEqual(original);
    expect((await db.query('SELECT * FROM accounts_receivable WHERE id=$1',[id])).rows[0]).toEqual(title);
    expect((await db.query('SELECT * FROM financial_entries WHERE id=$1',[expense.id])).rows[0]).toEqual(expense);
    expect((await db.query('SELECT * FROM accounts_payable WHERE id=$1',[payableId])).rows[0]).toEqual(payable);
    expect((await db.query('SELECT financial_entry_id,payable_id,idempotency_key FROM title_settlements WHERE payable_id=$1',[payableId])).rows).toEqual([{financial_entry_id:expense.id,payable_id:payableId,idempotency_key:paymentKey}]);
    expect((await db.query('SELECT financial_entry_id,receivable_id,idempotency_key FROM title_settlements WHERE receivable_id=$1',[id])).rows).toEqual([{financial_entry_id:original.id,receivable_id:id,idempotency_key:key}]);
    expect((await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/receivables/${id}/receive`,headers:{...headers,'idempotency-key':key},payload:{paymentMethod:'PIX',notes:'Liquidação anterior'}})).json().replayed).toBe(true);
    const reversed = await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/settlements/${original.id}/reverse`,headers:{...headers,'idempotency-key':randomUUID()},payload:{reason:'Correção após upgrade'}});
    expect(reversed.statusCode,reversed.body).toBe(201);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_receivable WHERE id=$1',[id])).rows[0]!.status).toBe('OPEN');
    const expenseReversal = await app.inject({method:'POST',url:`/api/companies/${companyId}/finance/settlements/${expense.id}/reverse`,headers:{...headers,'idempotency-key':randomUUID()},payload:{reason:'Correção de pagamento após upgrade'}});
    expect(expenseReversal.statusCode,expenseReversal.body).toBe(201);
    expect((await db.query<{status:string}>('SELECT status FROM accounts_payable WHERE id=$1',[payableId])).rows[0]!.status).toBe('OPEN');
  } finally {
    await app?.close();
    await db.close();
  }
});
