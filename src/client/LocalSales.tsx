import { useLocalQuery } from './useLocalQuery';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { itemTotalCents, quantityToMilli } from '../shared/scaled';
export type LocalSaleRow = { id: string; total_cents: bigint; method: string; change_cents: bigint; status: 'CONFIRMED' | 'CANCELLED'; cancellation_reason: string | null };
function money(value: bigint) { return `R$ ${value / 100n},${(value % 100n).toString().padStart(2, '0')}`; }
function cents(value: string) { if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe valor com até duas casas decimais.'); const [whole, fraction = ''] = value.replace(',', '.').split('.'); return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0')); }
function newSaleLine() { return { id: crypto.randomUUID(), productId: '', quantity: '1' }; }
export function LocalSales({ company, active = true, onSaved, administrator = true, refreshToken = 0 }: { company: string; active?: boolean; onSaved(): void; administrator?: boolean; refreshToken?: number }) {
  const bridge = window.nexoLocal!;
  const [products, setProducts] = useState<{ id: string; name: string; price_cents: bigint }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [sales, setSales] = useState<LocalSaleRow[]>([]);
  const [lines, setLines] = useState(() => [newSaleLine()]);
  const productInputs = useRef(new Map<string, HTMLSelectElement>());
  const focusAfterRemoval = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (focusAfterRemoval.current) {
      productInputs.current.get(focusAfterRemoval.current)?.focus();
      focusAfterRemoval.current = null;
    }
  }, [lines]);
  function removeLine(id: string) {
    if (busy) return;
    const index = lines.findIndex(line => line.id === id);
    if (index < 0) return;
    const remaining = lines.filter(line => line.id !== id);
    const next = remaining.length ? remaining : [newSaleLine()];
    focusAfterRemoval.current = (next[index] ?? next[next.length - 1])!.id;
    setLines(next);
    setMessage(`Item ${index + 1} removido da venda.`);
  }
  const [discount, setDiscount] = useState('0,00'); const [method, setMethod] = useState('CASH'); const [received, setReceived] = useState('');
  const [canceling, setCanceling] = useState<{ id: string; key: string }>();
  const [cancelReason, setCancelReason] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID()); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const requests = useLocalQuery(company, active, refreshToken,
    () => Promise.all([bridge.products(company), bridge.people(company, 'customer'), bridge.sales(company)]),
    ([catalog, people, history]) => { setProducts(catalog.filter(row => row.active === 1n)); setCustomers(people.filter(row => row.active)); setSales(history); },
    error => setMessage(String(error)));
  const { refresh } = requests;
  let total = 0n; let change = 0n; let calculationError = '';
  try { for (const line of lines) { const product = products.find(row => row.id === line.productId); if (product) total += itemTotalCents(quantityToMilli(line.quantity.replace(',', '.')), product.price_cents); } total -= cents(discount); if (total < 0n) throw new Error('Desconto acima do subtotal.'); if (method === 'CASH' && received) { change = cents(received) - total; if (change < 0n) throw new Error('Valor recebido insuficiente.'); } } catch (error) { calculationError = (error as Error).message; }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      if (calculationError) throw new Error(calculationError);
      const result = await bridge.confirmSale(company, key, { customerId: form.get('customer') || null, items: lines.map(row => ({ productId: row.productId, quantity: row.quantity.replace(',', '.') })), discountCents: Number(cents(discount)), paymentMethod: method, receivedCents: method === 'CASH' && received ? Number(cents(received)) : null, notes: form.get('notes') });
      task.finish(); if (!task.isCurrent()) return;
      setKey(crypto.randomUUID()); setLines([newSaleLine()]); setDiscount('0,00'); setReceived(''); element.reset(); setMessage(`Venda salva. Total: ${money(result.totalCents)}. Troco: ${money(result.changeCents)}.`); onSaved(); await refresh();
    } catch (error) { if (task.isCurrent()) setMessage(String(error)); } finally { if (task.finish()) setBusy(false); }
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canceling) return; const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try { const result = await bridge.cancelSale(company, canceling.id, canceling.key, { reason: cancelReason });
      task.finish(); if (!task.isCurrent()) return;
      if (!result.canceled) { setCanceling(undefined); setCancelReason(''); setMessage('Venda cancelada e valores estornados.'); onSaved(); await refresh(); }
    } catch (error) { if (task.isCurrent()) setMessage(String(error)); } finally { if (task.finish()) setBusy(false); }
  }
  return <details className="panel"><summary>Vendas</summary>
    <form aria-label="Nova venda" onSubmit={save} className="form-stack"><fieldset disabled={busy} className="form-stack">
      <label>Cliente da venda<select aria-label="Cliente da venda" name="customer"><option value="">Consumidor sem cadastro</option>{customers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {lines.map((line, index) => <div className="form-grid sale-line" role="group" aria-label={`Item da venda ${index + 1}`} key={line.id}>
        <label>Produto da venda {index + 1}<select aria-label={`Produto da venda ${index + 1}`} ref={element => { if (element) productInputs.current.set(line.id, element); else productInputs.current.delete(line.id); }} required value={line.productId} onChange={event => setLines(current => current.map(row => row.id === line.id ? { ...row, productId: event.target.value } : row))}><option value="">Selecione</option>{products.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label>Quantidade da venda {index + 1}<input required value={line.quantity} inputMode="decimal" onChange={event => setLines(current => current.map(row => row.id === line.id ? { ...row, quantity: event.target.value } : row))} /></label>
        <button type="button" className="button secondary" aria-label={`Remover item ${index + 1}${line.productId ? `: ${products.find(product => product.id === line.productId)?.name ?? 'produto'}` : ''}`} onClick={() => removeLine(line.id)}>Remover item</button>
      </div>)}
      <button type="button" className="button secondary" disabled={lines.length >= 100} onClick={() => setLines(current => [...current, newSaleLine()])}>Adicionar produto à venda</button>
      <div className="form-grid"><label>Desconto da venda (R$)<input disabled={!administrator} required value={discount} onChange={event => setDiscount(event.target.value)} inputMode="decimal" /></label><label>Pagamento<select aria-label="Pagamento" value={method} onChange={event => setMethod(event.target.value)}><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label>{method === 'CASH' && <label>Valor recebido (R$)<input value={received} placeholder="Valor exato se vazio" inputMode="decimal" onChange={event => setReceived(event.target.value)} /></label>}</div>
      <label>Observações da venda<input name="notes" maxLength={500} /></label><p aria-label="Total da venda"><strong>Total: {money(total < 0n ? 0n : total)}</strong></p><p aria-label="Troco da venda">Troco: {money(change < 0n ? 0n : change)}</p>{calculationError && <p>{calculationError}</p>}<button className="button primary">Concluir venda</button>
    </fieldset></form><p role="status">{message}</p><table aria-label="Vendas realizadas"><thead><tr><th>Total</th><th>Pagamento</th><th>Troco</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{sales.map(row => <tr key={row.id}><td>{money(row.total_cents)}</td><td>{{ CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito' }[row.method]}</td><td>{money(row.change_cents)}</td><td>{row.status === "CANCELLED" ? "Cancelada" : "Confirmada"}{row.cancellation_reason && <p>{row.cancellation_reason}</p>}</td><td>{administrator && row.status === "CONFIRMED" && <button disabled={busy} onClick={() => { setCanceling({ id: row.id, key: crypto.randomUUID() }); setCancelReason(""); }}>Cancelar venda</button>}</td></tr>)}</tbody></table>
    {canceling && <form aria-label="Cancelamento da venda" onSubmit={cancel}><label>Motivo do cancelamento<input required minLength={2} maxLength={1000} value={cancelReason} onChange={event => setCancelReason(event.target.value)} /></label><button className="button primary" disabled={busy}>Confirmar cancelamento</button><button type="button" disabled={busy} onClick={() => setCanceling(undefined)}>Voltar à venda</button></form>}
  </details>;
}