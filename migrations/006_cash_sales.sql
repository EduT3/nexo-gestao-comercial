-- M4: minimal cash register and atomic point-of-sale confirmation.
CREATE TABLE cash_registers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  operator_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('OPEN','CLOSED')),
  opening_cents bigint NOT NULL CHECK (opening_cents >= 0),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closing_cents bigint CHECK (closing_cents IS NULL OR closing_cents >= 0),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (length(command_hash)=64),
  UNIQUE (company_id, id),
  UNIQUE (company_id, idempotency_key),
  CHECK ((status='OPEN' AND closed_at IS NULL AND closing_cents IS NULL) OR (status='CLOSED' AND closed_at IS NOT NULL AND closing_cents IS NOT NULL))
);
CREATE UNIQUE INDEX cash_registers_one_open_company_uq ON cash_registers(company_id) WHERE status='OPEN';
CREATE INDEX cash_registers_company_opened_idx ON cash_registers(company_id, opened_at DESC, id DESC);

CREATE TABLE sales (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  cash_register_id uuid NOT NULL,
  customer_id uuid,
  operator_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('CONFIRMED','CANCELLED')),
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents bigint NOT NULL CHECK (discount_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0 AND total_cents=subtotal_cents-discount_cents),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (length(command_hash)=64),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, idempotency_key),
  CONSTRAINT sales_cash_company_fk FOREIGN KEY (company_id, cash_register_id) REFERENCES cash_registers(company_id, id),
  CONSTRAINT sales_customer_company_fk FOREIGN KEY (company_id, customer_id) REFERENCES customers(company_id, id)
);
CREATE INDEX sales_company_confirmed_idx ON sales(company_id, confirmed_at DESC, id DESC);

CREATE TABLE sale_items (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  unit_cost_cents bigint NOT NULL CHECK (unit_cost_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  UNIQUE (company_id, id),
  UNIQUE (company_id, sale_id, product_id),
  CONSTRAINT sale_items_sale_fk FOREIGN KEY (company_id, sale_id) REFERENCES sales(company_id, id),
  CONSTRAINT sale_items_product_fk FOREIGN KEY (company_id, product_id) REFERENCES products(company_id, id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('CASH','PIX','DEBIT','CREDIT')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, sale_id),
  CONSTRAINT payments_sale_fk FOREIGN KEY (company_id, sale_id) REFERENCES sales(company_id, id)
);

CREATE TABLE cash_movements (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  cash_register_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('OPENING','SALE','ENTRY','EXIT')),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  payment_method text CHECK (payment_method IS NULL OR payment_method IN ('CASH','PIX','DEBIT','CREDIT')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  sale_id uuid,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, sale_id),
  CONSTRAINT cash_movements_register_fk FOREIGN KEY (company_id, cash_register_id) REFERENCES cash_registers(company_id, id),
  CONSTRAINT cash_movements_sale_fk FOREIGN KEY (company_id, sale_id) REFERENCES sales(company_id, id),
  CHECK ((type='OPENING' AND payment_method='CASH' AND sale_id IS NULL AND direction='IN') OR type<>'OPENING')
);
CREATE INDEX cash_movements_register_created_idx ON cash_movements(company_id, cash_register_id, created_at, id);

CREATE TABLE financial_entries (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  kind text NOT NULL CHECK (kind IN ('REVENUE','EXPENSE')),
  status text NOT NULL CHECK (status IN ('REALIZED','OPEN','CANCELLED')),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 300),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  payment_method text CHECK (payment_method IS NULL OR payment_method IN ('CASH','PIX','DEBIT','CREDIT')),
  source_type text NOT NULL CHECK (source_type IN ('SALE','MANUAL')),
  source_id uuid NOT NULL,
  realized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, source_type, source_id),
  CHECK ((status='REALIZED' AND realized_at IS NOT NULL) OR (status<>'REALIZED' AND realized_at IS NULL))
);

CREATE UNIQUE INDEX inventory_sale_product_uq ON inventory_movements(company_id, source_type, source_id, product_id) WHERE source_type='SALE';

CREATE TRIGGER sale_items_immutable BEFORE UPDATE OR DELETE ON sale_items FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER payments_immutable BEFORE UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
