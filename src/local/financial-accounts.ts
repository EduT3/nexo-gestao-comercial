import {z} from 'zod';
import type {SQLInputValue} from 'node:sqlite';
import type {LocalDatabase} from './sqlite.js';
import {authorizeLocalCatalog} from './catalog.js';
import {FINANCIAL_PAGE_LIMIT,normalizeAccountSearch,type AccountPage,type PayableRow,type ReceivableRow} from '../shared/financial-accounts.js';
const day=z.union([z.literal(''),z.iso.date()]);
const filterSchema=z.object({page:z.number().int().min(0).max(Math.floor(Number.MAX_SAFE_INTEGER/FINANCIAL_PAGE_LIMIT)-1).default(0),pageSize:z.number().int().min(1).max(FINANCIAL_PAGE_LIMIT).default(FINANCIAL_PAGE_LIMIT),status:z.enum(['OPEN','SETTLED','ALL']).default('OPEN'),from:day.default(''),until:day.default(''),search:z.string().trim().max(1024).default(''),overdue:z.boolean().default(false),today:z.iso.date().optional()}).strict();
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
// Materialize active settlements once, avoiding a repeated scan of all payments for each title.
const payableBase=`WITH active AS MATERIALIZED (SELECT p.payable_id,p.company_id,p.id FROM local_payable_payments p WHERE p.company_id=? AND NOT EXISTS(SELECT 1 FROM local_payable_reversals r WHERE r.company_id=p.company_id AND r.payment_id=p.id))
 SELECT t.id,t.purchase_id,COALESCE(s.name,'Sem fornecedor informado') AS supplier_name,t.amount_cents,t.due_date,p.id AS payment_id,CASE WHEN p.id IS NULL THEN 'OPEN' ELSE 'PAID' END AS status FROM local_purchase_payables t JOIN local_purchases purchase ON purchase.company_id=t.company_id AND purchase.id=t.purchase_id LEFT JOIN local_suppliers s ON s.company_id=purchase.company_id AND s.id=purchase.supplier_id LEFT JOIN active p ON p.company_id=t.company_id AND p.payable_id=t.id WHERE t.company_id=?`;
const receivableBase=`WITH active AS MATERIALIZED (SELECT p.receivable_id,p.company_id,p.id FROM local_receivable_receipts p WHERE p.company_id=? AND NOT EXISTS(SELECT 1 FROM local_receivable_reversals r WHERE r.company_id=p.company_id AND r.receipt_id=p.id))
 SELECT t.id,t.description,t.amount_cents,t.due_date,c.name AS customer_name,p.id AS receipt_id,CASE WHEN p.id IS NULL THEN 'OPEN' ELSE 'RECEIVED' END AS status FROM local_receivables t LEFT JOIN local_customers c ON c.company_id=t.company_id AND c.id=t.customer_id LEFT JOIN active p ON p.company_id=t.company_id AND p.receivable_id=t.id WHERE t.company_id=?`;
async function accountPage<T>(db:LocalDatabase,actor:string,company:string,input:unknown,kind:'payables'|'receivables'):Promise<AccountPage<T>>{
 const filter=filterSchema.parse(input);
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,true);
  const conditions:string[]=[],params:SQLInputValue[]=[company,company];
  if(filter.status!=='ALL')conditions.push(filter.status==='OPEN'?"status='OPEN'":"status<>'OPEN'");
  if(filter.from){conditions.push('due_date>=?');params.push(filter.from);}
  if(filter.until){conditions.push('due_date<=?');params.push(filter.until);}
  if(filter.from&&filter.until&&filter.from>filter.until)conditions.push('0');
  if(filter.overdue){conditions.push("status='OPEN' AND due_date<?");params.push(filter.today??localDay());}
  const search=normalizeAccountSearch(filter.search);
  if(search){conditions.push(`instr(nexo_account_text(${kind==='payables'?"supplier_name||' '||purchase_id||' '||id":"description||' '||COALESCE(customer_name,'')||' '||id"}),?)>0`);params.push(search);}
  const query=`FROM (${kind==='payables'?payableBase:receivableBase}) accounts${conditions.length?' WHERE '+conditions.join(' AND '):''}`;
  if(search){
   // Reuse the normalized/filter result for statistics and page, instead of evaluating it twice.
   const records=await tx.query(`WITH matched AS MATERIALIZED (SELECT * ${query}),
    stats AS MATERIALIZED (SELECT count(*) AS total,nexo_sum_cents(amount_cents) AS cents FROM matched),
    bounds AS (SELECT total,cents,MIN(CAST(? AS INTEGER),MAX(0,CAST((total+?-1)/? AS INTEGER)-1)) AS page FROM stats),
    page_rows AS MATERIALIZED (SELECT * FROM matched ORDER BY due_date ASC,id ASC LIMIT ? OFFSET (SELECT page*? FROM bounds))
    SELECT b.total AS _nexo_total,b.cents AS _nexo_cents,b.page AS _nexo_page,p.* FROM bounds b LEFT JOIN page_rows p ON 1 ORDER BY p.due_date ASC,p.id ASC`,[...params,filter.page,filter.pageSize,filter.pageSize,filter.pageSize,filter.pageSize]);
   const stats=records[0]!,total=Number(stats._nexo_total);
   const rows=total?records.map(({_nexo_total,_nexo_cents,_nexo_page,...row})=>row as T):[];
   return {rows,total,totalCents:BigInt(String(stats._nexo_cents)),page:Number(stats._nexo_page),pageSize:filter.pageSize};
  }
  const totals=(await tx.query('SELECT count(*) AS count,nexo_sum_cents(amount_cents) AS amount '+query,params))[0]!;
  const total=Number(totals.count),page=Math.min(filter.page,Math.max(0,Math.ceil(total/filter.pageSize)-1));
  const rows=await tx.query('SELECT * '+query+' ORDER BY due_date ASC,id ASC LIMIT ? OFFSET ?',[...params,filter.pageSize,page*filter.pageSize]);
  return {rows:rows as T[],total,totalCents:BigInt(String(totals.amount)),page,pageSize:filter.pageSize};
 });
}
/** New additive IPC contracts; each count, exact total and bounded page share one transaction. */
export const listLocalPayablesPage=(db:LocalDatabase,actor:string,company:string,input:unknown={})=>accountPage<PayableRow>(db,actor,company,input,'payables');
export const listLocalReceivablesPage=(db:LocalDatabase,actor:string,company:string,input:unknown={})=>accountPage<ReceivableRow>(db,actor,company,input,'receivables');
