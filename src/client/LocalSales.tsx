import { useEffect, useState, type FormEvent } from 'react';
import { itemTotalCents, quantityToMilli } from '../shared/scaled';
export type LocalSaleRow = { id: string; total_cents: bigint; method: string; change_cents: bigint; status: 'CONFIRMED' | 'CANCELLED'; cancellation_reason: string | null };
function money(value: bigint) { return `R$ ${value / 100n},${(value % 100n).toString().padStart(2, '0')}`; }
function cents(value: string) { if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe valor com até duas casas decimais.'); const [whole, fraction = ''] = value.replace(',', '.').split('.'); return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0')); }
export function LocalSales({ company, onSaved, administrator = true }: { company: string; onSaved(): void; administrator?: boolean }) {
  const bridge = window.nexoLocal!;
  const [products, setProducts] = useState<{ id: string; name: string; price_cents: bigint }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [sales, setSales] = useState<LocalSaleRow[]>([]);
  const [lines, setLines] = useState([{ productId: '', quantity: '1' }]);
  const [discount, setDiscount] = useState('0,00'); const [method, setMethod] = useState('CASH'); const [received, setReceived] = useState('');
  const [canceling, setCanceling] = useState<{ id: string; key: string }>();
  const [cancelReason, setCancelReason] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID()); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function refresh() { const [catalog, people, history] = await Promise.all([bridge.products(company), bridge.people(company, 'customer'), bridge.sales(company)]); setProducts(catalog.filter(row => row.active === 1n)); setCustomers(people.filter(row => row.active)); setSales(history); }
  useEffect(() => { if (company) void refresh().catch(error => setMessage(String(error))); }, [company]);
  let total = 0n; let change = 0n; let calculationError = '';
  try { for (const line of lines) { const product = products.find(row => row.id === line.productId); if (product) total += itemTotalCents(quantityToMilli(line.quantity.replace(',', '.')), product.price_cents); } total -= cents(discount); if (total < 0n) throw new Error('Desconto acima do subtotal.'); if (method === 'CASH' && received) { change = cents(received) - total; if (change < 0n) throw new Error('Valor recebido insuficiente.'); } } catch (error) { calculationError = (error as Error).message; }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); setBusy(true); setMessage('');
    try {
      if (calculationError) throw new Error(calculationError);
      const result = await bridge.confirmSale(company, key, { customerId: form.get('customer') || null, items: lines.map(row => ({ ...row, quantity: row.quantity.replace(',', '.') })), discountCents: Number(cents(discount)), paymentMethod: method, receivedCents: method === 'CASH' && received ? Number(cents(received)) : null, notes: form.get('notes') });
      setKey(crypto.randomUUID()); setLines([{ productId: '', quantity: '1' }]); setDiscount('0,00'); setReceived(''); element.reset(); setMessage(`Venda salva. Total: ${money(result.totalCents)}. Troco: ${money(result.changeCents)}.`); onSaved(); await refresh();
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canceling) return; setBusy(true); setMessage('');
    try { const result = await bridge.cancelSale(company, canceling.id, canceling.key, { reason: cancelReason });
      if (!result.canceled) { setCanceling(undefined); setCancelReason(''); setMessage('Venda cancelada e valores estornados.'); onSaved(); await refresh(); }
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  }
  return <details className="panel" onToggle={event => { if (event.currentTarget.open && company) void refresh().catch(error => setMessage(String(error))); }}><summary>Vendas</summary>
    <form aria-label="Nova venda" onSubmit={save} className="form-stack"><fieldset disabled={busy} className="form-stack">
      <label>Cliente da venda<select aria-label="Cliente da venda" name="customer"><option value="">Consumidor sem cadastro</option>{customers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {lines.map((line, index) => <div className="form-grid" key={index}><label>Produto da venda {index + 1}<select aria-label={`Produto da venda ${index + 1}`} required value={line.productId} onChange={event => setLines(current => current.map((row, position) => position === index ? { ...row, productId: event.target.value } : row))}><option value="">Selecione</option>{products.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Quantidade da venda {index + 1}<input required value={line.quantity} inputMode="decimal" onChange={event => setLines(current => current.map((row, position) => position === index ? { ...row, quantity: event.target.value } : row))} /></label></div>)}
      <button type="button" className="button secondary" disabled={lines.length >= 100} onClick={() => setLines(current => [...current, { productId: '', quantity: '1' }])}>Adicionar produto à venda</button>{lines.length > 1 && <button type="button" onClick={() => setLines(current => current.slice(0, -1))}>Remover último produto</button>}
      <div className="form-grid"><label>Desconto da venda (R$)<input disabled={!administrator} required value={discount} onChange={event => setDiscount(event.target.value)} inputMode="decimal" /></label><label>Pagamento<select aria-label="Pagamento" value={method} onChange={event => setMethod(event.target.value)}><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label>{method === 'CASH' && <label>Valor recebido (R$)<input value={received} placeholder="Valor exato se vazio" inputMode="decimal" onChange={event => setReceived(event.target.value)} /></label>}</div>
      <label>Observações da venda<input name="notes" maxLength={500} /></label><p aria-label="Total da venda"><strong>Total: {money(total < 0n ? 0n : total)}</strong></p><p aria-label="Troco da venda">Troco: {money(change < 0n ? 0n : change)}</p>{calculationError && <p>{calculationError}</p>}<button className="button primary">Concluir venda</button>
    </fieldset></form><p role="status">{message}</p><table aria-label="Vendas realizadas"><thead><tr><th>Total</th><th>Pagamento</th><th>Troco</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{sales.map(row => <tr key={row.id}><td>{money(row.total_cents)}</td><td>{{ CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito' }[row.method]}</td><td>{money(row.change_cents)}</td><td>{row.status === "CANCELLED" ? "Cancelada" : "Confirmada"}{row.cancellation_reason && <p>{row.cancellation_reason}</p>}</td><td>{administrator && row.status === "CONFIRMED" && <button disabled={busy} onClick={() => { setCanceling({ id: row.id, key: crypto.randomUUID() }); setCancelReason(""); }}>Cancelar venda</button>}</td></tr>)}</tbody></table>
    {canceling && <form aria-label="Cancelamento da venda" onSubmit={cancel}><label>Motivo do cancelamento<input required minLength={2} maxLength={1000} value={cancelReason} onChange={event => setCancelReason(event.target.value)} /></label><button className="button primary" disabled={busy}>Confirmar cancelamento</button><button type="button" disabled={busy} onClick={() => setCanceling(undefined)}>Voltar à venda</button></form>}
  </details>;
}