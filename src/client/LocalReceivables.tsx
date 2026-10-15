import { useLocalQuery } from './useLocalQuery';
import { useState, type FormEvent } from 'react';
export type ReceivableRow = { id: string; description: string; customer_name: string | null; amount_cents: bigint; due_date: string; receipt_id: string | null; status: 'OPEN' | 'RECEIVED' };
function money(value: bigint) { return `R$ ${value / 100n},${(value % 100n).toString().padStart(2, '0')}`; }
function cents(value: string) { if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe valor com até duas casas decimais.'); const [whole, fraction = ''] = value.replace(',', '.').split('.'); return Number(BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'))); }
export function LocalReceivables({ company, active = true, onSaved, refreshToken = 0 }: { company: string; active?: boolean; onSaved(): void; refreshToken?: number }) {
 const bridge = window.nexoLocal!; const [rows, setRows] = useState<ReceivableRow[]>([]); const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
 const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [createKey, setCreateKey] = useState(() => crypto.randomUUID());
 const [operation, setOperation] = useState<{ id: string; kind: 'receive' | 'reverse'; key: string }>();
 const requests = useLocalQuery(company, active, refreshToken,
  () => Promise.all([bridge.receivables(company), bridge.people(company, 'customer')]),
  ([accounts, people]) => { setRows(accounts); setCustomers(people.filter(row => row.active)); },
  error => setMessage(String(error)));
 const { refresh } = requests;
 async function save(event: FormEvent<HTMLFormElement>, create: boolean) {
  event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
  try {
   if (create) { await bridge.createReceivable(company, createKey, { customerId: form.get('customer') || null, description: form.get('description'), category: 'Recebimentos', amountCents: cents(String(form.get('amount'))), dueDate: form.get('dueDate'), notes: '' }); task.finish(); if (!task.isCurrent()) return; setCreateKey(crypto.randomUUID()); element.reset(); }
   else if (operation) { if (operation.kind === 'receive') await bridge.receiveReceivable(company, operation.id, operation.key, { method: form.get('method'), notes: '' }); else { const result = await bridge.reverseReceivable(company, operation.id, operation.key, { reason: form.get('reason') }); if (result.canceled) return; } task.finish(); if (!task.isCurrent()) return; setOperation(undefined); }
   setMessage('Conta atualizada no computador.'); onSaved(); await refresh();
  } catch (error) { if (task.isCurrent()) setMessage(String(error)); } finally { if (task.finish()) setBusy(false); }
 }
 return <details className="panel"><summary>Contas a receber</summary>
  <form aria-label="Nova conta a receber" onSubmit={event => void save(event, true)}><fieldset className="form-grid" disabled={busy}><label>Cliente da conta<select aria-label="Cliente da conta" name="customer"><option value="">Sem cliente vinculado</option>{customers.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Descrição da conta<input name="description" required maxLength={300} /></label><label>Valor a receber (R$)<input name="amount" required inputMode="decimal" /></label><label>Vencimento a receber<input name="dueDate" type="date" required /></label><button className="button primary">Salvar conta a receber</button></fieldset></form>
  <table aria-label="Contas a receber"><thead><tr><th>Descrição</th><th>Cliente</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.description}</td><td>{row.customer_name || '—'}</td><td>{row.due_date}</td><td>{money(row.amount_cents)}</td><td>{row.status === 'RECEIVED' ? 'Recebida' : 'Em aberto'}</td><td><button disabled={busy} onClick={() => setOperation({ id: row.status === 'RECEIVED' ? row.receipt_id! : row.id, kind: row.status === 'RECEIVED' ? 'reverse' : 'receive', key: crypto.randomUUID() })}>{row.status === 'RECEIVED' ? 'Estornar recebimento' : 'Receber conta'}</button></td></tr>)}</tbody></table>
  {operation && <form key={operation.key} aria-label="Baixa de recebível" onSubmit={event => void save(event, false)}><fieldset className="form-grid" disabled={busy}>{operation.kind === 'receive' ? <label>Forma de recebimento<select aria-label="Forma de recebimento" name="method"><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label> : <label>Motivo do estorno do recebimento<input name="reason" required minLength={2} maxLength={1000} /></label>}<button className="button primary">{operation.kind === 'receive' ? 'Confirmar recebimento' : 'Confirmar estorno do recebimento'}</button><button type="button" onClick={() => setOperation(undefined)}>Voltar às contas</button></fieldset></form>}
  <p role="status">{message}</p>
 </details>;
}