import type { ReactNode } from 'react';
import type { AuditEvent } from '../shared/contracts';

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    products: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    inventory: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" /><path d="M4 12l8 4.5 8-4.5M12 7.5v9" /></>,
    purchases: <><path d="M4 6h16l-2 9H7zM7 6 6 3H3M9 20h.01M17 20h.01" /></>,
    pos: <><path d="M4 4h16v16H4zM8 8h8M8 12h3M8 16h8M15 12h1" /></>,
    cash: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></>,
    finance: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><path d="m3 7 6-4 6 6 6-5" /></>,
    categories: <><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" /></>,
    customers: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 8h4M19 6v4" /></>,
    suppliers: <><path d="M3 7h12v11H3zM15 11h3l3 3v4h-6z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    companies: <><path d="M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></>,
    roles: <><path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    audit: <><path d="M7 3h10v4H7zM7 5H4v16h16V5h-3M8 12h8M8 16h5" /></>,
    consolidated: <><rect x="8" y="3" width="8" height="5" rx="1" /><rect x="2" y="16" width="7" height="5" rx="1" /><rect x="15" y="16" width="7" height="5" rx="1" /><path d="M12 8v4M5 16v-4h14v4" /></>,
    account: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    logout: <><path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    plus: <path d="M12 4v16M4 12h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.overview}</svg>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark">NEXO<span>•</span></span><span className="brand-word">GESTÃO COMERCIAL</span></div>;
}
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p className="muted">{description}</p></div>{action}</header>;
}
export function Message({ text, kind = 'error' }: { text: string; kind?: 'error' | 'success' | 'info' }) {
  return text ? <div className={`message message-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{text}</div> : null;
}
export function Loading() { return <div className="loading" role="status"><span className="loading-dot" />Carregando informações…</div>; }
export function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><strong>{title}</strong><p>{text}</p></div>; }
export function ResourceState({ loading, error, reload }: { loading: boolean; error: string; reload: () => void }) {
  return loading ? <Loading /> : error ? <div><Message text={error} /><button className="button secondary" onClick={reload}>Tentar novamente</button></div> : null;
}
export function formatDate(date: string, timeZone = 'America/Sao_Paulo') { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone }).format(new Date(date)); }

const auditLabels: Record<string, string> = {
  'company.created': 'Empresa cadastrada', 'company.updated': 'Dados da empresa atualizados',
  'user.created': 'Usuário cadastrado', 'user.updated': 'Acesso do usuário atualizado',
  'membership.updated': 'Permissões de acesso atualizadas', 'auth.login': 'Entrada no sistema',
  'auth.logout': 'Saída do sistema', 'auth.password_changed': 'Senha alterada',
  'COMPANY_CREATED': 'Empresa cadastrada', 'COMPANY_UPDATED': 'Dados da empresa atualizados',
  'USER_CREATED': 'Usuário cadastrado', 'MEMBERSHIP_UPDATED': 'Permissões de acesso atualizadas',
};
export function auditAction(action: string) { return auditLabels[action] ?? action; }
export function ActivityList({ events }: { events: AuditEvent[] }) {
  return events.length ? <ul className="activity-list">{events.map(event => <li key={event.id}><span className="activity-dot" /><div><strong>{auditAction(event.action)}</strong><p>{event.actorName ?? 'Sistema'} <span>· {formatDate(event.createdAt)}</span></p></div></li>)}</ul> : <Empty title="Nenhuma atividade registrada" text="As alterações realizadas nesta empresa aparecerão aqui." />;
}
