import type { CashAvailability } from '../shared/cash-status';
import { errorMessage } from './local-format';
import { LocalSalesHistory } from './LocalSalesHistory';
import { useLocalQuery } from './useLocalQuery';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { itemTotalCents, quantityToMilli } from '../shared/scaled';
export type LocalSaleRow = { id: string; total_cents: bigint; method: string; change_cents: bigint; status: 'CONFIRMED' | 'CANCELLED'; cancellation_reason: string | null };
function money(value: bigint) { return `R$ ${value / 100n},${(value % 100n).toString().padStart(2, '0')}`; }
function cents(value: string) { if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe valor com até duas casas decimais.'); const [whole, fraction = ''] = value.replace(',', '.').split('.'); return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0')); }
function newSaleLine() { return { id: crypto.randomUUID(), productId: '', quantity: '1' }; }
export function LocalSales({ company, active = true, onSaved, administrator = true, refreshToken = 0, onOpenCash }: { company: string; active?: boolean; onSaved(): void; administrator?: boolean; refreshToken?: number; onOpenCash(): void }) {
  const bridge = window.nexoLocal!;
  const [cashAvailability, setCashAvailability] = useState<CashAvailability>();
  const [cashError, setCashError] = useState('');
  const cashRequests = useLocalQuery(company, active, refreshToken,
    async () => { setCashAvailability(undefined); setCashError(''); return bridge.cashAvailability(company); },
    setCashAvailability, error => { setCashAvailability(undefined); setCashError(errorMessage(error)); });
  const canSell = cashAvailability?.open && cashAvailability.canSell;
  const [products, setProducts] = useState<{ id: string; name: string; price_cents: bigint }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [historyRevision, setHistoryRevision] = useState(0);
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
  const [key, setKey] = useState(() => crypto.randomUUID()); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const requests = useLocalQuery(company, active, refreshToken,
    () => Promise.all([bridge.products(company), bridge.people(company, 'customer')]),
    ([catalog, people]) => { setProducts(catalog.filter(row => row.active === 1n)); setCustomers(people.filter(row => row.active)); },
    error => setMessage(errorMessage(error)));
  const { refresh } = requests;
  let total = 0n; let change = 0n; let calculationError = '';
  try { for (const line of lines) { const product = products.find(row => row.id === line.productId); if (product) total += itemTotalCents(quantityToMilli(line.quantity.replace(',', '.')), product.price_cents); } total -= cents(discount); if (total < 0n) throw new Error('Desconto acima do subtotal.'); if (method === 'CASH' && received) { change = cents(received) - total; if (change < 0n) throw new Error('Valor recebido insuficiente.'); } } catch (error) { calculationError = (error as Error).message; }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      if (!canSell) throw new Error(cashAvailability?.open ? 'O caixa aberto pertence a outro operador. Peça ao responsável para conferir o atendimento.' : 'Abra o caixa antes de registrar uma venda.');
      if (calculationError) throw new Error(calculationError);
      const result = await bridge.confirmSale(company, key, { customerId: form.get('customer') || null, items: lines.map(row => ({ productId: row.productId, quantity: row.quantity.replace(',', '.') })), discountCents: Number(cents(discount)), paymentMethod: method, receivedCents: method === 'CASH' && received ? Number(cents(received)) : null, notes: form.get('notes') });
      task.finish(); if (!task.isCurrent()) return;
      setKey(crypto.randomUUID()); setLines([newSaleLine()]); setDiscount('0,00'); setReceived(''); element.reset(); setMessage(`Venda salva. Total: ${money(result.totalCents)}. Troco: ${money(result.changeCents)}.`); setHistoryRevision(value => value + 1); onSaved(); await refresh();
    } catch (error) { if (task.isCurrent()) { setMessage(errorMessage(error)); void cashRequests.refresh(); } } finally { if (task.finish()) setBusy(false); }
  }
  return <details className="panel"><summary>Vendas</summary>
    <section className="cash-guidance" aria-label="Situação do caixa para venda">
      {!cashAvailability ? <><p>{cashError ? 'Não foi possível conferir o caixa. ' + cashError : 'Conferindo o caixa…'}</p>{cashError && <button className="button secondary" onClick={() => void cashRequests.refresh()}>Conferir caixa novamente</button>}</>
        : cashAvailability.open ? <><p><strong>{cashAvailability.canSell ? 'Caixa aberto para seu atendimento' : 'Caixa em uso por ' + cashAvailability.operatorName}</strong></p><p>Responsável: {cashAvailability.operatorName} · Dinheiro no caixa: {money(cashAvailability.balanceCents)}</p>{!cashAvailability.canSell && <p>Peça a esse operador para encerrar o atendimento antes de abrir seu caixa. Seu rascunho será mantido.</p>}</>
        : <><p><strong>Abra o caixa antes de concluir a venda.</strong></p><p>Você pode preparar os itens agora. Seu rascunho será mantido ao ir ao Caixa e voltar.</p></>}
      {!canSell && <button type="button" className="button secondary" onClick={onOpenCash}>Ir ao caixa</button>}
    </section>
    <form aria-label="Nova venda" onSubmit={save} className="form-stack"><fieldset disabled={busy} className="form-stack">
      <label>Cliente da venda<select aria-label="Cliente da venda" name="customer"><option value="">Consumidor sem cadastro</option>{customers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {lines.map((line, index) => <div className="form-grid sale-line" role="group" aria-label={`Item da venda ${index + 1}`} key={line.id}>
        <label>Produto da venda {index + 1}<select aria-label={`Produto da venda ${index + 1}`} ref={element => { if (element) productInputs.current.set(line.id, element); else productInputs.current.delete(line.id); }} required value={line.productId} onChange={event => setLines(current => current.map(row => row.id === line.id ? { ...row, productId: event.target.value } : row))}><option value="">Selecione</option>{products.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label>Quantidade da venda {index + 1}<input required value={line.quantity} inputMode="decimal" onChange={event => setLines(current => current.map(row => row.id === line.id ? { ...row, quantity: event.target.value } : row))} /></label>
        <button type="button" className="button secondary" aria-label={`Remover item ${index + 1}${line.productId ? `: ${products.find(product => product.id === line.productId)?.name ?? 'produto'}` : ''}`} onClick={() => removeLine(line.id)}>Remover item</button>
      </div>)}
      <button type="button" className="button secondary" disabled={lines.length >= 100} onClick={() => setLines(current => [...current, newSaleLine()])}>Adicionar produto à venda</button>
      <div className="form-grid"><label>Desconto da venda (R$)<input disabled={!administrator} required value={discount} onChange={event => setDiscount(event.target.value)} inputMode="decimal" /></label><label>Pagamento<select aria-label="Pagamento" value={method} onChange={event => setMethod(event.target.value)}><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label>{method === 'CASH' && <label>Valor recebido (R$)<input value={received} placeholder="Valor exato se vazio" inputMode="decimal" onChange={event => setReceived(event.target.value)} /></label>}</div>
      <label>Observações da venda<input name="notes" maxLength={500} /></label><p aria-label="Total da venda"><strong>Total: {money(total < 0n ? 0n : total)}</strong></p><p aria-label="Troco da venda">Troco: {money(change < 0n ? 0n : change)}</p>{calculationError && <p>{calculationError}</p>}<button className="button primary" disabled={!canSell}>Concluir venda</button>
    </fieldset></form><p role="status">{message}</p><LocalSalesHistory company={company} active={active} refreshToken={refreshToken + historyRevision} administrator={administrator} onSaved={onSaved} />
  </details>;
}
