import {LocalAccountReadError} from './LocalAccountReadError';
import {useLocalQuery} from './useLocalQuery';
import {useLocalAccountPage} from './useLocalAccountPage';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {LocalAccountFilters} from './LocalAccountFilters';
import {LocalListPager} from './LocalList';
import {defaultAccountFilter} from './account-filter';
import {cents,errorMessage,money,shortDate} from './local-format';
export type {ReceivableRow} from '../shared/financial-accounts';
import type {ReceivableRow} from '../shared/financial-accounts';
export function LocalReceivables({company,active=true,onSaved,refreshToken=0}:{company:string;active?:boolean;onSaved():void;refreshToken?:number}) {
 const bridge=window.nexoLocal!,[customers,setCustomers]=useState<{id:string;name:string}[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[createKey,setCreateKey]=useState(()=>crypto.randomUUID()),[creating,setCreating]=useState(false);
 const [operation,setOperation]=useState<{account:ReceivableRow;kind:'receive'|'reverse';key:string}>();const formRef=useRef<HTMLFormElement>(null),createRef=useRef<HTMLFormElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null),summaryRef=useRef<HTMLElement>(null);
 useEffect(()=>{if(active&&operation){formRef.current?.querySelector<HTMLElement>('select,input')?.focus();formRef.current?.scrollIntoView({block:'center'});}},[active,operation?.key]);
 useEffect(()=>{if(active&&creating)createRef.current?.querySelector<HTMLElement>('input[name="description"]')?.focus();},[active,creating]);
 const {filter,changeFilter,list,today,loading,queryError,requests}=useLocalAccountPage(company,active,refreshToken,input=>bridge.receivablesPage(company,input));
 useLocalQuery(company,active&&creating,refreshToken,()=>bridge.people(company,'customer'),people=>setCustomers(people.filter(row=>row.active)),error=>setMessage(errorMessage(error)));
 async function save(event:FormEvent<HTMLFormElement>,create:boolean){
  event.preventDefault();const element=event.currentTarget,form=new FormData(element),task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');
  try{
   if(create){await bridge.createReceivable(company,createKey,{customerId:form.get('customer')||null,description:form.get('description'),category:'Recebimentos',amountCents:Number(cents(String(form.get('amount')))),dueDate:form.get('dueDate'),notes:''});task.finish();if(!task.isCurrent())return;setCreateKey(crypto.randomUUID());element.reset();setCreating(false);changeFilter(defaultAccountFilter());}
   else if(operation){if(operation.kind==='receive')await bridge.receiveReceivable(company,operation.account.id,operation.key,{method:form.get('method'),notes:''});else{const result=await bridge.reverseReceivable(company,operation.account.receipt_id!,operation.key,{reason:form.get('reason')});if(result.canceled)return;}task.finish();if(!task.isCurrent())return;setOperation(undefined);}
   setMessage(create?'Conta cadastrada.':operation?.kind==='receive'?'Recebimento registrado.':'Recebimento estornado. A conta voltou a ficar em aberto.');onSaved();
  }catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{
   // Replace reads invalidated by success, failure or a canceled confirmation.
   if(task.finish()){await requests.refresh();if(task.isCurrent())setBusy(false);}
  }
 }
 return <details className="panel" open><summary ref={summaryRef}>Contas a receber</summary><button type="button" className="button primary" disabled={busy} onClick={()=>{setMessage('');setCreating(value=>!value);}}>{creating?'Cancelar cadastro de conta':'Nova conta a receber'}</button>
  {creating&&<form ref={createRef} aria-label="Nova conta a receber" onSubmit={event=>void save(event,true)}><fieldset className="form-grid" disabled={busy}><label>Cliente da conta<select aria-label="Cliente da conta" name="customer"><option value="">Sem cliente vinculado</option>{customers.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Descrição da conta<input name="description" required maxLength={300}/></label><label>Valor a receber (R$)<input name="amount" required inputMode="decimal"/></label><label>Vencimento a receber<input name="dueDate" type="date" required/></label><button className="button primary">Salvar conta a receber</button></fieldset></form>}
  <LocalAccountFilters kind="receber" value={filter} disabled={busy} onChange={value=>{changeFilter(value);}}/>
  <p>Total da consulta: <strong>{loading?"Consultando…":queryError?"Indisponível":money(list.totalCents)}</strong></p><div className="account-table" tabIndex={0}><table aria-label="Contas a receber" aria-busy={loading}><thead><tr><th>Descrição e cliente</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{list.rows.map(row=><tr key={row.id}><td>{row.description}<small className="account-reference">{row.customer_name||'Sem cliente vinculado'}</small></td><td>{shortDate(row.due_date)}{row.status==='OPEN'&&row.due_date<today&&<span className="account-overdue">Vencida</span>}</td><td>{money(row.amount_cents)}</td><td>{row.status==='RECEIVED'?'Recebida':'Em aberto'}</td><td><button className="button secondary" disabled={busy} onClick={event=>{triggerRef.current=event.currentTarget;setMessage('');setOperation({account:row,kind:row.status==='RECEIVED'?'reverse':'receive',key:crypto.randomUUID()});}}>{row.status==='RECEIVED'?'Estornar recebimento':'Receber conta'}</button></td></tr>)}</tbody></table></div>
  {!queryError&&<LocalListPager list={list} disabled={busy||loading} label="Páginas de contas a receber"/>}{!loading&&!queryError&&!list.total&&<p>Nenhuma conta a receber nesta consulta.</p>}
  {operation&&<form ref={formRef} key={operation.key} aria-label="Baixa de recebível" onSubmit={event=>void save(event,false)} className="account-operation"><h2>{operation.kind==='receive'?'Conferir recebimento':'Estornar recebimento'}</h2><p><strong>{operation.account.description}</strong> · {operation.account.customer_name||'Sem cliente vinculado'}</p><p>{shortDate(operation.account.due_date)} · {money(operation.account.amount_cents)}</p><p className="account-reference">Conta: {operation.account.id}</p><fieldset className="form-grid" disabled={busy}>{operation.kind==='receive'?<label>Forma de recebimento<select aria-label="Forma de recebimento" name="method"><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label>:<label>Motivo do estorno do recebimento<input name="reason" required minLength={2} maxLength={1000}/></label>}<button className="button primary">{operation.kind==='receive'?'Confirmar recebimento':'Confirmar estorno do recebimento'}</button><button type="button" className="button secondary" onClick={()=>{setOperation(undefined);const target=triggerRef.current?.isConnected?triggerRef.current:summaryRef.current;target?.focus();}}>Voltar às contas</button></fieldset></form>}
  {queryError?<LocalAccountReadError message={queryError} disabled={busy||loading} onRetry={()=>void requests.refresh()}/>:<p role="status">{message}</p>}
 </details>;
}
