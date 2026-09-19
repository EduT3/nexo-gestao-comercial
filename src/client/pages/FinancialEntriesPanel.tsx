import { useRef, useState, type FormEvent } from 'react';
import type { Company, FinancialEntry } from '../../shared/contracts';
import { api, errorMessage } from '../api';
import { Empty, Message, formatDate } from '../components';

const money = (value: number) => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(value / 100);
const methods = {CASH:'Dinheiro',PIX:'Pix',DEBIT:'Débito',CREDIT:'Crédito'};
export function FinancialEntriesPanel({company,entries,onUpdated}:{company:Company;entries:FinancialEntry[];onUpdated:()=>void}) {
  const [selected,setSelected] = useState<FinancialEntry|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const command = useRef<{body:string;key:string}|null>(null);
  async function reverse(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const reason = String(new FormData(event.currentTarget).get('reason')).trim();
    if (!reason) {setError('Informe o motivo do estorno.'); return;}
    if (!window.confirm(`Confirmar o estorno de ${money(selected.amountCents)} para “${selected.description}”? O original será preservado no histórico.`)) return;
    const body = JSON.stringify({companyId:company.id,entryId:selected.id,reason});
    if (command.current?.body !== body) command.current = {body,key:crypto.randomUUID()};
    setBusy(true);setError('');setSuccess('');
    try {
      const flow = selected.sourceType === 'MANUAL' ? 'entries' : 'settlements';
      await api(`/companies/${company.id}/finance/${flow}/${selected.id}/reverse`,{method:'POST',headers:{'Idempotency-Key':command.current.key},body:{reason}});
      command.current=null;setSelected(null);setSuccess('Estorno registrado. O original foi preservado e os totais atualizados.');onUpdated();
    } catch (failure) {setError(errorMessage(failure));} finally {setBusy(false);}
  }
  return <section className="panel table-panel catalog-card">
    <div className="section-heading"><div><p className="eyebrow">MOVIMENTAÇÃO FINANCEIRA</p><h2>Receitas e despesas realizadas</h2><p className="muted">Os totais desconsideram lançamentos estornados. O valor original permanece no histórico.</p></div></div>
    <Message text={error}/><Message text={success} kind="success"/>
    {selected ? <form className="form-panel" onSubmit={reverse}><h3>Estornar: {selected.description}</h3><p>{money(selected.amountCents)} · {selected.paymentMethod ? methods[selected.paymentMethod] : 'Não informado'}. Dinheiro exige caixa aberto; devolução de receita exige saldo.</p>{selected.sourceType !== 'MANUAL' ? <p>O título voltará a ficar em aberto para corrigir o pagamento ou recebimento. A liquidação anterior permanece no histórico.</p> : null}<label>Motivo do estorno<textarea name="reason" required maxLength={500} autoFocus disabled={busy}/></label><div className="form-actions"><button className="button secondary" type="button" disabled={busy} onClick={()=>setSelected(null)}>Cancelar estorno</button><button className="button primary" disabled={busy}>{busy?'Estornando…':'Confirmar estorno'}</button></div></form> : null}
    {entries.length ? <div className="table-scroll"><table className="catalog-table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Meio</th><th>Valor original</th><th>Situação</th></tr></thead><tbody>{entries.map(entry=><tr key={entry.id}>
      <td>{formatDate(entry.realizedAt??entry.createdAt,company.timezone)}</td><td><strong>{entry.description}</strong><small className="cell-detail">{entry.sourceType==='SALE'?'Venda':entry.sourceType==='PAYABLE'?'Conta a pagar':entry.sourceType==='RECEIVABLE'?'Conta a receber':'Lançamento manual'}</small></td><td>{entry.category}</td><td>{entry.paymentMethod?methods[entry.paymentMethod]:'Não informado'}</td><td className="number-cell"><strong>{entry.kind==='EXPENSE'?'−':'+'}{money(entry.amountCents)}</strong></td>
      <td>{entry.reversalId ? <><span className="badge neutral">Estornado</span><small className="cell-detail">{entry.reversalReason}</small></> : ['MANUAL','PAYABLE','RECEIVABLE'].includes(entry.sourceType) && entry.status==='REALIZED' && company.permissions.includes('finance.manage') ? <button className="button secondary small" disabled={busy} onClick={()=>{setSelected(entry);setError('');setSuccess('');}}>{entry.sourceType==='MANUAL'?'Estornar lançamento':'Estornar liquidação'}</button> : <span className="muted">{entry.status==='REALIZED'?'Realizado':entry.status==='OPEN'?'Em aberto':'Cancelado'}</span>}</td>
    </tr>)}</tbody></table></div> : <Empty title="Nenhuma movimentação financeira" text="As vendas e liquidações confirmadas aparecerão aqui."/>}
  </section>;
}
