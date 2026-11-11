import {initializeLocalOwner} from '../../src/local/onboarding';
import {createLocalPerson} from '../../src/local/people';
import {createLocalProduct} from '../../src/local/catalog';
import type {LocalDatabase} from '../../src/local/sqlite';
export const historyId=(group:number,index:number)=>String(group).padStart(8,'0')+'-0000-4000-8000-'+String(index).padStart(12,'0');
export async function seedHistoryFixture(db:LocalDatabase){
 const owner=await initializeLocalOwner(db,'Responsável QA');const company='adega-jg',other='deposito-jg';
 const operator=historyId(90,1);await db.query('INSERT INTO local_users VALUES(?,?,1)',[operator,'Operador QA']);await db.query('INSERT INTO local_memberships VALUES(?,?,?,1)',[company,operator,'OPERADOR']);
 const purchases:string[]=[],sessions:string[]=[];
 for(const [c,count,pg,cg] of [[company,101,11,21],[other,1,12,22]] as const){
  const supplier=await createLocalPerson(db,owner.id,c,'supplier',{name:c===company?'São Fornecedor A':'Fornecedor B'}),product=await createLocalProduct(db,owner.id,c,{name:'Mercadoria QA',internalCode:'HIST-101',unit:'KG',costCents:101,priceCents:201});
  await db.transaction(async tx=>{for(let i=0;i<count;i++){
   const purchase=historyId(pg,i),date=new Date(Date.UTC(2025,0,1+(i===100?99:i),12)).toISOString();
   await tx.query('INSERT INTO local_purchases(id,company_id,supplier_id,actor_id,request_key,request_payload,total_cents,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?)',[purchase,c,supplier.id,owner.id,historyId(pg+30,i),'{}',127,'Fixture',date]);
   await tx.query('INSERT INTO local_purchase_items VALUES(?,?,?,?,?,?,?)',[c,purchase,product.id,'Mercadoria QA',1255,101,127]);
   await tx.query('INSERT INTO local_purchase_payables VALUES(?,?,?,?,?,?)',[historyId(pg+60,i),c,purchase,127,'2025-12-31','Fixture']);
   const session=historyId(cg,i),open=c===company&&i===100,time=open?'2020-01-01T12:00:00.000Z':new Date(Date.UTC(2025,0,1+(i===99?98:i),12)).toISOString();
   await tx.query('INSERT INTO local_cash_sessions(id,company_id,actor_id,opening_cents,request_key,created_at,closed) VALUES(?,?,?,?,?,?,?)',[session,c,owner.id,10000,historyId(cg+30,i),time,open?0:1]);
   await tx.query('INSERT INTO local_cash_movements(id,company_id,session_id,actor_id,amount_cents,reason,operation_id,created_at) VALUES(?,?,?,?,?,?,?,?)',[historyId(cg+60,i),c,session,owner.id,1,'SUPPLY',historyId(cg+90,i),time]);
   if(!open)await tx.query('INSERT INTO local_cash_closures(company_id,session_id,actor_id,expected_cents,counted_cents,notes,created_at) VALUES(?,?,?,?,?,?,?)',[c,session,owner.id,10001,10000,'Nota preservada '+i,time]);
   if(c===company){purchases.push(purchase);sessions.push(session);}
  }});
 }
 return {owner,operator,company,other,purchases,sessions};
}
