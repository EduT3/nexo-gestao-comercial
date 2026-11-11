import type { LocalDatabase } from '../../src/local/sqlite';
import { prepareLocalDatabase } from '../../src/local/migrations';
import { initializeLocalOwner } from '../../src/local/onboarding';
export const fixtureToday='2026-10-19';
export const fixtureId=(kind:number,company:number,index:number)=>`00000000-0000-4000-8000-${kind}${company}${String(index).padStart(10,'0')}`;
export type OracleAccount={id:string;purchase_id:string;supplier_name:string;description:string;customer_name:string|null;amount_cents:bigint;due_date:string;status:string;payment_id:string|null;receipt_id:string|null};
export async function financialFixture(db:LocalDatabase,file:string,count:number,baseAmount=101n){
 await prepareLocalDatabase(db,file);const owner=await initializeLocalOwner(db,'Responsável sintético');
 const records:Record<string,{payables:OracleAccount[];receivables:OracleAccount[]}>={};
 const names=['São João','AÇÃO Maçã','Literal % e _','İstanbul ÇÃO','Cliente comum'];
 const dates=['2026-09-30','2026-10-18','2026-10-19','2026-10-20','2026-10-31','2026-11-01','2028-02-29'];
 await db.transaction(async tx=>{
 for(const [c,company] of ['adega-jg','deposito-jg'].entries()){
  const state={payables:[] as OracleAccount[],receivables:[] as OracleAccount[]};records[company]=state;
  for(let i=0;i<count;i++){
   const supplier=fixtureId(1,c,i%5),customer=fixtureId(2,c,i%5),name=names[i%5]!+' '+company;
   if(i<5){await tx.query('INSERT INTO local_suppliers VALUES(?,?,?,?,1)',[supplier,company,name,'{}']);await tx.query('INSERT INTO local_customers VALUES(?,?,?,?,1)',[customer,company,name,'{}']);}
   const purchase=fixtureId(3,c,i),payable=fixtureId(4,c,i),receivable=fixtureId(5,c,i),amount=baseAmount+BigInt(i*17),due=dates[i%dates.length]!,pattern=i%5;
   await tx.query('INSERT INTO local_purchases(id,company_id,supplier_id,actor_id,request_key,request_payload,total_cents,notes) VALUES(?,?,?,?,?,?,?,?)',[purchase,company,supplier,owner.id,purchase,'{}',amount,'Fixture sintética']);
   await tx.query('INSERT INTO local_purchase_payables(id,company_id,purchase_id,amount_cents,due_date,notes) VALUES(?,?,?,?,?,?)',[payable,company,purchase,amount,due,'']);
   await tx.query('INSERT INTO local_receivables(id,company_id,customer_id,actor_id,description,category,amount_cents,due_date,notes,request_key,request_payload) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[receivable,company,i%7===0?null:customer,owner.id,'Conta '+i+' '+names[i%5],'Fixture',amount,due,'',receivable,'{}']);
   for(let event=0;event<(pattern===0?0:pattern<3?1:2);event++){
    const payment=fixtureId(6+event,c,i),receipt=fixtureId(8+event,c,i);
    await tx.query('INSERT INTO local_payable_payments(id,company_id,payable_id,actor_id,method,amount_cents,notes,request_key) VALUES(?,?,?,?,?,?,?,?)',[payment,company,payable,owner.id,'PIX',amount,'Fixture',payment]);
    await tx.query('INSERT INTO local_receivable_receipts(id,company_id,receivable_id,actor_id,method,amount_cents,notes,request_key) VALUES(?,?,?,?,?,?,?,?)',[receipt,company,receivable,owner.id,'PIX',amount,'Fixture',receipt]);
    if(pattern===2||pattern===4||(pattern===3&&event===0)){
     await tx.query('INSERT INTO local_payable_reversals(id,company_id,payment_id,actor_id,reason,request_key) VALUES(?,?,?,?,?,?)',[fixtureId(event?0:1,c,i),company,payment,owner.id,'Fixture',fixtureId(event?0:1,c,i)]);
     await tx.query('INSERT INTO local_receivable_reversals(id,company_id,receipt_id,actor_id,reason,request_key) VALUES(?,?,?,?,?,?)',[fixtureId(event?2:3,c,i),company,receipt,owner.id,'Fixture',fixtureId(event?2:3,c,i)]);
    }
   }
   const settled=pattern===1||pattern===3;
   const common={id:payable,purchase_id:purchase,supplier_name:name,description:'Conta '+i+' '+names[i%5],customer_name:i%7===0?null:name,amount_cents:amount,due_date:due,payment_id:settled?fixtureId(pattern===3?7:6,c,i):null,receipt_id:settled?fixtureId(pattern===3?9:8,c,i):null,status:settled?'PAID':'OPEN'};
   state.payables.push(common);state.receivables.push({...common,id:receivable,status:settled?'RECEIVED':'OPEN'});
  }
 }
 });
 return {owner,records};
}
// Independent oracle: no production SQL, filtering or pagination helpers.
export function oracleAccounts(rows:OracleAccount[],filter:Record<string,unknown>,kind:'payables'|'receivables'){
 const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
 const search=fold(String(filter.search??'')),status=filter.status??'OPEN',today=String(filter.today??fixtureToday);
 return rows.filter(r=>((!filter.from||r.due_date>=String(filter.from))&&(!filter.until||r.due_date<=String(filter.until)))&&(status==='ALL'||(status==='OPEN'?r.status==='OPEN':r.status!=='OPEN'))&&(!filter.overdue||(r.status==='OPEN'&&r.due_date<today))&&fold(kind==='payables'?r.supplier_name+' '+r.purchase_id+' '+r.id:r.description+' '+(r.customer_name||'')+' '+r.id).includes(search)).sort((a,b)=>a.due_date<b.due_date?-1:a.due_date>b.due_date?1:a.id<b.id?-1:a.id>b.id?1:0);
}
