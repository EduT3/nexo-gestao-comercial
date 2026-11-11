import {z} from 'zod';
import type {SQLInputValue} from 'node:sqlite';
import type {LocalDatabase} from './sqlite.js';
import {authorizeLocalCatalog} from './catalog.js';
import {HISTORY_PAGE_SIZE,historyFilterSchema} from './history-filter.js';
import {normalizeAccountSearch} from '../shared/financial-accounts.js';
import type {HistoryPage,PurchaseHistoryRow,PurchaseDetails} from '../shared/operation-history.js';
/** Read-only, bounded history; count and page share the authorized transaction. */
export async function listLocalPurchaseHistory(db:LocalDatabase,actor:string,company:string,input:unknown={}):Promise<HistoryPage<PurchaseHistoryRow>> {
 const filter=historyFilterSchema.parse(input);
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,true);
  const clauses=['p.company_id=?'],params:SQLInputValue[]=[company];
  const search=normalizeAccountSearch(filter.search);
  if(search){clauses.push("instr(nexo_account_text(p.id||' '||COALESCE(s.name,\'Sem fornecedor informado\')),?)>0");params.push(search);}
  if(filter.from){clauses.push('p.created_at>=?');params.push(new Date(filter.from).toISOString());}
  if(filter.until){clauses.push('p.created_at<?');params.push(new Date(filter.until).toISOString());}
  const query='FROM local_purchases p LEFT JOIN local_suppliers s ON s.company_id=p.company_id AND s.id=p.supplier_id LEFT JOIN local_purchase_payables t ON t.company_id=p.company_id AND t.purchase_id=p.id WHERE '+clauses.join(' AND ');
  const total=Number((await tx.query('SELECT count(*) AS total '+query,params))[0]!.total);
  const page=Math.min(filter.page,Math.max(0,Math.ceil(total/HISTORY_PAGE_SIZE)-1));
  const rows=await tx.query('SELECT p.id,p.created_at,COALESCE(s.name,\'Sem fornecedor informado\') AS supplier_name,p.total_cents,t.due_date '+query+' ORDER BY p.created_at DESC,p.id ASC LIMIT ? OFFSET ?',[...params,HISTORY_PAGE_SIZE,page*HISTORY_PAGE_SIZE]);
  return {rows:rows as PurchaseHistoryRow[],total,page,pageSize:HISTORY_PAGE_SIZE};
 });
}

/** Historical item snapshots and optional payable; never changes a purchase or its stock. */
export async function getLocalPurchaseDetails(db:LocalDatabase,actor:string,company:string,id:string):Promise<PurchaseDetails> {
 z.uuid().parse(id);
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,true);
  const row=(await tx.query('SELECT p.id,p.company_id,p.supplier_id,p.created_at,p.total_cents,p.notes,COALESCE(s.name,\'Sem fornecedor informado\') AS supplier_name FROM local_purchases p LEFT JOIN local_suppliers s ON s.company_id=p.company_id AND s.id=p.supplier_id WHERE p.company_id=? AND p.id=?',[company,id]))[0];
  if(!row)throw new Error('Compra não encontrada nesta empresa.');
  const items=await tx.query('SELECT product_id,product_name,quantity_milli,unit_cost_cents,total_cents FROM local_purchase_items WHERE company_id=? AND purchase_id=? ORDER BY product_name,product_id',[company,id]);
  const payable=(await tx.query('SELECT id,amount_cents,due_date,notes FROM local_purchase_payables WHERE company_id=? AND purchase_id=?',[company,id]))[0]??null;
  return {...row,items,payable} as PurchaseDetails;
 });
}
