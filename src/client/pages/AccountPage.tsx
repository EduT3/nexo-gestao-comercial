import { useState, type FormEvent } from 'react';
import type { Session } from '../../shared/contracts';
import { api, errorMessage } from '../api';
import { Message, PageHeading } from '../components';

export function AccountPage({ session, onPasswordChanged }: { session: Session; onPasswordChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword'));
    const newPassword = String(form.get('newPassword'));
    if (newPassword !== String(form.get('confirmPassword'))) { setError('A confirmação da senha precisa ser igual à nova senha.'); return; }
    if (currentPassword === newPassword) { setError('Escolha uma senha diferente da senha atual.'); return; }
    setBusy(true);
    try { await api('/auth/password', { method: 'POST', body: { currentPassword, newPassword } }); onPasswordChanged(); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return <><PageHeading eyebrow="SEU ACESSO" title="Minha conta" description="Consulte sua identificação e mantenha sua senha atualizada." /><section className="panel account-identity"><span className="avatar">{session.user.name.charAt(0).toLocaleUpperCase('pt-BR')}</span><div><h2>{session.user.name}</h2><p className="muted">{session.user.email}</p></div>{session.user.systemAdmin ? <span className="badge positive">Administração do sistema</span> : null}</section><section className="panel form-panel password-panel"><div className="section-heading"><div><h2>Alterar senha</h2><p className="muted">Após salvar, todas as sessões desta conta serão encerradas. Entre novamente com a nova senha.</p></div></div><Message text={error} /><form onSubmit={submit}><fieldset disabled={busy} className="form-stack"><label>Senha atual<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} /></label><label>Nova senha<input type="password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-length-help" /><small id="password-length-help">Use de 12 a 128 caracteres.</small></label><label>Confirmar nova senha<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={128} /></label></fieldset><div className="form-actions"><button className="button primary" disabled={busy} type="submit">{busy ? 'Alterando senha…' : 'Alterar senha e entrar novamente'}</button></div></form></section></>;
}
