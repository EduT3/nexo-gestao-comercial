import { useState, type FormEvent } from 'react';
export function LocalOperators({ companies }: { companies: { id: string; name: string }[] }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setMessage('');
    try {
      if (data.get('password') !== data.get('confirmation')) throw new Error('As senhas precisam ser iguais.');
      await window.nexoLocal!.createOperator({ name: String(data.get('name')), password: String(data.get('password')), companies: data.getAll('companies') });
      form.reset(); setMessage('Operador cadastrado. Use Sair para entrar com o novo usuário.');
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  }
  return <details className="panel"><summary>Operadores</summary><p>O operador pode consultar produtos, abrir e fechar seu caixa e realizar vendas. Cadastros, descontos, cancelamentos e financeiro ficam com o responsável.</p><form aria-label="Cadastro de operadores" className="form-stack" onSubmit={save}><fieldset disabled={busy} className="form-grid"><label>Nome do operador<input name="name" required minLength={2} maxLength={100} /></label><label>Senha do operador<input name="password" type="password" required minLength={6} maxLength={128} autoComplete="new-password" /></label><label>Confirmar senha do operador<input name="confirmation" type="password" required minLength={6} maxLength={128} autoComplete="new-password" /></label><div>Empresas permitidas{companies.map(company => <label key={company.id}><input type="checkbox" name="companies" value={company.id} />{company.name}</label>)}</div></fieldset><button className="button primary" disabled={busy}>Cadastrar operador</button></form><p role="status">{message}</p></details>;
}
