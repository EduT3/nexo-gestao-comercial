-- Immutable settlement identities survive reopening and subsequent corrections.
CREATE TABLE title_settlements (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  financial_entry_id uuid NOT NULL,
  payable_id uuid,
  receivable_id uuid,
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (command_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,id),
  UNIQUE(company_id,financial_entry_id),
  UNIQUE(company_id,idempotency_key),
  FOREIGN KEY(company_id,financial_entry_id) REFERENCES financial_entries(company_id,id),
  FOREIGN KEY(company_id,payable_id) REFERENCES accounts_payable(company_id,id),
  FOREIGN KEY(company_id,receivable_id) REFERENCES accounts_receivable(company_id,id),
  CHECK ((payable_id IS NOT NULL AND receivable_id IS NULL) OR (payable_id IS NULL AND receivable_id IS NOT NULL))
);

INSERT INTO title_settlements(id,company_id,financial_entry_id,payable_id,idempotency_key,command_hash,created_at)
SELECT f.id,f.company_id,f.id,f.payable_id,a.payment_idempotency_key,a.payment_command_hash,f.created_at
FROM financial_entries f JOIN accounts_payable a ON a.company_id=f.company_id AND a.id=f.payable_id
WHERE f.source_type='PAYABLE';

INSERT INTO title_settlements(id,company_id,financial_entry_id,receivable_id,idempotency_key,command_hash,created_at)
SELECT f.id,f.company_id,f.id,f.receivable_id,a.receipt_idempotency_key,a.receipt_command_hash,f.created_at
FROM financial_entries f JOIN accounts_receivable a ON a.company_id=f.company_id AND a.id=f.receivable_id
WHERE f.source_type='RECEIVABLE';

CREATE TRIGGER title_settlements_immutable BEFORE UPDATE OR DELETE ON title_settlements
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
