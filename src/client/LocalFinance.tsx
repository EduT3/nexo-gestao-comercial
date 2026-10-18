import {useLocalQuery} from './useLocalQuery';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import {LocalListPager,useLocalList} from './LocalList';
import {LocalAccountFilters} from './LocalAccountFilters';
import {defaultAccountFilter,filterAccounts} from './account-filter';
import {errorMessage,money,shortDate,localToday} from './local-format';
export type PayableRow={id:string;purchase_id:string;supplier_name:string;amount_cents:bigint;due_date:string;status:'OPEN'|'PAID';payment_id:string|null};
export type FinanceSummary={receivedCents:bigint;reversedReceiptCents:bigint;netReceivedCents:bigint;totalIncomeCents:bigint;financialBalanceCents:bigint;revenueCents:bigint;reversedCents:bigint;netRevenueCents:bigint;paidExpenseCents:bigint;payables:PayableRow[]};
const accountText=(row:PayableRow)=>(row.supplier_name||'')+' '+(row.purchase_id||'')+' '+row.id;
export function LocalFinance({company,active=true,refreshToken,onSaved}:{company:string;active?:boolean;refreshToken:number;onSaved():void}) {
 const bridge=window.nexoLocal!,[rows,setRows]=useState<PayableRow[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [filter,setFilter]=useState(defaultAccountFilter);
 const [operation,setOperation]=useState<{account:PayableRow;kind:'pay'|'reverse';key:string}>();const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(active&&operation){formRef.current?.querySelector<HTMLElement>('select,input')?.focus();formRef.current?.scrollIntoView({block:'center'});}},[active,operation?.key]);
 const requests=useLocalQuery(company,active,refreshToken,()=>bridge.finance(company),value=>setRows(value.payables),error=>setMessage(errorMessage(error)));
 const today=localToday(),filtered=useMemo(()=>filterAccounts(rows,filter,today,accountText),[rows,filter,today]);
 const list=useLocalList(filtered,accountText,'');
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!operation)return;const form=new FormData(event.currentTarget),task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');
  try{
   if(operation.kind==='pay')await bridge.payPayable(company,operation.account.id,operation.key,{method:form.get('method'),notes:form.get('notes')});
   else{const result=await bridge.reversePayable(company,operation.account.payment_id!,operation.key,{reason:form.get('reason')});if(result.canceled)return;}
   task.finish();if(!task.isCurrent())return;setOperation(undefined);setMessage(operation.kind==='pay'?'Pagamento registrado.':'Pagamento estornado. A conta voltou a ficar em aberto.');onSaved();await requests.refresh();
  }catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{if(task.finish())setBusy(false);}
 }
 return <details className="panel" open><summary>Contas a pagar</summary><p>Confira o fornecedor, o vencimento e o valor antes de pagar.</p>
  <LocalAccountFilters kind="pagar" value={filter} disabled={busy} onChange={value=>{setFilter(value);list.setPage(0);}}/>
  <p>Total da consulta: <strong>{money(filtered.reduce((sum,row)=>sum+row.amount_cents,0n))}</strong></p>
  <div className="account-table" tabIndex={0}><table aria-label="Contas a pagar"><thead><tr><th>Fornecedor e referência</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{list.rows.map(row=><tr key={row.id}><td>{row.supplier_name||'Fornecedor'}<small className="account-reference">Compra: {row.purchase_id||row.id}</small></td><td>{shortDate(row.due_date)}{row.status==='OPEN'&&row.due_date<today&&<span className="account-overdue">Vencida</span>}</td><td>{money(row.amount_cents)}</td><td>{row.status==='PAID'?'Paga':'Em aberto'}</td><td><button className="button secondary" disabled={busy} onClick={()=>{setMessage('');setOperation({account:row,kind:row.status==='PAID'?'reverse':'pay',key:crypto.randomUUID()});}}>{row.status==='PAID'?'Estornar pagamento':'Pagar conta'}</button></td></tr>)}</tbody></table></div>
  <LocalListPager list={list} label="Páginas de contas a pagar"/>{!filtered.length&&<p>Nenhuma conta a pagar nesta consulta.</p>}
  {operation&&<form ref={formRef} key={operation.key} aria-label="Operação financeira" onSubmit={save} className="account-operation"><h2>{operation.kind==='pay'?'Conferir pagamento':'Estornar pagamento'}</h2><p><strong>{operation.account.supplier_name||'Fornecedor'}</strong> · {shortDate(operation.account.due_date)} · {money(operation.account.amount_cents)}</p><p className="account-reference">Conta: {operation.account.id}</p><fieldset disabled={busy} className="form-grid">{operation.kind==='pay'?<><label>Forma de pagamento da conta<select aria-label="Forma de pagamento da conta" name="method"><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label><label>Observações do pagamento<input name="notes" maxLength={1000}/></label></>:<label>Motivo do estorno<input name="reason" required minLength={2} maxLength={1000}/></label>}<button className="button primary">{operation.kind==='pay'?'Confirmar pagamento':'Confirmar estorno'}</button><button type="button" className="button secondary" onClick={()=>setOperation(undefined)}>Voltar ao financeiro</button></fieldset></form>}
  <p role="status">{message}</p>
 </details>;
}
