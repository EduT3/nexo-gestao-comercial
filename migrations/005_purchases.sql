-- M3 purchase receipt: commercial record, stock entries and optional payable.
ALTER TABLE inventory_movements ADD COLUMN source_type text CHECK (source_type IS NULL OR source_type IN ('PURCHASE','SALE'));
ALTER TABLE inventory_movements ADD COLUMN source_id uuid;

CREATE TABLE purchases (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  supplier_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('RECEIVED','CANCELLED')),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  received_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NOT NULL REFERENCES users(id),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (length(command_hash)=64),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, idempotency_key),
  CONSTRAINT purchases_supplier_company_fk FOREIGN KEY (company_id, supplier_id)
    REFERENCES suppliers(company_id, id)
);
CREATE INDEX purchases_company_received_idx ON purchases(company_id, received_at DESC, id DESC);

CREATE TABLE purchase_items (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  purchase_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost_cents bigint NOT NULL CHECK (unit_cost_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  UNIQUE (company_id, id),
  UNIQUE (company_id, purchase_id, product_id),
  CONSTRAINT purchase_items_purchase_fk FOREIGN KEY (company_id, purchase_id)
    REFERENCES purchases(company_id, id),
  CONSTRAINT purchase_items_product_fk FOREIGN KEY (company_id, product_id)
    REFERENCES products(company_id, id)
);

CREATE TABLE accounts_payable (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  purchase_id uuid NOT NULL,
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 300),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','PAID','CANCELLED')),
  paid_at timestamptz,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, purchase_id),
  CONSTRAINT accounts_payable_purchase_fk FOREIGN KEY (company_id, purchase_id)
    REFERENCES purchases(company_id, id),
  CHECK ((status='PAID' AND paid_at IS NOT NULL) OR (status<>'PAID' AND paid_at IS NULL))
);
CREATE INDEX accounts_payable_company_due_idx ON accounts_payable(company_id, status, due_date, id);

CREATE UNIQUE INDEX inventory_purchase_product_uq
  ON inventory_movements(company_id, source_type, source_id, product_id)
  WHERE source_type='PURCHASE';

CREATE TRIGGER purchase_items_immutable BEFORE UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER purchase_items_no_truncate BEFORE TRUNCATE ON purchase_items
FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
