import { useEffect, useState, type FormEvent } from 'react';

export function LocalPeople({ company, kind, disabled }: { company: string; kind: 'customer' | 'supplier'; disabled: boolean }) {
  const bridge = window.nexoLocal!;
  const title = kind === 'customer' ? 'Clientes' : 'Fornecedores';
  const [rows, setRows] = useState<{ id: string; name: string; taxId?: string | null; phone?: string | null }[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    if (company) void bridge.people(company, kind).then(result => { if (active) setRows(result); })
      .catch(error => { if (active) setMessage(String(error)); });
    return () => { active = false; };
  }, [company, kind]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget;
    const form = new FormData(element);
    const input = Object.fromEntries([...form.entries()].map(([key, value]) => [key, value || null]));
    setSaving(true); setMessage('');
    try {
      await bridge.createPerson(company, kind, input);
      setRows(await bridge.people(company, kind));
      element.reset(); setMessage('Cadastro salvo no computador.');
    } catch (error) { setMessage(String(error)); }
    finally { setSaving(false); }
  }
  return <details className="panel"><summary>{title}</summary>
    <form aria-label={`Cadastro de ${title.toLowerCase()}`} className="form-stack" onSubmit={save}>
      <fieldset className="form-grid" disabled={disabled || saving || !company}>
        <label>Nome<input name="name" required minLength={2} maxLength={160} /></label>
        <label>CPF/CNPJ<input name="taxId" maxLength={30} /></label>
        <label>Telefone<input name="phone" maxLength={40} /></label>
        <label>WhatsApp<input name="whatsapp" maxLength={40} /></label>
        {kind === 'supplier' && <label>E-mail<input name="email" type="email" maxLength={254} /></label>}
        <label>Endereço<input name="address" maxLength={500} /></label>
        <label>Observações<input name="notes" maxLength={1000} /></label>
      </fieldset>
      <button className="button primary" disabled={disabled || saving || !company}>Salvar {kind === 'customer' ? 'cliente' : 'fornecedor'}</button>
    </form>
    <p role="status" className="message">{message}</p>
    <label>Buscar {title.toLowerCase()}<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou CPF/CNPJ" /></label>
    <table aria-label={title}><thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th></tr></thead>
      <tbody>{rows.filter(row => `${row.name} ${row.taxId ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map(row =>
        <tr key={row.id}><td>{row.name}</td><td>{row.taxId || '—'}</td><td>{row.phone || '—'}</td></tr>)}</tbody></table>
    {!rows.length && <p>Nenhum cadastro nesta empresa.</p>}
  </details>;
}
