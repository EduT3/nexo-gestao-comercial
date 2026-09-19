import { useState, type FormEvent } from 'react';
import type { Company, Session } from '../../shared/contracts';
import { roleLabels } from '../../shared/contracts';
import { api, errorMessage } from '../api';
import { Empty, Icon, Message, PageHeading } from '../components';

interface CompanyValues { name: string; legalName: string; taxId: string | null; kind: Company['kind']; address: string; timezone: string }
export function CompaniesPage({ company, session, onUpdated }: { company?: Company; session: Session; onUpdated: () => Promise<void> }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function save(values: CompanyValues) {
    setBusy(true); setError(''); setSuccess('');
    try {
      if (creating) await api('/companies', { method: 'POST', body: { name: values.name, legalName: values.legalName, taxId: values.taxId, kind: values.kind, address: values.address } });
      else if (company) await api(`/companies/${company.id}`, { method: 'PATCH', body: values });
      await onUpdated();
      setSuccess(creating ? 'Empresa cadastrada. Ela já está disponível no seletor de empresas.' : 'Dados da empresa atualizados. A alteração foi registrada na auditoria.');
      setCreating(false);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  function toggleCreate() { setCreating(current => !current); setError(''); setSuccess(''); }
  return <><PageHeading eyebrow="CADASTROS ADMINISTRATIVOS" title="Empresas" description="Dados de identificação e organização de cada negócio." action={session.user.systemAdmin ? <button className="button primary" onClick={toggleCreate} disabled={busy}>{creating ? 'Voltar ao cadastro' : <><Icon name="plus" size={17} />Nova empresa</>}</button> : undefined} /><Message text={error} /><Message text={success} kind="success" />
    {creating ? <section className="panel form-panel"><div className="section-heading"><div><h2>Cadastrar empresa</h2><p className="muted">O cadastro cria a unidade principal e seu acesso de administrador.</p></div><span className="badge neutral">Nova empresa</span></div><CompanyForm key="new" onSave={save} busy={busy} creating /></section> : company ? <section className="panel form-panel"><div className="section-heading"><div><h2>{company.name}</h2><p className="muted">Seu perfil nesta empresa: {roleLabels[company.role]}</p></div><span className={`badge ${company.active ? 'positive' : 'neutral'}`}>{company.active ? 'Ativa' : 'Inativa'}</span></div><CompanyForm key={`${company.id}-${company.name}-${company.legalName}-${company.taxId}-${company.address}-${company.kind}-${company.timezone}`} company={company} onSave={save} busy={busy} readOnly={!company.permissions.includes('company.update')} /></section> : <Empty title="Nenhuma empresa disponível" text={session.user.systemAdmin ? 'Use Nova empresa para iniciar a estrutura do negócio.' : 'Procure o administrador para revisar seu vínculo com uma empresa.'} />}
    <p className="footnote">Para consultar outro negócio, use o seletor “Empresa em operação” no topo da página.</p>
  </>;
}

function CompanyForm({ company, onSave, busy, creating = false, readOnly = false }: { company?: Company; onSave: (values: CompanyValues) => Promise<void>; busy: boolean; creating?: boolean; readOnly?: boolean }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({ name: String(form.get('name')).trim(), legalName: String(form.get('legalName')).trim(), taxId: String(form.get('taxId')).trim() || null, kind: form.get('kind') as Company['kind'], address: String(form.get('address')).trim(), timezone: String(form.get('timezone') || 'America/Sao_Paulo').trim() });
  }
  return <form onSubmit={submit}><fieldset disabled={busy || readOnly} className="form-grid"><label>Nome fantasia<input name="name" defaultValue={company?.name ?? ''} required minLength={2} maxLength={120} autoComplete="organization" /></label><label>Razão social<input name="legalName" defaultValue={company?.legalName ?? ''} required minLength={2} maxLength={160} /></label><label>CNPJ <span className="field-optional">(opcional)</span><input name="taxId" defaultValue={company?.taxId ?? ''} maxLength={18} aria-describedby="tax-id-help" /><small id="tax-id-help">CNPJ numérico ou alfanumérico, com ou sem pontuação.</small></label><label>Tipo de operação<select name="kind" defaultValue={company?.kind ?? 'DEPOSITO'}><option value="DEPOSITO">Depósito</option><option value="ADEGA">Adega</option></select></label><label className="span-2">Endereço <span className="field-optional">(opcional)</span><input name="address" defaultValue={company?.address ?? ''} maxLength={500} autoComplete="street-address" /></label>{!creating ? <label>Fuso horário<input name="timezone" defaultValue={company?.timezone ?? 'America/Sao_Paulo'} required maxLength={80} aria-describedby="timezone-help" /><small id="timezone-help">Exemplo: America/Sao_Paulo</small></label> : null}</fieldset>{readOnly ? <div className="panel-note">Seu perfil permite consultar este cadastro. Alterações são realizadas pelo administrador da empresa.</div> : <div className="form-actions"><span className="muted">{creating ? 'Campos opcionais podem ser preenchidos depois.' : 'As alterações ficam registradas na auditoria.'}</span><button className="button primary" disabled={busy} type="submit">{busy ? 'Salvando…' : creating ? 'Cadastrar empresa' : 'Salvar alterações'}</button></div>}</form>;
}
