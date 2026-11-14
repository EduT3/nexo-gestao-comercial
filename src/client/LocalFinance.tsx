import {LocalAccountReadError} from './LocalAccountReadError';
import {useLocalAccountPage} from './useLocalAccountPage';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {LocalListPager} from './LocalList';
import {LocalAccountFilters} from './LocalAccountFilters';
import {errorMessage,money,shortDate} from './local-format';
export type {PayableRow} from '../shared/financial-accounts';
import type {PayableRow} from '../shared/financial-accounts';
export type FinanceSummary={receivedCents:bigint;reversedReceiptCents:bigint;netReceivedCents:bigint;totalIncomeCents:bigint;financialBalanceCents:bigint;revenueCents:bigint;reversedCents:bigint;netRevenueCents:bigint;paidExpenseCents:bigint;payables:PayableRow[]};
export function LocalFinance({company,active=true,refreshToken,onSaved}:{company:string;active?:boolean;refreshToken:number;onSaved():void}) {
 const bridge=window.nexoLocal!,[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [operation,setOperation]=useState<{account:PayableRow;kind:'pay'|'reverse';key:string}>();const formRef=useRef<HTMLFormElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null),summaryRef=useRef<HTMLElement>(null);
 useEffect(()=>{if(active&&operation){formRef.current?.querySelector<HTMLElement>('select,input')?.focus();formRef.current?.scrollIntoView({block:'center'});}},[active,operation?.key]);
 const {filter,changeFilter,list,today,loading,queryError,requests}=useLocalAccountPage(company,active,refreshToken,input=>bridge.payablesPage(company,input));
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!operation)return;const form=new FormData(event.currentTarget),task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');
  try{
   if(operation.kind==='pay')await bridge.payPayable(company,operation.account.id,operation.key,{method:form.get('method'),notes:form.get('notes')});
   else{const result=await bridge.reversePayable(company,operation.account.payment_id!,operation.key,{reason:form.get('reason')});if(result.canceled)return;}
   task.finish();if(!task.isCurrent())return;setOperation(undefined);setMessage(operation.kind==='pay'?'Pagamento registrado.':'Pagamento estornado. A conta voltou a ficar em aberto.');onSaved();
  }catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{
   // Replace reads invalidated by success, failure or a canceled confirmation.
   if(task.finish()){await requests.refresh();if(task.isCurrent())setBusy(false);}
  }
 }
 return <details className="panel" open><summary ref={summaryRef}>Contas a pagar</summary><p>Confira o fornecedor, o vencimento e o valor antes de pagar.</p>
  <LocalAccountFilters kind="pagar" value={filter} disabled={busy} onChange={value=>{changeFilter(value);}}/>
  <p>Total da consulta: <strong>{loading?"Consultando…":queryError?"Indisponível":money(list.totalCents)}</strong></p>
  <div className="account-table" tabIndex={0}><table aria-label="Contas a pagar" aria-busy={loading}><thead><tr><th>Fornecedor e referência</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{list.rows.map(row=><tr key={row.id}><td>{row.supplier_name||'Fornecedor'}<small className="account-reference">Compra: {row.purchase_id||row.id}</small></td><td>{shortDate(row.due_date)}{row.status==='OPEN'&&row.due_date<today&&<span className="account-overdue">Vencida</span>}</td><td>{money(row.amount_cents)}</td><td>{row.status==='PAID'?'Paga':'Em aberto'}</td><td><button className="button secondary" disabled={busy} onClick={event=>{triggerRef.current=event.currentTarget;setMessage('');setOperation({account:row,kind:row.status==='PAID'?'reverse':'pay',key:crypto.randomUUID()});}}>{row.status==='PAID'?'Estornar pagamento':'Pagar conta'}</button></td></tr>)}</tbody></table></div>
  {!queryError&&<LocalListPager list={list} disabled={busy||loading} label="Páginas de contas a pagar"/>}{!loading&&!queryError&&!list.total&&<p role="status">{filter.search.trim() || filter.from || filter.until || filter.overdue || filter.status !== 'OPEN' ? 'Nenhuma conta a pagar corresponde aos filtros. Use Limpar filtros para voltar às pendências.' : 'Nenhuma conta a pagar em aberto. Para consultar o histórico, altere a situação no filtro.'}</p>}
  {operation&&<form ref={formRef} key={operation.key} aria-label="Operação financeira" onSubmit={save} className="account-operation"><h2>{operation.kind==='pay'?'Conferir pagamento':'Estornar pagamento'}</h2><p><strong>{operation.account.supplier_name||'Fornecedor'}</strong> · {shortDate(operation.account.due_date)} · {money(operation.account.amount_cents)}</p><p className="account-reference">Conta: {operation.account.id}</p><fieldset disabled={busy} className="form-grid">{operation.kind==='pay'?<><label>Forma de pagamento da conta<select aria-label="Forma de pagamento da conta" name="method"><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label><label>Observações do pagamento<input name="notes" maxLength={1000}/></label></>:<label>Motivo do estorno<input name="reason" required minLength={2} maxLength={1000}/></label>}<button className="button primary">{operation.kind==='pay'?'Confirmar pagamento':'Confirmar estorno'}</button><button type="button" className="button secondary" onClick={()=>{setOperation(undefined);const target=triggerRef.current?.isConnected?triggerRef.current:summaryRef.current;target?.focus();}}>Voltar ao financeiro</button></fieldset></form>}
  {queryError?<LocalAccountReadError message={queryError} disabled={busy||loading} onRetry={()=>void requests.refresh()}/>:<p role="status">{message}</p>}
 </details>;
}
