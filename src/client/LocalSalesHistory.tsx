import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocalQuery } from './useLocalQuery';
import type { SaleHistoryFilter, SaleHistoryPage, SaleDetails } from '../shared/sale-history';
const payments = { CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito' };
const money = (value: bigint) => 'R$ ' + (value/100n).toString() + ',' + (value%100n).toString().padStart(2,'0');
const date = (value: string) => new Date(value).toLocaleString('pt-BR');
const quantity = (value: bigint) => (value/1000n).toString() + ',' + (value%1000n).toString().padStart(3,'0');
const messageOf = (error: unknown) => String(error).replace(/^Error: Error invoking remote method '[^']+': Error: /,'').replace(/^Error: /,'');
export function LocalSalesHistory({ company, active, refreshToken, administrator, onSaved }: {
  company: string; active: boolean; refreshToken: number; administrator: boolean; onSaved(): void;
}) {
  const bridge = window.nexoLocal!;
  const [filter, setFilter] = useState<SaleHistoryFilter>({ page: 0 });
  const [filterRevision, setFilterRevision] = useState(0);
  const [history, setHistory] = useState<SaleHistoryPage>();
  const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [queryError, setQueryError] = useState('');
  const [selected, setSelected] = useState(''); const [detail, setDetail] = useState<SaleDetails>();
  const [detailLoading, setDetailLoading] = useState(false); const [cancelRequested, setCancelRequested] = useState(false);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const operationKey = useRef(crypto.randomUUID()); const detailPanel = useRef<HTMLElement>(null);
  const scope = company + ':' + JSON.stringify(filter);
  const historyQueries = useLocalQuery(scope, active, refreshToken + filterRevision,
    async () => { setLoading(true); setQueryError(''); return bridge.salesHistory(company, filter); },
    value => { setHistory(value); setLoading(false); }, error => { setHistory(undefined); setLoading(false); setQueryError(messageOf(error)); });
  const detailsQuery = useLocalQuery(scope + ':' + selected, active && !!selected, refreshToken,
    () => bridge.saleDetails(company, selected),
    value => { setDetail(value); setDetailLoading(false); }, error => { setDetailLoading(false); setMessage(messageOf(error)); });
  useEffect(() => { if (active && detail?.id) detailPanel.current?.focus(); }, [active, detail?.id]);
  function openDetail(id: string, cancel: boolean) {
    setDetail(undefined); setDetailLoading(true); setSelected(id); setCancelRequested(cancel); setReason('');
    operationKey.current = crypto.randomUUID(); setMessage('');
    if (selected === id) void detailsQuery.refresh();
  }
  function changeFilter(next: SaleHistoryFilter) { setMessage(''); setQueryError(''); setSelected(''); setDetail(undefined); setCancelRequested(false); setHistory(undefined); setLoading(true); setFilter(next); setFilterRevision(value => value + 1); }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const from = String(values.get('from') || ''), until = String(values.get('until') || '');
    if (from && until && from > until) { setMessage('A data inicial deve ser anterior ou igual à data final.'); return; }
    const after = until ? new Date(until + 'T00:00:00') : undefined; if (after) after.setDate(after.getDate() + 1);
    changeFilter({ page: 0, search: String(values.get('search') || '').trim(), status: values.get('status') as SaleHistoryFilter['status'],
      ...(from ? { from: new Date(from + 'T00:00:00').toISOString() } : {}), ...(after ? { until: after.toISOString() } : {}) });
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!detail || busy) return; const task = detailsQuery.beginMutation(); if (!task) return;
    setBusy(true); setMessage('');
    try {
      const result = await bridge.cancelSale(company, detail.id, operationKey.current, { reason });
      task.finish(); if (!task.isCurrent()) return;
      if (!result.canceled) {
        setCancelRequested(false); setReason(''); setMessage('Venda cancelada e valores estornados.');
        onSaved(); await Promise.all([historyQueries.refresh(), detailsQuery.refresh()]);
      } else setMessage('Cancelamento interrompido. A venda foi mantida.');
    } catch (error) { if (task.isCurrent()) setMessage(messageOf(error)); }
    finally { if (task.finish()) setBusy(false); }
  }
  return <section className="sales-history" aria-label="Histórico de vendas">
    <h2>Histórico de vendas</h2><p>Consulte todas as vendas desta empresa. Mais recentes primeiro.</p>
    <form aria-label="Filtrar vendas" onSubmit={search}><fieldset disabled={busy} className="form-grid">
      <label>Buscar venda<input name="search" maxLength={120} placeholder="Identificação ou cliente" /></label>
      <label>Vendas de<input name="from" type="date" /></label><label>Vendas até<input name="until" type="date" /></label>
      <label>Situação da venda<select name="status" aria-label="Situação da venda"><option value="ALL">Todas</option><option value="CONFIRMED">Confirmadas</option><option value="CANCELLED">Canceladas</option></select></label>
      <button className="button secondary">Buscar vendas</button><button type="reset" className="button secondary" onClick={() => changeFilter({ page: 0 })}>Limpar filtros</button>
    </fieldset></form>
    <div className="sales-history-table" tabIndex={0} aria-label="Tabela do histórico de vendas"><table aria-label="Vendas realizadas" aria-busy={loading}><thead><tr><th>Data e identificação</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{history?.rows.map(row => <tr key={row.id}>
      <td>{date(row.created_at)}<small className="sale-reference">{row.id}</small></td><td>{row.customer_name || 'Consumidor sem cadastro'}</td><td>{money(row.total_cents)}</td><td>{payments[row.method]}</td><td>{row.status === 'CANCELLED' ? 'Cancelada' : 'Confirmada'}</td>
      <td><button className="button secondary" disabled={busy || loading} onClick={() => openDetail(row.id,false)}>Detalhes</button>{administrator && row.status === 'CONFIRMED' && <button className="button secondary" disabled={busy || loading} onClick={() => openDetail(row.id,true)}>Cancelar venda</button>}</td></tr>)}</tbody></table></div>
    {!loading && history?.total === 0 && <p>Nenhuma venda encontrada nesta consulta.</p>}
    <nav aria-label="Páginas de vendas" className="sales-history-pager"><button className="button secondary" disabled={busy || loading || !history || history.page === 0} onClick={() => changeFilter({ ...filter, page: history!.page - 1 })}>Vendas mais recentes</button>
      <span>{history ? 'Página ' + (history.page+1) + ' de ' + Math.max(1,Math.ceil(history.total/history.pageSize)) + ' · ' + history.total + (history.total === 1 ? ' venda' : ' vendas') : 'Consultando vendas…'}</span>
      <button className="button secondary" disabled={busy || loading || !history || (history.page+1)*history.pageSize >= history.total} onClick={() => changeFilter({ ...filter, page: history!.page + 1 })}>Vendas mais antigas</button></nav>
    {selected && <section className="sale-detail" ref={detailPanel} tabIndex={-1} aria-label="Detalhes da venda"><h3>Detalhes da venda</h3>
      {detailLoading && <p role="status">Consultando detalhes…</p>}{detail && <><p><strong>{date(detail.created_at)}</strong> · {detail.customer_name || 'Consumidor sem cadastro'}</p><p className="sale-reference">Identificação: {detail.id}</p>
      <div className="sales-history-table"><table aria-label="Itens da venda"><thead><tr><th>Produto</th><th>Quantidade</th><th>Preço unitário</th><th>Total do item</th></tr></thead><tbody>{detail.items.map(item => <tr key={item.product_id}><td>{item.product_name}</td><td>{quantity(item.quantity_milli)}</td><td>{money(item.unit_price_cents)}</td><td>{money(item.total_cents)}</td></tr>)}</tbody></table></div>
      <p>Subtotal: {money(detail.subtotal_cents)} · Desconto: {money(detail.discount_cents)} · <strong>Total: {money(detail.total_cents)}</strong></p><p>{payments[detail.method]} · Recebido: {money(detail.received_cents)} · Troco: {money(detail.change_cents)}</p>
      {detail.notes && <p>Observações: {detail.notes}</p>}<p>Situação: {detail.status === 'CANCELLED' ? 'Cancelada' : 'Confirmada'}</p>{detail.cancellation_reason && <p>Motivo do cancelamento: {detail.cancellation_reason}</p>}
      {administrator && detail.status === 'CONFIRMED' && !cancelRequested && <button className="button secondary" disabled={busy} onClick={() => { setCancelRequested(true); setReason(''); }}>Cancelar esta venda</button>}
      {cancelRequested && detail.status === 'CONFIRMED' && <form aria-label="Cancelamento da venda" onSubmit={cancel}><fieldset disabled={busy} className="form-stack"><p>Confira os itens e a identificação acima antes de cancelar. O estoque será devolvido e os valores serão estornados.</p><label>Motivo do cancelamento<input required minLength={2} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></label><button className="button primary">Confirmar cancelamento</button><button className="button secondary" type="button" onClick={() => setCancelRequested(false)}>Voltar à venda</button></fieldset></form>}</>}
      <button className="button secondary" disabled={busy} onClick={() => { setSelected(''); setDetail(undefined); }}>Fechar detalhes</button></section>}
    <p role="status">{loading ? 'Consultando vendas…' : queryError || message}</p>
  </section>;
}
