import { ArrowRight, CashRegister, CreditCard, Cube, ShoppingCart } from '@phosphor-icons/react';

export function LocalStart({
  onProducts,
  onSale,
  onCash,
  onAccounts,
  canManage,
  multipleCompanies = true,
}: {
  onProducts(): void;
  onSale(): void;
  onCash(): void;
  onAccounts(): void;
  canManage: boolean;
  multipleCompanies?: boolean;
}) {
  return (
    <section className="start-board" aria-label="Começar a usar o NEXO">
      <div className="start-board-heading">
        <h2>O que você precisa fazer agora?</h2>
        <p>
          Escolha um dos blocos. Você pode trocar de área sem perder uma venda
          ou entrada em andamento.
        </p>
      </div>
      <div className="start-card-grid">
        <button className="start-card sale-card" onClick={onSale}>
          <span className="nexo-start-icon"><ShoppingCart size={27} /></span>
          <span className="start-card-label">VENDAS</span>
          <strong>Atender um cliente</strong>
          <span>Monte a venda e escolha como receber. Cadastro de cliente é opcional.</span>
          <span className="start-card-link">Fazer uma venda <ArrowRight size={17} /></span>
        </button>
        <button className="start-card stock-card" onClick={onProducts}>
          <span className="nexo-start-icon"><Cube size={27} /></span>
          <span className="start-card-label">PRODUTOS E ESTOQUE</span>
          <strong>Cuidar das mercadorias</strong>
          <span>
            {canManage
              ? "Cadastrar produtos e informar o que chegou."
              : "Consultar produtos e quantidades disponíveis."}
          </span>
          <span className="start-card-link">Abrir produtos e estoque <ArrowRight size={17} /></span>
        </button>
        <button className="start-card cash-card" onClick={onCash}>
          <span className="nexo-start-icon"><CashRegister size={27} /></span>
          <span className="start-card-label">MEU CAIXA</span>
          <strong>Conferir o dinheiro</strong>
          <span>Abra seu caixa ou encerre o atendimento.</span>
          <span className="start-card-link">Abrir meu caixa <ArrowRight size={17} /></span>
        </button>
        {canManage && (
          <button className="start-card accounts-card" onClick={onAccounts}>
            <span className="nexo-start-icon"><CreditCard size={27} /></span>
            <span className="start-card-label">CONTAS</span>
            <strong>Organizar pagamentos</strong>
            <span>Veja o que precisa pagar e o que tem para receber.</span>
            <span className="start-card-link">Ver minhas contas <ArrowRight size={17} /></span>
          </button>
        )}
      </div>
      {multipleCompanies && <p className="muted">
        A empresa em uso aparece no topo. Confira antes de registrar uma
        operação.
      </p>}
    </section>
  );
}
