import { useGuardPending } from './Guard';
import { Trash } from '@phosphor-icons/react';
import {useEffect} from 'react';
import {addEntrySelection,stockUnitLabels,type StockEntrySelection} from './stock-entry-selection';
import {LocalOperationHistory} from './LocalOperationHistory';
import { useLocalQuery } from './useLocalQuery';
import { useLayoutEffect,useRef,useState,type FormEvent } from 'react';
import { calculatePurchase,type PurchaseLine } from './purchase-draft';
import { errorMessage,money,shortDate } from './local-format';
const newLine=():PurchaseLine=>({id:crypto.randomUUID(),productId:'',quantity:'1',cost:''});
export function LocalPurchases({company,active=true,refreshToken=0,selection,onNewProduct,onSaved}:{company:string;active?:boolean;refreshToken?:number;selection?:StockEntrySelection;onNewProduct?:()=>void;onSaved?:()=>void}) {
  const guardPending = useGuardPending();
 const bridge=window.nexoLocal!;
 const [suppliers,setSuppliers]=useState<{id:string;name:string}[]>([]),[products,setProducts]=useState<{id:string;name:string;unit:string;cost_cents?:bigint}[]>([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[key,setKey]=useState(()=>crypto.randomUUID());
 const [lines,setLines]=useState(()=>[newLine()]),[supplier,setSupplier]=useState(''),[dueDate,setDueDate]=useState('');
 const inputs=useRef(new Map<string,HTMLSelectElement>()),focus=useRef<string|null>(null);
 useLayoutEffect(()=>{if(focus.current){inputs.current.get(focus.current)?.focus();focus.current=null;}},[lines]);
 const [identifySupplier,setIdentifySupplier]=useState(false),[supplierError,setSupplierError]=useState('');
 const requests=useLocalQuery(company,active,refreshToken,()=>bridge.products(company),catalog=>setProducts(catalog.filter(row=>row.active===1n)),error=>setMessage(errorMessage(error)));
 const supplierRequests=useLocalQuery(company,active&&identifySupplier,refreshToken,()=>bridge.people(company,'supplier'),people=>{setSuppliers(people.filter(row=>row.active));setSupplierError('');},error=>setSupplierError(errorMessage(error)));
 const [historyRevision,setHistoryRevision]=useState(0);
 const appliedSelection=useRef<number|null>(null);
 useEffect(()=>{if(!selection||selection.company!==company||appliedSelection.current===selection.request)return;appliedSelection.current=selection.request;const next=addEntrySelection(lines,selection,company);focus.current=next.focusId;setLines(next.lines);setMessage(next.message);},[selection,company,lines]);
 const [supplierForm,setSupplierForm]=useState(false),[supplierName,setSupplierName]=useState('');
 async function saveSupplier(){const task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');try{const name=supplierName.trim();if(name.length<2)throw new Error('Informe o nome do fornecedor, com pelo menos duas letras.');const created=await bridge.createPerson(company,'supplier',{name});task.finish();if(!task.isCurrent())return;await supplierRequests.refresh();if(!task.isCurrent())return;setSupplier(created.id);setSupplierName('');setSupplierForm(false);setMessage('Fornecedor cadastrado e selecionado.');}catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{if(task.finish())setBusy(false);}}

 const calculated=calculatePurchase(lines);
 function update(id:string,patch:Partial<PurchaseLine>){setMessage('');setLines(current=>current.map(line=>line.id===id?{...line,...patch}:line));}
 function remove(id:string){if(busy)return;const index=lines.findIndex(row=>row.id===id);if(index<0)return;const remaining=lines.filter(row=>row.id!==id);const next=remaining.length?remaining:[newLine()];focus.current=(next[index]??next.at(-1))!.id;setLines(next);setMessage('Item '+(index+1)+' removido da compra.');}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const element=event.currentTarget,form=new FormData(element),task=requests.beginMutation();if(!task)return;setBusy(true);setMessage('');
  try {
   if(!calculated.valid)throw new Error(calculated.rows.find(row=>row.error)?.error||'Confira os itens da compra.');
   if(dueDate&&calculated.total===0n)throw new Error('Uma conta a pagar precisa ter valor maior que zero.');
   await bridge.receivePurchase(company,key,{supplierId:supplier||null,items:calculated.rows.map(row=>row.item!),notes:form.get('notes'),payable:dueDate?{dueDate}:null});
   task.finish();if(!task.isCurrent())return;setKey(crypto.randomUUID());setLines([newLine()]);setSupplier('');setIdentifySupplier(false);setSupplierForm(false);setSupplierName('');setDueDate('');element.reset();setHistoryRevision(value=>value+1);setMessage('Entrada registrada. Estoque atualizado. Total: '+money(calculated.total!)+'.');await requests.refresh();onSaved?.();
  }catch(error){if(task.isCurrent())setMessage(errorMessage(error));}finally{if(task.finish())setBusy(false);}
 }
 return <details className="panel"><summary>Adicionar produtos ao estoque</summary><p>Registre somente as mercadorias que já chegaram. A quantidade será somada ao saldo atual.</p>{onNewProduct&&<button type="button" className="button secondary" disabled={busy} onClick={onNewProduct}>Produto novo? Cadastrar aqui</button>}<form aria-label="Entrada de mercadorias" onSubmit={save} className="form-stack"><fieldset disabled={busy||!company} className="form-stack">
  <div className="stock-entry-actions">
   <button type="submit" className="button primary">{busy ? (guardPending ? 'Autorização em andamento…' : 'Processando…') : 'Salvar entrada no estoque'}</button>
   <p role="status">{message}</p>
  </div>
  <p className="optional-hint">Não precisa cadastrar fornecedor para dar entrada. Preencha só os produtos, as quantidades e os custos.</p>
  <details className="optional-party" open={identifySupplier} onToggle={event=>setIdentifySupplier(event.currentTarget.open)}><summary>{supplier?'Fornecedor selecionado (opcional)':'Informar fornecedor (opcional)'}</summary>
  <label>De quem você recebeu?<select aria-label="Fornecedor" value={supplier} onChange={event=>{setMessage('');setSupplier(event.target.value);}}><option value="">Sem fornecedor informado</option>{suppliers.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
  <button type="button" className="text-button" disabled={busy} onClick={()=>setSupplierForm(value=>!value)}>{supplierForm?'Fechar cadastro de fornecedor':'Fornecedor novo? Cadastrar aqui'}</button>
  {supplierForm&&<div className="inline-supplier"><label>Nome do fornecedor<input value={supplierName} onChange={event=>setSupplierName(event.target.value)} maxLength={160}/></label><button type="button" className="button secondary" disabled={busy||supplierName.trim().length<2} onClick={()=>void saveSupplier()}>Salvar fornecedor</button><p>O fornecedor será selecionado nesta entrada.</p></div>}
  {supplierError&&<p role="status">Não foi possível consultar fornecedores. Você pode continuar sem informar um fornecedor. <button type="button" onClick={()=>void supplierRequests.refresh()}>Tentar novamente</button></p>}
  </details>
  {lines.map((line,index)=><div className="purchase-line" role="group" aria-label={'Item da compra '+(index+1)} key={line.id}><div className="form-grid">
   <label>Produto {index+1}<select aria-label={'Produto '+(index+1)} ref={element=>{if(element)inputs.current.set(line.id,element);else inputs.current.delete(line.id);}} required value={line.productId} onChange={event=>{const id=event.target.value,cost=products.find(product=>product.id===id)?.cost_cents;update(line.id,{productId:id,...(cost===undefined?{}:{cost:`${cost/100n},${(cost%100n).toString().padStart(2,'0')}`})});}}><option value="">Selecione</option>{products.map(row=><option key={row.id} value={row.id}>{row.name} · {stockUnitLabels[row.unit]??row.unit}</option>)}</select></label>
   <label>Quantidade {index+1}<input required inputMode="decimal" value={line.quantity} onChange={event=>update(line.id,{quantity:event.target.value})}/></label>
   <label>Custo unitário {index+1} (R$)<input required inputMode="decimal" value={line.cost} onChange={event=>update(line.id,{cost:event.target.value})}/></label>
   </div><div className="purchase-line-footer"><p aria-label={'Subtotal do item '+(index+1)}>Subtotal: <strong>{calculated.rows[index]!.subtotal===null?'A preencher':money(calculated.rows[index]!.subtotal!)}</strong></p><button type="button" className="button secondary nexo-row-icon" aria-label={'Remover item da compra '+(index+1)} title="Remover item" onClick={()=>remove(line.id)}><Trash size={19} aria-hidden="true" /></button></div>
   {line.productId&&calculated.rows[index]!.error&&<p className="message">{calculated.rows[index]!.error}</p>}
  </div>)}
  <button type="button" className="button secondary" disabled={lines.length>=100} onClick={()=>setLines(current=>[...current,newLine()])}>Adicionar item</button>
  <label>Pagar depois? Informe o vencimento<input type="date" value={dueDate} onChange={event=>{setMessage('');setDueDate(event.target.value);}}/></label><p>Deixe o vencimento vazio para receber sem gerar conta a pagar.</p>
  <label>Observações da compra<input name="notes" maxLength={1000}/></label>
  <section className="purchase-review" aria-label="Conferência da compra"><h2>Confira a entrada</h2><p>Fornecedor: <strong>{suppliers.find(row=>row.id===supplier)?.name||'Sem fornecedor informado'}</strong></p><p>{dueDate?'Conta a pagar com vencimento em '+shortDate(dueDate):'Sem geração de conta a pagar'}</p><p aria-label="Total da compra">Total da compra: <strong>{calculated.total===null?'Preencha e confira todos os itens':money(calculated.total)}</strong></p></section>
  </fieldset></form>
  <details className="purchase-history"><summary>Consultar entradas anteriores</summary><LocalOperationHistory key={company} kind="purchases" company={company} active={active} refreshToken={refreshToken+historyRevision}/></details></details>;
}
