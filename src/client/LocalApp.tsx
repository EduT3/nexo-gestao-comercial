import { LocalProductExcel } from './LocalProductExcel';
import { LocalDailyReport, type DailyReport } from './LocalDailyReport';
import { LocalStock, type StockHistory } from './LocalStock';
import { LocalOperators } from './LocalOperators';
import { LocalLogin } from './LocalLogin';
import { useEffect, useState, type FormEvent } from 'react';
import { LocalCategories } from './LocalCategories';
import { LocalPeople } from './LocalPeople';
import { LocalCash, type CashSession } from './LocalCash';
import { LocalReceivables, type ReceivableRow } from './LocalReceivables';
import { LocalFinance, type FinanceSummary } from './LocalFinance';
import { LocalSales, type LocalSaleRow } from './LocalSales';
import { LocalPurchases } from './LocalPurchases';

export type Status = { authenticated: boolean; needsPassword: boolean; users: { id: string; name: string }[]; configured: boolean; owner?: string; dataFolder: string; lastBackup?: string; companies: { id: string; name: string; role: 'ADMIN' | 'OPERADOR' }[] };
type Product = { id: string; name: string; internal_code: string; price_cents: bigint; cost_cents?: bigint; unit: string; active: bigint; category_id?: string | null };
declare global {
  interface Window {
    nexoLocal?: {
      createOperator(input: unknown): Promise<unknown>;
      stockHistory(company: string, input: unknown): Promise<StockHistory>;
      status(): Promise<Status>;
      setupPassword(password: string): Promise<void>;
      login(id: string, password: string): Promise<void>;
      logout(): Promise<void>;
      receivables(company: string): Promise<ReceivableRow[]>;
      createReceivable(company: string, key: string, input: unknown): Promise<unknown>;
      receiveReceivable(company: string, id: string, key: string, input: unknown): Promise<unknown>;
      reverseReceivable(company: string, id: string, key: string, input: unknown): Promise<{ canceled: boolean }>;
      finance(company: string): Promise<FinanceSummary>;
      dailyReport(company: string, input: unknown): Promise<DailyReport>;
      payPayable(company: string, id: string, key: string, input: unknown): Promise<unknown>;
      reversePayable(company: string, id: string, key: string, input: unknown): Promise<{ canceled: boolean }>;
      cancelSale(company: string, id: string, key: string, input: unknown): Promise<{ canceled: boolean }>;
      sales(company: string): Promise<LocalSaleRow[]>;
      confirmSale(company: string, key: string, input: unknown): Promise<{ totalCents: bigint; changeCents: bigint }>;
      cash(company: string): Promise<CashSession[]>;
      openCash(company: string, key: string, input: unknown): Promise<unknown>;
      moveCash(company: string, key: string, input: unknown): Promise<unknown>;
      closeCash(company: string, id: string, input: unknown): Promise<unknown>;
      stock(company: string): Promise<{ id: string; name: string; unit: string; balance_milli: bigint }[]>;
      purchases(company: string): Promise<{ id: string; supplier_name: string; total_cents: bigint; due_date: string | null }[]>;
      receivePurchase(company: string, key: string, input: unknown): Promise<unknown>;
      backup(): Promise<{ canceled: boolean; createdAt?: string }>;
      restore(): Promise<{ canceled: boolean }>;
      configure(name: string): Promise<unknown>;
      exportExcel(company:string):Promise<{canceled:boolean}>;
      productImportTemplate(company:string):Promise<{canceled:boolean}>;
      productImportPreview(company:string):Promise<{canceled:true}|({canceled:false;token:string;rows:{line:number;status:'READY'|'DUPLICATE'|'ERROR';message:string;product:{name:string;internalCode:string}|null}[];ready:number;duplicates:number;errors:number})>;
      productImportConfirm(token:string):Promise<{imported:number;skipped:number}>;
      products(company: string): Promise<Product[]>;
      categories(company: string): Promise<{ id: string; name: string; description: string; active: bigint }[]>;
      createCategory(company: string, input: unknown): Promise<unknown>;
      people(company: string, kind: 'customer' | 'supplier'): Promise<{ id: string; name: string; taxId?: string | null; phone?: string | null; active: boolean }[]>;
      createPerson(company: string, kind: 'customer' | 'supplier', input: unknown): Promise<unknown>;
      createProduct(company: string, input: unknown): Promise<unknown>;
      updateProduct(company: string, id: string, input: unknown): Promise<unknown>;
    };
  }
}
function cents(value: string) {
  if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe um valor positivo com até duas casas decimais.');
  const [whole = '0', fraction = ''] = value.replace(',', '.').split('.');
  return Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export function LocalApp() {
  const bridge = window.nexoLocal!;
  const [status, setStatus] = useState<Status>();
  const [company, setCompany] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product>();
  const [commercialRevision, setCommercialRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string; active: bigint }[]>([]);
  const [categoryRevision, setCategoryRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setCategories([]);
    if (company) void bridge.categories(company).then(rows => { if (active) setCategories(rows); })
      .catch(error => { if (active) setMessage(String(error)); });
    return () => { active = false; };
  }, [company, revision, categoryRevision]);
  async function changeActive(product: Product) {
    setBusy(true); setMessage('');
    try {
      await bridge.updateProduct(company, product.id, { active: product.active !== 1n });
      setProducts(await bridge.products(company));
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  async function backup() {
    setBusy(true); setMessage('');
    try {
      const result = await bridge.backup();
      if (!result.canceled) { await refresh(); setMessage('Cópia de segurança criada. Guarde uma cópia em outro dispositivo.'); }
    } catch (error) { setMessage(`Não foi possível criar o backup. Escolha um nome de arquivo novo. ${String(error)}`); }
    finally { setBusy(false); }
  }
  async function restore() {
    setBusy(true); setMessage('');
    try {
      const result = await bridge.restore();
      if (!result.canceled) {
        await refresh();
        setEditing(undefined); setRevision(current => current + 1);
        setProducts([]);
        setMessage('Dados restaurados. A cópia do estado anterior foi guardada na pasta de dados.');
      }
    } catch (error) { setMessage(`Não foi possível restaurar os dados. ${String(error)}`); }
    finally { setBusy(false); }
  }
  async function refresh() {
    const next = await bridge.status();
    setStatus(next);
    if (!next.authenticated) { setProducts([]); setCategories([]); setEditing(undefined); setSearch(''); setRevision(value => value + 1); }
    setCompany(current => next.companies.some(item => item.id === current) ? current : next.companies[0]?.id ?? '');
  }
  useEffect(() => { void refresh().catch(error => setMessage(String(error))); }, []);
  useEffect(() => {
    let active = true;
    setProducts([]);
    setEditing(undefined);
    if (company) void bridge.products(company).then(rows => { if (active) setProducts(rows); }).catch(error => { if (active) setMessage(String(error)); });
    return () => { active = false; };
  }, [company]);
  async function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try { await bridge.configure(String(form.get('owner') ?? '')); await refresh(); }
    catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget;
    const form = new FormData(element); setBusy(true); setMessage('');
    try {
      const fields = { name: form.get('name'), internalCode: form.get('code'), unit: form.get('unit'), categoryId: form.get('category') || null,
        costCents: cents(String(form.get('cost'))), priceCents: cents(String(form.get('price'))) };
      if (editing) await bridge.updateProduct(company, editing.id, fields);
      else await bridge.createProduct(company, { ...fields, barcode: null, supplierId: null, stockMin: '0', active: true });
      setEditing(undefined);
      setProducts(await bridge.products(company)); element.reset(); setMessage('Produto salvo no computador.');
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  const administrator = status?.companies.find(row => row.id === company)?.role === 'ADMIN';
  if (!status) return <main className="initial-loading"><h1>NEXO</h1><p>{message || 'Abrindo seus dados…'}</p></main>;
  if (!status.configured) return <main className="login-panel"><div className="login-box"><h1>NEXO</h1><h2>Primeiro acesso</h2><p className="muted">Informe o responsável pelo uso deste computador. As duas empresas serão preparadas com cadastros separados.</p><form className="form-stack" onSubmit={configure}><label>Nome do responsável<input name="owner" required minLength={2} maxLength={100} autoFocus /></label><button className="button primary" disabled={busy}>Começar</button></form><p role="status">{message}</p></div></main>;
  if (!status.authenticated) return <LocalLogin status={status} onReady={refresh} />;
  return <div className="app-layout local-app"><aside className="sidebar"><h1>NEXO</h1><p>Gestão Comercial</p><nav aria-label="Atalhos dos módulos"><a className="nav-link" href="#resumo">Resumo</a><a className="nav-link" href="#vendas">Vendas</a><a className="nav-link" href="#caixa">Caixa</a><a className="nav-link" href="#estoque">Estoque</a>{administrator && <><a className="nav-link" href="#compras">Compras</a><a className="nav-link" href="#financeiro">Financeiro</a><a className="nav-link" href="#cadastros">Cadastros</a><a className="nav-link" href="#produtos">Produtos</a><a className="nav-link" href="#excel">Excel</a><a className="nav-link" href="#dados">Dados e backup</a></>}</nav><p className="local-edition">Aplicativo local · V1</p></aside><div><header className="topbar"><label>Empresa em uso<select value={company} disabled={busy} onChange={event => { setCompany(event.target.value); setMessage(''); }}>{status.companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><span>{status.owner}</span><button className="button secondary" disabled={busy} onClick={() => { setBusy(true); void bridge.logout().then(refresh).catch(error => setMessage(String(error))).finally(() => setBusy(false)); }}>Sair</button></header><main className="main-content"><div className="local-page-heading"><div><p className="eyebrow">OPERAÇÃO LOCAL</p><h1>Central de trabalho</h1><p className="muted">Escolha um módulo na barra lateral. Os dados são salvos automaticamente neste computador.</p></div><span className="badge success">Offline</span></div>{administrator && <><div id="resumo" className="local-anchor"><LocalDailyReport company={company} refreshToken={commercialRevision} /></div><div id="contas-receber" className="local-anchor"><LocalReceivables key={`receivables-${company}-${revision}`} company={company} onSaved={() => setCommercialRevision(current => current + 1)} /></div><div id="financeiro" className="local-anchor"><LocalFinance key={`finance-${company}-${revision}`} company={company} refreshToken={commercialRevision} onSaved={() => setCommercialRevision(current => current + 1)} /></div></>}<div id="estoque" className="local-anchor"><LocalStock key={`stock-${company}-${revision}`} company={company} refreshToken={commercialRevision} /></div><div id="vendas" className="local-anchor"><LocalSales administrator={administrator} key={`sales-${company}-${revision}`} company={company} onSaved={() => setCommercialRevision(current => current + 1)} /></div><div id="caixa" className="local-anchor"><LocalCash administrator={administrator} refreshToken={commercialRevision} key={`cash-${company}-${revision}`} company={company} /></div>{administrator && <><div id="excel" className="local-anchor"><LocalProductExcel company={company} onImported={async()=>{setProducts(await bridge.products(company));setRevision(value=>value+1);}} /></div><div id="operadores" className="local-anchor"><LocalOperators companies={status.companies.filter(row => row.role === "ADMIN")} /></div><div id="compras" className="local-anchor"><LocalPurchases refreshToken={commercialRevision} key={`purchase-${company}-${revision}`} company={company} /></div><div id="cadastros" className="local-anchor"><LocalPeople key={`customer-${company}-${revision}`} company={company} kind="customer" disabled={busy} /><LocalPeople key={`supplier-${company}-${revision}`} company={company} kind="supplier" disabled={busy} /><LocalCategories key={`${company}-${revision}`} company={company} disabled={busy} onSaved={() => setCategoryRevision(current => current + 1)} /></div><section id="produtos" className="panel local-anchor"><h2>{editing ? "Editar produto" : "Cadastrar produto"}</h2><form aria-label="Cadastro de produtos" key={editing?.id ?? "new"} className="form-stack" onSubmit={save}><fieldset disabled={busy || !company} className="form-grid"><label>Nome<input name="name" defaultValue={editing?.name} required minLength={2} maxLength={160} /></label><label>Código interno<input name="code" defaultValue={editing?.internal_code} required /></label><label>Unidade<select name="unit" defaultValue={editing?.unit ?? "UNIT"}><option value="UNIT">Unidade</option><option value="BOX">Caixa</option><option value="KG">Quilo</option><option value="LITER">Litro</option><option value="PACKAGE">Pacote</option><option value="BAG">Saco</option><option value="METER">Metro</option></select></label><label>Categoria<select aria-label="Categoria" name="category" defaultValue={editing?.category_id ?? ""}><option value="">Sem categoria</option>{categories.filter(category => category.active === 1n || category.id === editing?.category_id).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Custo (R$)<input name="cost" defaultValue={editing ? (Number(editing.cost_cents ?? 0n) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label><label>Preço de venda (R$)<input name="price" defaultValue={editing ? (Number(editing.price_cents) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label></fieldset><button className="button primary" disabled={busy || !company}>{busy ? 'Salvando…' : 'Salvar produto'}</button>{editing && <button type="button" className="button secondary" disabled={busy} onClick={() => setEditing(undefined)}>Voltar ao cadastro</button>}</form><p role="status" className="message">{message}</p></section></>}<section className="panel table-panel"><label>Buscar produto<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou código" /></label><table><thead><tr><th>Produto</th><th>Código</th><th>Preço</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{products.filter(product => `${product.name} ${product.internal_code}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map(product => <tr key={product.id}><td>{product.name}</td><td>{product.internal_code}</td><td>R$ {(Number(product.price_cents) / 100).toFixed(2).replace('.', ',')}</td><td>{product.active === 1n ? "Ativo" : "Inativo"}</td><td>{administrator && <><button className="text-button" disabled={busy} onClick={() => { setEditing(product); setMessage(""); }}>Editar</button> <button className="text-button" disabled={busy} onClick={() => void changeActive(product)}>{product.active === 1n ? "Inativar" : "Reativar"}</button></>}</td></tr>)}</tbody></table>{!products.length && <p>Nenhum produto cadastrado nesta empresa.</p>}</section><details id="dados" className="panel local-anchor"><summary>Onde meus dados ficam?</summary><p>{status.dataFolder}</p><p>Último backup: {status.lastBackup ? new Date(status.lastBackup).toLocaleString("pt-BR") : "Ainda não realizado"}</p>{administrator && <><button className="button secondary" disabled={busy} onClick={() => void backup()}>Gerar backup</button><button className="button secondary" disabled={busy} onClick={() => void restore()}>Restaurar backup</button></>}<p>Guarde uma cópia em outro dispositivo.</p></details></main></div></div>;
}
