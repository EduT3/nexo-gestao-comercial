import { useState, type FormEvent } from 'react';
import type { Session } from '../shared/contracts';
import { api, errorMessage, visualPreview } from './api';
import { Brand, Icon, Message } from './components';

export function Login({ onLogin, notice }: { onLogin: (session: Session) => void; notice: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (visualPreview) return <main className="initial-loading"><Brand/><p>Prévia visual com dados fictícios, sem gravação de operações.</p><button className="button primary" onClick={() => void api<Session>('/auth/login', {method:'POST'}).then(onLogin)}>Explorar a interface</button></main>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { onLogin(await api<Session>('/auth/login', { method: 'POST', body: { email: String(form.get('email')).trim(), password: String(form.get('password')) } })); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return <main className="login-layout">
    <section className="login-story"><Brand /><div className="login-story-copy"><p className="eyebrow">DEPÓSITO · ADEGA</p><h1>Seus negócios.<br />Uma gestão<br /><em>bem organizada.</em></h1><p>Do estoque à venda, cada detalhe do seu negócio no mesmo lugar.</p></div><p className="login-edition">NEXO · GESTÃO COMERCIAL <span>SEU NEGÓCIO, CONECTADO</span></p></section>
    <section className="login-panel"><div className="login-box"><p className="eyebrow">BEM-VINDO AO NEXO</p><h2>Acesse sua conta</h2><p className="muted">Entre com o usuário cadastrado pela administração.</p><Message text={notice} kind="info" /><Message text={error} /><form onSubmit={submit} className="form-stack"><label>E-mail<input type="email" name="email" autoComplete="username" maxLength={254} required autoFocus /></label><label>Senha<input type="password" name="password" autoComplete="current-password" required maxLength={128} /></label><button className="button primary full-width" disabled={busy} type="submit">{busy ? 'Entrando…' : 'Entrar no sistema'}<Icon name="arrow" size={18} /></button></form><p className="login-help">Precisa de acesso? Procure o administrador da sua empresa.</p></div><p className="login-footer">Empresas independentes. Gestão conectada.</p></section>
  </main>;
}
