import { Archive, ArrowCounterClockwise, PencilSimple } from '@phosphor-icons/react';
import {LocalStart} from './LocalStart';
import {stockQuantity,type StockEntrySelection} from './stock-entry-selection';
import type {BuildInfo} from '../shared/build-info';
import type {AccountPageFilter,AccountPage,PayableRow,FinanceTotals} from '../shared/financial-accounts';
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
import { LocalUpdate } from './LocalUpdate';
import { LocalOperators } from './LocalOperators';
import { LocalLogin } from './LocalLogin';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LocalCategories } from './LocalCategories';
import { LocalPeople } from './LocalPeople';
import type {HistoryFilter,CashHistoryFilter,HistoryPage,PurchaseHistoryRow,CashHistoryRow,PurchaseDetails} from '../shared/operation-history';
import { LocalCash, type CashSession } from './LocalCash';
import type { ReceivableRow } from './LocalReceivables';
import type { FinanceSummary } from './LocalFinance';
import type { LocalSaleRow } from './LocalSales';
import { LocalSalesBalcao } from './LocalSalesBalcao';
import { NexoNavigation } from './NexoNavigation';
import { NexoTopbar } from './NexoTopbar';
import { LocalPurchases } from './LocalPurchases';

export type Status = { userId?: string; authenticated: boolean; users: { id: string; name: string }[]; configured: boolean; owner?: string; dataFolder: string; lastBackup?: string; startupNotice?: string; companies: { id: string; name: string; role: 'ADMIN' | 'OPERADOR' }[] };
type Product = { id: string; name: string; internal_code: string; price_cents: bigint; cost_cents?: bigint; unit: string; active: bigint; category_id?: string | null };
declare global {
  interface Window {
    nexoLocal?: {
      tutorialPreference(company: string, expectedUserId: string): Promise<TutorialPreference>;
      saveTutorialPreference(company: string, expectedUserId: string, preference: TutorialPreference): Promise<TutorialPreference>;
      createOperator(input: unknown): Promise<unknown>;
      stockHistory(company: string, input: unknown): Promise<StockHistory>;
      status(): Promise<Status>;
      openReleases?(): Promise<void>;
      buildInfo?(): Promise<BuildInfo>;
      login(id: string): Promise<void>;
      logout(): Promise<void>;
      receivables(company: string): Promise<ReceivableRow[]>;
      createReceivable(company: string, key: string, input: unknown): Promise<unknown>;
      receiveReceivable(company: string, id: string, key: string, input: unknown): Promise<unknown>;
      reverseReceivable(company: string, id: string, key: string, input: unknown): Promise<{ canceled: boolean }>;
      payablesPage(company:string,input:AccountPageFilter):Promise<AccountPage<PayableRow>>;
      receivablesPage(company:string,input:AccountPageFilter):Promise<AccountPage<ReceivableRow>>;
      financeTotals(company:string):Promise<FinanceTotals>;
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
      purchaseDetails(company:string,id:string):Promise<PurchaseDetails>;
      purchaseHistory(company:string,input?:HistoryFilter):Promise<HistoryPage<PurchaseHistoryRow>>;
      cashHistory(company:string,input?:CashHistoryFilter):Promise<HistoryPage<CashHistoryRow>>;
      activeCash(company:string):Promise<CashSession|null>;
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
      createPerson(company: string, kind: 'customer' | 'supplier', input: unknown): Promise<{id:string}>;
      createProduct(company: string, input: unknown): Promise<{ id: string }>;
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
  const [area, setArea] = useState(() => preview ? previewLocation(window.location.hash).area : 'inicio');
  const currentArea=useRef(area);currentArea.current=area;
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
  const [returnToEntry,setReturnToEntry]=useState(false);
  const [entrySelection,setEntrySelection]=useState<StockEntrySelection>();
  const selectionRequest=useRef(0);
  const [balances,setBalances]=useState<Map<string,bigint>>(()=>new Map());
  const [catalogLoaded,setCatalogLoaded]=useState(false),[catalogFailed,setCatalogFailed]=useState(false);
  const productArea=['produtos','compras','estoque'].includes(area);
  function go(next:string){setArea(next);setNavigationRevision(value=>value+1);setMessage('');window.scrollTo(0,0);}
  function startProduct(fromEntry=false){setReturnToEntry(fromEntry);resetProductForm(true);go('produtos');}
  function addToStock(id:string,cost:string){setEntrySelection({company,productId:id,cost,request:++selectionRequest.current});go('compras');}
  useEffect(()=>{if(productForm&&area==='produtos'){const frame=requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('#produtos input[name="name"]')?.focus());return ()=>cancelAnimationFrame(frame);}},[productForm,area]);
  const [productDraft, setProductDraft] = useState(0);
  const [productCategory, setProductCategory] = useState('');
  function resetProductForm(open = false) {
    setEditing(undefined); setProductCategory(''); setProductDraft(value => value + 1); setProductForm(open);
  }
  function openArea() {
    if (area === 'vendas') return;
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
  const [onlyEmpty, setOnlyEmpty] = useState(false);
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
    setStatus({
      ...next,
      companies: next.companies.map(item => {
        if (item.id === 'adega-jg' && item.name === 'Adega JG') return { ...item, name: 'Loja principal' };
        if (item.id === 'deposito-jg' && item.name === 'Depósito JG') return { ...item, name: 'Loja secundária' };
        return item;
      }),
    });
    if (!next.authenticated) { setArea("inicio"); setMore("cadastros"); setProducts([]); setCategories([]); setEditing(undefined); setSearch(''); setRevision(value => value + 1); }
    setCompany(current => next.companies.some(item => item.id === current) ? current : next.companies[0]?.id ?? '');
  }
  useEffect(() => { void refresh().catch(error => setMessage(errorMessage(error))); }, []);
  useEffect(() => {
    setProducts([]);
    resetProductForm(); setReturnToEntry(false); setEntrySelection(undefined); setBalances(new Map()); setCatalogLoaded(false); setCatalogFailed(false);
    setSearch(''); setOnlyEmpty(false); productList.setPage(0);
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
      let createdId:string|undefined;
      if (editing) await bridge.updateProduct(company, editing.id, fields);
      else createdId=(await bridge.createProduct(company, { ...fields, barcode: null, supplierId: null, stockMin: '0', active: true })).id;
      task.finish(); if (!task.isCurrent()) return;
      element.reset(); resetProductForm(); setMessage('Produto salvo. O cadastro não altera a quantidade em estoque.'); await productQueries.refresh();
      if(task.isCurrent()&&currentArea.current==='produtos'&&createdId&&returnToEntry){setReturnToEntry(false);addToStock(createdId,String(form.get('cost')));setMessage('Produto cadastrado e selecionado na entrada. Informe a quantidade que chegou.');}
    } catch (error) { if (task.isCurrent()) setMessage(errorMessage(error)); }
    finally { if (task.finish()) setBusy(false); }
  }
  const productList = useLocalList(onlyEmpty ? products.filter(product => (balances.get(product.id) ?? 0n) <= 0n) : products, productSearchText, search);
  const productQueries = useLocalQuery(company, area === 'produtos', revision+commercialRevision+navigationRevision,
    ()=>{setCatalogLoaded(false);setCatalogFailed(false);return Promise.all([bridge.products(company),bridge.stock(company)]);},
    ([catalog,stock])=>{setProducts(catalog);setBalances(new Map(stock.map(row=>[row.id,row.balance_milli])));setCatalogLoaded(true);},
    error=>{setProducts([]);setBalances(new Map());setCatalogFailed(true);setMessage(errorMessage(error));});
  const administrator = status?.companies.find(row => row.id === company)?.role === 'ADMIN';
  const [cashOpen, setCashOpen] = useState<boolean>();
  useLocalQuery(company, Boolean(status?.authenticated) && area !== 'vendas', commercialRevision,
    async () => {
      setCashOpen(undefined);
      return bridge.cashAvailability(company);
    },
    availability => setCashOpen(availability.open),
    () => setCashOpen(undefined));

  if (!status) return <main className="initial-loading"><h1>NEXO Balcão</h1><p>{message || 'Abrindo seus dados…'}</p></main>;
  if (!status.configured) return <main className="login-panel"><div className="login-box"><h1>NEXO Balcão</h1><h2>Primeiro acesso</h2><p className="muted">Informe o responsável pelo uso deste computador.</p><form className="form-stack" onSubmit={configure}><label>Nome do responsável<input name="owner" required minLength={2} maxLength={100} autoFocus /></label><button className="button primary" disabled={busy}>Começar</button></form><p role="status">{message}</p></div></main>;
  if (!status.authenticated) return <LocalLogin status={status} onReady={refresh} />;
  return <>{preview && <aside className="local-preview-banner" aria-label="Aviso da demonstração"><strong>DEMONSTRAÇÃO · NEXO Balcão</strong><span>Dados fictícios. Explore as telas; vendas, compras e pagamentos não são gravados.</span></aside>}<div data-area={productArea?'produtos':area} className={"app-layout local-app" + (preview ? ' local-preview' : '')}><NexoNavigation area={area} productArea={productArea} administrator={administrator}
    preview={preview} navigate={go} />
  <div>
    <NexoTopbar status={status} company={company} preview={preview} busy={busy}
      excelBusy={excelBusy} cashOpen={cashOpen}
      onCompanyChange={value => { setCompany(value); setMessage(''); setCashOpen(undefined); }}
      onBackup={() => { setMore('dados'); go('mais'); }}
      onLogout={() => {
        setBusy(true);
        void bridge.logout().then(refresh).catch(error => setMessage(errorMessage(error))).finally(() => setBusy(false));
      }} />
    <main className="main-content" id="main-content" tabIndex={-1}><div className="local-page-heading"><div><p className="eyebrow">{preview ? "DEMONSTRAÇÃO WEB" : "OPERAÇÃO LOCAL"}</p><h1 tabIndex={-1}>{{inicio:'Início',vendas:'Vender',caixa:'Meu caixa',estoque:'Produtos e estoque',produtos:'Produtos e estoque',compras:'Produtos e estoque',financeiro:'Contas',mais:'Cadastros e configurações'}[area]}</h1><p className="muted">{{inicio:'Um caminho simples para cuidar da sua loja.',vendas:'Escolha os produtos e confira o pagamento antes de concluir.',caixa:'Abra o caixa para começar e feche ao terminar o atendimento.',estoque:'Consulte o saldo e acompanhe as entradas e saídas.',produtos:administrator?'Cadastre seus produtos e confira quanto há de cada um no estoque.':'Consulte produtos, preços e quantidades disponíveis.',compras:'Registre a mercadoria recebida do fornecedor.',financeiro:'Escolha pagar, receber ou consultar o resumo.',mais:'Cadastros de apoio, planilhas, equipe e cópias de segurança.'}[area]}</p></div><span className="badge success">{preview ? "Somente visual" : "Offline"}</span></div>{area!=='inicio'&&<nav className="context-shortcuts" aria-label="Atalhos para outras áreas"><span>Ir direto para</span>{productArea?<><button type="button" onClick={()=>go('vendas')}>Fazer uma venda</button>{administrator&&<button type="button" onClick={()=>{setFinanceView('pagar');go('financeiro');}}>Contas a pagar</button>}</>:area==='vendas'?<><button type="button" onClick={()=>go('produtos')}>Consultar estoque</button><button type="button" onClick={()=>go('caixa')}>Meu caixa</button></>:area==='caixa'?<><button type="button" onClick={()=>go('vendas')}>Fazer uma venda</button>{administrator&&<button type="button" onClick={()=>{setFinanceView('receber');go('financeiro');}}>Contas a receber</button>}</>:<><button type="button" onClick={()=>go('produtos')}>Produtos e estoque</button><button type="button" onClick={()=>go('vendas')}>Fazer uma venda</button></>}</nav>}{area === 'inicio' && <LocalStart multipleCompanies={status.companies.length > 1} onAccounts={()=>{setFinanceView('pagar');go('financeiro');}} canManage={administrator} onProducts={()=>go('produtos')} onSale={()=>go('vendas')} onCash={()=>go('caixa')} />}{productArea && <section className="panel products-guide" aria-label="Gerenciar produtos e estoque"><div className="section-heading"><div><h2>{area==='compras'?'O que chegou para o estoque?':area==='estoque'?'Entradas e saídas':'Seus produtos, em um só lugar'}</h2><p>{area==='compras'?'Informe os produtos recebidos, as quantidades e os custos. Fornecedor é opcional.':area==='estoque'?'Veja quando cada quantidade entrou ou saiu. Esta consulta não altera seu estoque.':administrator?'Veja o saldo na lista. Para um produto novo, cadastre primeiro; depois informe a quantidade que chegou.':'Veja os produtos e as quantidades disponíveis. Cadastros e entradas são feitos pelo responsável.'}</p></div></div><nav className="local-tabs" aria-label="Ações de produtos e estoque"><button type="button" className={`button ${area==='produtos'&&!productForm?'primary':'secondary'}`} onClick={()=>{resetProductForm();setReturnToEntry(false);go('produtos');}}>Meus produtos</button>{administrator && <><button type="button" className={`button ${productForm?'primary':'secondary'}`} disabled={busy} onClick={()=>startProduct()}>Cadastrar produto</button><button type="button" className={`button ${area==='compras'?'primary':'secondary'}`} onClick={()=>go('compras')}>Adicionar ao estoque</button></>}<button type="button" className={`button ${area==='estoque'?'primary':'secondary'}`} onClick={()=>go('estoque')}>Ver movimentações</button></nav>{message&&area!=='produtos'&&!preview&&<p role="status">{message}</p>}</section>}{preview && message && area !== "produtos" && <p role="status" className="message">{message}</p>}{preview && company && <PreviewTutorial userId="preview-visitor" companyId={company} companyName={status.companies.find(item => item.id === company)?.name ?? ""} routes={["products","purchases","inventory","cash","pos","finance"]} currentRoute={previewHash(area, more)} onNavigate={step => { if (step.route) { const next = previewLocation(step.route); setArea(next.area); setMore(next.more); setNavigationRevision(value => value + 1); } requestAnimationFrame(() => { const target = document.querySelector<HTMLElement>(step.target ?? "#main-content"); target?.focus(); target?.scrollIntoView({block:"center"}); }); }} />}{!preview && company && status.userId && <LocalTutorial multipleCompanies={status.companies.length > 1} userId={status.userId} key={`${status.userId}-${company}-${administrator}`} company={company} companyName={status.companies.find(item => item.id === company)?.name ?? ''} administrator={administrator} currentRoute={area === 'mais' ? more : area} busy={busy || excelBusy} onNavigate={step => {
      if (step.route) {
        if (['cadastros', 'excel', 'dados'].includes(step.route)) { setArea('mais'); setMore(step.route); }
        else { setArea(step.route); if (step.route === 'financeiro') setFinanceView('pagar'); }
        setNavigationRevision(value => value + 1);
      }
      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(step.target ?? '.local-page-heading h1');
        target?.focus(); target?.scrollIntoView({ block: 'center' });
      });
    }} />}{area === 'mais' && !preview && <LocalUpdate />}{area === 'mais' && <div className="local-tabs" role="group" aria-label="Opções de apoio">{[['cadastros','Clientes, fornecedores e categorias'],['excel','Planilhas Excel'],['operadores','Equipe'],['dados','Backup e dados']].map(([id,label]) => <button className={`button ${more === id ? 'primary' : 'secondary'}`} key={id} onClick={() => setMore(id!)}>{label}</button>)}</div>}{administrator && <LocalWorkspace id="financeiro" active={area === 'financeiro'}><LocalFinancialWorkspace key={"financial-"+company+"-"+revision} company={company} active={area === 'financeiro'} view={financeView} onViewChange={view => { setFinanceView(view); setNavigationRevision(value => value + 1); window.scrollTo(0,0); }} refreshToken={commercialRevision + navigationRevision} onSaved={() => setCommercialRevision(current => current + 1)} /></LocalWorkspace>}<LocalWorkspace id="estoque" active={area === 'estoque'}><LocalStock historyOnly active={area === 'estoque'} key={`stock-${company}-${revision}`} company={company} refreshToken={commercialRevision + navigationRevision} /></LocalWorkspace><LocalWorkspace id="vendas" active={area === 'vendas'}><LocalSalesBalcao onCashStatus={setCashOpen} onOpenCash={() => { setArea('caixa'); setNavigationRevision(value => value + 1); window.scrollTo(0,0); }} active={area === 'vendas'} refreshToken={commercialRevision + navigationRevision} administrator={administrator} key={`sales-${company}-${revision}`} company={company} onSaved={() => setCommercialRevision(current => current + 1)} /></LocalWorkspace><LocalWorkspace id="caixa" active={area === 'caixa'}><LocalCash onSaved={() => setCommercialRevision(value => value + 1)} active={area === 'caixa'} administrator={administrator} refreshToken={commercialRevision + navigationRevision} key={`cash-${company}-${revision}`} company={company} /></LocalWorkspace>{administrator && <><LocalWorkspace id="excel" active={area === 'mais' && more === 'excel'}><LocalProductExcel key={`excel-${company}`} company={company} onBusyChange={setExcelBusy} onImported={async()=>{if(currentCompany.current!==company)return;const rows=await bridge.products(company);if(currentCompany.current!==company)return;setProducts(rows);setRevision(value=>value+1);}} /></LocalWorkspace><LocalWorkspace id="operadores" active={area === 'mais' && more === 'operadores'}><LocalOperators companies={status.companies.filter(row => row.role === "ADMIN")} /></LocalWorkspace><LocalWorkspace id="compras" active={area === 'compras'}><LocalPurchases selection={entrySelection} onNewProduct={()=>startProduct(true)} onSaved={()=>setCommercialRevision(value=>value+1)} active={area === 'compras'} refreshToken={commercialRevision + navigationRevision} key={`purchase-${company}-${revision}`} company={company} /></LocalWorkspace><LocalWorkspace id="cadastros" active={area === 'mais' && more === 'cadastros'}><LocalPeople active={area === 'mais' && more === 'cadastros'} key={`customer-${company}-${revision}`} company={company} kind="customer" disabled={busy} /><LocalPeople active={area === 'mais' && more === 'cadastros'} key={`supplier-${company}-${revision}`} company={company} kind="supplier" disabled={busy} /><LocalCategories active={area === 'mais' && more === 'cadastros'} key={`${company}-${revision}`} company={company} disabled={busy} onSaved={() => setCategoryRevision(current => current + 1)} /></LocalWorkspace><section id="produtos" className="panel local-anchor" hidden={area !== "produtos" || !productForm}><h2>{editing ? "Editar produto" : "Cadastrar produto"}</h2><p>{returnToEntry?"Salve o cadastro para voltar à entrada com este produto selecionado.":"Aqui você guarda nome, unidade e preço. Para informar a quantidade, use Adicionar ao estoque."}</p><form aria-label="Cadastro de produtos" key={`${company}-${editing?.id ?? "new"}-${productDraft}`} className="form-stack" onSubmit={save}><fieldset disabled={busy || !company} className="form-grid"><label>Nome<input name="name" defaultValue={editing?.name} required minLength={2} maxLength={160} /></label><label>Código interno<input name="code" defaultValue={editing?.internal_code} required /></label><label>Unidade<select name="unit" defaultValue={editing?.unit ?? "UNIT"}><option value="UNIT">Unidade</option><option value="BOX">Caixa</option><option value="KG">Quilo</option><option value="LITER">Litro</option><option value="PACKAGE">Pacote</option><option value="BAG">Saco</option><option value="METER">Metro</option></select></label><label>Categoria<select aria-label="Categoria" name="category" value={productCategory} onChange={event => setProductCategory(event.target.value)}><option value="">Sem categoria</option>{categories.filter(category => category.active === 1n || category.id === editing?.category_id).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Custo (R$)<input name="cost" defaultValue={editing ? (Number(editing.cost_cents ?? 0n) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label><label>Preço de venda (R$)<input name="price" defaultValue={editing ? (Number(editing.price_cents) / 100).toFixed(2).replace(".", ",") : "0,00"} required inputMode="decimal" /></label></fieldset><button className="button primary" disabled={busy || !company}>{busy ? 'Salvando…' : 'Salvar produto'}</button><button type="button" className="button secondary" disabled={busy} onClick={() => {resetProductForm();if(returnToEntry)go('compras');setReturnToEntry(false);}}>Cancelar</button></form></section></>}<section className="panel table-panel" hidden={area !== "produtos" || productForm}>{message && <p role="status" className="message">{message}</p>}<label>Buscar produto<input value={search} onChange={event => { setSearch(event.target.value); productList.setPage(0); }} placeholder="Nome ou código" /></label><label><input type="checkbox" checked={onlyEmpty} onChange={event => { setOnlyEmpty(event.target.checked); productList.setPage(0); }} /> Somente sem estoque</label><div className="table-scroll" tabIndex={0} role="region" aria-label="Lista de produtos e estoque"><table aria-label="Produtos e quantidades em estoque"><thead><tr><th>Produto</th><th>Código</th><th>Em estoque</th><th>Preço</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{productList.rows.map(product => <tr key={product.id}><td>{product.name}</td><td>{product.internal_code}</td><td>{stockQuantity(balances.get(product.id),product.unit)}</td><td>R$ {(Number(product.price_cents) / 100).toFixed(2).replace('.', ',')}</td><td>{product.active === 1n ? "Ativo" : "Inativo"}</td><td>{administrator && <div className="nexo-row-actions"><button type="button" className="button secondary nexo-row-icon" aria-label="Editar" title="Editar produto" disabled={busy} onClick={() => { setReturnToEntry(false); setEditing(product); setProductCategory(product.category_id ?? ''); setProductForm(true); setMessage(""); }}><PencilSimple size={19} aria-hidden="true" /></button> <button type="button" className="text-button" disabled={busy||product.active!==1n} onClick={()=>addToStock(product.id,`${(product.cost_cents??0n)/100n},${((product.cost_cents??0n)%100n).toString().padStart(2,'0')}`)}>Adicionar estoque</button> <button type="button" className="button secondary nexo-row-icon" aria-label={product.active === 1n ? 'Inativar' : 'Reativar'} title={product.active === 1n ? 'Inativar produto' : 'Reativar produto'} disabled={busy} onClick={() => void changeActive(product)}>{product.active === 1n ? <Archive size={19} aria-hidden="true" /> : <ArrowCounterClockwise size={19} aria-hidden="true" />}</button></div>}</td></tr>)}</tbody></table></div>{products.length > 0 && productList.total === 0 && <p>Nenhum produto encontrado. Tente outro nome ou código.</p>}<LocalListPager list={productList} label="Páginas de produtos" />{!products.length&&catalogLoaded&&!catalogFailed&&<p>Você ainda não cadastrou nenhum produto nesta empresa. Use Cadastrar produto para começar.</p>}{!catalogLoaded&&!catalogFailed&&<p role="status">Consultando seus produtos e quantidades…</p>}{catalogFailed&&<button type="button" className="button secondary" onClick={()=>void productQueries.refresh()}>Tentar carregar produtos novamente</button>}</section><details id="dados" className="panel local-anchor" hidden={area !== "mais" || more !== "dados"}><summary>Onde meus dados ficam?</summary><p>{status.dataFolder}</p><p>Último backup: {status.lastBackup ? new Date(status.lastBackup).toLocaleString("pt-BR") : "Ainda não realizado"}</p>{administrator && <><button className="button secondary" disabled={busy || excelBusy} onClick={() => void backup()}>Gerar backup</button><button className="button secondary" disabled={busy || excelBusy} onClick={() => void restore()}>Restaurar backup</button></>}<p>Guarde uma cópia em outro dispositivo.</p>{administrator && <LocalDataHealth disabled={busy || excelBusy} />}</details></main></div></div></>;
}
