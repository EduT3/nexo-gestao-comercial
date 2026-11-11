import {LocalPurchaseDetails} from './LocalPurchaseDetails';
import {useRef,useState,type FormEvent} from 'react';
import {useLocalQuery} from './useLocalQuery';
import {errorMessage,money,shortDate} from './local-format';
import type {CashHistoryFilter,CashHistoryRow,HistoryPage,PurchaseHistoryRow} from '../shared/operation-history';
type Row=PurchaseHistoryRow|CashHistoryRow;
/** History filters never change the operational cash session. */
export function LocalOperationHistory({kind,company,active,refreshToken}:{kind:'purchases'|'cash';company:string;active:boolean;refreshToken:number}) {
 const purchases=kind==='purchases',title=purchases?'Compras recebidas':'Histórico de caixas',noun=purchases?'compras':'caixas';
 const [selected,setSelected]=useState('');const opener=useRef<HTMLButtonElement|null>(null);
 const [filter,setFilter]=useState<CashHistoryFilter>({page:0});
 const [data,setData]=useState<HistoryPage<Row>>(),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const scope=company+':'+kind+':'+JSON.stringify(filter);
 const query=useLocalQuery(scope,active,refreshToken,
  async()=>{setLoading(true);setError('');setData(undefined);return purchases?window.nexoLocal!.purchaseHistory(company,filter):window.nexoLocal!.cashHistory(company,filter);},
  value=>{setData(value);setLoading(false);},reason=>{setData(undefined);setError(errorMessage(reason));setLoading(false);});
 function change(next:CashHistoryFilter){setSelected('');opener.current=null;setData(undefined);setError('');setLoading(true);setFilter(next);}
 function search(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=new FormData(event.currentTarget),from=String(form.get('from')||''),until=String(form.get('until')||'');
  if(from&&until&&from>until){setError('A data inicial deve ser anterior ou igual à data final.');return;}
  const end=until?new Date(until+'T00:00:00'):undefined;if(end)end.setDate(end.getDate()+1);
  const next:CashHistoryFilter={page:0,search:String(form.get('search')||'').trim(),...(from?{from:new Date(from+'T00:00:00').toISOString()}:{}),...(end?{until:end.toISOString()}:{}),...(!purchases?{status:form.get('status') as CashHistoryFilter['status']}:{})};
  setSelected('');opener.current=null;setData(undefined);setLoading(true);setError('');setFilter(next);if(JSON.stringify(next)===JSON.stringify(filter))void query.refresh();
 }
 return <section aria-label={title}>
  <h2>{title}</h2>
  <form aria-label={'Filtros de '+noun} onSubmit={search} className="form-grid">
   <label>Buscar {noun}<input name="search" maxLength={120} placeholder={purchases?'Fornecedor ou identificação':'Responsável ou identificação'}/></label>
   <label>{purchases?'Compras':'Caixas'} de<input type="date" name="from"/></label>
   <label>{purchases?'Compras':'Caixas'} até<input type="date" name="until"/></label>
   {!purchases&&<label>Situação dos caixas<select name="status" defaultValue="ALL"><option value="ALL">Todos</option><option value="OPEN">Abertos</option><option value="CLOSED">Fechados</option></select></label>}
   <button className="button secondary" type="submit">Consultar {noun}</button>
   <button className="text-button" type="button" onClick={event=>{event.currentTarget.form?.reset();change({page:0});if(JSON.stringify(filter)==='{"page":0}')void query.refresh();}}>Limpar filtros de {noun}</button>
  </form>
  {error&&<p role="alert">{error} <button type="button" className="text-button" onClick={()=>void query.refresh()}>Tentar novamente</button></p>}
  <p role="status">{loading?'Consultando '+noun+'…':data?(data.total?'Mostrando '+(data.page*data.pageSize+1)+'–'+Math.min((data.page+1)*data.pageSize,data.total)+' de '+data.total+' '+noun: 'Nenhum registro encontrado para estes filtros.') : ''}</p>
  {purchases&&selected&&<LocalPurchaseDetails key={company+':'+selected} company={company} id={selected} active={active} refreshToken={refreshToken} onClose={()=>{setSelected('');const target=opener.current;opener.current=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus();});}}/>}
  <div className="account-table" tabIndex={0}><table aria-label={title}>
   <thead><tr><th>Data e identificação</th><th>{purchases?'Fornecedor':'Responsável'}</th>{purchases?<><th>Total</th><th>Vencimento</th><th>Detalhes</th></>:<><th>Situação</th><th>Saldo esperado</th><th>Contado</th><th>Diferença</th></>}</tr></thead>
   <tbody>{data?.rows.map(row=><tr key={row.id} data-history-id={row.id}><td><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('pt-BR')}</time><br/><small title={row.id}>#{row.id.slice(0,8)}</small></td>{'supplier_name' in row?<><td>{row.supplier_name}</td><td>{money(row.total_cents)}</td><td>{row.due_date?shortDate(row.due_date):'Sem conta a pagar'}</td><td><button type="button" className="text-button" aria-label={'Ver detalhes da compra '+row.id} onClick={event=>{opener.current=event.currentTarget;setSelected(row.id);}}>Ver detalhes</button></td></>:<><td>{row.actor_name}</td><td>{row.closed===1n?'Fechado':'Aberto'}</td><td>{money(row.balance_cents)}</td><td>{row.closure?money(row.closure.counted_cents):'—'}</td><td>{row.closure?money(row.closure.counted_cents-row.closure.expected_cents):'—'}</td></>}</tr>)}</tbody>
  </table></div>
  {data&&data.total>0&&<div role="group" aria-label={'Páginas de '+noun}><button type="button" className="text-button" disabled={loading||data.page===0} onClick={()=>change({...filter,page:data.page-1})}>Mais recentes</button><span>Página {data.page+1} de {Math.ceil(data.total/data.pageSize)}</span><button type="button" className="text-button" disabled={loading||(data.page+1)*data.pageSize>=data.total} onClick={()=>change({...filter,page:data.page+1})}>Mais antigas</button></div>}
 </section>;
}
