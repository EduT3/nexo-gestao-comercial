import { useRef, useState, type FormEvent } from 'react';
import type { Company, Sale } from '../../shared/contracts';
import { api, errorMessage } from '../api';
import { Empty, Message, formatDate } from '../components';

const money=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
const methods={CASH:'Dinheiro',PIX:'Pix',DEBIT:'Débito',CREDIT:'Crédito'};
export function SaleHistory({company,sales,onUpdated}:{company:Company;sales:Sale[];onUpdated:()=>void}){
  const [selected,setSelected]=useState<Sale|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const command=useRef<{body:string;key:string}|null>(null);
  async function cancel(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!selected||busy)return;
    const reason=String(new FormData(event.currentTarget).get('reason')).trim();
    if(!reason){setError('Informe o motivo do cancelamento.');return;}
    if(!window.confirm(`Cancelar esta venda de ${money(selected.totalCents)}? O estoque será devolvido e o financeiro revertido.`))return;
    const body=JSON.stringify({company:company.id,sale:selected.id,reason});
    if(command.current?.body!==body)command.current={body,key:crypto.randomUUID()};
    setBusy(true);setError('');
    try{
      await api(`/companies/${company.id}/sales/${selected.id}/cancel`,{method:'POST',headers:{'Idempotency-Key':command.current.key},body:{reason}});
      command.current=null;setSelected(null);onUpdated();
    }catch(failure){setError(errorMessage(failure));}finally{setBusy(false);}
  }
  return <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">VENDAS RECENTES</p><h2>Histórico da empresa</h2><p className="muted">As vendas canceladas permanecem no histórico com seus itens e pagamento originais.</p></div></div>
    <Message text={error}/>
    {selected?<form className="form-panel" onSubmit={cancel}><h3>Cancelar venda</h3><p>{money(selected.totalCents)} · {methods[selected.paymentMethod]} · {formatDate(selected.confirmedAt,company.timezone)}</p><p>Todos os itens voltarão ao estoque. Dinheiro exige caixa aberto do responsável e saldo para devolução.</p><label>Motivo do cancelamento<textarea name="reason" required maxLength={500} autoFocus disabled={busy}/></label><div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={()=>setSelected(null)}>Voltar sem cancelar</button><button className="button primary" disabled={busy}>{busy?'Cancelando…':'Confirmar cancelamento'}</button></div></form>:null}
    {sales.length?<div className="table-scroll"><table className="catalog-table"><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th>Total original</th><th>Operador</th><th>Situação</th></tr></thead><tbody>{sales.map(sale=><tr key={sale.id}><td>{formatDate(sale.confirmedAt,company.timezone)}</td><td>{sale.customerName??'Consumidor'}</td><td>{sale.items.map(item=>`${item.productName} · ${item.quantity}`).join(' | ')}</td><td>{methods[sale.paymentMethod]}</td><td className="number-cell"><strong>{money(sale.totalCents)}</strong></td><td>{sale.operatorName}</td><td>{sale.status==='CANCELLED'?<><span className="badge neutral">Cancelada</span>{sale.cancellation?<><small className="cell-detail">{sale.cancellation.reason}</small><small className="cell-detail">{sale.cancellation.actorName} · {formatDate(sale.cancellation.cancelledAt,company.timezone)}</small></>:null}</>:company.permissions.includes('sales.cancel')?<button className="button secondary small" disabled={busy} onClick={()=>{setSelected(sale);setError('');}}>Cancelar venda</button>:<span className="badge positive">Confirmada</span>}</td></tr>)}</tbody></table></div>:<Empty title="Nenhuma venda registrada" text="Abra o caixa e finalize a primeira venda para iniciar o histórico."/>}
  </section>;
}
