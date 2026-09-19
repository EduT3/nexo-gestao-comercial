import { useState, type FormEvent } from 'react';
import type { Company, Member, Role, Session } from '../../shared/contracts';
import { roles, roleLabels } from '../../shared/contracts';
import { api, errorMessage, useResource } from '../api';
import { Empty, Icon, Message, PageHeading, ResourceState } from '../components';

export function UsersPage({ company, session }: { company: Company; session: Session }) {
  const resource = useResource<{ users: Member[] }>(`/companies/${company.id}/users`);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canManage = company.permissions.includes('users.manage');
  function openCreate() { setCreating(current => !current); setEditing(null); setError(''); setSuccess(''); }
  async function mutate(path: string, method: 'POST' | 'PATCH', body: unknown) {
    setBusy(true); setError(''); setSuccess('');
    try {
      await api(path, { method, body });
      setSuccess(method === 'POST' ? 'Usuário cadastrado com acesso a esta empresa.' : 'Acesso atualizado. A alteração foi registrada na auditoria.');
      setCreating(false); setEditing(null); resource.reload();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void mutate(`/companies/${company.id}/users`, 'POST', { name: String(form.get('name')).trim(), email: String(form.get('email')).trim(), password: String(form.get('password')), role: form.get('role') });
  }
  function updateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; const form = new FormData(event.currentTarget);
    void mutate(`/companies/${company.id}/users/${editing.id}`, 'PATCH', { role: form.get('role'), active: form.get('active') === 'on' });
  }
  return <><PageHeading eyebrow="PESSOAS E ACESSOS" title="Usuários" description={`Gerencie os acessos de ${company.name}. Cada vínculo vale apenas para esta empresa.`} action={canManage ? <button className="button primary" onClick={openCreate} disabled={busy}>{creating ? 'Cancelar cadastro' : <><Icon name="plus" size={17} />Novo usuário</>}</button> : undefined} /><Message text={error} /><Message text={success} kind="success" />
    {creating && canManage ? <section className="panel form-panel"><div className="section-heading"><h2>Cadastrar usuário</h2><span className="badge neutral">{company.name}</span></div><form onSubmit={createUser}><fieldset disabled={busy} className="form-grid"><label>Nome completo<input name="name" required minLength={2} maxLength={120} autoComplete="name" autoFocus /></label><label>E-mail<input type="email" name="email" required maxLength={254} autoComplete="off" /></label><label>Senha inicial<input type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" aria-describedby="new-user-password-help" /><small id="new-user-password-help">Use de 12 a 128 caracteres. O usuário pode trocar sua senha em Minha conta.</small></label><RoleField defaultValue="OPERADOR" /></fieldset><div className="form-actions"><span className="muted">O novo usuário terá acesso somente a {company.name}.</span><button type="submit" className="button primary" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar usuário'}</button></div></form></section> : null}
    {editing && canManage ? <section className="panel form-panel" key={editing.id}><div className="section-heading"><div><h2>Editar acesso de {editing.name}</h2><p className="muted">{editing.email}</p></div><button className="text-button" disabled={busy} onClick={() => { setEditing(null); setError(''); }}>Cancelar</button></div><form onSubmit={updateUser}><fieldset disabled={busy} className="form-grid"><RoleField defaultValue={editing.role} /><label className="checkbox-label"><input name="active" type="checkbox" defaultChecked={editing.active} /><span>Acesso ativo nesta empresa<small>Desmarque para inativar o vínculo e preservar o histórico.</small></span></label></fieldset><div className="form-actions"><span className="muted">O último administrador ativo é protegido pelo sistema.</span><button className="button primary" disabled={busy} type="submit">{busy ? 'Salvando…' : 'Salvar acesso'}</button></div></form></section> : null}
    <aside className="profile-guide" aria-label="Perfis da equipe"><div><strong>Admin</strong><p>Gerencia os cadastros, a operação, o financeiro e os acessos desta empresa.</p></div><div><strong>Operador</strong><p>Atende clientes, consulta produtos e realiza vendas e operações de caixa.</p></div></aside>
    <ResourceState {...resource} />{resource.data ? <section className="panel table-panel"><div className="section-heading"><h2>Equipe da empresa</h2><span className="badge neutral">{resource.data.users.length} {resource.data.users.length === 1 ? 'usuário' : 'usuários'}</span></div>{resource.data.users.length ? <div className="table-scroll"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th>{canManage ? <th><span className="sr-only">Ações</span></th> : null}</tr></thead><tbody>{resource.data.users.map(user => <tr key={user.id}><td><div className="table-user"><span className="avatar small-avatar">{user.name.charAt(0).toLocaleUpperCase('pt-BR')}</span><span><strong>{user.name}</strong>{user.userId === session.user.id ? <span className="you-label">Você</span> : null}<small className="cell-detail">{user.email}</small></span></div></td><td>{roleLabels[user.role]}</td><td><span className={`badge ${user.active ? 'positive' : 'neutral'}`}>{user.active ? 'Ativo' : 'Inativo'}</span></td>{canManage ? <td>{user.userId !== session.user.id ? <button className="text-button" aria-label={`Editar acesso de ${user.name}`} disabled={busy} onClick={() => { setEditing(user); setCreating(false); setError(''); setSuccess(''); }}>Editar acesso</button> : <span className="muted small-text">Sua conta</span>}</td> : null}</tr>)}</tbody></table></div> : <Empty title="Nenhum usuário encontrado" text="Cadastre um usuário para organizar a equipe desta empresa." />}</section> : null}<p className="footnote">A inativação preserva o histórico. Seu próprio perfil de acesso não pode ser alterado por você nesta tela.</p></>;
}

function RoleField({ defaultValue }: { defaultValue: Role }) {
  return <label>Perfil de acesso<select name="role" defaultValue={defaultValue}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>;
}
