import { useLocalQuery } from './useLocalQuery';
import { useState, type FormEvent } from 'react';
export type FinanceSummary = { receivedCents: bigint; reversedReceiptCents: bigint; netReceivedCents: bigint; totalIncomeCents: bigint; financialBalanceCents: bigint; revenueCents: bigint; reversedCents: bigint; netRevenueCents: bigint; paidExpenseCents: bigint; payables: { id: string; amount_cents: bigint; due_date: string; status: 'OPEN' | 'PAID'; payment_id: string | null }[] };
function money(value: bigint) { const sign = value < 0n ? '-' : ''; const absolute = value < 0n ? -value : value; return `${sign}R$ ${absolute / 100n},${(absolute % 100n).toString().padStart(2, '0')}`; }
export function LocalFinance({ company, active = true, refreshToken, onSaved }: { company: string; active?: boolean; refreshToken: number; onSaved(): void }) {
  const bridge = window.nexoLocal!; const [summary, setSummary] = useState<FinanceSummary>(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [operation, setOperation] = useState<{ id: string; kind: 'pay' | 'reverse'; key: string }>();
  const requests = useLocalQuery(company, active, refreshToken, () => bridge.finance(company), setSummary, error => setMessage(String(error)));
  const { refresh } = requests;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!operation) return; const form = new FormData(event.currentTarget); const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      if (operation.kind === 'pay') await bridge.payPayable(company, operation.id, operation.key, { method: form.get('method'), notes: form.get('notes') });
      else { const result = await bridge.reversePayable(company, operation.id, operation.key, { reason: form.get('reason') }); if (result.canceled) return; }
      task.finish(); if (!task.isCurrent()) return;
      setOperation(undefined); setMessage('Operação financeira salva no computador.'); onSaved(); await refresh();
    } catch (error) { if (task.isCurrent()) setMessage(String(error)); } finally { if (task.finish()) setBusy(false); }
  }
  return <details className="panel"><summary>Financeiro</summary>
    {summary && <><p aria-label="Receita líquida">Vendas após cancelamentos: <strong>{money(summary.netRevenueCents)}</strong></p><p>Receitas de vendas: {money(summary.revenueCents)} · Estornos: {money(summary.reversedCents)}</p><p aria-label="Despesas pagas">Despesas pagas: {money(summary.paidExpenseCents)}</p>
    <p aria-label="Recebimentos líquidos">Contas recebidas após estornos: <strong>{money(summary.netReceivedCents)}</strong></p><p>Recebimentos: {money(summary.receivedCents)} · Estornos de recebimentos: {money(summary.reversedReceiptCents)}</p><p aria-label="Entradas financeiras">Entradas de vendas e contas recebidas: {money(summary.totalIncomeCents)}</p><p aria-label="Saldo financeiro">Entradas menos contas pagas: <strong>{money(summary.financialBalanceCents)}</strong></p><p className="muted">Totais de todo o histórico desta empresa. Incluem dinheiro, PIX e cartões; o saldo do caixa mostra apenas dinheiro. Este resumo não calcula lucro.</p>
    <h2>Contas a pagar</h2><table aria-label="Contas a pagar"><thead><tr><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{summary.payables.map(row => <tr key={row.id}><td>{row.due_date}</td><td>{money(row.amount_cents)}</td><td>{row.status === 'PAID' ? 'Paga' : 'Em aberto'}</td><td><button disabled={busy} onClick={() => setOperation({ id: row.status === 'PAID' ? row.payment_id! : row.id, kind: row.status === 'PAID' ? 'reverse' : 'pay', key: crypto.randomUUID() })}>{row.status === 'PAID' ? 'Estornar pagamento' : 'Pagar conta'}</button></td></tr>)}</tbody></table>{summary.payables.length === 0 && <p>Nenhuma conta a pagar nesta empresa.</p>}</>}
    {operation && <form key={operation.key} aria-label="Operação financeira" onSubmit={save} className="form-grid"><fieldset disabled={busy} className="form-grid">{operation.kind === 'pay' ? <><label>Forma de pagamento da conta<select aria-label="Forma de pagamento da conta" name="method"><option value="CASH">Dinheiro</option><option value="PIX">PIX</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label><label>Observações do pagamento<input name="notes" maxLength={1000} /></label></> : <label>Motivo do estorno<input name="reason" required minLength={2} maxLength={1000} /></label>}<button className="button primary">{operation.kind === 'pay' ? 'Confirmar pagamento' : 'Confirmar estorno'}</button><button type="button" onClick={() => setOperation(undefined)}>Voltar ao financeiro</button></fieldset></form>}
    <p role="status">{message}</p>
  </details>;
}