-- Original items/payments remain immutable; cancellation is a separate event.
CREATE TABLE sale_cancellations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  sale_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500),
  actor_id uuid NOT NULL REFERENCES users(id),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (command_hash ~ '^[a-f0-9]{64}$'),
  financial_reversal_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,id),
  UNIQUE(company_id,sale_id),
  UNIQUE(company_id,idempotency_key),
  UNIQUE(company_id,financial_reversal_id),
  FOREIGN KEY(company_id,sale_id) REFERENCES sales(company_id,id),
  FOREIGN KEY(company_id,financial_reversal_id) REFERENCES financial_reversals(company_id,id)
);
CREATE TRIGGER sale_cancellations_immutable BEFORE UPDATE OR DELETE ON sale_cancellations
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

ALTER TABLE inventory_movements DROP CONSTRAINT inventory_movements_source_type_check;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_source_type_check
CHECK (source_type IS NULL OR source_type IN ('PURCHASE','SALE','SALE_CANCELLATION'));
ALTER TABLE inventory_movements ADD COLUMN sale_cancellation_id uuid;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_cancellation_company_fk
FOREIGN KEY(company_id,sale_cancellation_id) REFERENCES sale_cancellations(company_id,id);
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_cancellation_origin_check CHECK (
  (source_type='SALE_CANCELLATION' AND sale_cancellation_id IS NOT NULL AND source_id=sale_cancellation_id AND source_id IS NOT NULL AND type='ADJUSTMENT' AND direction='IN')
  OR (source_type IS DISTINCT FROM 'SALE_CANCELLATION' AND sale_cancellation_id IS NULL)
);
CREATE UNIQUE INDEX inventory_cancellation_product_uq ON inventory_movements(company_id,sale_cancellation_id,product_id)
WHERE sale_cancellation_id IS NOT NULL;

CREATE FUNCTION validate_sale_cancellation_reversal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM financial_reversals r JOIN financial_entries f
      ON f.company_id=r.company_id AND f.id=r.entry_id
    WHERE r.company_id=NEW.company_id AND r.id=NEW.financial_reversal_id
      AND f.source_type='SALE' AND f.source_id=NEW.sale_id
  ) THEN
    RAISE EXCEPTION 'Cancellation reversal does not belong to sale' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER sale_cancellation_reversal_origin BEFORE INSERT ON sale_cancellations
FOR EACH ROW EXECUTE FUNCTION validate_sale_cancellation_reversal();
