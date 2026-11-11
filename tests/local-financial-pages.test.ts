import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {openLocalDatabase,type LocalDatabase} from '../src/local/sqlite';
import {listLocalPayablesPage,listLocalReceivablesPage} from '../src/local/financial-accounts';
import {getLocalFinanceTotals,getLocalFinanceSummary} from '../src/local/finance';
import {financialFixture,oracleAccounts,fixtureToday,type OracleAccount} from './support/financial-fixture';
import {receiveLocalReceivable,reverseLocalReceivableReceipt} from '../src/local/receivables';
import {payLocalPayable,reverseLocalPayablePayment} from '../src/local/settlements';
let db:LocalDatabase,folder:string,owner:string,records:Record<string,{payables:OracleAccount[];receivables:OracleAccount[]}>;
beforeAll(async()=>{folder=await mkdtemp(path.join(tmpdir(),'nexo-financial-pages-'));db=openLocalDatabase(path.join(folder,'base.sqlite'));const fixture=await financialFixture(db,path.join(folder,'base.sqlite'),10000);owner=fixture.owner.id;records=fixture.records;},120000);
afterAll(async()=>{await db?.close();if(folder)await rm(folder,{recursive:true,force:true});});
const kinds=[{name:'payables' as const,query:listLocalPayablesPage},{name:'receivables' as const,query:listLocalReceivablesPage}];
describe('páginas financeiras reais em SQLite',()=>{
 it('alcança 10.000 títulos de cada tipo/empresa sem perda ou repetição em conjunto imóvel',async()=>{
  for(const company of ['adega-jg','deposito-jg'])for(const kind of kinds){const ids:string[]=[];const expected=oracleAccounts(records[company]![kind.name],{status:'ALL'},kind.name);for(let page=0;page<200;page++){
   const value=await kind.query(db,owner,company,{status:'ALL',page});expect(value.total).toBe(10000);expect(value.rows.length).toBe(50);expect(value.totalCents).toBe(expected.reduce((s,r)=>s+r.amount_cents,0n));ids.push(...value.rows.map(r=>r.id));
  }expect(ids).toEqual(expected.map(r=>r.id));expect(new Set(ids).size).toBe(10000);}
 },180000);
 it('filtros, totais completos, fronteiras de data, acentos e curingas literais correspondem ao oráculo',async()=>{
  const filters=[{}, {status:'ALL'}, {status:'SETTLED'}, {status:'ALL',overdue:true}, {status:'SETTLED',overdue:true}, {status:'ALL',search:'sao joao'}, {status:'ALL',search:'AÇÃO'}, {status:'ALL',search:'%'}, {status:'ALL',search:'_'}, {status:'ALL',search:"' OR 1=1 --"}, {status:'ALL',search:'İSTANBUL'}, {status:'ALL',from:'2026-10-19',until:'2026-10-19'}, {status:'ALL',from:'2026-10-20',until:'2026-10-18'}, {status:'ALL',from:'2028-02-29',until:'2028-02-29'}];
  for(const company of ['adega-jg','deposito-jg'])for(const kind of kinds)for(const filter of filters){
   const input={...filter,today:fixtureToday,page:999999,pageSize:17};const expected=oracleAccounts(records[company]![kind.name],input,kind.name),page=Math.max(0,Math.ceil(expected.length/17)-1),actual=await kind.query(db,owner,company,input);
   expect(actual).toMatchObject({total:expected.length,totalCents:expected.reduce((s,r)=>s+r.amount_cents,0n),page,pageSize:17});expect(actual.rows.map(r=>r.id)).toEqual(expected.slice(page*17,(page+1)*17).map(r=>r.id));
  }
 },120000);
 it('valida limite, tamanho, tipo e calendário no serviço, sem SQL ou filtros livres',async()=>{
  for(const kind of kinds)for(const filter of [{page:-1},{page:1.5},{page:Number.MAX_SAFE_INTEGER},{pageSize:0},{pageSize:51},{pageSize:Infinity},{today:'2026-02-30'},{from:'2026-13-01'},{until:'2026-02-29'},{search:'x'.repeat(1025)},{overdue:'true'},{status:'PAID'},{sql:'DROP TABLE local_users'}])await expect(kind.query(db,owner,'adega-jg',filter)).rejects.toThrow();
 });
 it('revalida empresa, vínculo, usuário e perfil em cada chamada e não escreve auditoria',async()=>{
  const id=randomUUID();await db.query('INSERT INTO local_users VALUES(?,?,1)',[id,'Operador']);await db.query("INSERT INTO local_memberships VALUES(?,?,?,1)",['adega-jg',id,'OPERADOR']);
  const before=await db.query('SELECT count(*) AS count FROM local_audit');
  for(const query of [listLocalPayablesPage,listLocalReceivablesPage]){await expect(query(db,id,'adega-jg',{})).rejects.toThrow('administrador');await expect(query(db,id,'deposito-jg',{})).rejects.toThrow('acesso ativo');await expect(query(db,owner,'outra',{})).rejects.toThrow('acesso ativo');}
  await db.query('UPDATE local_memberships SET active=0 WHERE company_id=? AND user_id=?',['deposito-jg',owner]);await expect(listLocalPayablesPage(db,owner,'deposito-jg')).rejects.toThrow('acesso ativo');await db.query('UPDATE local_memberships SET active=1 WHERE company_id=? AND user_id=?',['deposito-jg',owner]);
  expect(await db.query('SELECT count(*) AS count FROM local_audit')).toEqual(before);
 });
 it('totais acumulados são escalares e independentes da página/filtro',async()=>{
  for(const company of ['adega-jg','deposito-jg']){const amounts=records[company]!.receivables.filter(r=>r.status==='RECEIVED').reduce((s,r)=>s+r.amount_cents,0n),totals=await getLocalFinanceTotals(db,owner,company);expect(totals).not.toHaveProperty('payables');expect(totals).toMatchObject({netReceivedCents:amounts,paidExpenseCents:amounts,financialBalanceCents:0n});
   const gross=records[company]!.receivables.reduce((sum,row,index)=>sum+row.amount_cents*(index%5===0?0n:index%5<3?1n:2n),0n);expect(totals).toMatchObject({receivedCents:gross,reversedReceiptCents:gross-amounts});
  }
 },120000);
 it('count, total e página não intercalam baixa concorrente; idempotência e estorno ficam exatos',async()=>{
  const company='adega-jg',item=records[company]!.receivables[0]!,key=randomUUID();let queued:Promise<unknown>|undefined;
  const wrapped:LocalDatabase={...db,transaction:operation=>db.transaction(tx=>operation({...tx,query:async(sql,params)=>{const rows=await tx.query(sql,params);if(sql.startsWith('SELECT count(*)'))queued=receiveLocalReceivable(db,owner,company,item.id,key,{method:'PIX'});return rows;}}))};
  const before=await listLocalReceivablesPage(wrapped,owner,company,{});expect(before.total).toBe(6000);expect(before.totalCents).toBe(records[company]!.receivables.filter(r=>r.status==='OPEN').reduce((s,r)=>s+r.amount_cents,0n));await queued;
  const receipt=await receiveLocalReceivable(db,owner,company,item.id,key,{method:'PIX'});expect(receipt.replayed).toBe(true);expect((await listLocalReceivablesPage(db,owner,company,{})).total).toBe(5999);
  await reverseLocalReceivableReceipt(db,owner,company,receipt.id,randomUUID(),{reason:'Teste de compensação'});expect((await listLocalReceivablesPage(db,owner,company,{})).total).toBe(6000);
  const payable=records[company]!.payables[0]!,payKey=randomUUID(),payments=await Promise.all([payLocalPayable(db,owner,company,payable.id,payKey,{method:'PIX'}),payLocalPayable(db,owner,company,payable.id,payKey,{method:'PIX'})]);expect(payments.map(r=>r.replayed)).toEqual([false,true]);
  expect((await listLocalPayablesPage(db,owner,company,{})).total).toBe(5999);await reverseLocalPayablePayment(db,owner,company,payments[0]!.id,randomUUID(),{reason:'Teste de compensação'});expect((await listLocalPayablesPage(db,owner,company,{})).total).toBe(6000);
 });
});
it('soma exata não usa float nem transborda quando a soma de centavos ultrapassa int64',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nexo-account-large-total-')),file=path.join(root,'base.sqlite'),database=openLocalDatabase(file);try{const fixture=await financialFixture(database,file,2000,9007199254740000n);const expected=fixture.records['adega-jg']!.receivables.reduce((s,r)=>s+r.amount_cents,0n);expect(expected).toBeGreaterThan(9223372036854775807n);expect((await listLocalReceivablesPage(database,fixture.owner.id,'adega-jg',{status:'ALL'})).totalCents).toBe(expected);expect((await listLocalReceivablesPage(database,fixture.owner.id,'adega-jg',{status:'ALL',search:'Conta'})).totalCents).toBe(expected);const totals=await getLocalFinanceTotals(database,fixture.owner.id,'adega-jg');expect(totals.financialBalanceCents).toBe(0n);const {payables,...legacy}=await getLocalFinanceSummary(database,fixture.owner.id,'adega-jg');expect(totals).toEqual(legacy);expect(payables).toHaveLength(2000);}finally{await database.close();await rm(root,{recursive:true,force:true});}
},120000);
