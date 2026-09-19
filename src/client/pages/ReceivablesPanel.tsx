import { useState, type FormEvent } from 'react';
import type { AccountReceivable, Company, Customer, PaymentMethod } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Message } from '../components';

const money=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
export function ReceivablesPanel({company,items,onUpdated}:{company:Company;items:AccountReceivable[];onUpdated:()=>void}) {
  const [show,setShow]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [success,setSuccess]=useState('');
  const [methods,setMethods]=useState<Record<string,PaymentMethod>>({});
  const customers=useResource<{customers:Customer[]}>(`/companies/${company.id}/customers?active=true&limit=100&offset=0`);
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget); const amount=String(form.get('amount')).trim();
    if(!/^\d+(?:[,.]\d{1,2})?$/.test(amount)){setError('Informe um valor como 12,50.');return;}
    const [whole,fraction='']=amount.replace(',','.').split('.'); const amountCents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    setBusy(true);setError('');setSuccess('');
    try{await api(`/companies/${company.id}/finance/receivables`,{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:{customerId:form.get('customerId')||null,description:form.get('description'),category:form.get('category'),amountCents,dueDate:form.get('dueDate'),notes:form.get('notes')}});setShow(false);setSuccess('Conta a receber cadastrada.');onUpdated();}catch(reason){setError(errorMessage(reason));}finally{setBusy(false);}
  }
  async function receive(item:AccountReceivable){
    const paymentMethod=methods[item.id]??'PIX';
    if(!window.confirm(`Confirmar o recebimento de ${money(item.amountCents)} para “${item.description}”?`))return;
    setBusy(true);setError('');setSuccess('');
    try{await api(`/companies/${company.id}/finance/receivables/${item.id}/receive`,{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:{paymentMethod,notes:''}});setSuccess('Recebimento registrado. Receita e histórico atualizados.');onUpdated();}catch(reason){setError(errorMessage(reason));}finally{setBusy(false);}
  }
  return <section className="panel form-panel"><div className="section-heading"><div><p className="eyebrow">CONTAS A RECEBER</p><h2>Recebimentos previstos</h2><p className="muted">Cadastre valores pendentes e registre o recebimento quando ele ocorrer.</p></div><button className="button primary" onClick={()=>setShow(value=>!value)}>{show?'Fechar cadastro':'Nova conta a receber'}</button></div><Message text={error}/><Message text={success} kind="success"/>
    {show?<form onSubmit={create}><fieldset className="form-grid" disabled={busy}><label>Descrição da conta<input name="description" maxLength={300} required autoFocus/></label><label>Categoria financeira<input name="category" maxLength={100} required/></label><label>Valor a receber<input name="amount" inputMode="decimal" required/></label><label>Vencimento da conta<input name="dueDate" type="date" required/></label><label>Cliente da conta<select name="customerId"><option value="">Sem cliente vinculado</option>{customers.data?.customers.map(customer=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Observação da conta<input name="notes" maxLength={500}/></label></fieldset><div className="form-actions"><button className="button primary" disabled={busy}>Cadastrar conta a receber</button></div></form>:null}
    {items.length?<div className="table-scroll"><table className="catalog-table"><thead><tr><th>Conta</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Recebimento</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.description}</strong><small className="cell-detail">{item.customerName??'Sem cliente'} · {item.category}</small></td><td>{new Intl.DateTimeFormat('pt-BR').format(new Date(`${item.dueDate}T12:00:00`))}</td><td>{money(item.amountCents)}</td><td>{item.status==='OPEN'?'Em aberto':item.status==='RECEIVED'?'Recebido':'Cancelado'}</td><td>{item.status==='OPEN'?<div className="inline-payment"><select aria-label={`Meio de recebimento de ${item.description}`} value={methods[item.id]??'PIX'} onChange={event=>setMethods(current=>({...current,[item.id]:event.target.value as PaymentMethod}))}><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select><button className="button primary small" disabled={busy} onClick={()=>void receive(item)}>Registrar recebimento</button></div>:item.paymentMethod??'—'}</td></tr>)}</tbody></table></div>:<Empty title="Nenhuma conta a receber" text="Cadastre um recebimento previsto para acompanhar seu vencimento e a liquidação."/>}
  </section>;
}
