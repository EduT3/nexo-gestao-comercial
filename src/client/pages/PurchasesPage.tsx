import { useState, type FormEvent } from 'react';
import type { Company, Product, Purchase, Supplier } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Icon, Message, PageHeading, ResourceState, formatDate } from '../components';

type PurchaseList = { purchases: Purchase[]; total: number; limit: number; offset: number };
type ProductList = { products: Product[]; total: number; limit: number; offset: number };
type SupplierList = { suppliers: Supplier[]; total: number; limit: number; offset: number };
type DraftItem = { key: string; productId: string; quantity: string; cost: string };
function money(cents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100); }
function parseMoney(value: string): number | null {
  const clean = value.trim().replace(/^R\$\s*/i, '').replace(/\s/g, ''); const separator = Math.max(clean.lastIndexOf(','), clean.lastIndexOf('.'));
  const whole = (separator >= 0 ? clean.slice(0, separator) : clean).replace(/[.]/g, ''); const fraction = separator >= 0 ? clean.slice(separator + 1) : '';
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0')); return Number.isSafeInteger(result) ? result : null;
}
function newItem(): DraftItem { return { key: crypto.randomUUID(), productId: '', quantity: '1', cost: '' }; }

export function PurchasesPage({ company }: { company: Company }) {
  const [showForm, setShowForm] = useState(false); const [items, setItems] = useState<DraftItem[]>([newItem()]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const purchases = useResource<PurchaseList>(`/companies/${company.id}/purchases?limit=50&offset=0`);
  const products = useResource<ProductList>(`/companies/${company.id}/products?active=true&limit=100&offset=0`);
  const suppliers = useResource<SupplierList>(`/companies/${company.id}/suppliers?active=true&limit=100&offset=0`);
  function update(key: string, patch: Partial<DraftItem>) { setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item)); }
  function close() { setShowForm(false); setItems([newItem()]); setError(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError(''); setSuccess('');
    const parsed = items.map(item => ({ productId: item.productId, quantity: item.quantity.trim().replace(',', '.'), unitCostCents: parseMoney(item.cost) }));
    if (parsed.some(item => !item.productId || item.unitCostCents === null)) { setError('Selecione os produtos e informe custos válidos, como 12,50.'); return; }
    const hasPayable = form.get('createPayable') === 'on'; const dueDate = String(form.get('dueDate') ?? '');
    if (hasPayable && !dueDate) { setError('Informe o vencimento da conta a pagar.'); return; }
    setBusy(true);
    try {
      await api(`/companies/${company.id}/purchases/receive`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { supplierId: form.get('supplierId'), items: parsed, notes: String(form.get('notes') ?? '').trim(), payable: hasPayable ? { dueDate, notes: String(form.get('payableNotes') ?? '').trim() } : null } });
      setSuccess('Compra recebida. Estoque, custos, histórico e conta a pagar foram atualizados juntos.'); close(); purchases.reload();
    } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  return <>
    <PageHeading eyebrow="OPERAÇÃO · COMPRAS" title="Compras" description={`Receba mercadorias de ${company.name} com estoque e custos atualizados na mesma operação.`} action={<button className="button primary" type="button" onClick={() => showForm ? close() : setShowForm(true)}><Icon name="plus" size={17} />{showForm ? 'Fechar recebimento' : 'Registrar compra'}</button>} />
    <Message text={error} /><Message text={success} kind="success" />
    {showForm ? <section className="panel form-panel purchase-form"><div className="section-heading"><div><p className="eyebrow">RECEBIMENTO</p><h2>Fornecedor e mercadorias</h2><p className="muted">Confirme quantidades e custos. O recebimento não pode ser editado depois.</p></div><button className="text-button" type="button" onClick={close}>Fechar</button></div><form onSubmit={submit}><fieldset disabled={busy}><div className="form-grid"><label className="span-2">Fornecedor<select name="supplierId" required autoFocus defaultValue=""><option value="" disabled>Selecione o fornecedor</option>{(suppliers.data?.suppliers ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="purchase-items"><div className="section-heading compact"><h3>Itens recebidos</h3><button className="button secondary small" type="button" onClick={() => setItems(current => [...current, newItem()])}>Adicionar item</button></div>{items.map((item, index) => <div className="purchase-item" key={item.key}><label>Produto<select required value={item.productId} onChange={event => { const product = products.data?.products.find(value => value.id === event.target.value); update(item.key, { productId: event.target.value, cost: product?.costCents === undefined ? '' : `${Math.floor(product.costCents / 100)},${String(product.costCents % 100).padStart(2, '0')}` }); }}><option value="">Selecione</option>{(products.data?.products ?? []).map(product => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label>Quantidade<input required inputMode="decimal" value={item.quantity} onChange={event => update(item.key, { quantity: event.target.value })} /></label><label>Custo unitário<input required inputMode="decimal" placeholder="0,00" value={item.cost} onChange={event => update(item.key, { cost: event.target.value })} /></label><button className="text-button remove-item" type="button" disabled={items.length === 1} onClick={() => setItems(current => current.filter(value => value.key !== item.key))}>Remover item {index + 1}</button></div>)}</div><div className="form-grid purchase-details"><label className="span-2">Observação da compra<textarea name="notes" rows={3} maxLength={1000} /></label><label className="checkbox-label span-2"><input type="checkbox" name="createPayable" /><span>Gerar conta a pagar<small>Cria uma obrigação vinculada a esta compra.</small></span></label><label>Vencimento<input type="date" name="dueDate" /></label><label>Observação financeira<input name="payableNotes" maxLength={500} /></label></div></fieldset><div className="form-actions"><span className="muted">Ao confirmar, o estoque será aumentado imediatamente.</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Recebendo…' : 'Confirmar recebimento'}</button></div></form></section> : null}
    <ResourceState {...purchases} />
    {purchases.data ? <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">HISTÓRICO DE RECEBIMENTOS</p><h2>{purchases.data.total} {purchases.data.total === 1 ? 'compra recebida' : 'compras recebidas'}</h2></div></div>{purchases.data.purchases.length ? <div className="table-scroll"><table className="catalog-table purchase-table"><thead><tr><th>Recebimento</th><th>Fornecedor</th><th>Itens</th><th>Total</th><th>Financeiro</th><th>Responsável</th></tr></thead><tbody>{purchases.data.purchases.map(purchase => <tr key={purchase.id}><td>{formatDate(purchase.receivedAt, company.timezone)}<small className="cell-detail">{purchase.notes || 'Sem observação'}</small></td><td><strong>{purchase.supplierName}</strong></td><td>{purchase.items.length}<small className="cell-detail">{purchase.items.map(item => `${item.productName} · ${item.quantity}`).join(' | ')}</small></td><td className="number-cell"><strong>{money(purchase.totalCents)}</strong></td><td>{purchase.payable ? <><span className="badge inventory-low">A pagar</span><small className="cell-detail">Vence {new Intl.DateTimeFormat('pt-BR').format(new Date(`${purchase.payable.dueDate}T12:00:00`))}</small></> : <span className="badge neutral">Sem título</span>}</td><td>{purchase.actorName}</td></tr>)}</tbody></table></div> : <Empty title="Nenhuma compra registrada" text="Registre a primeira compra para adicionar produtos ao estoque e acompanhar os custos." />}</section> : null}
  </>;
}
