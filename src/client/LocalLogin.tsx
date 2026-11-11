import { useState, type FormEvent } from 'react';
import type { Status } from './LocalApp';
export function LocalLogin({ status, onReady }: { status: Status; onReady(): Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    setBusy(true); setMessage('');
    try {
      await window.nexoLocal!.login(String(fields.get('user')));
      form.reset(); await onReady();
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  return <main className="login-panel"><div className="login-box"><h1>NEXO Balcão</h1><h2>Entrar</h2><p className="muted">Selecione seu nome para identificar suas operações.</p>{status.startupNotice && <p role="status">{status.startupNotice}</p>}<form className="form-stack" aria-label="Acesso local" onSubmit={enter}><fieldset disabled={busy}><label>Usuário<select aria-label="Usuário" name="user" required autoFocus>{status.users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></fieldset><button className="button primary" disabled={busy || !status.users.length}>Entrar</button></form><p role="status">{message || (!status.users.length && "Nenhum usuário ativo disponível.")}</p></div></main>;
}
