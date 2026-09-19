-- M3 foundation: authoritative balances change only through immutable movements.
CREATE TABLE inventory_balances (
  company_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, product_id),
  CONSTRAINT inventory_balance_product_fk FOREIGN KEY (company_id, product_id)
    REFERENCES products(company_id, id)
);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  product_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('PURCHASE','ENTRY_MANUAL','SALE','LOSS','ADJUSTMENT')),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  balance_before numeric(14,3) NOT NULL CHECK (balance_before >= 0),
  balance_after numeric(14,3) NOT NULL CHECK (balance_after >= 0),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  actor_id uuid NOT NULL REFERENCES users(id),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (length(command_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, idempotency_key),
  CONSTRAINT inventory_movement_product_fk FOREIGN KEY (company_id, product_id)
    REFERENCES products(company_id, id),
  CONSTRAINT inventory_movement_delta_check CHECK (
    (direction='IN' AND balance_after=balance_before+quantity) OR
    (direction='OUT' AND balance_after=balance_before-quantity)
  )
);
CREATE INDEX inventory_movements_company_created_idx
  ON inventory_movements(company_id, created_at DESC, id DESC);
CREATE INDEX inventory_movements_product_created_idx
  ON inventory_movements(company_id, product_id, created_at DESC, id DESC);

CREATE TRIGGER inventory_movements_immutable BEFORE UPDATE OR DELETE ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER inventory_movements_no_truncate BEFORE TRUNCATE ON inventory_movements
FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
