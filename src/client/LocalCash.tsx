import { useEffect, useState, type FormEvent } from 'react';
export type CashSession = { id: string; closed: bigint; balance_cents: bigint; movements: { id: string; reason: string; amount_cents: bigint }[]; closure: { expected_cents: bigint; counted_cents: bigint } | null };
function money(value: bigint) { const sign = value < 0n ? '-' : ''; const absolute = value < 0n ? -value : value; return `${sign}R$ ${absolute / 100n},${(absolute % 100n).toString().padStart(2, '0')}`; }
function cents(value: FormDataEntryValue | null) {
  const text = String(value); if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(text)) throw new Error('Informe um valor com até duas casas decimais.');
  const [whole, fraction = ''] = text.replace(',', '.').split('.'); return Number(BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export function LocalCash({ company, refreshToken = 0, administrator = true }: { company: string; refreshToken?: number; administrator?: boolean }) {
  const bridge = window.nexoLocal!; const [sessions, setSessions] = useState<CashSession[]>([]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [openKey, setOpenKey] = useState(() => crypto.randomUUID()); const [moveKey, setMoveKey] = useState(() => crypto.randomUUID());
  const current = sessions.find(row => row.closed === 0n);
  useEffect(() => { let active = true; if (company) void bridge.cash(company).then(rows => { if (active) setSessions(rows); }).catch(error => { if (active) setMessage(String(error)); }); return () => { active = false; }; }, [company, refreshToken]);
  async function submit(event: FormEvent<HTMLFormElement>, action: 'open' | 'move' | 'close') {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); setBusy(true); setMessage('');
    try {
      if (action === 'open') { await bridge.openCash(company, openKey, { openingCents: cents(form.get('amount')) }); setOpenKey(crypto.randomUUID()); }
      if (action === 'move' && current) { await bridge.moveCash(company, moveKey, { sessionId: current.id, kind: form.get('kind'), amountCents: cents(form.get('amount')), notes: form.get('notes') }); setMoveKey(crypto.randomUUID()); }
      if (action === 'close' && current) await bridge.closeCash(company, current.id, { countedCents: cents(form.get('amount')), notes: form.get('notes') });
      element.reset(); setSessions(await bridge.cash(company)); setMessage('Caixa atualizado no computador.');
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  }
  return <details className="panel"><summary>Caixa</summary>
    <h2>{current ? 'Caixa aberto' : 'Caixa fechado'}</h2>{current && <p aria-label="Saldo do caixa"><strong>Saldo: {money(current.balance_cents)}</strong></p>}
    {!current && <form aria-label="Abertura de caixa" onSubmit={event => void submit(event, 'open')}><label>Valor inicial (R$)<input name="amount" required defaultValue="0,00" inputMode="decimal" /></label><button className="button primary" disabled={busy}>Abrir caixa</button></form>}
    {current && <>{administrator && <form aria-label="Movimentação de caixa" onSubmit={event => void submit(event, 'move')} className="form-grid"><label>Tipo de movimento<select aria-label="Tipo de movimento" name="kind"><option value="SUPPLY">Suprimento</option><option value="WITHDRAWAL">Sangria</option></select></label><label>Valor do movimento (R$)<input name="amount" required inputMode="decimal" /></label><label>Motivo do movimento<input name="notes" required minLength={2} maxLength={1000} /></label><button className="button primary" disabled={busy}>Registrar movimento</button></form>}
    <form aria-label="Fechamento de caixa" onSubmit={event => void submit(event, 'close')} className="form-grid"><label>Dinheiro contado (R$)<input name="amount" required inputMode="decimal" /></label><label>Observações do fechamento<input name="notes" maxLength={1000} /></label><button className="button secondary" disabled={busy}>Fechar caixa</button></form></>}
    <p role="status">{message}</p>
    <table aria-label="Histórico de caixas"><thead><tr><th>Situação</th><th>Saldo esperado</th><th>Contado</th><th>Diferença</th></tr></thead><tbody>{sessions.map(row => <tr key={row.id}><td>{row.closed === 1n ? 'Fechado' : 'Aberto'}</td><td>{money(row.balance_cents)}</td><td>{row.closure ? money(row.closure.counted_cents) : '—'}</td><td>{row.closure ? money(row.closure.counted_cents - row.closure.expected_cents) : '—'}</td></tr>)}</tbody></table>
    {current && <table aria-label="Movimentos do caixa"><thead><tr><th>Movimento</th><th>Valor</th></tr></thead><tbody>{current.movements.map(row => <tr key={row.id}><td>{{ PAYMENT: 'Pagamento de conta', PAYMENT_REVERSAL: 'Estorno de pagamento', RECEIPT: 'Recebimento de conta', RECEIPT_REVERSAL: 'Estorno de recebimento', SUPPLY: 'Suprimento', WITHDRAWAL: 'Sangria', SALE: 'Venda', REVERSAL: 'Estorno' }[row.reason] || row.reason}</td><td>{money(row.amount_cents)}</td></tr>)}</tbody></table>}
  </details>;
}