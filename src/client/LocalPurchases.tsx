import { useLocalQuery } from './useLocalQuery';
import { useState, type FormEvent } from 'react';

export function LocalPurchases({ company, active = true, refreshToken = 0 }: { company: string; active?: boolean; refreshToken?: number }) {
  const bridge = window.nexoLocal!;
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [stock, setStock] = useState<Awaited<ReturnType<typeof bridge.stock>>>([]);
  const [purchases, setPurchases] = useState<Awaited<ReturnType<typeof bridge.purchases>>>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [lineCount, setLineCount] = useState(1);
  const requests = useLocalQuery(company, active, refreshToken,
    () => Promise.all([bridge.people(company, 'supplier'), bridge.products(company), bridge.stock(company), bridge.purchases(company)]),
    ([people, catalog, balances, receipts]) => { setSuppliers(people.filter(row => row.active)); setProducts(catalog.filter(row => row.active === 1n)); setStock(balances); setPurchases(receipts); },
    error => setMessage(String(error)));
  const { refresh } = requests;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      const items = Array.from({ length: lineCount }, (_, index) => {
        const cost = String(form.get(`cost-${index}`));
        if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(cost)) throw new Error('Informe um custo com até duas casas decimais.');
        const [whole, fraction = ''] = cost.replace(',', '.').split('.');
        return { productId: form.get(`product-${index}`), quantity: String(form.get(`quantity-${index}`)).replace(',', '.'), unitCostCents: Number(BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'))) };
      });
      const dueDate = String(form.get('dueDate') ?? '');
      await bridge.receivePurchase(company, key, { supplierId: form.get('supplier'), items, notes: form.get('notes'), payable: dueDate ? { dueDate } : null });
      task.finish(); if (!task.isCurrent()) return;
      setKey(crypto.randomUUID()); formElement.reset(); setLineCount(1);
      setMessage('Compra recebida e estoque atualizado.'); await refresh();
    } catch (error) { if (task.isCurrent()) setMessage(String(error)); } finally { if (task.finish()) setBusy(false); }
  }
  return <details className="panel">
    <summary>Compras e estoque</summary>
    <form aria-label="Recebimento de compra" onSubmit={save} className="form-stack">
      <fieldset disabled={busy || !company} className="form-stack">
        <label>Fornecedor<select aria-label="Fornecedor" name="supplier" required><option value="">Selecione</option>{suppliers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        {Array.from({ length: lineCount }, (_, index) => <div className="form-grid" key={index}>
          <label>Produto {index + 1}<select aria-label={`Produto ${index + 1}`} name={`product-${index}`} required><option value="">Selecione</option>{products.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label>Quantidade {index + 1}<input name={`quantity-${index}`} required inputMode="decimal" defaultValue="1" /></label>
          <label>Custo unitário {index + 1} (R$)<input name={`cost-${index}`} required inputMode="decimal" /></label>
        </div>)}
        <button type="button" className="button secondary" disabled={lineCount >= 100} onClick={() => setLineCount(count => count + 1)}>Adicionar item</button>
        {lineCount > 1 && <button type="button" className="button secondary" onClick={() => setLineCount(count => count - 1)}>Remover último item</button>}
        <label>Vencimento da conta a pagar<input name="dueDate" type="date" /></label><p>Deixe o vencimento vazio para receber sem gerar conta a pagar.</p>
        <label>Observações da compra<input name="notes" maxLength={1000} /></label>
        <button className="button primary">Receber compra</button>
      </fieldset>
    </form>
    <p role="status">{message}</p>
    <h2>Estoque atual</h2><table aria-label="Estoque atual"><thead><tr><th>Produto</th><th>Quantidade</th></tr></thead><tbody>{stock.map(row => <tr key={row.id}><td>{row.name}</td><td>{`${row.balance_milli / 1000n},${(row.balance_milli % 1000n).toString().padStart(3, '0')}`} {row.unit}</td></tr>)}</tbody></table>
    <h2>Compras recebidas</h2><table aria-label="Compras recebidas"><thead><tr><th>Fornecedor</th><th>Total</th><th>Vencimento</th></tr></thead><tbody>{purchases.map(row => <tr key={row.id}><td>{row.supplier_name}</td><td>R$ {`${row.total_cents / 100n},${(row.total_cents % 100n).toString().padStart(2, '0')}`}</td><td>{row.due_date || 'Sem conta a pagar'}</td></tr>)}</tbody></table>
  </details>;
}
