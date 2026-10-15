import { useEffect, useId, useRef, useState } from 'react';
import { newTutorialPreference, type TutorialPreference } from '../shared/tutorial';
import './tutorial.css';

export type TutorialStep = {
  id: TutorialPreference['step']; title: string; text: string; location: string;
  route?: string; target?: string;
};
export type TutorialStore = {
  read(): Promise<TutorialPreference>;
  write(value: TutorialPreference): Promise<unknown>;
};

/** Inline help leaves the app operable; only explicit links change the current screen. */
export function Tutorial({ steps, store, companyName, preview = false, currentRoute, onNavigate, busy = false }: {
  steps: TutorialStep[]; store: TutorialStore; companyName: string; preview?: boolean;
  currentRoute: string; onNavigate(step: TutorialStep): void; busy?: boolean;
}) {
  const panelId = useId();
  const help = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(false);
  const sequence = useRef(0);
  const [preference, setPreference] = useState(newTutorialPreference);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const index = Math.max(0, steps.findIndex(step => step.id === preference.step));
  const step = steps[index]!;
  useEffect(() => {
    let canceled = false; mounted.current = true;
    void store.read().then(value => {
      if (canceled) return;
      setPreference(value); setOpen(value.state === 'welcome' || value.state === 'active');
    }).catch(() => {
      if (!canceled) setError('Não foi possível carregar sua preferência. A ajuda continua disponível; tente salvá-la novamente.');
    }).finally(() => { if (!canceled) setReady(true); });
    return () => { canceled = true; mounted.current = false; };
  }, [store]);
  useEffect(() => { if (focusRevision) heading.current?.focus(); }, [focusRevision]);

  function save(value: TutorialPreference) {
    setPreference(value); setSaving(true); setError('');
    const request = ++sequence.current;
    queue.current = queue.current.then(() => store.write(value)).then(() => {
      if (mounted.current && request === sequence.current) setError('');
    }).catch(() => {
      if (mounted.current && request === sequence.current) setError('Sua preferência não foi salva. Tente novamente; ao reabrir, o tutorial pode voltar.');
    }).finally(() => { if (mounted.current && request === sequence.current) setSaving(false); });
  }
  function show(nextStep = step.id) {
    save({ version: 1, state: 'active', step: nextStep });
    setOpen(true); setFocusRevision(value => value + 1);
  }
  function close(state: TutorialPreference['state'] = 'paused') {
    save({ ...preference, state }); setOpen(false); help.current?.focus();
  }
  const active = preference.state === 'active';
  const contextual = steps.find(item => item.route === currentRoute) ?? steps[0]!;
  return <div className="tutorial-shell">
    <button ref={help} type="button" className="button secondary tutorial-help" aria-expanded={open} aria-controls={panelId} disabled={!ready}
      onClick={() => { setOpen(true); setFocusRevision(value => value + 1); }}>Ajuda e tutorial</button>
    {open && <section id={panelId} className="tutorial-panel" aria-label="Tutorial do NEXO" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(preference.state === 'disabled' || preference.state === 'completed' ? preference.state : 'paused'); }
    }}>
      <div className="tutorial-heading"><div><p className="tutorial-context">{preview ? 'DEMONSTRAÇÃO · ' : ''}{companyName}</p>
        <h2 ref={heading} tabIndex={-1}>{active ? step.title : 'Primeiros passos no NEXO'}</h2></div>
        <button type="button" className="button secondary" onClick={() => close(preference.state === 'disabled' || preference.state === 'completed' ? preference.state : 'paused')}>Fechar tutorial</button>
      </div>
      {active ? <>
        <p className="tutorial-progress" aria-live="polite" aria-atomic="true">Etapa {index + 1} de {steps.length} · {step.location}</p>
        <p>{step.text}</p>
        <div className="tutorial-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={() => onNavigate(step)}>Ver esta tela</button>
          <button type="button" className="button secondary" disabled={index === 0} onClick={() => show(steps[index - 1]!.id)}>Etapa anterior</button>
          <button type="button" className="button primary" onClick={() => index === steps.length - 1 ? close('completed') : show(steps[index + 1]!.id)}>{index === steps.length - 1 ? 'Concluir tutorial' : 'Próxima etapa'}</button>
        </div>
      </> : <>
        <p>{preference.state === 'disabled' ? 'O tutorial está desativado para você nesta empresa. Reative quando quiser.' : preference.state === 'completed' ? 'Tutorial concluído. Volte a qualquer etapa quando precisar.' : 'Conheça as telas no seu ritmo. Você pode pular agora e voltar pela Ajuda e tutorial.'}</p>
        <div className="tutorial-actions"><button type="button" className="button primary" onClick={() => show()}>{preference.state === 'disabled' ? 'Reativar tutorial' : preference.state === 'welcome' ? 'Começar tutorial' : 'Retomar tutorial'}</button></div>
      </>}
      <p className="tutorial-note">{preview ? 'Esta prévia usa dados fictícios e não grava operações. O guia apresenta apenas as telas disponíveis aqui.' : 'O guia apenas explica e abre telas. Nenhum cadastro, venda ou movimento é feito pelo tutorial.'}</p>
      <div className="tutorial-actions tutorial-secondary">
        <button type="button" className="text-button" onClick={() => show(contextual.id)}>Ajuda desta tela</button>
        <button type="button" className="text-button" onClick={() => show(steps[0]!.id)}>Reiniciar tutorial</button>
        <button type="button" className="text-button" onClick={() => close('paused')}>Pular tutorial</button>
        <button type="button" className="text-button" onClick={() => close('disabled')}>Desativar tutorial</button>
      </div>
      <p className="tutorial-note">Sua escolha vale para seu usuário nesta empresa. Fechar ou pular guarda a etapa; use Ajuda e tutorial para voltar. Tecla Esc fecha a ajuda.</p>
    </section>}
    <p className="tutorial-status" role="status">{saving ? 'Salvando preferência…' : error}</p>
    {error && !saving && <button type="button" className="text-button" onClick={() => save(preference)}>Tentar salvar preferência novamente</button>}
  </div>;
}
