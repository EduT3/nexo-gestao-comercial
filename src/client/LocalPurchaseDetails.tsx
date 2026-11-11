import {useEffect,useRef,useState} from 'react';
import {useLocalQuery} from './useLocalQuery';
import {money,shortDate,errorMessage} from './local-format';
import type {PurchaseDetails} from '../shared/operation-history';
const quantity=(value:bigint)=>value/1000n+','+(value%1000n).toString().padStart(3,'0');
/** The original item name/cost/quantity comes from the received purchase, not today's product. */
export function PurchaseDetailsView({detail}:{detail:PurchaseDetails}) {
 return <>
  <p>Identificação: <code style={{overflowWrap:'anywhere'}}>{detail.id}</code></p>
  <p>Fornecedor: <strong>{detail.supplier_name}</strong></p>
  <p>Recebida em: <time dateTime={detail.created_at}>{new Date(detail.created_at).toLocaleString('pt-BR')}</time></p>
  <h4>Observações da compra</h4><p style={{whiteSpace:'pre-wrap'}}>{detail.notes||'Sem observações.'}</p>
  <div className="account-table" tabIndex={0}><table aria-label="Itens da compra recebida"><thead><tr><th>Produto recebido</th><th>Quantidade</th><th>Custo unitário</th><th>Subtotal</th></tr></thead><tbody>{detail.items.map(item=><tr key={item.product_id}><td>{item.product_name}</td><td>{quantity(item.quantity_milli)}</td><td>{money(item.unit_cost_cents)}</td><td>{money(item.total_cents)}</td></tr>)}</tbody></table></div>
  <p aria-label="Total da compra recebida"><strong>Total: {money(detail.total_cents)}</strong></p>
  <h4>Conta a pagar vinculada</h4>
  {detail.payable?<><p>Identificação: <code style={{overflowWrap:'anywhere'}}>{detail.payable.id}</code></p><p>Valor original: {money(detail.payable.amount_cents)} · Vencimento: {shortDate(detail.payable.due_date)}</p>{detail.payable.notes&&<p style={{whiteSpace:'pre-wrap'}}>{detail.payable.notes}</p>}<p>Consulte Pagar no Financeiro para conferir pagamentos e estornos.</p></>:<p>Esta compra foi recebida sem gerar conta a pagar.</p>}
 </>;
}
export function LocalPurchaseDetails({company,id,active,refreshToken,onClose}:{company:string;id:string;active:boolean;refreshToken:number;onClose():void}) {
 const [detail,setDetail]=useState<PurchaseDetails>(),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 const query=useLocalQuery(company+':'+id,active,refreshToken,
  async()=>{setDetail(undefined);setLoading(true);setError('');return window.nexoLocal!.purchaseDetails(company,id);},
  value=>{if(value.id!==id||value.company_id!==company){setDetail(undefined);setError('Não foi possível confirmar a compra selecionada. Consulte novamente.');}else setDetail(value);setLoading(false);},
  reason=>{setDetail(undefined);setLoading(false);setError(errorMessage(reason));});
 useEffect(()=>{heading.current?.focus();},[]);
 return <section className="purchase-review" aria-label="Detalhes da compra">
  <h3 ref={heading} tabIndex={-1}>Compra recebida</h3><p>Somente consulta. Os registros originais são preservados.</p>
  <button type="button" className="text-button" onClick={onClose}>Fechar detalhes da compra</button>
  {loading&&<p role="status">Consultando detalhes da compra…</p>}
  {error&&<p role="alert">{error} <button type="button" className="text-button" onClick={()=>void query.refresh()}>Tentar novamente</button></p>}
  {detail&&<PurchaseDetailsView detail={detail}/>}
 </section>;
}
