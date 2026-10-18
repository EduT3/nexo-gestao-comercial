import { useEffect, useState, type FormEvent } from 'react';

export function LocalCategories({ company, active: visible = true, disabled, onSaved }: { company: string; active?: boolean; disabled: boolean; onSaved(): void }) {
  const bridge = window.nexoLocal!;
  const [rows, setRows] = useState<{ id: string; name: string; description: string }[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setRows([]); setMessage('');
    if (company && visible) void bridge.categories(company).then(result => { if (active) setRows(result); })
      .catch(error => { if (active) setMessage(String(error)); });
    return () => { active = false; };
  }, [company, visible]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    setSaving(true); setMessage('');
    try {
      await bridge.createCategory(company, { name: form.get('name'), description: form.get('description') });
      setRows(await bridge.categories(company));
      element.reset(); setMessage('Categoria salva no computador.');
      onSaved();
    } catch (error) { setMessage(String(error)); }
    finally { setSaving(false); }
  }
  return <details className="panel"><summary>Categorias de produtos</summary>
    <form className="form-stack" onSubmit={save}>
      <fieldset className="form-grid" disabled={disabled || saving || !company}>
        <label>Nome da categoria<input name="name" required maxLength={120} /></label>
        <label>Descrição da categoria<input name="description" maxLength={500} /></label>
      </fieldset>
      <button className="button primary" disabled={disabled || saving || !company}>Salvar categoria</button>
    </form>
    <p role="status" className="message">{message}</p>
    <table aria-label="Categorias cadastradas"><thead><tr><th>Categoria</th><th>Descrição</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.description}</td></tr>)}</tbody></table>
    {!rows.length && <p>Nenhuma categoria cadastrada nesta empresa.</p>}
  </details>;
}
