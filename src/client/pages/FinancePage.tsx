import { useState } from 'react';
import type { Company, FinanceOverview, PaymentMethod } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Message, PageHeading, ResourceState, formatDate } from '../components';
import { ReceivablesPanel } from './ReceivablesPanel';
import { ManualFinancePanel } from './ManualFinancePanel';
import { FinancialEntriesPanel } from './FinancialEntriesPanel';

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'Pix' }, { value: 'CASH', label: 'Dinheiro' }, { value: 'DEBIT', label: 'Débito' }, { value: 'CREDIT', label: 'Crédito' },
];
const methodLabel = (value: PaymentMethod | null) => methods.find(item => item.value === value)?.label ?? 'Não informado';
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const dateOnly = (date: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`));

export function FinancePage({ company }: { company: Company }) {
  const resource = useResource<FinanceOverview>(`/companies/${company.id}/finance?limit=50`);
  const [methodsById, setMethodsById] = useState<Record<string, PaymentMethod>>({});
  const [busyId, setBusyId] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function pay(id: string, description: string) {
    const paymentMethod = methodsById[id] ?? 'PIX';
    if (!window.confirm(`Confirmar o pagamento de “${description}” por ${methodLabel(paymentMethod)}?`)) return;
    setBusyId(id); setError(''); setSuccess('');
    try {
      await api(`/companies/${company.id}/finance/payables/${id}/pay`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { paymentMethod, notes: '' } });
      setSuccess(`Conta paga por ${methodLabel(paymentMethod)}. A despesa e o histórico foram atualizados juntos.`); resource.reload();
    } catch (reason) { setError(errorMessage(reason)); } finally { setBusyId(''); }
  }
  const data = resource.data;
  return <>
    <PageHeading eyebrow="FINANCEIRO · CONTROLE DIÁRIO" title="Financeiro" description={`Acompanhe obrigações, receitas e despesas realizadas em ${company.name}.`} />
    <Message text={error} /><Message text={success} kind="success" /><ResourceState {...resource} />
    {data ? <>
      <section className="metric-grid finance-metrics">
        <article><span>A pagar</span><strong>{money(data.totals.payableOpenCents)}</strong><small>Contas ainda abertas</small></article>
        <article><span>A receber</span><strong>{money(data.totals.receivableOpenCents)}</strong><small>Recebimentos em aberto</small></article>
        <article><span>Receitas realizadas</span><strong>{money(data.totals.revenueRealizedCents)}</strong><small>Vendas e recebimentos confirmados</small></article>
        <article><span>Despesas realizadas</span><strong>{money(data.totals.expenseRealizedCents)}</strong><small>Pagamentos confirmados</small></article>
      </section>
      <ReceivablesPanel company={company} items={data.receivables} onUpdated={resource.reload}/>
      <ManualFinancePanel company={company} onUpdated={resource.reload}/>
      <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">CONTAS A PAGAR</p><h2>Obrigações de compras</h2><p className="muted">Pague o título pelo meio realmente utilizado. Dinheiro exige um caixa aberto com saldo.</p></div></div>
        {data.payables.length ? <div className="table-scroll"><table className="catalog-table finance-table"><thead><tr><th>Conta</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Liquidação</th></tr></thead><tbody>{data.payables.map(item => <tr key={item.id}><td><strong>{item.description}</strong><small className="cell-detail">{item.supplierName} · {item.category}</small></td><td>{dateOnly(item.dueDate)}</td><td>{item.status === 'OPEN' ? <span className="badge inventory-low">Em aberto</span> : item.status === 'PAID' ? <><span className="badge positive">Pago</span><small className="cell-detail">{item.paidAt ? formatDate(item.paidAt, company.timezone) : ''} · {methodLabel(item.paymentMethod)}</small></> : <span className="badge neutral">Cancelado</span>}</td><td className="number-cell"><strong>{money(item.amountCents)}</strong></td><td>{item.status === 'OPEN' ? <div className="inline-payment"><label><span className="sr-only">Forma de pagamento de {item.description}</span><select aria-label={`Forma de pagamento de ${item.description}`} value={methodsById[item.id] ?? 'PIX'} onChange={event => setMethodsById(current => ({ ...current, [item.id]: event.target.value as PaymentMethod }))}>{methods.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label><button className="button primary small" disabled={busyId === item.id} onClick={() => void pay(item.id, item.description)}>{busyId === item.id ? 'Pagando…' : 'Registrar pagamento'}</button></div> : <span className="muted">Liquidação registrada</span>}</td></tr>)}</tbody></table></div> : <Empty title="Nenhuma conta a pagar" text="Ao receber uma compra com vencimento, a obrigação aparecerá aqui." />}
      </section>
      <FinancialEntriesPanel company={company} entries={data.entries} onUpdated={resource.reload}/>
    </> : null}
  </>;
}
