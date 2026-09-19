import { useState, type FormEvent } from 'react';
import type { AuditEvent, Company, CompanyOverview } from '../../shared/contracts';
import { roleLabels } from '../../shared/contracts';
import { useResource } from '../api';
import { ActivityList, auditAction, Empty, formatDate, Icon, PageHeading, ResourceState } from '../components';

export function Overview({ company, onNavigate }: { company: Company; onNavigate: (page: 'companies' | 'users' | 'audit') => void }) {
  const resource = useResource<CompanyOverview>(`/companies/${company.id}/overview`);
  const data = resource.data;
  return <>
    <PageHeading eyebrow="VISÃO GERAL" title="Seu negócio, em ordem." description={`Você está operando ${company.name}.`} />
    <ResourceState {...resource} />
    {data ? <>
      <section className="welcome-panel">
        <div><p className="eyebrow">PRIMEIROS PASSOS</p><h2>Prepare sua operação</h2><p>Confira o cadastro da empresa e organize o acesso da equipe para começar com tudo no lugar.</p></div>
        <span className="badge positive">{roleLabels[company.role]}</span>
      </section>
      {company.permissions.includes('users.manage') ? <div className="quick-actions" aria-label="Ações rápidas">
        <button onClick={() => onNavigate('companies')}><Icon name="companies" /><span><strong>Revisar empresa</strong><small>Dados e endereço da operação</small></span><Icon name="arrow" size={18} /></button>
        <button onClick={() => onNavigate('users')}><Icon name="users" /><span><strong>Organizar equipe</strong><small>{data.activeUsers} {data.activeUsers === 1 ? 'pessoa com acesso' : 'pessoas com acesso'}</small></span><Icon name="arrow" size={18} /></button>
      </div> : null}
      <div className="overview-columns">
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">EMPRESA EM OPERAÇÃO</p><h2>{company.name}</h2></div><Icon name="companies" /></div>
          <dl className="business-details"><div><dt>Segmento</dt><dd>{company.kind === 'DEPOSITO' ? 'Materiais de construção' : 'Adega e conveniência'}</dd></div><div><dt>Endereço</dt><dd>{data.company.address || 'Endereço ainda não informado'}</dd></div><div><dt>Equipe</dt><dd>{data.activeUsers} {data.activeUsers === 1 ? 'usuário ativo' : 'usuários ativos'}</dd></div></dl>
          <p className="panel-note">Use o seletor no cabeçalho para alternar entre suas empresas.</p>
        </section>
        {company.permissions.includes('audit.read') ? <section className="panel"><div className="section-heading"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Atividade recente</h2></div><button className="text-button" onClick={() => onNavigate('audit')}>Ver histórico<Icon name="arrow" size={15} /></button></div><ActivityList events={data.recentAudit} /></section> : <section className="panel"><div className="section-heading"><h2>Bem-vindo à equipe</h2><Icon name="users" /></div><p className="muted">As ações disponíveis acompanham seu perfil nesta empresa. Para ajustar seu acesso, procure a administração.</p></section>}
      </div>
    </> : null}
  </>;
}

export function AuditPage({ company }: { company: Company }) {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(String(new FormData(event.currentTarget).get('query') ?? '').trim());
    setOffset(0);
  }
  return <>
    <PageHeading eyebrow="ADMINISTRAÇÃO" title="Auditoria" description={`Acompanhe quem fez cada alteração em ${company.name}.`} />
    <form className="filter-bar" onSubmit={search}><label>Pesquisar histórico<input name="query" type="search" maxLength={120} placeholder="Ação, responsável ou registro" /></label><button className="button secondary" type="submit">Pesquisar</button></form>
    <AuditResults key={`${offset}:${query}`} company={company} offset={offset} query={query} onPage={setOffset} />
  </>;
}

function AuditResults({ company, offset, query, onPage }: { company: Company; offset: number; query: string; onPage: (offset: number) => void }) {
  const limit = 20;
  const resource = useResource<{ events: AuditEvent[]; total: number }>(`/companies/${company.id}/audit?limit=${limit}&offset=${offset}&q=${encodeURIComponent(query)}`);
  const data = resource.data;
  return <><ResourceState {...resource} />{data ? <section className="panel table-panel">
    <div className="section-heading"><h2>Histórico de alterações</h2><span className="badge neutral">{data.total} {data.total === 1 ? 'registro' : 'registros'}</span></div>
    {data.events.length ? <div className="table-scroll"><table className="audit-table"><thead><tr><th>Data e hora</th><th>Ação</th><th>Responsável</th><th>Detalhes</th></tr></thead><tbody>{data.events.map(event => <tr key={event.id}><td className="nowrap">{formatDate(event.createdAt, company.timezone)}</td><td><strong>{auditAction(event.action)}</strong><small className="cell-detail">{event.entityType}</small></td><td>{event.actorName ?? 'Sistema'}</td><td><details className="audit-detail"><summary>Ver alterações</summary><div><strong>Antes</strong><pre>{event.before ? JSON.stringify(event.before, null, 2) : 'Sem valor anterior'}</pre><strong>Depois</strong><pre>{event.after ? JSON.stringify(event.after, null, 2) : 'Sem valor posterior'}</pre></div></details></td></tr>)}</tbody></table></div> : <Empty title={query ? 'Nenhuma alteração encontrada' : 'Nenhuma alteração registrada'} text={query ? 'Tente outro termo para consultar o histórico.' : 'As alterações e movimentações desta empresa aparecerão aqui, com data e responsável.'} />}
    <div className="pagination"><span>{data.total ? `${offset + 1}–${Math.min(offset + limit, data.total)} de ${data.total}` : '0 registros'}</span><div><button className="button secondary small" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - limit))}>Anterior</button><button className="button secondary small" disabled={offset + limit >= data.total} onClick={() => onPage(offset + limit)}>Próxima</button></div></div>
  </section> : null}</>;
}
