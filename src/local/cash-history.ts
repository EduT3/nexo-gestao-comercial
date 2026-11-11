import {z} from 'zod';
import type {SQLInputValue} from 'node:sqlite';
import type {LocalDatabase} from './sqlite.js';
import {authorizeLocalCatalog} from './catalog.js';
import {HISTORY_PAGE_SIZE,historyFilterFields,validHistoryPeriod} from './history-filter.js';
import {normalizeAccountSearch} from '../shared/financial-accounts.js';
import type {CashHistoryRow,HistoryPage} from '../shared/operation-history.js';
const filterSchema=z.object({...historyFilterFields,status:z.enum(['ALL','OPEN','CLOSED']).default('ALL')}).strict().refine(validHistoryPeriod,'Confira o período informado.');
const fields='s.id,s.actor_id,u.name AS actor_name,s.opening_cents,s.closed,s.created_at';
const base='FROM local_cash_sessions s JOIN local_users u ON u.id=s.actor_id WHERE s.company_id=?';
/** Only children of these authorized session IDs are read, never the whole company. */
async function hydrate(tx:LocalDatabase,company:string,rows:Record<string,unknown>[]):Promise<CashHistoryRow[]> {
 if(!rows.length)return [];
 const ids=rows.map(row=>String(row.id)),slots=ids.map(()=>'?').join(',');
 const sums=await tx.query('SELECT session_id,nexo_sum_cents(amount_cents) AS amount FROM local_cash_movements WHERE company_id=? AND session_id IN ('+slots+') GROUP BY session_id',[company,...ids]);
 const closures=await tx.query('SELECT session_id,expected_cents,counted_cents,notes FROM local_cash_closures WHERE company_id=? AND session_id IN ('+slots+')',[company,...ids]);
 const totals=new Map(sums.map(row=>[String(row.session_id),BigInt(String(row.amount))]));
 const closed=new Map(closures.map(row=>[String(row.session_id),row]));
 return rows.map(row=>({...row,id:String(row.id),closed:BigInt(String(row.closed)),balance_cents:BigInt(String(row.opening_cents))+(totals.get(String(row.id))??0n),closure:closed.get(String(row.id))??null})) as CashHistoryRow[];
}
export async function listLocalCashHistory(db:LocalDatabase,actor:string,company:string,input:unknown={}):Promise<HistoryPage<CashHistoryRow>> {
 const filter=filterSchema.parse(input);
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,false);
  const clauses:string[]=[],params:SQLInputValue[]=[company],search=normalizeAccountSearch(filter.search);
  if(search){clauses.push("instr(nexo_account_text(s.id||' '||u.name),?)>0");params.push(search);}
  if(filter.from){clauses.push('s.created_at>=?');params.push(new Date(filter.from).toISOString());}
  if(filter.until){clauses.push('s.created_at<?');params.push(new Date(filter.until).toISOString());}
  if(filter.status!=='ALL')clauses.push('s.closed='+(filter.status==='CLOSED'?'1':'0'));
  const query=base+(clauses.length?' AND '+clauses.join(' AND '):'');
  const total=Number((await tx.query('SELECT count(*) AS total '+query,params))[0]!.total),page=Math.min(filter.page,Math.max(0,Math.ceil(total/HISTORY_PAGE_SIZE)-1));
  const rows=await tx.query('SELECT '+fields+' '+query+' ORDER BY s.created_at DESC,s.id ASC LIMIT ? OFFSET ?',[...params,HISTORY_PAGE_SIZE,page*HISTORY_PAGE_SIZE]);
  return {rows:await hydrate(tx,company,rows),total,page,pageSize:HISTORY_PAGE_SIZE};
 });
}
/** Active service is independent of all history filters and pages. */
export async function getLocalActiveCash(db:LocalDatabase,actor:string,company:string) {
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,false);
  const rows=await tx.query('SELECT '+fields+' '+base+' AND s.closed=0',[company]);
  const current=(await hydrate(tx,company,rows))[0];if(!current)return null;
  const movements=await tx.query(`SELECT m.id,m.session_id,m.amount_cents,m.created_at,CASE a.action WHEN 'payable.paid' THEN 'PAYMENT' WHEN 'payable.payment_reversed' THEN 'PAYMENT_REVERSAL' WHEN 'receivable.received' THEN 'RECEIPT' WHEN 'receivable.receipt_reversed' THEN 'RECEIPT_REVERSAL' ELSE m.reason END AS reason FROM local_cash_movements m LEFT JOIN local_audit a ON a.company_id=m.company_id AND a.entity_id=m.operation_id AND a.action IN('payable.paid','payable.payment_reversed','receivable.received','receivable.receipt_reversed') WHERE m.company_id=? AND m.session_id=? ORDER BY m.created_at,m.id`,[company,current.id]);
  return {...current,can_operate:rows[0]!.actor_id===actor,movements:movements as {id:string;reason:string;amount_cents:bigint}[]};
 });
}
