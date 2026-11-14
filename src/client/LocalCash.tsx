import {LocalOperationHistory} from './LocalOperationHistory';
import { errorMessage } from './local-format';
import { useLocalQuery } from './useLocalQuery';
import { useState, type FormEvent } from 'react';
export type CashSession = { id: string; can_operate: boolean; actor_name: string; closed: bigint; balance_cents: bigint; movements: { id: string; reason: string; amount_cents: bigint }[]; closure: { expected_cents: bigint; counted_cents: bigint } | null };
function money(value: bigint) { const sign = value < 0n ? '-' : ''; const absolute = value < 0n ? -value : value; return `${sign}R$ ${absolute / 100n},${(absolute % 100n).toString().padStart(2, '0')}`; }
function cents(value: FormDataEntryValue | null) {
  const text = String(value); if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(text)) throw new Error('Informe um valor com até duas casas decimais.');
  const [whole, fraction = ''] = text.replace(',', '.').split('.'); return Number(BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export function LocalCash({ company, active = true, refreshToken = 0, administrator = true, onSaved }: { company: string; active?: boolean; refreshToken?: number; administrator?: boolean; onSaved?(): void }) {
  const bridge = window.nexoLocal!; const [current, setCurrent] = useState<CashSession|null>(),[activeError,setActiveError]=useState(''),[historyRevision,setHistoryRevision]=useState(0);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [openKey, setOpenKey] = useState(() => crypto.randomUUID()); const [moveKey, setMoveKey] = useState(() => crypto.randomUUID());
  const requests = useLocalQuery(company, active, refreshToken, async () => {setCurrent(undefined);setActiveError('');return bridge.activeCash(company);}, setCurrent, error => {setCurrent(undefined);setActiveError(errorMessage(error));});
  const { refresh } = requests;
  async function submit(event: FormEvent<HTMLFormElement>, action: 'open' | 'move' | 'close') {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); const task = requests.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      if (action === 'open') { await bridge.openCash(company, openKey, { openingCents: cents(form.get('amount')) }); if (task.isCurrent()) setOpenKey(crypto.randomUUID()); }
      if (action === 'move' && current) { await bridge.moveCash(company, moveKey, { sessionId: current.id, kind: form.get('kind'), amountCents: cents(form.get('amount')), notes: form.get('notes') }); if (task.isCurrent()) setMoveKey(crypto.randomUUID()); }
      if (action === 'close' && current) await bridge.closeCash(company, current.id, { countedCents: cents(form.get('amount')), notes: form.get('notes') });
      task.finish(); if (!task.isCurrent()) return;
      element.reset(); setHistoryRevision(value=>value+1);setMessage({open:'Caixa aberto. Você já pode registrar vendas.',move:'Movimento registrado no caixa.',close:'Caixa fechado. Confira a diferença no histórico.'}[action]); onSaved?.(); await refresh();
    } catch (error) { if (task.isCurrent()) setMessage(errorMessage(error)); } finally { if (task.finish()) setBusy(false); }
  }
  return <section className="panel" aria-label="Operação do caixa">
    <h2>{current===undefined?'Consultando caixa…':current ? 'Caixa aberto' : 'Caixa fechado'}</h2>{activeError&&<p role="alert">{activeError} <button type="button" className="text-button" onClick={()=>void refresh()}>Tentar novamente</button></p>}{current && <p aria-label="Saldo do caixa"><strong>Saldo: {money(current.balance_cents)}</strong></p>}
    {current===null && <form aria-label="Abertura de caixa" onSubmit={event => void submit(event, 'open')}><label>Valor inicial (R$)<input name="amount" required defaultValue="0,00" inputMode="decimal" /></label><button className="button primary" disabled={busy}>Abrir caixa</button></form>}
    {current && <p>Responsável pelo caixa: {current.actor_name}</p>}
    {current && !current.can_operate && <p role="status">Este caixa pertence a {current.actor_name}. Somente esse operador pode movimentar ou encerrar o atendimento.</p>}
    {current?.can_operate && <>{administrator && <details><summary>Adicionar ou retirar dinheiro</summary><form aria-label="Movimentação de caixa" onSubmit={event => void submit(event, 'move')} className="form-grid"><label>Tipo de movimento<select aria-label="Tipo de movimento" name="kind"><option value="SUPPLY">Suprimento</option><option value="WITHDRAWAL">Sangria</option></select></label><label>Valor do movimento (R$)<input name="amount" required inputMode="decimal" /></label><label>Motivo do movimento<input name="notes" required minLength={2} maxLength={1000} /></label><button className="button primary" disabled={busy}>Registrar movimento</button></form></details>}
    <details><summary>Encerrar atendimento e fechar caixa</summary><form aria-label="Fechamento de caixa" onSubmit={event => void submit(event, 'close')} className="form-grid"><label>Dinheiro contado (R$)<input name="amount" required inputMode="decimal" /></label><label>Observações do fechamento<input name="notes" maxLength={1000} /></label><button className="button secondary" disabled={busy}>Fechar caixa</button></form></details></>}
    <p role="status">{message}</p>
    <LocalOperationHistory key={company} kind="cash" company={company} active={active} refreshToken={refreshToken+historyRevision}/>
    {current && <table aria-label="Movimentos do caixa"><thead><tr><th>Movimento</th><th>Valor</th></tr></thead><tbody>{current.movements.map(row => <tr key={row.id}><td>{{ PAYMENT: 'Pagamento de conta', PAYMENT_REVERSAL: 'Estorno de pagamento', RECEIPT: 'Recebimento de conta', RECEIPT_REVERSAL: 'Estorno de recebimento', SUPPLY: 'Suprimento', WITHDRAWAL: 'Sangria', SALE: 'Venda', REVERSAL: 'Estorno' }[row.reason] || row.reason}</td><td>{money(row.amount_cents)}</td></tr>)}</tbody></table>}
  </section>;
}
