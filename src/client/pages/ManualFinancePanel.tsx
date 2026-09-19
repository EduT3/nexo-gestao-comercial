import { useRef, useState, type FormEvent } from 'react';
import type { Company } from '../../shared/contracts';
import { api, errorMessage } from '../api';
import { Message } from '../components';

export function ManualFinancePanel({ company, onUpdated }: { company: Company; onUpdated: () => void }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const command = useRef<{ body: string; key: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = String(form.get('amount')).trim();
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(amount)) { setError('Informe um valor como 12,50.'); return; }
    const [whole, fraction = ''] = amount.replace(',', '.').split('.');
    const amountCents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 9_999_999_999) { setError('Informe um valor positivo até R$ 99.999.999,99.'); return; }
    const body = { kind: form.get('kind'), description: form.get('description'), category: form.get('category'), amountCents, paymentMethod: form.get('paymentMethod'), notes: form.get('notes') };
    const serialized = JSON.stringify({ companyId: company.id, ...body });
    if (command.current?.body !== serialized) command.current = { body: serialized, key: crypto.randomUUID() };
    setBusy(true); setError(''); setSuccess('');
    try {
      await api(`/companies/${company.id}/finance/entries`, { method: 'POST', headers: { 'Idempotency-Key': command.current.key }, body });
      command.current = null; setShow(false); setSuccess('Lançamento registrado. Financeiro e caixa atualizados conforme o meio utilizado.'); onUpdated();
    } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  return <section className="panel form-panel">
    <div className="section-heading"><div><p className="eyebrow">RECEITAS E DESPESAS</p><h2>Lançamento avulso</h2><p className="muted">Registre valores já pagos ou recebidos. Vendas e títulos liquidados entram automaticamente; dinheiro movimenta o caixa aberto.</p></div><button className="button primary" disabled={busy} onClick={() => setShow(value => !value)}>{show ? 'Fechar lançamento' : 'Novo lançamento'}</button></div>
    <Message text={error}/><Message text={success} kind="success"/>
    {show ? <form onSubmit={submit}><fieldset className="form-grid" disabled={busy}>
      <label>Tipo de lançamento<select name="kind" aria-label="Tipo de lançamento"><option value="EXPENSE">Despesa</option><option value="REVENUE">Receita</option></select></label>
      <label>Descrição do lançamento<input name="description" required maxLength={300} autoFocus/></label>
      <label>Categoria do lançamento<input name="category" required maxLength={100}/></label>
      <label>Valor do lançamento<input name="amount" inputMode="decimal" required/></label>
      <label>Meio do lançamento<select name="paymentMethod" aria-label="Meio do lançamento"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select></label>
      <label>Observação do lançamento<input name="notes" maxLength={500}/></label>
    </fieldset><div className="form-actions"><button className="button primary" disabled={busy}>{busy ? 'Registrando…' : 'Registrar lançamento'}</button></div></form> : null}
  </section>;
}
