import { useCallback, useEffect, useState } from 'react';
import type { Session } from '../shared/contracts';
import { api, errorMessage, RequestError, setCsrfToken, visualPreview } from './api';
import { Brand, Icon, Loading, Message } from './components';
import { Login } from './Login';
import { Overview, AuditPage } from './pages/ReadPages';
import { CompaniesPage } from './pages/CompaniesPage';
import { UsersPage } from './pages/UsersPage';
import { AccountPage } from './pages/AccountPage';
import { CategoriesPage, ProductsPage } from './pages/CatalogPages';
import { CustomersPage, SuppliersPage } from './pages/PeoplePages';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { CashPage } from './pages/CashPage';
import { PosPage } from './pages/PosPage';
import { FinancePage } from './pages/FinancePage';

type Page = 'overview'|'pos'|'products'|'categories'|'inventory'|'purchases'|'cash'|'finance'|'customers'|'suppliers'|'companies'|'users'|'audit'|'account';
const pages:Page[]=['overview','pos','products','categories','inventory','purchases','cash','finance','customers','suppliers','companies','users','audit','account'];
const pageLabels:Record<Page,string>={overview:'Dashboard',pos:'PDV / Vendas',products:'Produtos',categories:'Categorias',inventory:'Estoque',purchases:'Compras',cash:'Caixa',finance:'Financeiro',customers:'Clientes',suppliers:'Fornecedores',companies:'Empresas',users:'Usuários',audit:'Auditoria',account:'Minha conta'};
function readPage(): Page { const value = window.location.hash.slice(1) as Page; return pages.includes(value) ? value : 'overview'; }

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [companyId, setCompanyId] = useState(() => sessionStorage.getItem('nexo.companyPreference') ?? '');
  useEffect(() => {
    if (companyId) sessionStorage.setItem('nexo.companyPreference', companyId);
  }, [companyId]);
  const [page, setPage] = useState<Page>(readPage);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [notice, setNotice] = useState('');
  const [logoutBusy, setLogoutBusy] = useState(false);
  const acceptSession = useCallback((next: Session) => {
    setCsrfToken(next.csrfToken); setSession(next); setSessionError(''); setNotice('');
    setCompanyId(current => next.companies.some(company => company.id === current) ? current : next.companies[0]?.id ?? '');
  }, []);
  const clearSession = useCallback((message: string) => { setSession(null); setCsrfToken(''); setCompanyId(''); setNotice(message); setSessionError(''); }, []);
  const refreshSession = useCallback(async () => { acceptSession(await api<Session>('/auth/session')); }, [acceptSession]);
  useEffect(() => {
    const controller = new AbortController();
    void api<Session>('/auth/session', { signal: controller.signal })
      .then(next => { if (!controller.signal.aborted) acceptSession(next); })
      .catch(reason => { if (!controller.signal.aborted && !(reason instanceof RequestError && reason.status === 401)) setSessionError(errorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [acceptSession]);
  useEffect(() => {
    const changePage = () => setPage(readPage());
    const expired = () => clearSession('Sua sessão terminou. Entre novamente para continuar.');
    window.addEventListener('hashchange', changePage); window.addEventListener('jg:session-expired', expired);
    return () => { window.removeEventListener('hashchange', changePage); window.removeEventListener('jg:session-expired', expired); };
  }, [clearSession]);
  async function logout() {
    setLogoutBusy(true); setSessionError('');
    try { await api('/auth/logout', { method: 'POST' }); clearSession('Você saiu do sistema.'); }
    catch (reason) { setSessionError(errorMessage(reason)); }
    finally { setLogoutBusy(false); }
  }
  if (loading) return <main className="initial-loading"><Brand /><Loading /></main>;
  if (!session) return <Login onLogin={acceptSession} notice={sessionError || notice} />;
  const company = session.companies.find(item => item.id === companyId);
  const navGroups: { label: string; items: Page[] }[] = [
    { label: 'VISÃO GERAL', items: ['overview'] as Page[] },
    ...((company?.permissions.includes('products.read') || company?.permissions.includes('inventory.read')) ? [{ label: 'OPERAÇÃO', items: [...(company?.permissions.includes('sales.create') ? ['pos'] as Page[] : []), ...(company?.permissions.includes('products.read') ? ['products', 'categories'] as Page[] : []), ...(company?.permissions.includes('inventory.read') ? ['inventory'] as Page[] : []), ...(company?.permissions.includes('purchases.manage') ? ['purchases'] as Page[] : [])] }] : []),
    ...((company?.permissions.includes('cash.manage') || company?.permissions.includes('finance.read')) ? [{ label: 'FINANCEIRO', items: [...(company?.permissions.includes('cash.manage') ? ['cash'] as Page[] : []), ...(company?.permissions.includes('finance.read') ? ['finance'] as Page[] : [])] }] : []),
    ...(company?.permissions.includes('company.read') ? [{ label: 'CADASTROS', items: ['customers', 'suppliers'] as Page[] }] : []),
    { label: 'ADMINISTRAÇÃO', items: [
      ...(company?.permissions.includes('company.update') || session.user.systemAdmin ? ['companies' as const] : []),
      ...(company?.permissions.includes('users.read') ? ['users' as const] : []),
      ...(company?.permissions.includes('audit.read') ? ['audit' as const] : []),
    ] as Page[] },
  ].filter(group => group.items.length > 0);
  const navigation = navGroups.flatMap(group => group.items);
  const activePage = navigation.includes(page) || page === 'account' ? page : 'overview';
  const navigate = (next: Page) => { window.location.hash = next; setPage(next); };
  let content;
  if (activePage === 'account') content = <AccountPage session={session} onPasswordChanged={() => clearSession('Senha alterada. Entre novamente com sua nova senha.')} />;
  else if (activePage === 'companies') content = <CompaniesPage key={companyId} company={company} session={session} onUpdated={refreshSession} />;
  else if (!company) content = <section className="panel"><h1>Bem-vindo ao Nexo</h1><p>Nenhuma empresa está disponível para seu usuário.</p>{session.user.systemAdmin ? <button className="button primary" onClick={() => navigate('companies')}>Cadastrar empresa</button> : <p>Peça ao administrador que revise seus vínculos de acesso.</p>}</section>;
  else if (activePage === 'products') content = <ProductsPage key={companyId} company={company} />;
  else if (activePage === 'categories') content = <CategoriesPage key={companyId} company={company} />;
  else if (activePage === 'inventory') content = <InventoryPage key={companyId} company={company} />;
  else if (activePage === 'purchases') content = <PurchasesPage key={companyId} company={company} />;
  else if (activePage === 'pos') content = <PosPage key={companyId} company={company} />;
  else if (activePage === 'cash') content = <CashPage key={companyId} company={company} />;
  else if (activePage === 'finance') content = <FinancePage key={companyId} company={company} />;
  else if (activePage === 'customers') content = <CustomersPage key={companyId} company={company} />;
  else if (activePage === 'suppliers') content = <SuppliersPage key={companyId} company={company} />;
  else if (activePage === 'users') content = <UsersPage key={companyId} company={company} session={session} />;
  else if (activePage === 'audit') content = <AuditPage key={companyId} company={company} />;
  else content = <Overview key={companyId} company={company} onNavigate={navigate} />;
  return <div className="app-layout"><a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside className="sidebar"><Brand /><nav aria-label="Navegação principal">{navGroups.map(group => <div className="nav-group" key={group.label}><p className="nav-group-title">{group.label}</p>{group.items.map(item => <a key={item} href={`#${item}`} className={`nav-link ${activePage === item ? 'active' : ''}`} aria-current={activePage === item ? 'page' : undefined}><Icon name={item} /><span>{pageLabels[item]}</span>{activePage === item ? <span className="nav-active-dot" /> : null}</a>)}</div>)}</nav><div className="sidebar-bottom"><div className="edition"><span className="edition-dot" />Aplicativo local · V1</div><button className={`nav-link ${activePage === 'account' ? 'active' : ''}`} onClick={() => navigate('account')}><Icon name="account" />Minha conta</button><button className="nav-link logout" onClick={() => void logout()} disabled={logoutBusy}><Icon name="logout" />{logoutBusy ? 'Saindo…' : 'Sair do sistema'}</button></div></aside>
    <div className="workspace"><header className="topbar"><div className="company-select"><span className="company-icon"><Icon name="companies" /></span><label htmlFor="active-company">Empresa em operação<select id="active-company" value={companyId} onChange={event => setCompanyId(event.target.value)} disabled={!session.companies.length}>{session.companies.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}{!session.companies.length ? <option value="">Sem empresa</option> : null}</select></label></div><div className="topbar-user">{session.demo ? <span className="badge demo">DEMONSTRAÇÃO</span> : null}<button className="user-button" onClick={() => navigate('account')} aria-label={`Minha conta: ${session.user.name}`}><span className="avatar">{session.user.name.charAt(0).toLocaleUpperCase('pt-BR')}</span><span>{session.user.name}<small>{session.user.systemAdmin ? 'Administrador do sistema' : 'Usuário do sistema'}</small></span></button></div></header>
    <main id="main-content" className="main-content" tabIndex={-1}><Message text={sessionError} />{session.demo ? <div className="demo-note">{visualPreview ? 'Prévia visual da V1 local · Dados fictícios. No aplicativo Windows, compras, vendas, estoque, caixa, financeiro, Excel e backup estão disponíveis. Nesta demonstração, alterações não são gravadas.' : 'Ambiente de demonstração · Os cadastros e alterações deste ambiente são dados de teste.'}</div> : null}{content}<footer className="workspace-footer"><span>NEXO · Gestão Comercial</span><span>{company?.name ?? 'Empresa em operação'}</span></footer></main></div>
  </div>;
}
