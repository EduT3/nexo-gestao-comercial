import { useState, type FormEvent } from 'react';
import type { Status } from './LocalApp';
export function LocalLogin({ status, onReady }: { status: Status; onReady(): Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    setBusy(true); setMessage('');
    try {
      const password = String(fields.get('password') ?? '');
      if (status.needsPassword) {
        if (password !== fields.get('confirmation')) throw new Error('As senhas precisam ser iguais.');
        await window.nexoLocal!.setupPassword(password);
      } else await window.nexoLocal!.login(String(fields.get('user')), password);
      form.reset(); await onReady();
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  return <main className="login-panel"><div className="login-box"><h1>NEXO</h1><h2>{status.needsPassword ? 'Definir senha do responsável' : 'Entrar'}</h2><p className="muted">Acesso local neste computador.</p><form className="form-stack" aria-label="Acesso local" onSubmit={enter}><fieldset disabled={busy}>{!status.needsPassword && <label>Usuário<select aria-label="Usuário" name="user" required>{status.users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>}<label>Senha<input name="password" type="password" required minLength={6} maxLength={128} autoFocus autoComplete={status.needsPassword ? 'new-password' : 'current-password'} /></label>{status.needsPassword && <label>Confirmar senha<input name="confirmation" type="password" required minLength={6} maxLength={128} autoComplete="new-password" /></label>}</fieldset><button className="button primary" disabled={busy}>{status.needsPassword ? 'Definir senha' : 'Entrar'}</button></form><p role="status">{message}</p></div></main>;
}
