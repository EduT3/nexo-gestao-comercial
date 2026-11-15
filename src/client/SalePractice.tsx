import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cents, money } from './local-format';

const unitPrice = 500n;
const initialUnits = 10;

type Sale = { total: bigint; change: bigint; remaining: number };
type Practice =
  | { step: 'open' }
  | { step: 'sell'; opening: bigint }
  | { step: 'close'; expected: bigint; sale: Sale }
  | { step: 'done'; expected: bigint; counted: bigint };

const titles = {
  open: '1 de 3 · Abrir o caixa de treino',
  sell: '2 de 3 · Registrar a venda fictícia',
  close: '3 de 3 · Conferir o caixa de treino',
  done: 'Caixa de treino fechado',
};

export function SalePractice() {
  const [practice, setPractice] = useState<Practice>({ step: 'open' });
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (panel.current?.open) heading.current?.focus();
  }, [practice.step]);

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    setError('');
    try {
      if (practice.step === 'open') {
        setPractice({ step: 'sell', opening: cents(String(input.get('opening')).trim()) });
      } else if (practice.step === 'sell') {
        const quantity = Number(input.get('quantity'));
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > initialUnits) {
          throw new Error('Escolha de 1 a 10 unidades para esta prática.');
        }
        const received = cents(String(input.get('received')).trim());
        const total = BigInt(quantity) * unitPrice;
        if (received < total) throw new Error('O valor recebido precisa cobrir ' + money(total) + '.');
        setPractice({ step: 'close', expected: practice.opening + total,
          sale: { total, change: received - total, remaining: initialUnits - quantity } });
      } else if (practice.step === 'close') {
        setPractice({ step: 'done', expected: practice.expected, counted: cents(String(input.get('counted')).trim()) });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Confira os valores.');
    }
  }

  return <details ref={panel} className="tutorial-secondary">
    <summary>Praticar caixa e venda em dinheiro</summary>
    <p>Use dados fictícios para abrir o caixa, vender e conferir o fechamento.</p>
    <h3 ref={heading} tabIndex={-1}>{titles[practice.step]}</h3>
    {practice.step === 'done' ? <>
      <p role="status">Valor esperado {money(practice.expected)}. Valor contado {money(practice.counted)}. Diferença {money(practice.counted - practice.expected)}.</p>
      <button type="button" className="button secondary" onClick={() => setPractice({ step: 'open' })}>Praticar novamente</button>
    </> : <form key={practice.step} aria-label="Prática de caixa e venda" className="form-stack" noValidate onSubmit={simulate} onChange={() => setError('')}>
      {practice.step === 'open' && <label>Valor inicial de treino (R$)<input name="opening" inputMode="decimal" maxLength={11} defaultValue="20,00" /></label>}
      {practice.step === 'sell' && <>
        <p>Caixa aberto com {money(practice.opening)}. Há {initialUnits} garrafas de água a {money(unitPrice)} cada.</p>
        <div className="form-grid">
          <label>Quantidade de garrafas<input type="number" name="quantity" min="1" max={initialUnits} step="1" defaultValue={2} /></label>
          <label>Valor recebido (R$)<input name="received" inputMode="decimal" maxLength={11} defaultValue="20,00" /></label>
        </div>
      </>}
      {practice.step === 'close' && <>
        <p>Venda simulada de {money(practice.sale.total)}. Troco de {money(practice.sale.change)}. Restam {practice.sale.remaining} garrafas.</p>
        <p>Valor esperado no caixa {money(practice.expected)}.</p>
        <label>Valor contado no caixa de treino (R$)<input name="counted" inputMode="decimal" maxLength={11} /></label>
      </>}
      {error && <p role="alert">{error}</p>}
      <div className="tutorial-actions"><button type="submit" className="button primary">
        {practice.step === 'open' ? 'Abrir caixa de treino' : practice.step === 'sell' ? 'Simular venda' : 'Fechar caixa de treino'}
      </button></div>
    </form>}
  </details>;
}
