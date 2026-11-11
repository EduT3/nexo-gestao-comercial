import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {openLocalDatabase,type LocalDatabase} from '../src/local/sqlite';import {prepareLocalDatabase} from '../src/local/migrations';
import {listLocalPurchaseHistory} from '../src/local/purchase-history';import {listLocalCashHistory,getLocalActiveCash} from '../src/local/cash-history';import {seedHistoryFixture} from './helpers/history-fixture';
async function fixture(test:(db:LocalDatabase,data:Awaited<ReturnType<typeof seedHistoryFixture>>,file:string)=>Promise<void>){const folder=await mkdtemp(path.join(tmpdir(),'nexo-paged-history-')),file=path.join(folder,'synthetic.sqlite'),db=openLocalDatabase(file);try{await prepareLocalDatabase(db,file);await test(db,await seedHistoryFixture(db),file);}finally{await db.close();await rm(folder,{recursive:true,force:true});}}
it('compras: 101 em três páginas completas, empates estáveis e busca/período do registro antigo sem perda',()=>fixture(async(db,f)=>{
 const pages=await Promise.all([0,1,2].map(page=>listLocalPurchaseHistory(db,f.owner.id,f.company,{page})));expect(pages.map(p=>p.rows.length)).toEqual([50,50,1]);expect(pages.every(p=>p.total===101)).toBe(true);
 const ids=pages.flatMap(p=>p.rows.map(row=>row.id));expect(new Set(ids).size).toBe(101);expect(new Set(ids)).toEqual(new Set(f.purchases));expect(ids.at(-1)).toBe(f.purchases[0]);expect(ids.slice(0,2)).toEqual([f.purchases[99],f.purchases[100]]);
 expect(pages.flatMap(p=>p.rows).every(row=>row.total_cents===127n&&row.due_date==='2025-12-31')).toBe(true);
 const old=await listLocalPurchaseHistory(db,f.owner.id,f.company,{search:f.purchases[0],from:'2025-01-01T00:00:00Z',until:'2025-01-02T00:00:00Z'});expect(old.total).toBe(1);expect(old.rows[0]?.id).toBe(f.purchases[0]);
 expect((await listLocalPurchaseHistory(db,f.owner.id,f.company,{search:'SAO FORNECEDOR'})).total).toBe(101);expect((await listLocalPurchaseHistory(db,f.owner.id,f.company,{page:900})).page).toBe(2);
 const empty=await listLocalPurchaseHistory(db,f.owner.id,f.company,{search:'não existe',page:9});expect(empty).toMatchObject({rows:[],total:0,page:0,pageSize:50});
}));
it('caixa: histórico inteiro com empates, fechado antigo recuperável, ativa antiga independente de todas as páginas',()=>fixture(async(db,f)=>{
 const all=[];for(let page=0;page<3;page++){const result=await listLocalCashHistory(db,f.owner.id,f.company,{page});expect(result.total).toBe(101);all.push(...result.rows);const current=await getLocalActiveCash(db,f.owner.id,f.company);expect(current).toMatchObject({id:f.sessions[100],balance_cents:10001n,can_operate:true});expect(current?.movements).toHaveLength(1);}
 expect(new Set(all.map(row=>row.id))).toEqual(new Set(f.sessions));expect(all.slice(0,2).map(row=>row.id)).toEqual([f.sessions[98],f.sessions[99]]);expect(all.at(-1)?.id).toBe(f.sessions[100]);
 const old=await listLocalCashHistory(db,f.owner.id,f.company,{search:f.sessions[0],status:'CLOSED',from:'2025-01-01T00:00:00Z',until:'2025-01-02T00:00:00Z'});expect(old.rows[0]).toMatchObject({id:f.sessions[0],balance_cents:10001n,closure:{expected_cents:10001n,counted_cents:10000n,notes:'Nota preservada 0'}});expect(old.total).toBe(1);
 expect((await listLocalCashHistory(db,f.owner.id,f.company,{status:'OPEN'})).rows[0]?.id).toBe(f.sessions[100]);expect((await listLocalCashHistory(db,f.owner.id,f.company,{search:'ausente'})).total).toBe(0);expect(await getLocalActiveCash(db,f.owner.id,f.other)).toBeNull();
}));
it('consultas de filhos do caixa ficam restritas aos IDs da página/ativa e não executam gravações',()=>fixture(async(db,f)=>{
 const trace:{sql:string;params:unknown[]}[]=[];const wrap=(target:LocalDatabase):LocalDatabase=>({...target,query:async(sql,params=[])=>{trace.push({sql,params});return target.query(sql,params);},transaction:fn=>target.transaction(tx=>fn(wrap(tx)))});
 const audit=await db.query('SELECT * FROM local_audit ORDER BY id'),page=await listLocalCashHistory(wrap(db),f.owner.id,f.company,{page:2});expect(page.rows).toHaveLength(1);
 const child=trace.filter(x=>/FROM local_cash_(movements|closures)/.test(x.sql));expect(child).toHaveLength(2);for(const query of child){expect(query.sql).toContain('session_id IN (?)');expect(query.params).toEqual([f.company,page.rows[0]!.id]);}
 trace.length=0;await getLocalActiveCash(wrap(db),f.owner.id,f.company);for(const query of trace.filter(x=>/FROM local_cash_(movements|closures)/.test(x.sql)))expect(query.params).toEqual([f.company,f.sessions[100]]);
 expect(await db.query('SELECT * FROM local_audit ORDER BY id')).toEqual(audit);
}));
it('empresa e permissão são conferidas em todas as novas consultas, inclusive após revogação',()=>fixture(async(db,f)=>{
 expect((await listLocalPurchaseHistory(db,f.owner.id,f.other)).total).toBe(1);expect((await listLocalCashHistory(db,f.owner.id,f.other)).total).toBe(1);
 expect((await listLocalPurchaseHistory(db,f.owner.id,f.company,{search:'Fornecedor B'})).total).toBe(0);await expect(listLocalPurchaseHistory(db,f.operator,f.company)).rejects.toThrow('perfil');expect((await listLocalCashHistory(db,f.operator,f.company)).total).toBe(101);expect((await getLocalActiveCash(db,f.operator,f.company))?.can_operate).toBe(false);
 for(const fn of [listLocalPurchaseHistory,listLocalCashHistory,getLocalActiveCash]){await expect(fn(db,f.operator,f.other)).rejects.toThrow('acesso ativo');}
 await db.query('UPDATE local_memberships SET active=0 WHERE company_id=? AND user_id=?',[f.company,f.owner.id]);for(const fn of [listLocalPurchaseHistory,listLocalCashHistory,getLocalActiveCash])await expect(fn(db,f.owner.id,f.company)).rejects.toThrow('acesso ativo');
}));
it('contratos recusam período inválido, página negativa/extrema, propriedades extras e busca excessiva',()=>fixture(async(db,f)=>{
 for(const fn of [listLocalPurchaseHistory,listLocalCashHistory])for(const input of [{page:-1},{page:0.5},{page:Number.MAX_SAFE_INTEGER},{search:'x'.repeat(121)},{from:'não é data'},{from:'2025-02-02T00:00:00Z',until:'2025-02-01T00:00:00Z'},{sql:'DROP TABLE local_purchases'}])await expect(fn(db,f.owner.id,f.company,input)).rejects.toThrow();
 await expect(listLocalCashHistory(db,f.owner.id,f.company,{status:'INVALID'})).rejects.toThrow();
 expect((await listLocalPurchaseHistory(db,f.owner.id,f.company,{from:'2025-01-01T00:00:00-03:00',until:'2025-01-02T00:00:00-03:00'})).total).toBe(1);
}));
it('persistência e reabertura preservam registros antigos e consulta ativa, sem migrar esquema',()=>fixture(async(db,f,file)=>{
 const version=await db.query('PRAGMA user_version');await db.backup(file+'.copy');const reopened=openLocalDatabase(file+'.copy');try{await prepareLocalDatabase(reopened,file+'.copy');expect(await reopened.query('PRAGMA user_version')).toEqual(version);expect((await listLocalPurchaseHistory(reopened,f.owner.id,f.company,{page:2})).rows[0]?.id).toBe(f.purchases[0]);expect((await listLocalCashHistory(reopened,f.owner.id,f.company,{search:f.sessions[0]})).total).toBe(1);expect((await getLocalActiveCash(reopened,f.owner.id,f.company))?.balance_cents).toBe(10001n);}finally{await reopened.close();}
}));
