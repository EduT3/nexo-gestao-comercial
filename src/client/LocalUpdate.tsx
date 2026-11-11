import { useState } from 'react';

export function LocalUpdate() {
  const check = window.nexoLocal?.openReleases;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function checkUpdate() {
    if (!check) return;
    setBusy(true);
    setMessage('');
    try {
      await check();
      setMessage('A página de versões foi aberta no navegador.');
    } catch {
      setMessage('Não foi possível abrir o GitHub. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (!check) return null;
  return <section className="panel" aria-label="Atualização do NEXO">
    <h2>Atualizações</h2>
    <p>Consulte as versões do NEXO no GitHub. Se solicitado, entre com sua conta.</p>
    <button type="button" className="button secondary" disabled={busy} onClick={checkUpdate}>
      Verificar atualização
    </button>
    {message && <p role="status">{message}</p>}
  </section>;
}
