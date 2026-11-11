import { useState, type FormEvent } from 'react';
import type { Status } from './LocalApp';
export function LocalLogin({ status, onReady }: { status: Status; onReady(): Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(status.users[0]?.id ?? '');
  const selected = status.users.find(user => user.id === userId);
  const setup = selected?.requiresPassword && !selected.hasPassword;

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    setBusy(true); setMessage('');
    try {
      const password = String(fields.get('password') ?? '');
      if (setup && password !== fields.get('confirmation')) throw new Error('As senhas precisam ser iguais.');
      await window.nexoLocal!.login(userId, selected?.requiresPassword ? password : undefined);
      form.reset(); await onReady();
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  return <main className="login-panel"><div className="login-box"><h1>NEXO Balcão</h1><h2>Entrar</h2><p className="muted">Operadores entram pelo nome. O responsável usa senha.</p>{status.startupNotice && <p role="status">{status.startupNotice}</p>}<form className="form-stack" aria-label="Acesso local" onSubmit={enter}><fieldset disabled={busy}><label>Usuário<select aria-label="Usuário" name="user" required autoFocus value={userId} onChange={event => { setUserId(event.target.value); setMessage(''); }}>{status.users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
    {selected?.requiresPassword && <label>{setup ? 'Criar senha do responsável' : 'Senha do responsável'}<input key={userId} name="password" type="password" required minLength={6} maxLength={128} autoComplete={setup ? 'new-password' : 'current-password'} /></label>}
    {setup && <label>Confirmar senha<input name="confirmation" type="password" required minLength={6} maxLength={128} autoComplete="new-password" /></label>}
    </fieldset><button className="button primary" disabled={busy || !status.users.length}>Entrar</button></form><p role="status">{message || (!status.users.length && "Nenhum usuário ativo disponível.")}</p></div></main>;
}
