import {
  CashRegister,
  CreditCard,
  Cube,
  GearSix,
  House,
  ShoppingCart,
} from "@phosphor-icons/react";

type NavigationProps = {
  area: string;
  productArea: boolean;
  administrator: boolean;
  preview: boolean;
  navigate(area: string): void;
};

const primary = [
  { id: "inicio", label: "Início", Icon: House },
  { id: "vendas", label: "Vender", Icon: ShoppingCart },
  { id: "produtos", label: "Estoque", Icon: Cube },
  { id: "caixa", label: "Caixa", Icon: CashRegister },
  { id: "financeiro", label: "Contas", Icon: CreditCard },
] as const;

export function NexoNavigation({
  area,
  productArea,
  administrator,
  preview,
  navigate,
}: NavigationProps) {
  return (
    <aside className="sidebar nexo-sidebar">
      <div className="nexo-brand" aria-label="NEXO Balcão">
        <strong aria-label="NEXO"><img className="nexo-brand-icon" src={`${import.meta.env.BASE_URL}nexo-icon.png`} alt="" width={40} height={40} />EXO</strong>
        <span>Balcão</span>
      </div>
      <nav aria-label="Navegação principal">
        {primary
          .filter((item) => administrator || item.id !== "financeiro")
          .map(({ id, label, Icon }) => {
            const selected = id === area || (id === "produtos" && productArea);
            return (
              <button
                type="button"
                key={id}
                className={`nav-link ${selected ? "active" : ""}`}
                aria-current={selected ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon
                  size={24}
                  weight={selected ? "duotone" : "regular"}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </button>
            );
          })}
      </nav>
      {administrator && (
        <button
          type="button"
          className={`nexo-settings ${area === "mais" ? "active" : ""}`}
          onClick={() => navigate("mais")}
        >
          <GearSix size={22} aria-hidden="true" />
          <span>Configurações</span>
        </button>
      )}
      <p className="local-edition">
        {preview
          ? "Prévia do aplicativo Windows"
          : "Aplicativo Windows · local"}
      </p>
    </aside>
  );
}
