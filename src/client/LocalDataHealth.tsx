import { useEffect, useRef, useState } from 'react';
import type { LocalHealth } from '../local/health';
export function LocalDataHealth({ disabled }: { disabled: boolean }) {
  const [result, setResult] = useState<LocalHealth>();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const lock = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function check() {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); setResult(undefined); setMessage('Conferindo os dados salvos…');
    try {
      const health = await window.nexoLocal!.checkDataHealth();
      if (!alive.current) return;
      setResult(health);
      setMessage(health.integrityOk && health.linksOk
        ? 'Verificação concluída: estrutura e vínculos sem problemas.'
        : 'A verificação encontrou um problema. Preserve seus backups e peça ajuda antes de continuar.');
    } catch (error) { if (alive.current) setMessage(String(error)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <section className="local-data-health" aria-label="Verificação dos dados">
    <h2>Verificar dados salvos</h2>
    <p>Confira a estrutura da base e os vínculos entre registros. A verificação não altera seus cadastros e não substitui o backup.</p>
    <button type="button" className="button secondary" disabled={disabled || busy} onClick={() => void check()}>Verificar dados</button>
    <p role="status">{message}</p>
    {result && <p>Conferido em {new Date(result.checkedAt).toLocaleString('pt-BR')} · Tamanho da base: {(Number(result.databaseBytes) / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB</p>}
  </section>;
}
