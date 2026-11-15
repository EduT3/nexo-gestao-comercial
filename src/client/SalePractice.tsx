import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cents, money, localToday, shortDate } from './local-format';

type Product = { name: string; code: string; cost: bigint; price: bigint };
type Inventory = { product: Product; quantity: number; payable?: { amount: bigint; due: string } };
type Sale = { total: bigint; change: bigint; remaining: number };
type Closing = { expected: bigint; sale: Sale };
type Practice =
  | { step: 'product' }
  | { step: 'receive'; product: Product }
  | { step: 'open'; inventory: Inventory }
  | { step: 'sell'; inventory: Inventory; opening: bigint }
  | { step: 'account'; payable: NonNullable<Inventory['payable']>; closing: Closing }
  | ({ step: 'close' } & Closing)
  | { step: 'done'; expected: bigint; counted: bigint };

const readyInventory: Inventory = {
  product: { name: 'Água de treino', code: 'AGUA-QA', cost: 200n, price: 500n },
  quantity: 10,
};

const titles = {
  product: 'Cadastrar o primeiro produto',
  receive: 'Receber a mercadoria',
  open: 'Abrir o caixa de treino',
  sell: 'Registrar a venda fictícia',
  account: 'Consultar a conta a pagar',
  close: 'Conferir o caixa de treino',
  done: 'Caixa de treino fechado',
};

function firstStep(administrator: boolean): Practice {
  return administrator ? { step: 'product' } : { step: 'open', inventory: readyInventory };
}

function practiceQuantity(value: FormDataEntryValue | null, available: number) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > available) {
    throw new Error('Escolha de 1 a ' + available + ' unidades para esta prática.');
  }
  return quantity;
}

export function SalePractice({ administrator }: { administrator: boolean }) {
  const [practice, setPractice] = useState(() => firstStep(administrator));
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (panel.current?.open) heading.current?.focus();
  }, [practice.step]);

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const field = (name: string) => String(input.get(name) ?? '').trim();
    setError('');
    try {
      switch (practice.step) {
        case 'product': {
          const name = field('name'), code = field('code');
          if (name.length < 2 || !code) throw new Error('Informe o nome e o código do produto.');
          const cost = cents(field('cost')), price = cents(field('price'));
          if (price === 0n) throw new Error('Informe um preço de venda maior que zero.');
          setPractice({ step: 'receive', product: { name, code, cost, price } });
          break;
        }
        case 'receive': {
          const { product } = practice;
          const quantity = practiceQuantity(input.get('quantity'), 1000);
          const due = field('due');
          if (!due) throw new Error('Informe o vencimento da conta de treino.');
          setPractice({ step: 'open', inventory: { product, quantity, payable: { amount: product.cost * BigInt(quantity), due } } });
          break;
        }
        case 'open':
          setPractice({ step: 'sell', inventory: practice.inventory, opening: cents(field('opening')) });
          break;
        case 'sell': {
          const { opening, inventory } = practice;
          const quantity = practiceQuantity(input.get('quantity'), inventory.quantity);
          const received = cents(field('received'));
          const total = BigInt(quantity) * inventory.product.price;
          if (received < total) throw new Error('O valor recebido precisa cobrir ' + money(total) + '.');
          const closing = { expected: opening + total, sale: { total, change: received - total, remaining: inventory.quantity - quantity } };
          setPractice(inventory.payable ? { step: 'account', payable: inventory.payable, closing } : { step: 'close', ...closing });
          break;
        }
        case 'account':
          setPractice({ step: 'close', ...practice.closing });
          break;
        case 'close':
          setPractice({ step: 'done', expected: practice.expected, counted: cents(field('counted')) });
          break;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Confira os valores.');
    }
  }

  return <details ref={panel} className="tutorial-secondary">
    <summary>{administrator ? 'Praticar a primeira rotina de balcão' : 'Praticar caixa e venda em dinheiro'}</summary>
    <p>Exercício com dados fictícios. Ao fechar a ajuda, a prática recomeça.</p>
    <h3 ref={heading} tabIndex={-1}>{titles[practice.step]}</h3>
    {practice.step === 'done' ? <>
      <p role="status">Valor esperado {money(practice.expected)}. Valor contado {money(practice.counted)}. Diferença {money(practice.counted - practice.expected)}.</p>
      <button type="button" className="button secondary" onClick={() => setPractice(firstStep(administrator))}>Praticar novamente</button>
    </> : <form key={practice.step} aria-label="Prática de balcão" className="form-stack" noValidate onSubmit={simulate} onChange={() => setError('')}>
      {practice.step === 'product' && <div className="form-grid">
        <label>Nome do produto<input name="name" maxLength={160} defaultValue="Água de treino" /></label>
        <label>Código interno<input name="code" maxLength={60} defaultValue="AGUA-QA" /></label>
        <label>Custo (R$)<input name="cost" inputMode="decimal" maxLength={11} defaultValue="2,00" /></label>
        <label>Preço de venda (R$)<input name="price" inputMode="decimal" maxLength={11} defaultValue="5,00" /></label>
      </div>}
      {practice.step === 'receive' && <>
        <p>{practice.product.name} ({practice.product.code}) · {money(practice.product.cost)} por unidade.</p>
        <div className="form-grid">
          <label>Quantidade recebida<input type="number" name="quantity" min="1" max="1000" step="1" defaultValue={10} /></label>
          <label>Vencimento da conta<input type="date" name="due" defaultValue={localToday()} /></label>
        </div>
      </>}
      {practice.step === 'open' && <label>Valor inicial de treino (R$)<input name="opening" inputMode="decimal" maxLength={11} defaultValue="20,00" /></label>}
      {practice.step === 'sell' && <>
        <p>Caixa aberto com {money(practice.opening)}. Estoque de treino: {practice.inventory.quantity} un. de {practice.inventory.product.name} a {money(practice.inventory.product.price)} cada.</p>
        <div className="form-grid">
          <label>Quantidade vendida<input type="number" name="quantity" min="1" max={practice.inventory.quantity} step="1" defaultValue={Math.min(2, practice.inventory.quantity)} /></label>
          <label>Valor recebido (R$)<input name="received" inputMode="decimal" maxLength={11} defaultValue="20,00" /></label>
        </div>
      </>}
      {practice.step === 'account' && <>
        <p>Troco de {money(practice.closing.sale.change)}. Restam {practice.closing.sale.remaining} unidades no estoque de treino.</p>
        <p>Conta a pagar da entrada: {money(practice.payable.amount)}, com vencimento em {shortDate(practice.payable.due)}.</p>
      </>}
      {practice.step === 'close' && <>
        <p>Venda simulada de {money(practice.sale.total)}. Troco de {money(practice.sale.change)}. Restam {practice.sale.remaining} unidades.</p>
        <p>Valor esperado no caixa {money(practice.expected)}.</p>
        <label>Valor contado no caixa de treino (R$)<input name="counted" inputMode="decimal" maxLength={11} /></label>
      </>}
      {error && <p role="alert">{error}</p>}
      <div className="tutorial-actions"><button type="submit" className="button primary">
        {{ product: 'Cadastrar produto fictício', receive: 'Registrar entrada fictícia', open: 'Abrir caixa de treino', sell: 'Simular venda', account: 'Ir ao fechamento', close: 'Fechar caixa de treino' }[practice.step]}
      </button></div>
    </form>}
  </details>;
}
