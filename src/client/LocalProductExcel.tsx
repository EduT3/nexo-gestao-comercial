import { useEffect, useRef, useState } from 'react';
type PreviewRow = {
  line: number;
  status: 'READY' | 'DUPLICATE' | 'ERROR';
  message: string;
  product: { name: string; internalCode: string } | null;
};
type Preview = {
  canceled: false;
  token: string;
  rows: PreviewRow[];
  ready: number;
  duplicates: number;
  errors: number;
};
export function LocalProductExcel({
  company,
  onImported,
  onBusyChange,
}: {
  company: string;
  onImported(): Promise<void>;
  onBusyChange(busy: boolean): void;
}) {
  const running = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const bridge = window.nexoLocal!;
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview>();
  const [message, setMessage] = useState('');
  async function exportReport() {
    if (running.current) return;
    running.current = true;
    onBusyChange(true);
    setBusy(true);
    setMessage('');
    try {
      const result = await bridge.exportExcel(company);
      if (active.current && !result.canceled)
        setMessage(
          'Relatório Excel exportado. Editar esse arquivo não altera os dados do NEXO.',
        );
    } catch (error) {
      if (!active.current) return;
      setMessage(String(error));
    } finally {
      running.current = false;
      if (active.current) { onBusyChange(false); setBusy(false); }
    }
  }
  async function template() {
    if (running.current) return;
    running.current = true;
    onBusyChange(true);
    setBusy(true);
    setMessage('');
    try {
      const result = await bridge.productImportTemplate(company);
      if (active.current && !result.canceled)
        setMessage(
          'Modelo Excel salvo. Preencha a aba Produtos e volte para conferir a importação.',
        );
    } catch (error) {
      if (!active.current) return;
      setMessage(String(error));
    } finally {
      running.current = false;
      if (active.current) { onBusyChange(false); setBusy(false); }
    }
  }
  async function select() {
    if (running.current) return;
    running.current = true;
    onBusyChange(true);
    setBusy(true);
    setPreview(undefined);
    setMessage('');
    try {
      const result = await bridge.productImportPreview(company);
      if (active.current && !result.canceled) setPreview(result);
    } catch (error) {
      if (!active.current) return;
      setPreview(undefined);
      setMessage(String(error));
    } finally {
      running.current = false;
      if (active.current) { onBusyChange(false); setBusy(false); }
    }
  }
  async function confirm() {
    if (
      !preview ||
      preview.errors > 0 ||
      preview.ready === 0 ||
      running.current
    )
      return;
    running.current = true;
    onBusyChange(true);
    setBusy(true);
    setMessage('');
    try {
      const result = await bridge.productImportConfirm(preview.token);
      if (!active.current) return;
      setPreview(undefined);
      await onImported();
      if (!active.current) return;
      setMessage(
        `${result.imported} produto(s) importado(s); ${result.skipped} duplicado(s) ignorado(s).`,
      );
    } catch (error) {
      if (!active.current) return;
      setPreview(undefined);
      setMessage(String(error));
    } finally {
      running.current = false;
      if (active.current) { onBusyChange(false); setBusy(false); }
    }
  }
  return (
    <details className="panel" aria-busy={busy}>
      <summary>Excel: importar e exportar</summary>
      <p>
        Exporte produtos, estoque, vendas e financeiro para consulta. Para
        cadastrar produtos, baixe o modelo; nada será gravado antes da prévia e
        confirmação.
      </p>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void exportReport()}
      >
        Exportar relatório Excel
      </button>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void template()}
      >
        Baixar modelo Excel
      </button>
      <button
        className="button primary"
        disabled={busy}
        onClick={() => void select()}
      >
        Selecionar planilha
      </button>
      {preview && (
        <section aria-label="Prévia da importação">
          <p>
            <strong>{preview.ready}</strong> prontos ·{' '}
            <strong>{preview.duplicates}</strong> duplicados ·{' '}
            <strong>{preview.errors}</strong> com erro
          </p>
          <table aria-label="Prévia de produtos do Excel">
            <thead>
              <tr>
                <th>Linha</th>
                <th>Código</th>
                <th>Produto</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.line}>
                  <td>{row.line}</td>
                  <td>{row.product?.internalCode ?? '—'}</td>
                  <td>{row.product?.name ?? '—'}</td>
                  <td>
                    {row.status === 'READY'
                      ? 'Pronto'
                      : row.status === 'DUPLICATE'
                        ? 'Duplicado'
                        : `Erro: ${row.message}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="button primary"
            disabled={busy || preview.errors > 0 || preview.ready === 0}
            onClick={() => void confirm()}
          >
            Confirmar importação
          </button>
          <button disabled={busy} onClick={() => setPreview(undefined)}>
            Descartar prévia
          </button>
          {preview.errors > 0 && (
            <p>Corrija os erros na planilha e selecione o arquivo novamente.</p>
          )}
        </section>
      )}
      <p role="status">
        {busy
          ? 'Processando planilha… Aguarde antes de trocar de empresa.'
          : message}
      </p>
    </details>
  );
}
