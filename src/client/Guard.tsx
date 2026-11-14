import { useEffect, useRef, useState, type FormEvent } from 'react';
import './guard.css';

type Policy = { enabled: boolean; all: boolean; actions: string[] };
type GuardStatus = Policy & { operations: Record<string, string>; pinLength: number };
type Configuration = Policy & { pin?: string; confirmation?: string; currentPin?: string };

export interface GuardBridge {
  guardStatus(): Promise<GuardStatus>;
  guardConfigure(input: Configuration): Promise<{ recoveryKey: string } | undefined>;
  guardRecover(input: {key:string;pin:string;confirmation:string}): Promise<{recoveryKey:string}>;
  guardApprove(id: string, pin: string): Promise<unknown>;
  guardCancel(id: string): Promise<void>;
  guardInvalidate(): Promise<void>;
  registerGuardPrompt(callback: ((id: string, label: string) => Promise<unknown>) | null): void;
}

type Request = { id: string; label: string; resolve(value: unknown): void; reject(error: Error): void };

export function GuardPrompt() {
  const [request, setRequest] = useState<Request>();
  const [notice, setNotice] = useState('');
  const current = useRef<Request>(undefined);
  const bridge = window.nexoLocal;

  useEffect(() => {
    bridge?.registerGuardPrompt?.((id, label) => new Promise((resolve, reject) => {
      setNotice('');
      current.current?.reject(Error('Solicitação substituída.'));
      const next = { id, label, resolve, reject };
      current.current = next;
      setRequest(next);
    }));
    return () => {
      bridge?.registerGuardPrompt?.(null);
      current.current?.reject(Error('Autorização cancelada.'));
      current.current = undefined;
    };
  }, [bridge]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!request) return notice ? <div role="status" className="guard-success">{notice}</div> : null;
  function finish() {
    if (current.current !== request) return;
    current.current = undefined;
    setRequest(undefined);
  }
  return <PinDialog key={request.id} label={request.label} onCancel={() => {
    void bridge?.guardCancel?.(request.id).catch(() => undefined);
    request.reject(Error('Autorização cancelada.'));
    finish();
  }} onApprove={async pin => {
    try {
      const result = await bridge!.guardApprove!(request.id, pin);
      setNotice('Autorização confirmada: ' + request.label + '.');
      request.resolve(result);
      finish();
    } catch (error) {
      if (/PIN incorreto|bloqueio|bloqueado/.test(String(error))) throw error;
      request.reject(Error(String(error)));
      finish();
    }
  }} />;
}

function PinDialog({ label, onCancel, onApprove }: {
  label: string; onCancel(): void; onApprove(pin: string): Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [digits, setDigits] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  function add(digit: string) {
    setDigits(value => value.length < 4 ? value + digit : value);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || digits.length !== 4) return;
    setBusy(true);
    setMessage('');
    const pin = digits;
    setDigits('');
    try { await onApprove(pin); }
    catch (error) { setMessage(String(error).includes('bloque') ? 'Guard bloqueado temporariamente.' : 'PIN incorreto. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="guard-dialog" aria-labelledby="guard-title" onCancel={event => {
    event.preventDefault();
    if (!busy) onCancel();
  }} onKeyDown={event => {
    if (busy || event.ctrlKey || event.altKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) { event.preventDefault(); add(event.key); }
    if (event.key === 'Backspace') { event.preventDefault(); setDigits(value => value.slice(0,-1)); }
  }}>
    <form onSubmit={submit}>
      <h2 id="guard-title">Autorização administrativa</h2>
      <p>{label}</p>
      <div className="guard-dots" aria-label={digits.length + ' de 4 dígitos preenchidos'}>
        {[0,1,2,3].map(index => <span key={index} aria-hidden="true" data-filled={index < digits.length} />)}
      </div>
      <fieldset disabled={busy} className="guard-keypad">
        {[1,2,3,4,5,6,7,8,9].map(digit => <button key={digit} type="button" onClick={() => add(String(digit))}>{digit}</button>)}
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" onClick={() => add('0')}>0</button>
        <button type="button" aria-label="Apagar último dígito" onClick={() => setDigits(value => value.slice(0,-1))}>⌫</button>
      </fieldset>
      <p role="status">{message}</p>
      <button className="button primary" disabled={busy || digits.length !== 4}>Autorizar</button>
    </form>
  </dialog>;
}

export function GuardSettings() {
  const bridge = window.nexoLocal;
  const [status, setStatus] = useState<GuardStatus>();
  const [policy, setPolicy] = useState<Policy>();
  const [message, setMessage] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recovering, setRecovering] = useState(false);
  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const result = await bridge!.guardRecover!({key:String(data.get('key')),pin:String(data.get('pin')),confirmation:String(data.get('confirmation'))});
      setRecoveryKey(result.recoveryKey);
      setRecovering(false);
      setMessage('PIN redefinido.');
      await load();
    } catch (error) { setMessage(String(error)); }
    finally { form.reset(); setBusy(false); }
  }
  async function load() {
    try {
      const next = await bridge?.guardStatus?.();
      if (next) { setStatus(next); setPolicy(next); }
    } catch (error) { setMessage(String(error)); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!policy || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const result = await bridge!.guardConfigure!({
        enabled:policy.enabled, all:policy.all, actions:policy.actions,
        pin:String(data.get('pin') || '') || undefined,
        confirmation:String(data.get('confirmation') || '') || undefined,
        currentPin:String(data.get('currentPin') || '') || undefined,
      });
      form.reset();
      setRecoveryKey(result?.recoveryKey ?? '');
      setReview(false);
      setMessage('Configuração salva.');
      await load();
    } catch (error) { form.reset(); setMessage(String(error)); }
    finally { setBusy(false); }
  }
  if (!bridge?.guardStatus) return null;
  return <details className="panel" onToggle={event => {
    if (event.currentTarget.open && !status) void load();
  }}>
    <summary>Segurança</summary>
    <h2>NEXO Guard</h2>
    {recoveryKey && <div role="status"><p>Guarde esta chave fora do computador. Ela permite redefinir o PIN e será exibida apenas agora.</p><code>{recoveryKey}</code><button type="button" onClick={() => setRecoveryKey('')}>Já guardei a chave</button></div>}
    {status?.enabled && <button type="button" disabled={busy} onClick={() => setRecovering(value => !value)}>Esqueci meu PIN</button>}
    {recovering && <form className="form-stack" onSubmit={recover}>
      <label>Chave de recuperação<input name="key" type="password" required minLength={48} maxLength={48} autoComplete="off" /></label>
      <PinField name="pin" label="Novo PIN" required />
      <PinField name="confirmation" label="Confirmar novo PIN" required />
      <button className="button primary" disabled={busy}>Redefinir PIN</button>
    </form>}
    {policy && status && !recovering && <form className="form-stack" onSubmit={save}>
      <fieldset disabled={busy || review} className="form-stack">
        <label><input type="checkbox" checked={policy.enabled} onChange={event => setPolicy({...policy,enabled:event.target.checked})} /> Ativar NEXO Guard</label>
        {policy.enabled && <>
          <label><input type="checkbox" checked={policy.all} onChange={event => setPolicy({...policy,all:event.target.checked})} /> Proteger todas as ações administrativas</label>
          {!policy.all && Object.entries(status.operations).map(([id,label]) => <label key={id}>
            <input type="checkbox" checked={policy.actions.includes(id)} onChange={event => setPolicy({...policy,actions:event.target.checked ? [...policy.actions,id] : policy.actions.filter(action => action !== id)})} /> {label}
          </label>)}
        </>}
      </fieldset>
      {review ? <>
        <p>{policy.enabled ? policy.all ? 'Proteger todas as ações administrativas.' : 'Proteger ' + policy.actions.length + ' ações selecionadas.' : 'Desativar o NEXO Guard.'}</p>
        {status.enabled && <PinField name="currentPin" label="PIN atual" required />}
        {policy.enabled && <><PinField name="pin" label={status.enabled ? 'Novo PIN (opcional)' : 'Novo PIN'} required={!status.enabled} /><PinField name="confirmation" label="Confirmar novo PIN" required={!status.enabled} /></>}
        <button className="button primary" disabled={busy}>Confirmar configuração</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => setReview(false)}>Voltar</button>
      </> : <button type="button" className="button secondary" onClick={() => setReview(true)}>Revisar configuração</button>}
    </form>}
    <p role="status">{message}</p>
  </details>;
}

function PinField({name,label,required}: {name:string;label:string;required:boolean}) {
  return <label>{label}<input name={name} type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required={required} autoComplete="off" /></label>;
}
