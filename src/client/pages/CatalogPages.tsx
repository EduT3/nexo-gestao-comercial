import { useState, type FormEvent, type ReactNode } from 'react';
import type { Category, Company, Product, ProductUnit, Supplier } from '../../shared/contracts';
import { productUnits } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Icon, Message, PageHeading, ResourceState } from '../components';

type Filter = 'true' | 'false' | 'all';
type PageMeta = { total: number; limit: number; offset: number };
type ProductList = PageMeta & { products: Product[] };
type CategoryList = PageMeta & { categories: Category[] };
type SupplierList = PageMeta & { suppliers: Supplier[] };

const unitLabels: Record<ProductUnit, string> = {
  UNIT: 'Unidade', PACKAGE: 'Pacote', BOX: 'Caixa', BAG: 'Saco', KG: 'Quilo', METER: 'Metro', LITER: 'Litro',
};

function path(companyId: string, resource: string, query: string, active: Filter, offset: number, limit = 50) {
  return `/companies/${companyId}/${resource}?${new URLSearchParams({ q: query, active, offset: String(offset), limit: String(limit) })}`;
}

function money(cents?: number) {
  return cents === undefined ? 'Restrito' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function moneyInput(cents?: number) {
  return cents === undefined ? '' : `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

function parseMoney(value: string): number | null {
  const normalized = value.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (!normalized) return null;
  const separator = normalized.lastIndexOf(',') >= 0 ? normalized.lastIndexOf(',') : normalized.lastIndexOf('.');
  const whole = (separator >= 0 ? normalized.slice(0, separator) : normalized).replace(/[.]/g, '');
  const decimals = separator >= 0 ? normalized.slice(separator + 1) : '';
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(decimals)) return null;
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 9_999_999_999 ? cents : null;
}

function CatalogToolbar({ query, active, placeholder, onSearch, onFilter }: { query: string; active: Filter; placeholder: string; onSearch: (value: string) => void; onFilter: (value: Filter) => void }) {
  const [value, setValue] = useState(query);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSearch(value.trim()); }
  return <form className="catalog-toolbar" onSubmit={submit}>
    <label className="catalog-search">Pesquisar<input type="search" value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} maxLength={120} /></label>
    <label className="catalog-status">Exibir<select value={active} onChange={event => onFilter(event.target.value as Filter)}><option value="true">Ativos</option><option value="all">Ativos e inativos</option><option value="false">Inativos</option></select></label>
    <button className="button secondary catalog-search-button" type="submit"><Icon name="search" size={16} />Pesquisar</button>
  </form>;
}

function CatalogCard({ children }: { children: ReactNode }) { return <section className="panel table-panel catalog-card">{children}</section>; }
function ActiveBadge({ active }: { active: boolean }) { return <span className={`badge ${active ? 'positive' : 'neutral'}`}>{active ? 'Ativo' : 'Inativo'}</span>; }
function Pagination({ data, onPage }: { data: PageMeta; onPage: (offset: number) => void }) {
  if (data.total <= data.limit) return null;
  const last = Math.min(data.offset + data.limit, data.total);
  return <div className="catalog-pagination"><span>{data.offset + 1}–{last} de {data.total}</span><div><button type="button" className="button secondary small" disabled={data.offset === 0} onClick={() => onPage(Math.max(0, data.offset - data.limit))}>Anterior</button><button type="button" className="button secondary small" disabled={last >= data.total} onClick={() => onPage(data.offset + data.limit)}>Próxima</button></div></div>;
}
function FormHeading({ title, description, close }: { title: string; description: string; close: () => void }) { return <div className="section-heading"><div><p className="eyebrow">CADASTRO COMERCIAL</p><h2>{title}</h2><p className="muted">{description}</p></div><button className="text-button" type="button" onClick={close}>Fechar</button></div>; }
function Toggle({ label, active, busy, action }: { label: string; active: boolean; busy: boolean; action: (next: boolean) => void }) {
  function run() { if (active && !window.confirm(`Inativar ${label}? O histórico será preservado.`)) return; action(!active); }
  return <button className="text-button" type="button" disabled={busy} onClick={run}>{active ? 'Inativar' : 'Reativar'}</button>;
}

export function ProductsPage({ company }: { company: Company }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<Filter>('true'); const [offset, setOffset] = useState(0);
  const [form, setForm] = useState<Product | 'new' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const resource = useResource<ProductList>(path(company.id, 'products', query, filter, offset));
  const categories = useResource<CategoryList>(path(company.id, 'categories', '', 'all', 0, 100));
  const suppliers = useResource<SupplierList>(path(company.id, 'suppliers', '', 'all', 0, 100));
  const canManage = company.permissions.includes('products.manage'); const canViewCost = company.permissions.includes('cost.read');
  const categoryNames = new Map((categories.data?.categories ?? []).map(item => [item.id, item.name]));
  function clear() { setError(''); setSuccess(''); }
  async function save(body: Record<string, unknown>) {
    setBusy(true); clear();
    try { const current = form !== 'new' ? form : null; await api(current ? `/companies/${company.id}/products/${current.id}` : `/companies/${company.id}/products`, { method: current ? 'PATCH' : 'POST', body }); setSuccess(current ? 'Produto atualizado e auditado.' : 'Produto cadastrado e disponível para a operação.'); setForm(null); resource.reload(); }
    catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  async function toggle(item: Product, active: boolean) { setBusy(true); clear(); try { await api(`/companies/${company.id}/products/${item.id}`, { method: 'PATCH', body: { active } }); setSuccess(active ? 'Produto reativado.' : 'Produto inativado. O histórico foi preservado.'); resource.reload(); } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); } }
  const empty = <Empty title="Nenhum produto encontrado" text={query || filter !== 'true' ? 'Ajuste a pesquisa ou o filtro para encontrar outros produtos.' : 'Cadastre o primeiro produto para iniciar o catálogo da empresa.'} />;
  return <>
    <PageHeading eyebrow="OPERAÇÃO · CATÁLOGO" title="Produtos" description={`Organize o catálogo de ${company.name} para vender com segurança e preparar o estoque.`} action={canManage ? <button className="button primary" type="button" disabled={busy} onClick={() => { clear(); setForm(form === 'new' ? null : 'new'); }}><Icon name="plus" size={17} />{form === 'new' ? 'Fechar cadastro' : 'Novo produto'}</button> : undefined} />
    <Message text={error} /><Message text={success} kind="success" />
    {form && canManage ? <section className="panel form-panel catalog-form"><FormHeading title={form === 'new' ? 'Novo produto' : `Editar ${form.name}`} description="Dados comerciais usados nas compras e no PDV." close={() => setForm(null)} /><ProductForm product={form === 'new' ? undefined : form} categories={categories.data?.categories ?? []} suppliers={suppliers.data?.suppliers ?? []} busy={busy} onSave={save} /></section> : null}
    <CatalogToolbar query={query} active={filter} placeholder="Nome, código ou código de barras" onSearch={value => { setQuery(value); setOffset(0); }} onFilter={value => { setFilter(value); setOffset(0); }} />
    <ResourceState {...resource} />
    {resource.data ? <CatalogCard><div className="section-heading"><div><p className="eyebrow">CATÁLOGO DA EMPRESA</p><h2>{resource.data.total} {resource.data.total === 1 ? 'produto' : 'produtos'}</h2></div><span className="badge neutral">{canViewCost ? 'Custos autorizados' : 'Custos protegidos'}</span></div>{resource.data.products.length ? <div className="table-scroll"><table className="catalog-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Unidade</th><th>Preço</th><th>Custo</th><th>Status</th>{canManage ? <th>Ações</th> : null}</tr></thead><tbody>{resource.data.products.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small className="cell-detail">Código {item.internalCode}{item.barcode ? ` · ${item.barcode}` : ''}</small></td><td>{item.categoryId ? categoryNames.get(item.categoryId) ?? 'Categoria inativa' : <span className="muted">Sem categoria</span>}</td><td>{unitLabels[item.unit]}<small className="cell-detail">Mín. {item.stockMin}</small></td><td className="number-cell"><strong>{money(item.priceCents)}</strong></td><td className="number-cell">{money(item.costCents)}</td><td><ActiveBadge active={item.active} /></td>{canManage ? <td><div className="catalog-actions"><button type="button" className="text-button" disabled={busy} onClick={() => { clear(); setForm(item); }}>Editar</button><Toggle label={`o produto ${item.name}`} active={item.active} busy={busy} action={next => void toggle(item, next)} /></div></td> : null}</tr>)}</tbody></table></div> : empty}<Pagination data={resource.data} onPage={setOffset} /></CatalogCard> : null}
    <p className="footnote">Preço e custo usam centavos inteiros. O custo não aparece para perfis sem autorização.</p>
  </>;
}

function ProductForm({ product, categories, suppliers, busy, onSave }: { product?: Product; categories: Category[]; suppliers: Supplier[]; busy: boolean; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const [validation, setValidation] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const costCents = parseMoney(String(data.get('cost') ?? '')); const priceCents = parseMoney(String(data.get('price') ?? '')); const stockMin = String(data.get('stockMin') ?? '').trim().replace(',', '.') || '0';
    if (costCents === null || priceCents === null) { setValidation('Informe custo e preço válidos em reais, como 12,50.'); return; }
    if (!/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/.test(stockMin)) { setValidation('O estoque mínimo deve ter até três casas decimais.'); return; }
    void onSave({ name: String(data.get('name') ?? '').trim(), internalCode: String(data.get('internalCode') ?? '').trim().toUpperCase(), barcode: String(data.get('barcode') ?? '').trim() || null, categoryId: String(data.get('categoryId') ?? '') || null, unit: data.get('unit'), costCents, priceCents, stockMin, supplierId: String(data.get('supplierId') ?? '') || null, active: product ? data.get('active') === 'on' : true });
  }
  return <form onSubmit={submit}><Message text={validation} /><fieldset className="form-grid" disabled={busy}><label>Nome do produto<input name="name" required minLength={2} maxLength={160} defaultValue={product?.name ?? ''} autoFocus /></label><label>Código interno<input name="internalCode" required maxLength={60} defaultValue={product?.internalCode ?? ''} /></label><label>Código de barras <span className="field-optional">(opcional)</span><input name="barcode" inputMode="numeric" maxLength={64} defaultValue={product?.barcode ?? ''} /></label><label>Unidade<select name="unit" defaultValue={product?.unit ?? 'UNIT'}>{productUnits.map(unit => <option key={unit} value={unit}>{unitLabels[unit]}</option>)}</select></label><label>Custo<input name="cost" inputMode="decimal" required defaultValue={moneyInput(product?.costCents)} placeholder="0,00" /></label><label>Preço de venda<input name="price" inputMode="decimal" required defaultValue={moneyInput(product?.priceCents)} placeholder="0,00" /></label><label>Estoque mínimo<input name="stockMin" inputMode="decimal" defaultValue={product?.stockMin ?? '0'} /></label><label>Categoria<select name="categoryId" defaultValue={product?.categoryId ?? ''}><option value="">Sem categoria</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}{!item.active ? ' (inativa)' : ''}</option>)}</select></label><label className="span-2">Fornecedor principal<select name="supplierId" defaultValue={product?.supplierId ?? ''}><option value="">Sem fornecedor</option>{suppliers.map(item => <option key={item.id} value={item.id}>{item.name}{!item.active ? ' (inativo)' : ''}</option>)}</select></label>{product ? <label className="checkbox-label"><input type="checkbox" name="active" defaultChecked={product.active} /><span>Produto ativo<small>Desmarque para inativar sem apagar o histórico.</small></span></label> : null}</fieldset><div className="form-actions"><span className="muted">A alteração fica registrada na auditoria.</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : product ? 'Salvar produto' : 'Cadastrar produto'}</button></div></form>;
}

export function CategoriesPage({ company }: { company: Company }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<Filter>('true'); const [offset, setOffset] = useState(0); const [form, setForm] = useState<Category | 'new' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const resource = useResource<CategoryList>(path(company.id, 'categories', query, filter, offset)); const canManage = company.permissions.includes('products.manage');
  function clear() { setError(''); setSuccess(''); }
  async function save(body: Record<string, unknown>) { setBusy(true); clear(); try { const current = form !== 'new' ? form : null; await api(current ? `/companies/${company.id}/categories/${current.id}` : `/companies/${company.id}/categories`, { method: current ? 'PATCH' : 'POST', body }); setSuccess(current ? 'Categoria atualizada.' : 'Categoria cadastrada.'); setForm(null); resource.reload(); } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); } }
  async function toggle(item: Category, active: boolean) { setBusy(true); clear(); try { await api(`/companies/${company.id}/categories/${item.id}`, { method: 'PATCH', body: { active } }); setSuccess(active ? 'Categoria reativada.' : 'Categoria inativada.'); resource.reload(); } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); } }
  return <><PageHeading eyebrow="OPERAÇÃO · CATÁLOGO" title="Categorias" description={`Organize os produtos de ${company.name} para a equipe encontrar cada item rapidamente.`} action={canManage ? <button className="button primary" type="button" disabled={busy} onClick={() => { clear(); setForm(form === 'new' ? null : 'new'); }}><Icon name="plus" size={17} />{form === 'new' ? 'Fechar cadastro' : 'Nova categoria'}</button> : undefined} /><Message text={error} /><Message text={success} kind="success" />{form && canManage ? <section className="panel form-panel catalog-form"><FormHeading title={form === 'new' ? 'Nova categoria' : `Editar ${form.name}`} description="Categorias simples deixam a busca e o catálogo mais claros." close={() => setForm(null)} /><CategoryForm category={form === 'new' ? undefined : form} busy={busy} onSave={save} /></section> : null}<CatalogToolbar query={query} active={filter} placeholder="Nome ou descrição" onSearch={value => { setQuery(value); setOffset(0); }} onFilter={value => { setFilter(value); setOffset(0); }} /><ResourceState {...resource} />{resource.data ? <CatalogCard><div className="section-heading"><h2>{resource.data.total} {resource.data.total === 1 ? 'categoria' : 'categorias'}</h2></div>{resource.data.categories.length ? <div className="table-scroll"><table className="catalog-table"><thead><tr><th>Categoria</th><th>Descrição</th><th>Status</th>{canManage ? <th>Ações</th> : null}</tr></thead><tbody>{resource.data.categories.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.description || <span className="muted">Sem descrição</span>}</td><td><ActiveBadge active={item.active} /></td>{canManage ? <td><div className="catalog-actions"><button className="text-button" type="button" onClick={() => { clear(); setForm(item); }}>Editar</button><Toggle label={`a categoria ${item.name}`} active={item.active} busy={busy} action={next => void toggle(item, next)} /></div></td> : null}</tr>)}</tbody></table></div> : <Empty title="Nenhuma categoria encontrada" text={query || filter !== 'true' ? 'Ajuste a pesquisa ou o filtro.' : 'Cadastre uma categoria para organizar o catálogo.'} />}<Pagination data={resource.data} onPage={setOffset} /></CatalogCard> : null}</>;
}

function CategoryForm({ category, busy, onSave }: { category?: Category; busy: boolean; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void onSave({ name: String(data.get('name') ?? '').trim(), description: String(data.get('description') ?? '').trim(), ...(category ? { active: data.get('active') === 'on' } : {}) }); }
  return <form onSubmit={submit}><fieldset className="form-grid" disabled={busy}><label>Nome<input name="name" required minLength={1} maxLength={120} defaultValue={category?.name ?? ''} autoFocus /></label><label className="span-2">Descrição <span className="field-optional">(opcional)</span><textarea name="description" rows={3} maxLength={500} defaultValue={category?.description ?? ''} /></label>{category ? <label className="checkbox-label"><input name="active" type="checkbox" defaultChecked={category.active} /><span>Categoria ativa<small>Desmarque para preservar o histórico.</small></span></label> : null}</fieldset><div className="form-actions"><span className="muted">A alteração fica registrada na auditoria.</span><button className="button primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : category ? 'Salvar categoria' : 'Cadastrar categoria'}</button></div></form>;
}
