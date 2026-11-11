import {searchText} from './local-list';
export type {AccountFilter} from '../shared/financial-accounts';
import type {AccountFilter} from '../shared/financial-accounts';
export const defaultAccountFilter=():AccountFilter=>({status:'OPEN',from:'',until:'',overdue:false,search:''});
export function filterAccounts<T extends {status:string;due_date:string;amount_cents:bigint}>(rows:readonly T[],filter:AccountFilter,today:string,text:(row:T)=>string) {
 if(filter.from&&filter.until&&filter.from>filter.until)return [];
 const search=searchText(filter.search);
 return rows.filter(row=>(filter.status==='ALL'||(filter.status==='OPEN'?row.status==='OPEN':row.status!=='OPEN'))
  &&(!filter.from||row.due_date>=filter.from)&&(!filter.until||row.due_date<=filter.until)
  &&(!filter.overdue||(row.status==='OPEN'&&row.due_date<today))&&searchText(text(row)).includes(search));
}
