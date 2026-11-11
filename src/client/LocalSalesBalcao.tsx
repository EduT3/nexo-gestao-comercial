import {
  ArrowClockwise,
  Check,
  ClockCounterClockwise,
  MagnifyingGlass,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CashAvailability } from "../shared/cash-status";
import { itemTotalCents, quantityToMilli } from "../shared/scaled";
import { errorMessage } from "./local-format";
import { LocalSalesHistory } from "./LocalSalesHistory";
import { useLocalQuery } from "./useLocalQuery";

type Product = {
  id: string;
  name: string;
  internal_code?: string;
  price_cents: bigint;
};
type Line = { id: string; productId: string; quantity: string };
const methods = [
  { id: "CASH", label: "Dinheiro" },
  { id: "DEBIT", label: "Cartão de débito" },
  { id: "CREDIT", label: "Cartão de crédito" },
  { id: "PIX", label: "PIX" },
] as const;

function money(value: bigint) {
  const positive = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}R$ ${positive / 100n},${(positive % 100n).toString().padStart(2, "0")}`;
}
function cents(value: string) {
  if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value))
    throw new Error("Informe um valor com até duas casas decimais.");
  const [whole = "0", fraction = ""] = value.replace(",", ".").split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}
function normal(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function formattedQuantity(value: bigint) {
  const fraction = (value % 1000n)
    .toString()
    .padStart(3, "0")
    .replace(/0+$/, "");
  return `${value / 1000n}${fraction ? "," + fraction : ""}`;
}
export function adjustSaleQuantity(value: string, change: 1 | -1) {
  const current = quantityToMilli(value.replace(",", "."));
  const next = current + BigInt(change) * 1000n;
  return formattedQuantity(next > 0n ? next : current > 0n ? current : 1000n);
}

export function LocalSalesBalcao({
  company,
  active = true,
  onSaved,
  administrator = true,
  refreshToken = 0,
  onOpenCash,
  onCashStatus,
}: {
  company: string;
  active?: boolean;
  onSaved(): void;
  administrator?: boolean;
  refreshToken?: number;
  onOpenCash(): void;
  onCashStatus?(open: boolean | undefined): void;
}) {
  const bridge = window.nexoLocal!;
  const searchRef = useRef<HTMLInputElement>(null);
  const [cashAvailability, setCashAvailability] = useState<CashAvailability>();
  const [cashError, setCashError] = useState("");
  const cashRequests = useLocalQuery(
    company,
    active,
    refreshToken,
    async () => {
      setCashAvailability(undefined);
      onCashStatus?.(undefined);
      setCashError("");
      return bridge.cashAvailability(company);
    },
    (availability) => {
      setCashAvailability(availability);
      onCashStatus?.(availability.open);
    },
    (error) => {
      setCashAvailability(undefined);
      onCashStatus?.(undefined);
      setCashError(errorMessage(error));
    },
  );
  const canSell = !!(cashAvailability?.open && cashAvailability.canSell);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [suggestions, setSuggestions] = useState(false);
  const [discount, setDiscount] = useState("0,00");
  const [method, setMethod] = useState("CASH");
  const [received, setReceived] = useState("");
  const [operationKey, setOperationKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saleFeedback, setSaleFeedback] = useState<{ text: string; error: boolean }>();
  const [historyRevision, setHistoryRevision] = useState(0);
  const [identifyCustomer, setIdentifyCustomer] = useState(false);
  const [customer, setCustomer] = useState("");
  const [customerError, setCustomerError] = useState("");

  const requests = useLocalQuery(
    company,
    active,
    refreshToken,
    () => bridge.products(company),
    (rows) => setProducts(rows.filter((row) => row.active === 1n)),
    (error) => setMessage(errorMessage(error)),
  );
  const customerRequests = useLocalQuery(
    company,
    active && identifyCustomer,
    refreshToken,
    () => bridge.people(company, "customer"),
    (rows) => {
      setCustomers(rows.filter((row) => row.active));
      setCustomerError("");
    },
    (error) => setCustomerError(errorMessage(error)),
  );

  useEffect(() => {
    if (!active) return;
    const listener = (event: KeyboardEvent) => {
      if (
        event.key === "F2" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        searchRef.current?.focus();
        setSuggestions(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [active]);

  const matches = products
    .filter((product) =>
      normal(`${product.name} ${product.internal_code ?? ""}`).includes(
        normal(productSearch.trim()),
      ),
    )
    .slice(0, 8);
  function addProduct(product: Product) {
    if (busy) return;
    if (
      lines.length >= 100 &&
      !lines.some((row) => row.productId === product.id)
    ) {
      setMessage("Uma venda pode conter até 100 produtos diferentes.");
      return;
    }
    const existing = lines.find((row) => row.productId === product.id);
    let nextQuantity: string | undefined;
    if (existing) {
      try {
        nextQuantity = adjustSaleQuantity(existing.quantity, 1);
      } catch {
        setMessage(
          "Corrija a quantidade deste produto antes de adicioná-lo novamente.",
        );
        return;
      }
    }
    setLines((rows) => {
      if (existing)
        return rows.map((row) =>
          row.id === existing.id ? { ...row, quantity: nextQuantity! } : row,
        );
      return [
        ...rows,
        { id: crypto.randomUUID(), productId: product.id, quantity: "1" },
      ];
    });
    setProductSearch("");
    setSaleFeedback(undefined);
    setSuggestions(false);
    setMessage("");
    searchRef.current?.focus();
  }
  function setQuantity(id: string, quantity: string) {
    setSaleFeedback(undefined);
    setLines((rows) =>
      rows.map((row) => (row.id === id ? { ...row, quantity } : row)),
    );
  }
  function removeProduct(id: string) {
    const index = lines.findIndex((row) => row.id === id);
    if (busy || index < 0 || !window.confirm("Remover este produto do rascunho?")) return;
    setLines((rows) => rows.filter((row) => row.id !== id));
    setMessage(`Item ${index + 1} removido da venda.`);
    searchRef.current?.focus();
  }
  function clearProducts() {
    if (
      busy ||
      !lines.length ||
      !window.confirm("Limpar todos os itens deste rascunho?")
    )
      return;
    setLines([]);
    setMessage("Itens do rascunho removidos.");
    searchRef.current?.focus();
  }
  function step(id: string, quantity: string, change: 1 | -1) {
    try {
      setQuantity(id, adjustSaleQuantity(quantity, change));
    } catch {
      setMessage("Corrija a quantidade antes de usar os botões + e −.");
    }
  }

  let subtotal = 0n;
  let total = 0n;
  let change = 0n;
  let calculationError = "";
  try {
    for (const line of lines) {
      const product = products.find((row) => row.id === line.productId);
      if (!product)
        throw new Error("Um produto da venda não está mais disponível.");
      const milli = quantityToMilli(line.quantity.replace(",", "."));
      if (milli <= 0n)
        throw new Error(
          "A quantidade de cada produto precisa ser maior que zero.",
        );
      subtotal += itemTotalCents(milli, product.price_cents);
    }
    total = subtotal - cents(discount);
    if (total < 0n) throw new Error("Desconto acima do subtotal.");
    if (method === "CASH" && received) {
      change = cents(received) - total;
      if (change < 0n) throw new Error("Valor recebido insuficiente.");
    }
  } catch (error) {
    calculationError = errorMessage(error);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const task = requests.beginMutation();
    if (!task) return;
    setBusy(true);
    setSaleFeedback(undefined);
    setMessage("");
    try {
      if (!lines.length)
        throw new Error("Adicione pelo menos um produto antes de concluir.");
      if (!canSell)
        throw new Error(
          cashAvailability?.open
            ? "O caixa pertence a outro operador. Peça ao responsável para conferir o atendimento."
            : "Abra o caixa antes de registrar uma venda.",
        );
      if (calculationError) throw new Error(calculationError);
      const result = await bridge.confirmSale(company, operationKey, {
        customerId: customer || null,
        items: lines.map((row) => ({
          productId: row.productId,
          quantity: row.quantity.replace(",", "."),
        })),
        discountCents: Number(cents(discount)),
        paymentMethod: method,
        receivedCents:
          method === "CASH" && received ? Number(cents(received)) : null,
        notes: form.get("notes"),
      });
      task.finish();
      if (!task.isCurrent()) return;
      setOperationKey(crypto.randomUUID());
      setLines([]);
      setDiscount("0,00");
      setReceived("");
      setCustomer("");
      setIdentifyCustomer(false);
      element.reset();
      setSaleFeedback({
        text: `Venda salva. Total: ${money(result.totalCents)}. Troco: ${money(result.changeCents)}.`,
        error: false,
      });
      setHistoryRevision((revision) => revision + 1);
      onSaved();
      await requests.refresh();
    } catch (error) {
      if (task.isCurrent()) {
        setSaleFeedback({ text: errorMessage(error), error: true });
        void cashRequests.refresh();
      }
    } finally {
      if (task.finish()) setBusy(false);
    }
  }

  return (
    <section className="nexo-sales-screen" aria-label="Nova venda">
      <div
        className={`nexo-cash-notice ${canSell ? "ready" : "attention"}`}
        role="status"
      >
        {!cashAvailability ? (
          <>
            <span>{cashError || "Conferindo a situação do caixa…"}</span>
            {cashError && (
              <button
                type="button"
                className="button secondary"
                onClick={() => void cashRequests.refresh()}
              >
                <ArrowClockwise size={17} /> Tentar novamente
              </button>
            )}
          </>
        ) : (
          <>
            <span>
              <strong>
                {canSell
                  ? "Caixa aberto para atendimento"
                  : cashAvailability.open
                    ? "Caixa em uso por outro operador"
                    : "Caixa fechado"}
              </strong>
              <small>
                {cashAvailability.open
                  ? `Responsável: ${cashAvailability.operatorName}`
                  : "Você pode preparar a venda antes de abrir o caixa."}
              </small>
            </span>
            {!canSell && (
              <button
                type="button"
                className="button secondary"
                onClick={onOpenCash}
              >
                Ir ao caixa
              </button>
            )}
          </>
        )}
      </div>
      <form aria-label="Nova venda" onSubmit={save} className="nexo-sales-form"
        onChange={() => setSaleFeedback(current => current?.error ? undefined : current)}>
        <fieldset disabled={busy} className="nexo-sales-layout">
          <div className="nexo-sales-main">
            <div className="nexo-product-search" onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSuggestions(false);
            }}>
              <MagnifyingGlass size={27} aria-hidden="true" />
              <input
                ref={searchRef}
                aria-label="Buscar produto para venda"
                aria-controls={suggestions ? "nexo-product-results" : undefined}
                autoComplete="off"
                placeholder="Buscar produto pelo nome ou código"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setSuggestions(true);
                }}
                onFocus={() => setSuggestions(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSuggestions(false);
                    event.preventDefault();
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (matches[0]) addProduct(matches[0]);
                  }
                }}
              />
              <kbd>F2</kbd>
              {suggestions && (
                <div
                  id="nexo-product-results"
                  className="nexo-product-results"
                  aria-label="Resultados da busca"
                >
                  {matches.length ? (
                    matches.map((product) => (
                      <button
                        type="button"
                        key={product.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addProduct(product)}
                      >
                        <Package size={20} />
                        <span>
                          <strong>{product.name}</strong>
                          <small>{product.internal_code || "Sem código"}</small>
                        </span>
                        <b>{money(product.price_cents)}</b>
                        <Plus size={18} />
                      </button>
                    ))
                  ) : (
                    <p>Nenhum produto encontrado nesta empresa.</p>
                  )}
                </div>
              )}
            </div>
            <div className="nexo-cart-heading">
              <h2>
                Itens da venda{" "}
                <span>{lines.length ? `(${lines.length})` : ""}</span>
              </h2>
              <button
                type="button"
                className="button secondary nexo-clear"
                disabled={!lines.length}
                onClick={clearProducts}
              >
                <Trash size={18} /> Limpar itens
              </button>
            </div>
            <div className="nexo-cart-table">
              <div className="nexo-cart-column-head">
                <span>Produto</span>
                <span>Quantidade</span>
                <span>Valor unitário</span>
                <span>Subtotal</span>
                <span className="sr-only">Ações</span>
              </div>
              {lines.length ? (
                lines.map((line, index) => {
                  const product = products.find(
                    (row) => row.id === line.productId,
                  );
                  if (!product) return null;
                  let lineTotal: bigint | undefined;
                  try {
                    lineTotal = itemTotalCents(
                      quantityToMilli(line.quantity.replace(",", ".")),
                      product.price_cents,
                    );
                  } catch {
                    /* Shown in calculationError. */
                  }
                  return (
                    <div
                      className="nexo-cart-row"
                      role="group"
                      aria-label={`Item da venda ${index + 1}`}
                      key={line.id}
                    >
                      <div className="nexo-cart-product">
                        <span className="nexo-cart-product-icon">
                          <Package size={23} />
                        </span>
                        <span>
                          <strong>{product.name}</strong>
                          <small>{product.internal_code}</small>
                        </span>
                      </div>
                      <div className="nexo-quantity-control">
                        <button
                          type="button"
                          aria-label={`Diminuir quantidade de ${product.name}`}
                          onClick={() => step(line.id, line.quantity, -1)}
                        >
                          <Minus size={17} />
                        </button>
                        <input
                          aria-label={`Quantidade da venda ${index + 1}`}
                          value={line.quantity}
                          required
                          inputMode="decimal"
                          onChange={(event) =>
                            setQuantity(line.id, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Aumentar quantidade de ${product.name}`}
                          onClick={() => step(line.id, line.quantity, 1)}
                        >
                          <Plus size={17} />
                        </button>
                      </div>
                      <span className="nexo-unit-price">
                        {money(product.price_cents)}
                      </span>
                      <strong className="nexo-line-total">
                        {lineTotal === undefined
                          ? "Confira a quantidade"
                          : money(lineTotal)}
                      </strong>
                      <button
                        type="button"
                        className="nexo-remove-item"
                        aria-label={`Remover item ${index + 1}: ${product.name}`}
                        onClick={() => removeProduct(line.id)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="nexo-cart-empty">
                  <ShoppingCart size={40} weight="thin" />
                  <strong>Sua venda começa aqui</strong>
                  <p>
                    Busque um produto pelo nome ou código. Pressione F2 para
                    começar.
                  </p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => searchRef.current?.focus()}
                  >
                    Escolher produto
                  </button>
                </div>
              )}
            </div>
            <div className="nexo-cart-total">
              <span>Total da venda</span>
              <strong aria-label="Total da venda">
                {money(total > 0n ? total : 0n)}
              </strong>
            </div>
            <details className="nexo-sale-extras">
              <summary>
                Cliente, desconto e observações <span>(opcional)</span>
              </summary>
              <p className="optional-hint">
                Você pode vender sem cadastrar cliente.
              </p>
              <div className="nexo-extra-grid">
                <label className="nexo-customer-toggle">
                  <input
                    type="checkbox"
                    checked={identifyCustomer}
                    onChange={(event) => {
                      setIdentifyCustomer(event.target.checked);
                      if (!event.target.checked) setCustomer("");
                    }}
                  />{" "}
                  Identificar cliente
                </label>
                {identifyCustomer && (
                  <label>
                    Cliente da venda
                    <select
                      aria-label="Cliente da venda"
                      name="customer"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                    >
                      <option value="">Consumidor sem cadastro</option>
                      {customers.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Desconto da venda (R$)
                  <input
                    disabled={!administrator}
                    required
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label>
                  Observações
                  <input
                    name="notes"
                    maxLength={500}
                    placeholder="Observações sobre a venda"
                  />
                </label>
              </div>
              {customerError && (
                <p role="status">
                  Não foi possível consultar clientes.{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => void customerRequests.refresh()}
                  >
                    Tentar novamente
                  </button>
                </p>
              )}
            </details>
          </div>
          <aside className="nexo-payment-panel" aria-label="Pagamento">
            <h2>Pagamento</h2>
            <div
              className="nexo-payment-options"
              role="radiogroup"
              aria-label="Forma de pagamento"
            >
              {methods.map((payment) => (
                <label
                  key={payment.id}
                  className={method === payment.id ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={payment.id}
                    checked={method === payment.id}
                    onChange={() => setMethod(payment.id)}
                  />
                  <span>{payment.label}</span>
                </label>
              ))}
            </div>
            <div className="nexo-payment-summary">
              <div>
                <span>A receber</span>
                <strong>{money(total > 0n ? total : 0n)}</strong>
              </div>
              {method === "CASH" ? (
                <>
                  <label>
                    Recebido (R$)
                    <input
                      value={received}
                      placeholder="Valor exato se vazio"
                      inputMode="decimal"
                      onChange={(event) => setReceived(event.target.value)}
                    />
                  </label>
                  <div>
                    <span>Troco</span>
                    <strong className="nexo-change">
                      {money(change > 0n ? change : 0n)}
                    </strong>
                  </div>
                </>
              ) : (
                <p className="nexo-payment-hint">
                  O pagamento será registrado na forma selecionada.
                </p>
              )}
            </div>
            {calculationError && (
              <p className="nexo-sale-error" role="alert">
                {calculationError}
              </p>
            )}
            <button
              type="submit"
              className="button primary nexo-finalize"
              aria-label="Concluir venda"
              disabled={!canSell || !lines.length || !!calculationError}
            >
              <Check size={25} weight="bold" /> Finalizar venda
            </button>
            {saleFeedback && (
              <p className={saleFeedback.error ? "nexo-sale-error" : "nexo-sale-feedback"}
                role={saleFeedback.error ? "alert" : "status"}>
                {saleFeedback.text}
              </p>
            )}
            {!canSell && (
              <p className="nexo-payment-hint">
                Abra seu caixa para habilitar a finalização.
              </p>
            )}
          </aside>
        </fieldset>
      </form>
      {message && (
        <p className="nexo-sale-feedback" role="status">
          {message}
        </p>
      )}
      <details className="nexo-sales-history">
        <summary>
          <ClockCounterClockwise size={19} /> Histórico de vendas
        </summary>
        <LocalSalesHistory
          company={company}
          active={active}
          refreshToken={refreshToken + historyRevision}
          administrator={administrator}
          onSaved={onSaved}
        />
      </details>
    </section>
  );
}
