import { useState, type FormEvent } from 'react';
import type { Company, Customer, Supplier } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Icon, Message, PageHeading, ResourceState } from '../components';

type Filter = 'true' | 'false' | 'all';
type PageMeta = { total: number; limit: number; offset: number };
type Person = Customer | Supplier;
type PersonList = PageMeta & ({ customers: Customer[] } | { suppliers: Supplier[] });
type Kind = 'customers' | 'suppliers';

function listPath(companyId: string, kind: Kind, query: string, active: Filter, offset: number) {
  return `/companies/${companyId}/${kind}?${new URLSearchParams({ q: query, active, offset: String(offset), limit: '50' })}`;
}

function nullable(data: FormData, name: string) { const value = String(data.get(name) ?? '').trim(); return value || null; }
function singular(kind: Kind) { return kind === 'customers' ? 'cliente' : 'fornecedor'; }
function plural(kind: Kind) { return kind === 'customers' ? 'clientes' : 'fornecedores'; }
function capitalized(value: string) { return `${value.charAt(0).toUpperCase()}${value.slice(1)}`; }

function Toolbar({ query, active, kind, search, filter }: { query: string; active: Filter; kind: Kind; search: (value: string) => void; filter: (value: Filter) => void }) {
  const [value, setValue] = useState(query);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); search(value.trim()); }
  return <form className="catalog-toolbar" onSubmit={submit}><label className="catalog-search">Pesquisar<input type="search" maxLength={120} placeholder={kind === 'customers' ? 'Nome, documento ou telefone' : 'Nome, documento, telefone ou e-mail'} value={value} onChange={event => setValue(event.target.value)} /></label><label className="catalog-status">Exibir<select value={active} onChange={event => filter(event.target.value as Filter)}><option value="true">Ativos</option><option value="all">Ativos e inativos</option><option value="false">Inativos</option></select></label><button className="button secondary catalog-search-button" type="submit"><Icon name="search" size={16} />Pesquisar</button></form>;
}

function Pagination({ data, page }: { data: PageMeta; page: (offset: number) => void }) {
  if (data.total <= data.limit) return null;
  const last = Math.min(data.offset + data.limit, data.total);
  return <div className="catalog-pagination"><span>{data.offset + 1}–{last} de {data.total}</span><div><button className="button secondary small" type="button" disabled={data.offset === 0} onClick={() => page(Math.max(0, data.offset - data.limit))}>Anterior</button><button className="button secondary small" type="button" disabled={last >= data.total} onClick={() => page(data.offset + data.limit)}>Próxima</button></div></div>;
}

export function CustomersPage({ company }: { company: Company }) { return <PeoplePage company={company} kind="customers" />; }
export function SuppliersPage({ company }: { company: Company }) { return <PeoplePage company={company} kind="suppliers" />; }

function PeoplePage({ company, kind }: { company: Company; kind: Kind }) {
  const [query, setQuery] = useState(''); const [active, setActive] = useState<Filter>('true'); const [offset, setOffset] = useState(0);
  const [form, setForm] = useState<Person | 'new' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const resource = useResource<PersonList>(listPath(company.id, kind, query, active, offset)); const canManage = company.permissions.includes('products.manage');
  const records: Person[] = resource.data ? ('customers' in resource.data ? resource.data.customers : resource.data.suppliers) : [];
  const label = singular(kind); const title = capitalized(plural(kind));
  function clear() { setError(''); setSuccess(''); }
  async function save(body: Record<string, unknown>) {
    setBusy(true); clear();
    try { const current = form !== 'new' ? form : null; await api(current ? `/companies/${company.id}/${kind}/${current.id}` : `/companies/${company.id}/${kind}`, { method: current ? 'PATCH' : 'POST', body }); setSuccess(`${capitalized(label)} ${current ? 'atualizado' : 'cadastrado'}.`); setForm(null); resource.reload(); }
    catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  async function toggle(item: Person, next: boolean) {
    if (item.active && !window.confirm(`Inativar o ${label} ${item.name}? O histórico será preservado.`)) return;
    setBusy(true); clear();
    try { await api(`/companies/${company.id}/${kind}/${item.id}`, { method: 'PATCH', body: { active: next } }); setSuccess(`${capitalized(label)} ${next ? 'reativado' : 'inativado'}.`); resource.reload(); }
    catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  return <>
    <PageHeading eyebrow="CADASTROS" title={title} description={kind === 'customers' ? `Cadastre as pessoas atendidas pela ${company.name} para associá-las às vendas.` : `Organize os parceiros de compra de ${company.name} para preparar o recebimento.`} action={canManage ? <button className="button primary" type="button" disabled={busy} onClick={() => { clear(); setForm(form === 'new' ? null : 'new'); }}><Icon name="plus" size={17} />{form === 'new' ? 'Fechar cadastro' : `Novo ${label}`}</button> : undefined} />
    <Message text={error} /><Message text={success} kind="success" />
    {form && canManage ? <section className="panel form-panel catalog-form"><div className="section-heading"><div><p className="eyebrow">CADASTRO COMERCIAL</p><h2>{form === 'new' ? `Novo ${label}` : `Editar ${form.name}`}</h2><p className="muted">Mantenha apenas os contatos necessários à operação.</p></div><button className="text-button" type="button" onClick={() => setForm(null)}>Fechar</button></div><PersonForm kind={kind} person={form === 'new' ? undefined : form} busy={busy} save={save} /></section> : null}
    <Toolbar kind={kind} query={query} active={active} search={value => { setQuery(value); setOffset(0); }} filter={value => { setActive(value); setOffset(0); }} />
    <ResourceState {...resource} />
    {resource.data ? <section className="panel table-panel catalog-card"><div className="section-heading"><div><p className="eyebrow">{kind === 'customers' ? 'BASE DE CLIENTES' : 'PARCEIROS DE COMPRA'}</p><h2>{resource.data.total} {resource.data.total === 1 ? label : plural(kind)}</h2></div></div>{records.length ? <div className="table-scroll"><table className="catalog-table"><thead><tr><th>{capitalized(label)}</th><th>Contato</th><th>Documento</th><th>Status</th>{canManage ? <th>Ações</th> : null}</tr></thead><tbody>{records.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small className="cell-detail">{item.address || 'Endereço não informado'}</small></td><td>{item.phone || item.whatsapp || <span className="muted">Sem telefone</span>}<small className="cell-detail">{'email' in item ? item.email || 'E-mail não informado' : item.notes || 'Sem observação'}</small></td><td>{item.taxId || <span className="muted">Não informado</span>}</td><td><span className={`badge ${item.active ? 'positive' : 'neutral'}`}>{item.active ? 'Ativo' : 'Inativo'}</span></td>{canManage ? <td><div className="catalog-actions"><button className="text-button" type="button" disabled={busy} onClick={() => { clear(); setForm(item); }}>Editar</button><button className="text-button" type="button" disabled={busy} onClick={() => void toggle(item, !item.active)}>{item.active ? 'Inativar' : 'Reativar'}</button></div></td> : null}</tr>)}</tbody></table></div> : <Empty title={`Nenhum ${label} encontrado`} text={query || active !== 'true' ? 'Ajuste a pesquisa ou o filtro.' : `Cadastre o primeiro ${label} para preparar a operação.`} />}<Pagination data={resource.data} page={setOffset} /></section> : null}
  </>;
}

function PersonForm({ kind, person, busy, save }: { kind: Kind; person?: Person; busy: boolean; save: (body: Record<string, unknown>) => Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { name: String(data.get('name') ?? '').trim(), taxId: nullable(data, 'taxId'), phone: nullable(data, 'phone'), whatsapp: nullable(data, 'whatsapp'), address: nullable(data, 'address'), notes: nullable(data, 'notes') };
    if (kind === 'suppliers') body.email = nullable(data, 'email');
    if (person) body.active = data.get('active') === 'on';
    void save(body);
  }
  return <form onSubmit={submit}><fieldset className="form-grid" disabled={busy}><label>Nome ou razão social<input name="name" required minLength={2} maxLength={160} defaultValue={person?.name ?? ''} autoFocus /></label><label>CPF/CNPJ <span className="field-optional">(opcional)</span><input name="taxId" maxLength={30} defaultValue={person?.taxId ?? ''} /></label><label>Telefone <span className="field-optional">(opcional)</span><input name="phone" type="tel" maxLength={40} defaultValue={person?.phone ?? ''} /></label><label>WhatsApp <span className="field-optional">(opcional)</span><input name="whatsapp" type="tel" maxLength={40} defaultValue={person?.whatsapp ?? ''} /></label>{kind === 'suppliers' ? <label>E-mail <span className="field-optional">(opcional)</span><input name="email" type="email" maxLength={254} defaultValue={(person as Supplier | undefined)?.email ?? ''} /></label> : null}<label className={kind === 'customers' ? 'span-2' : ''}>Endereço <span className="field-optional">(opcional)</span><input name="address" maxLength={500} defaultValue={person?.address ?? ''} /></label><label className="span-2">Observação <span className="field-optional">(opcional)</span><textarea name="notes" rows={3} maxLength={1000} defaultValue={person?.notes ?? ''} /></label>{person ? <label className="checkbox-label"><input name="active" type="checkbox" defaultChecked={person.active} /><span>{capitalized(singular(kind))} ativo<small>Desmarque para preservar o histórico.</small></span></label> : null}</fieldset><div className="form-actions"><span className="muted">Os dados pertencem somente a esta empresa.</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : person ? `Salvar ${singular(kind)}` : `Cadastrar ${singular(kind)}`}</button></div></form>;
}
