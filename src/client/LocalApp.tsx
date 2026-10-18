import { PreviewTutorial } from './PreviewTutorial';
import { previewLocation, previewHash } from './preview/location';
import { errorMessage } from './local-format';
import { LocalFinancialWorkspace, type FinancialView } from './LocalFinancialWorkspace';
import type { SaleHistoryFilter, SaleHistoryPage, SaleDetails } from '../shared/sale-history';
import { useLocalQuery } from './useLocalQuery';
import { LocalWorkspace } from './LocalWorkspace';
import { LocalDataHealth } from './LocalDataHealth';
import { LocalListPager, useLocalList } from './LocalList';
import { LocalTutorial } from './LocalTutorial';
import type { TutorialPreference } from '../shared/tutorial';
import { LocalProductExcel } from './LocalProductExcel';
import type { DailyReport } from './LocalDailyReport';
import { LocalStock, type StockHistory } from './LocalStock';
import { LocalOperators } from './LocalOperators';
import { LocalLogin } from './LocalLogin';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LocalCategories } from './LocalCategories';
import { LocalPeople } from './LocalPeople';
import { LocalCash, type CashSession } from './LocalCash';
import type { ReceivableRow } from './LocalReceivables';
import type { FinanceSummary } from './LocalFinance';
import { LocalSales, type LocalSaleRow } from './LocalSales';
import { LocalPurchases } from './LocalPurchases';

export type Status = { userId?: string; authenticated: boolean; needsPassword: boolean; users: { id: string; name: string }[]; configured: boolean; owner?: string; dataFolder: string; lastBackup?: string; startupNotice?: string; companies: { id: string; name: string; role: 'ADMIN' | 'OPERADOR' }[] };
type Product = { id: string; name: string; internal_code: string; price_cents: bigint; cost_cents?: bigint; unit: string; active: bigint; category_id?: string | null };
declare global {
  interface Window {
    nexoLocal?: {
      tutorialPreference(company: string, expectedUserId: string): Promise<TutorialPreference>;
      saveTutorialPreference(company: string, expectedUserId: string, preference: TutorialPreference): Promise<TutorialPreference>;
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
      salesHistory(company: string, input: SaleHistoryFilter): Promise<SaleHistoryPage>;
      saleDetails(company: string, id: string): Promise<SaleDetails>;
      sales(company: string): Promise<LocalSaleRow[]>;
      confirmSale(company: string, key: string, input: unknown): Promise<{ totalCents: bigint; changeCents: bigint }>;
      cashAvailability(company: string): Promise<import('../shared/cash-status').CashAvailability>;
      cash(company: string): Promise<CashSession[]>;
      openCash(company: string, key: string, input: unknown): Promise<unknown>;
      moveCash(company: string, key: string, input: unknown): Promise<unknown>;
      closeCash(company: string, id: string, input: unknown): Promise<unknown>;
      stock(company: string): Promise<{ id: string; name: string; unit: string; balance_milli: bigint }[]>;
      purchases(company: string): Promise<{ id: string; supplier_name: string; total_cents: bigint; due_date: string | null }[]>;
      receivePurchase(company: string, key: string, input: unknown): Promise<unknown>;
      checkDataHealth(): Promise<import('../local/health').LocalHealth>;
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
const productSearchText = (product: Product) => `${product.name} ${product.internal_code}`;
function cents(value: string) {
  if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value)) throw new Error('Informe um valor positivo com até duas casas decimais.');
  const [whole = '0', fraction = ''] = value.replace(',', '.').split('.');
  return Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export function LocalApp({ preview = false }: { preview?: boolean }) {
  const bridge = window.nexoLocal!;
  const [area, setArea] = useState(() => preview ? previewLocation(window.location.hash).area : 'vendas');
  const [navigationRevision, setNavigationRevision] = useState(0);
  const [financeView, setFinanceView] = useState<FinancialView>('pagar');
  const [more, setMore] = useState(() => preview ? previewLocation(window.location.hash).more : 'cadastros');
  useEffect(() => {
    if (!preview) return;
    const change = () => { const next = previewLocation(window.location.hash); setArea(next.area); setMore(next.more); };
    window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change);
  }, [preview]);
  useEffect(() => { if (preview) window.history.replaceState(null, '', '#' + previewHash(area, more)); }, [preview, area, more]);
  const [productForm, setProductForm] = useState(false);
  const [productDraft, setProductDraft] = useState(0);
  const [productCategory, setProductCategory] = useState('');
  function resetProductForm(open = false) {
    setEditing(undefined); setProductCategory(''); setProductDraft(value => value + 1); setProductForm(open);
  }
  function openArea() {
    const targets = area === 'financeiro' ? [financeView === 'pagar' ? 'contas-pagar' : financeView === 'receber' ? 'contas-receber' : 'resumo'] : area === 'mais' ? [more] : [area];
    for (const id of targets) { const detail = document.getElementById(id)?.querySelector('details') ?? document.getElementById(id); if (detail instanceof HTMLDetailsElement) detail.open = true; }
  }
  const [status, setStatus] = useState<Status>();
  const [company, setCompany] = useState('');
  const currentCompany = useRef(company); currentCompany.current = company;
  useEffect(openArea, [area, more, financeView, status?.authenticated, company]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product>();
  const [commercialRevision, setCommercialRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string; active: bigint }[]>([]);
  const [categoryRevision, setCategoryRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setCategories([]);
    if (company && productForm && area === 'produtos') void bridge.categories(company).then(rows => { if (active) setCategories(rows); })
      .catch(error => { if (active) setMessage(errorMessage(error)); });
    return () => { active = false; };
  }, [company, revision, categoryRevision, productForm, area]);
  async function changeActive(product: Product) {
    const task = productQueries.beginMutation(); if (!task) return;
    setBusy(true); setMessage('');
    try {
      await bridge.updateProduct(company, product.id, { active: product.active !== 1n });
      task.finish(); if (!task.isCurrent()) return;
      await productQueries.refresh();
    } catch (error) { if (task.isCurrent()) setMessage(errorMessage(error)); }
    finally { if (task.finish()) setBusy(false); }
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
    if (!next.authenticated) { setArea("vendas"); setMore("cadastros"); setProducts([]); setCategories([]); setEditing(undefined); setSearch(''); setRevision(value => value + 1); }
    setCompany(current => next.companies.some(item => item.id === current) ? current : next.companies[0]?.id ?? '');
  }
  useEffect(() => { void refresh().catch(error => setMessage(errorMessage(error))); }, []);
  useEffect(() => {
    setProducts([]);
    resetProductForm();
    setSearch(''); productList.setPage(0);
  }, [company]);
  async function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try { await bridge.configure(String(form.get('owner') ?? '')); await refresh(); }
    catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget;
    const form = new FormData(element); const task = productQueries.beginMutation(); if (!task) return; setBusy(true); setMessage('');
    try {
      const fields = { name: form.get('name'), internalCode: form.get('code'), unit: form.get('unit'), categoryId: form.get('category') || null,
        costCents: cents(String(form.get('cost'))), priceCents: cents(String(form.get('price'))) };
      if (editing) await bridge.updateProduct(company, editing.id, fields);
      else await bridge.createProduct(company, { ...fields, barcode: null, supplierId: null, stockMin: '0', active: true });
      task.finish(); if (!task.isCurrent()) return;
      element.reset(); resetProductForm(); setMessage('Produto salvo no computador.'); await productQueries.refresh();
    } catch (error) { if (task.isCurrent()) setMessage(errorMessage(error)); }
    finally { if (task.finish()) setBusy(false); }
  }
  const productList = useLocalList(products, productSearchText, search);
  const productQueries = useLocalQuery(company, area === 'produtos', revision, () => bridge.products(company), setProducts, error => setMessage(errorMessage(error)));
  const administrator = status?.companies.find(row => row.id === company)?.role === 'ADMIN';
  if (!status) return <main className="initial-loading"><h1>NEXO</h1><p>{message || 'Abrindo seus dados…'}</p></main>;
  if (!status.configured) return <main className="login-panel"><div className="login-box"><h1>NEXO</h1><h2>Primeiro acesso</h2><p className="muted">Informe o responsável pelo uso deste computador. As duas empresas serão preparadas com cadastros separados.</p><form className="form-stack" onSubmit={configure}><label>Nome do responsável<input name="owner" required minLength={2} maxLength={100} autoFocus /></label><button className="button primary" disabled={busy}>Começar</button></form><p role="status">{message}</p></div></main>;
  if (!status.authenticated) return <LocalLogin status={status} onReady={refresh} />;
  return <>{preview && <aside className="local-preview-banner" aria-label="Aviso da demonstração"><strong>DEMONSTRAÇÃO · NEXO para Windows</strong><span>Dados fictícios. Explore as telas; vendas, compras e pagamentos não são gravados.</span></aside>}<div className={"app-layout local-app" + (preview ? ' local-preview' : '')}><aside className="sidebar"><h1>NEXO</h1><p>Gestão Comercial</p><nav aria-label="Navegação principal">{[['vendas','Vender'],['caixa','Caixa'],['estoque','Estoque'],['produtos','Produtos'],...(administrator ? [['compras','Compras'],['financeiro','Financeiro'],['mais','Mais opções']] : [])].map(([id,label]) => <button type="button" key={id} className={`nav-link ${area === id ? 'active' : ''}`} aria-current={area === id ? 'page' : undefined} onClick={() => { setArea(id!); setNavigationRevision(value => value + 1); setMessage(''); window.scrollTo(0,0); }}>{label}</button>)}</nav><p className="local-edition">{preview ? "Prévia do aplicativo Windows" : "Aplicativo local · V1"}</p></aside><div><header className="topbar"><label>{preview ? "Empresa em operação" : "Empresa em uso"}<select id={preview ? "active-company" : undefined} data-tutorial-company value={company} disabled={busy || excelBusy} onChange={event => { setCompany(event.target.value); setMessage(''); }}>{status.companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{administrator && <button type="button" className="local-backup-indicator" disabled={busy || excelBusy} title="Abrir Backup e dados" onClick={() => { setArea('mais'); setMore('dados'); setMessage(''); window.scrollTo(0,0); }}>{preview ? "Conhecer backup" : "Backup: "}{!preview && (status.lastBackup ? `Feito em ${new Date(status.lastBackup).toLocaleString('pt-BR')}` : 'Nunca feito')}</button>}<span>{status.owner}</span>{!preview && <button className="button secondary" disabled={busy || excelBusy} onClick={() => { setBusy(true); void bridge.logout().then(refresh).catch(error => setMessage(errorMessage(error))).finally(() => setBusy(false)); }}>Sair</button>}</header><main className="main-content" id="main-content" tabIndex={-1}><div className="local-page-heading"><div><p className="eyebrow">{preview ? "DEMONSTRAÇÃO WEB" : "OPERAÇÃO LOCAL"}</p><h1 tabIndex={-1}>{{vendas:'Vender',caixa:'Caixa',estoque:'Estoque',produtos:'Produtos',compras:'Compras',financeiro:'Financeiro',mais:'Mais opções'}[area]}</h1><p className="muted">{{vendas:'Escolha os produtos e confira o pagamento antes de concluir.',caixa:'Abra o caixa para começar e feche ao terminar o atendimento.',estoque:'Consulte o saldo e acompanhe as entradas e saídas.',produtos:'Busque um produto ou abra o cadastro quando precisar.',compras:'Registre a mercadoria recebida do fornecedor.',financeiro:'Escolha pagar, receber ou consultar o resumo.',mais:'Cadastros de apoio, planilhas, equipe e cópias de segurança.'}[area]}</p></div><span className="badge success">{preview ? "Somente visual" : "Offline"}</span></div>{preview && message && area !== "produtos" && <p role="status" className="message">{message}</p>}{preview && company && <PreviewTutorial userId="preview-visitor" companyId={company} companyName={status.companies.find(item => item.id === company)?.name ?? ""} routes={["products","purchases","inventory","cash","pos","finance"]} currentRoute={previewHash(area, more)} onNavigate={step => { if (step.route) { const next = previewLocation(step.route); setArea(next.area); setMore(next.more); setNavigationRevision(value => value + 1); } requestAnimationFrame(() => { const target = document.querySelector<HTMLElement>(step.target ?? "#main-content"); target?.focus(); target?.scrollIntoView({block:"center"}); }); }} />}{!preview && company && status.userId && <LocalTutorial userId={status.userId} key={`${status.userId}-${company}-${administrator}`} company={company} companyName={status.companies.find(item => item.id === company)?.name ?? ''} administrator={administrator} currentRoute={area === 'mais' ? more : area} busy={busy || excelBusy} onNavigate={step => {
      if (step.route) {
        if (['cadastros', 'excel', 'dados'].includes(step.route)) { setArea('mais'); setMore(step.route); }
        else { setArea(step.route); if (step.route === 'financeiro') setFinanceView('pagar'); }
        setNavigationRevision(value => value + 1);
      }
      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(step.target ?? '.local-page-heading h1');
        target?.focus(); target?.scrollIntoView({ block: 'center' });
      });
    }} />}{area === 'mais' && <div className="local-tabs" role="group" aria-label="Opções de apoio">{[['cadastros','Clientes, fornecedores e categorias'],['excel','Planilhas Excel'],['operadores','Equipe'],['dados','Backup e dados']].map(([id,label]) => <button className={`button ${more === id ? 'primary' : 'secondary'}`} key={id} onClick={() => setMore(id!)}>{label}</button>)}</div>}{administrator && <LocalWorkspace id="financeiro" active={area === 'financeiro'}><LocalFinancialWorkspace key={"financial-"+company+"-"+revision} company={company} active={area === 'financeiro'} view={financeView} onViewChange={view => { setFinanceView(view); setNavigationRevision(value => value + 1); window.scrollTo(0,0); }} refreshToken={commercialRevision + navigationRevision} onSaved={() => setCommercialRevision(current => current + 1)} /></LocalWorkspace>}<LocalWorkspace id="estoque" active={area === 'estoque'}><LocalStock active={area === 'estoque'} key={`stock-${company}-${revision}`} company={company} refreshToken={commercialRevision + navigationRevision} /></LocalWorkspace><LocalWorkspace id="vendas" active={area === 'vendas'}><LocalSales onOpenCash={() => { setArea('caixa'); setNavigationRevision(value => value + 1); window.scrollTo(0,0); }} active={area === 'vendas'} refreshToken={commercialRevision + navigationRevision} administrator={administrator} key={`sales-${company}-${revision}`} company={company} onSaved={() => setCommercialRevision(current => current + 1)} /></LocalWorkspace><LocalWorkspace id="caixa" active={area === 'caixa'}><LocalCash active={area === 'caixa'} administrator={administrator} refreshToken={commercialRevision + navigationRevision} key={`cash-${company}-${revision}`} company={company} /></LocalWorkspace>{administrator && <><LocalWorkspace id="excel" active={area === 'mais' && more === 'excel'}><LocalProductExcel key={`excel-${company}`} company={company} onBusyChange={setExcelBusy} onImported={async()=>{if(currentCompany.current!==company)return;const rows=await bridge.products(company);if(currentCompany.current!==company)return;setProducts(rows);setRevision(value=>value+1);}} /></LocalWorkspace><LocalWorkspace id="operadores" active={area === 'mais' && more === 'operadores'}><LocalOperators companies={status.companies.filter(row => row.role === "ADMIN")} /></LocalWorkspace><LocalWorkspace id="compras" active={area === 'compras'}><LocalPurchases active={area === 'compras'} refreshToken={commercialRevision + navigationRevision} key={`purchase-${company}-${revision}`} company={company} /></LocalWorkspace><LocalWorkspace id="cadastros" active={area === 'mais' && more === 'cadastros'}><LocalPeople active={area === 'mais' && more === 'cadastros'} key={`customer-${company}-${revision}`} company={company} kind="customer" disabled={busy} /><LocalPeople active={area === 'mais' && more === 'cadastros'} key={`supplier-${company}-${revision}`} company={company} kind="supplier" disabled={busy} /><LocalCategories active={area === 'mais' && more === 'cadastros'} key={`${company}-${revision}`} company={company} disabled={busy} onSaved={() => setCategoryRevision(current => current + 1)} /></LocalWorkspace><section id="produtos" className="panel local-anchor" hidden={area !== "produtos" || !productForm}><h2>{editing ? "Editar produto" : "Cadastrar produto"}</h2><form aria-label="Cadastro de produtos" key={`${company}-${editing?.id ?? "new"}-${productDraft}`} className="form-stack" onSubmit={save}><fieldset disabled={busy || !company} className="form-grid"><label>Nome<input name="name" defaultValue={editing?.name} required minLength={2} maxLength={160} /></label><label>Código interno<input name="code" defaultValue={editing?.internal_code} required /></label><label>Unidade<select name="unit" defaultValue={editing?.unit ?? "UNIT"}><option value="UNIT">Unidade</option><option value="BOX">Caixa</option><option value="KG">Quilo</option><option value="LITER">Litro</option><option value="PACKAGE">Pacote</option><option value="BAG">Saco</option><option value="METER">Metro</option></select></label><label>Categoria<select aria-label="Categoria" name="category" value={productCategory} onChange={event => setProductCategory(event.target.value)}><option value="">Sem categoria</option>{categories.filter(category => category.active === 1n || category.id === editing?.category_id).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Custo (R$)<input name="cost" defaultValue={editing ? (Number(editing.cost_cents ?? 0n) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label><label>Preço de venda (R$)<input name="price" defaultValue={editing ? (Number(editing.price_cents) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label></fieldset><button className="button primary" disabled={busy || !company}>{busy ? 'Salvando…' : 'Salvar produto'}</button><button type="button" className="button secondary" disabled={busy} onClick={() => {resetProductForm();}}>Cancelar</button></form></section></>}<section className="panel table-panel" hidden={area !== "produtos"}>{message && <p role="status" className="message">{message}</p>}{administrator && <button className="button primary" onClick={() => {resetProductForm(true);}}>Novo produto</button>}<label>Buscar produto<input value={search} onChange={event => { setSearch(event.target.value); productList.setPage(0); }} placeholder="Nome ou código" /></label><table><thead><tr><th>Produto</th><th>Código</th><th>Preço</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{productList.rows.map(product => <tr key={product.id}><td>{product.name}</td><td>{product.internal_code}</td><td>R$ {(Number(product.price_cents) / 100).toFixed(2).replace('.', ',')}</td><td>{product.active === 1n ? "Ativo" : "Inativo"}</td><td>{administrator && <><button className="text-button" disabled={busy} onClick={() => { setEditing(product); setProductCategory(product.category_id ?? ''); setProductForm(true); setMessage(""); }}>Editar</button> <button className="text-button" disabled={busy} onClick={() => void changeActive(product)}>{product.active === 1n ? "Inativar" : "Reativar"}</button></>}</td></tr>)}</tbody></table>{products.length > 0 && productList.total === 0 && <p>Nenhum produto encontrado. Tente outro nome ou código.</p>}<LocalListPager list={productList} label="Páginas de produtos" />{!products.length && <p>Nenhum produto cadastrado nesta empresa.</p>}</section><details id="dados" className="panel local-anchor" hidden={area !== "mais" || more !== "dados"}><summary>Onde meus dados ficam?</summary><p>{status.dataFolder}</p><p>Último backup: {status.lastBackup ? new Date(status.lastBackup).toLocaleString("pt-BR") : "Ainda não realizado"}</p>{administrator && <><button className="button secondary" disabled={busy || excelBusy} onClick={() => void backup()}>Gerar backup</button><button className="button secondary" disabled={busy || excelBusy} onClick={() => void restore()}>Restaurar backup</button></>}<p>Guarde uma cópia em outro dispositivo.</p>{administrator && <LocalDataHealth disabled={busy || excelBusy} />}</details></main></div></div></>;
}
