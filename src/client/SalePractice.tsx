import { useState, type FormEvent } from 'react';
import { cents, money } from './local-format';

const unitPrice = 500n;
const openingCash = 2000n;
const initialUnits = 10;

export function SalePractice() {
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ total: bigint; change: bigint; remaining: number }>();

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const quantity = Number(input.get('quantity'));
    setError('');
    setResult(undefined);
    try {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > initialUnits) {
        throw new Error('Escolha de 1 a 10 unidades para esta prática.');
      }
      const received = cents(String(input.get('received')).trim());
      const total = BigInt(quantity) * unitPrice;
      if (received < total) throw new Error('O valor recebido precisa cobrir ' + money(total) + '.');
      setResult({ total, change: received - total, remaining: initialUnits - quantity });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Confira os valores.');
    }
  }

  return <details className="tutorial-secondary">
    <summary>Praticar uma venda em dinheiro</summary>
    <p>Exercício com dados fictícios. O caixa de treino começa com {money(openingCash)} e há {initialUnits} garrafas de água a {money(unitPrice)} cada.</p>
    <form aria-label="Prática de venda" className="form-stack" noValidate onSubmit={simulate} onChange={() => { setError(''); setResult(undefined); }}>
      <div className="form-grid">
        <label>Quantidade de garrafas<input type="number" name="quantity" min="1" max={initialUnits} step="1" defaultValue={2} /></label>
        <label>Valor recebido (R$)<input name="received" inputMode="decimal" maxLength={11} defaultValue="20,00" /></label>
      </div>
      <div className="tutorial-actions"><button type="submit" className="button primary">Simular venda</button></div>
      {error && <p role="alert">{error}</p>}
      {result && <p role="status">Venda simulada de {money(result.total)}. Troco de {money(result.change)}. Restam {result.remaining} garrafas e o caixa de treino fica com {money(openingCash + result.total)}.</p>}
    </form>
  </details>;
}
