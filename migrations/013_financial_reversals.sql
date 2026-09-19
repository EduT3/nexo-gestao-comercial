-- Preserve the realized entry; reversal is a separate immutable event.
CREATE TABLE financial_reversals (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  entry_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500),
  actor_id uuid NOT NULL REFERENCES users(id),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (command_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,id),
  UNIQUE(company_id,entry_id),
  UNIQUE(company_id,idempotency_key),
  FOREIGN KEY(company_id,entry_id) REFERENCES financial_entries(company_id,id)
);
CREATE TRIGGER financial_reversals_immutable BEFORE UPDATE OR DELETE ON financial_reversals
  FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
ALTER TABLE cash_movements ADD COLUMN financial_reversal_id uuid;
ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_reversal_company_fk
  FOREIGN KEY(company_id,financial_reversal_id) REFERENCES financial_reversals(company_id,id);
ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_reversal_origin CHECK
  (financial_reversal_id IS NULL OR (financial_entry_id IS NULL AND sale_id IS NULL AND payment_method='CASH' AND type IN ('ENTRY','EXIT')));
CREATE UNIQUE INDEX cash_movements_reversal_once ON cash_movements(company_id,financial_reversal_id)
  WHERE financial_reversal_id IS NOT NULL;
