import { useLocalQuery } from './useLocalQuery';
import { useLayoutEffect,useRef,useState,type FormEvent } from 'react';
import { calculatePurchase,type PurchaseLine } from './purchase-draft';
import { errorMessage,money,shortDate } from './local-format';
const newLine=():PurchaseLine=>({id:crypto.randomUUID(),productId:'',quantity:'1',cost:''});
export function LocalPurchases({company,active=true,refreshToken=0}:{company:string;active?:boolean;refreshToken?:number}) {
 const bridge=window.nexoLocal!;
 const [suppliers,setSuppliers]=useState<{id:string;name:string}[]>([]),[products,setProducts]=useState<{id:string;name:string}[]>([]);
 const [stock,setStock]=useState<Awaited<ReturnType<typeof bridge.stock>>>([]),[purchases,setPurchases]=useState<Awaited<ReturnType<typeof bridge.purchases>>>([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[key,setKey]=useState(()=>crypto.randomUUID());
 const [lines,setLines]=useState(()=>[newLine()]),[supplier,setSupplier]=useState(''),[dueDate,setDueDate]=useState('');
 const inputs=useRef(new Map<string,HTMLSelectElement>()),focus=useRef<string|null>(null);
 useLayoutEffect(()=>{if(focus.current){inputs.current.get(focus.current)?.focus();focus.current=null;}},[lines]);
 const requests=useLocalQuery(company,active,refreshToken,
  ()=>Promise.all([bridge.people(company,'supplier'),bridge.products(company),bridge.stock(company),bridge.purchases(company)]),
  ([people,catalog,balances,receipts])=>{setSuppliers(people.filter(row=>row.active));setProducts(catalog.filter(row=>row.active===1n));setStock(balances);setPurchases(receipts);},error=>setMessage(errorMessage(error)));
 const calculated=calculatePurchase(lines);
 function update(id:string,patch:Partial<PurchaseLine>){setMessage('');setLines(current=>current.map(line=>line.id===id?{...line,...patch}:line));}
 function remove(id:string){if(busy)return;const index=lines.findIndex(row=>row.id===id);if(index<0)return;const remaining=lines.filter(row=>row.id!==id);const next=remaining.length?remaining:[newLine()];focus.current=(next[index]??next.at(-1))!.id;setLines(next);setMessage('Item '+(index+1)+' removido da compra.');}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const element=event.currentTarget,form=new FormData(element),task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');
  try {
   if(!calculated.valid)throw new Error(calculated.rows.find(row=>row.error)?.error||'Confira os itens da compra.');
   if(dueDate&&calculated.total===0n)throw new Error('Uma conta a pagar precisa ter valor maior que zero.');
   await bridge.receivePurchase(company,key,{supplierId:supplier,items:calculated.rows.map(row=>row.item!),notes:form.get('notes'),payable:dueDate?{dueDate}:null});
   task.finish();if(!task.isCurrent())return;setKey(crypto.randomUUID());setLines([newLine()]);setSupplier('');setDueDate('');element.reset();setMessage('Compra recebida e estoque atualizado. Total: '+money(calculated.total!)+'.');await requests.refresh();
  }catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{if(task.finish())setBusy(false);}
 }
 return <details className="panel"><summary>Compras e estoque</summary><form aria-label="Recebimento de compra" onSubmit={save} className="form-stack"><fieldset disabled={busy||!company} className="form-stack">
  <label>Fornecedor<select aria-label="Fornecedor" required value={supplier} onChange={event=>{setMessage('');setSupplier(event.target.value);}}><option value="">Selecione</option>{suppliers.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
  {lines.map((line,index)=><div className="purchase-line" role="group" aria-label={'Item da compra '+(index+1)} key={line.id}><div className="form-grid">
   <label>Produto {index+1}<select aria-label={'Produto '+(index+1)} ref={element=>{if(element)inputs.current.set(line.id,element);else inputs.current.delete(line.id);}} required value={line.productId} onChange={event=>update(line.id,{productId:event.target.value})}><option value="">Selecione</option>{products.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
   <label>Quantidade {index+1}<input required inputMode="decimal" value={line.quantity} onChange={event=>update(line.id,{quantity:event.target.value})}/></label>
   <label>Custo unitário {index+1} (R$)<input required inputMode="decimal" value={line.cost} onChange={event=>update(line.id,{cost:event.target.value})}/></label>
   </div><div className="purchase-line-footer"><p aria-label={'Subtotal do item '+(index+1)}>Subtotal: <strong>{calculated.rows[index]!.subtotal===null?'A preencher':money(calculated.rows[index]!.subtotal!)}</strong></p><button type="button" className="button secondary" aria-label={'Remover item da compra '+(index+1)} onClick={()=>remove(line.id)}>Remover item</button></div>
   {line.productId&&calculated.rows[index]!.error&&<p className="message">{calculated.rows[index]!.error}</p>}
  </div>)}
  <button type="button" className="button secondary" disabled={lines.length>=100} onClick={()=>setLines(current=>[...current,newLine()])}>Adicionar item</button>
  <label>Vencimento da conta a pagar<input type="date" value={dueDate} onChange={event=>{setMessage('');setDueDate(event.target.value);}}/></label><p>Deixe o vencimento vazio para receber sem gerar conta a pagar.</p>
  <label>Observações da compra<input name="notes" maxLength={1000}/></label>
  <section className="purchase-review" aria-label="Conferência da compra"><h2>Confira antes de receber</h2><p>Fornecedor: <strong>{suppliers.find(row=>row.id===supplier)?.name||'Selecione o fornecedor'}</strong></p><p>{dueDate?'Conta a pagar com vencimento em '+shortDate(dueDate):'Sem geração de conta a pagar'}</p><p aria-label="Total da compra">Total da compra: <strong>{calculated.total===null?'Preencha e confira todos os itens':money(calculated.total)}</strong></p></section>
  <button className="button primary">Receber compra</button></fieldset></form><p role="status">{message}</p>
  <details className="purchase-history"><summary>Consultar estoque e compras recebidas</summary><h2>Estoque atual</h2><div className="account-table" tabIndex={0}><table aria-label="Estoque atual"><thead><tr><th>Produto</th><th>Quantidade</th></tr></thead><tbody>{stock.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.balance_milli/1000n},{(row.balance_milli%1000n).toString().padStart(3,'0')} {row.unit}</td></tr>)}</tbody></table></div>
  <h2>Compras recebidas</h2><div className="account-table" tabIndex={0}><table aria-label="Compras recebidas"><thead><tr><th>Fornecedor</th><th>Total</th><th>Vencimento</th></tr></thead><tbody>{purchases.map(row=><tr key={row.id}><td>{row.supplier_name}</td><td>{money(row.total_cents)}</td><td>{row.due_date?shortDate(row.due_date):'Sem conta a pagar'}</td></tr>)}</tbody></table></div></details></details>;
}
