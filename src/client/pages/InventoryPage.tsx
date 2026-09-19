import { useState, type FormEvent } from 'react';
import type { Company, InventoryItem, InventoryMovement, InventoryMovementType, ProductUnit } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Icon, Message, PageHeading, ResourceState, formatDate } from '../components';

type InventoryList = { inventory: InventoryItem[]; total: number; limit: number; offset: number };
type MovementList = { movements: InventoryMovement[]; total: number; limit: number; offset: number };
type Status = 'all' | 'normal' | 'low' | 'zero';
const unitLabels: Record<ProductUnit, string> = { UNIT: 'un.', PACKAGE: 'pacote', BOX: 'caixa', BAG: 'saco', KG: 'kg', METER: 'm', LITER: 'L' };
const typeLabels: Record<InventoryMovementType, string> = { PURCHASE: 'Compra', ENTRY_MANUAL: 'Entrada manual', SALE: 'Venda', LOSS: 'Perda', ADJUSTMENT: 'Ajuste' };

function inventoryPath(companyId: string, query: string, status: Status) {
  return `/companies/${companyId}/inventory?${new URLSearchParams({ q: query, status, limit: '100', offset: '0' })}`;
}

export function InventoryPage({ company }: { company: Company }) {
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inventory = useResource<InventoryList>(inventoryPath(company.id, query, status));
  const movements = useResource<MovementList>(`/companies/${company.id}/inventory/movements?limit=20&offset=0`);
  const canManage = company.permissions.includes('inventory.manage');
  function reload() { inventory.reload(); movements.reload(); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const form = new FormData(event.currentTarget);
    const type = String(form.get('type')) as 'ENTRY_MANUAL' | 'LOSS' | 'ADJUSTMENT';
    const direction = type === 'ENTRY_MANUAL' ? 'IN' : type === 'LOSS' ? 'OUT' : String(form.get('direction'));
    const quantity = String(form.get('quantity') ?? '').trim().replace(',', '.');
    try {
      await api(`/companies/${company.id}/inventory/movements`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: { productId: form.get('productId'), type, direction, quantity, notes: String(form.get('notes') ?? '').trim() } });
      setSuccess('Movimentação registrada. O saldo e o histórico foram atualizados juntos.'); setShowForm(false); reload();
    } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery(queryInput.trim()); }
  return <>
    <PageHeading eyebrow="OPERAÇÃO · ESTOQUE" title="Estoque" description={`Acompanhe saldos e movimentações de ${company.name}. Toda alteração deixa histórico.`} action={canManage ? <button className="button primary" type="button" onClick={() => setShowForm(value => !value)}><Icon name="plus" size={17} />{showForm ? 'Fechar movimentação' : 'Nova movimentação'}</button> : undefined} />
    <Message text={error} /><Message text={success} kind="success" />
    {showForm && canManage ? <section className="panel form-panel catalog-form"><div className="section-heading"><div><p className="eyebrow">MOVIMENTO DE ESTOQUE</p><h2>Registrar entrada, perda ou ajuste</h2><p className="muted">O saldo não pode ser editado diretamente. Esta operação será auditada.</p></div><button className="text-button" type="button" onClick={() => setShowForm(false)}>Fechar</button></div><form onSubmit={submit}><fieldset className="form-grid" disabled={busy}><label className="span-2">Produto<select name="productId" required autoFocus defaultValue=""><option value="" disabled>Selecione um produto</option>{(inventory.data?.inventory ?? []).map(item => <option value={item.productId} key={item.productId}>{item.productName} · saldo {item.quantity}</option>)}</select></label><label>Tipo<select name="type" defaultValue="ENTRY_MANUAL"><option value="ENTRY_MANUAL">Entrada manual</option><option value="LOSS">Perda</option><option value="ADJUSTMENT">Ajuste</option></select></label><label>Sentido do ajuste<select name="direction" defaultValue="IN"><option value="IN">Aumentar saldo</option><option value="OUT">Reduzir saldo</option></select><small>Usado somente quando o tipo for Ajuste.</small></label><label>Quantidade<input name="quantity" required inputMode="decimal" placeholder="0,000" /></label><label className="span-2">Observação<textarea name="notes" rows={3} maxLength={500} placeholder="Explique a origem da movimentação" /></label></fieldset><div className="form-actions"><span className="muted">Saídas acima do saldo disponível serão recusadas.</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Registrando…' : 'Registrar movimentação'}</button></div></form></section> : null}
    <form className="catalog-toolbar" onSubmit={search}><label className="catalog-search">Pesquisar<input type="search" value={queryInput} onChange={event => setQueryInput(event.target.value)} placeholder="Produto, código ou código de barras" maxLength={120} /></label><label className="catalog-status">Situação<select value={status} onChange={event => setStatus(event.target.value as Status)}><option value="all">Todos</option><option value="normal">Normal</option><option value="low">Estoque baixo</option><option value="zero">Zerado</option></select></label><button className="button secondary catalog-search-button" type="submit"><Icon name="search" size={16} />Pesquisar</button></form>
    <ResourceState {...inventory} />
    {inventory.data ? <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">POSIÇÃO ATUAL</p><h2>{inventory.data.total} {inventory.data.total === 1 ? 'produto acompanhado' : 'produtos acompanhados'}</h2></div></div>{inventory.data.inventory.length ? <div className="table-scroll"><table className="catalog-table inventory-table"><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th><th>Situação</th></tr></thead><tbody>{inventory.data.inventory.map(item => <tr key={item.productId}><td><strong>{item.productName}</strong><small className="cell-detail">{item.internalCode} · {unitLabels[item.unit]}</small></td><td className="number-cell"><strong>{item.quantity}</strong></td><td className="number-cell">{item.stockMin}</td><td><span className={`badge inventory-${item.status.toLowerCase()}`}>{item.status === 'ZERO' ? 'Zerado' : item.status === 'LOW' ? 'Estoque baixo' : 'Normal'}</span></td></tr>)}</tbody></table></div> : <Empty title="Nenhum produto nesta situação" text="Ajuste a pesquisa ou o filtro para consultar outros saldos." />}</section> : null}
    <ResourceState {...movements} />
    {movements.data ? <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">RASTREABILIDADE</p><h2>Movimentações recentes</h2></div><span className="badge neutral">{movements.data.total} registros</span></div>{movements.data.movements.length ? <div className="table-scroll"><table className="catalog-table inventory-history"><thead><tr><th>Data</th><th>Produto</th><th>Movimento</th><th>Quantidade</th><th>Saldo</th><th>Responsável</th></tr></thead><tbody>{movements.data.movements.map(item => <tr key={item.id}><td>{formatDate(item.createdAt, company.timezone)}</td><td><strong>{item.productName}</strong><small className="cell-detail">{item.internalCode}</small></td><td>{typeLabels[item.type]}<small className="cell-detail">{item.notes || 'Sem observação'}</small></td><td className={`number-cell movement-${item.direction.toLowerCase()}`}>{item.direction === 'IN' ? '+' : '−'}{item.quantity}</td><td className="number-cell">{item.balanceBefore} → <strong>{item.balanceAfter}</strong></td><td>{item.actorName}</td></tr>)}</tbody></table></div> : <Empty title="Nenhuma movimentação registrada" text="Registre a primeira entrada para iniciar o controle rastreável de estoque." />}</section> : null}
  </>;
}
