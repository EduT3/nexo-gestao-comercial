-- M5: traceable settlement of purchase payables and realized expenses.
ALTER TABLE accounts_payable ADD COLUMN category text NOT NULL DEFAULT 'Compras'
  CHECK (length(trim(category)) BETWEEN 1 AND 100);
ALTER TABLE accounts_payable ADD COLUMN payment_method text
  CHECK (payment_method IS NULL OR payment_method IN ('CASH','PIX','DEBIT','CREDIT'));
ALTER TABLE accounts_payable ADD COLUMN paid_by uuid REFERENCES users(id);
ALTER TABLE accounts_payable ADD COLUMN payment_notes text NOT NULL DEFAULT '' CHECK (length(payment_notes) <= 500);
ALTER TABLE accounts_payable ADD COLUMN payment_idempotency_key uuid;
ALTER TABLE accounts_payable ADD COLUMN payment_command_hash text
  CHECK (payment_command_hash IS NULL OR length(payment_command_hash)=64);
ALTER TABLE accounts_payable ADD CONSTRAINT accounts_payable_payment_state_check CHECK (
  (status='PAID' AND paid_at IS NOT NULL AND payment_method IS NOT NULL AND paid_by IS NOT NULL AND payment_idempotency_key IS NOT NULL AND payment_command_hash IS NOT NULL)
  OR
  (status<>'PAID' AND paid_at IS NULL AND payment_method IS NULL AND paid_by IS NULL AND payment_idempotency_key IS NULL AND payment_command_hash IS NULL)
);
CREATE UNIQUE INDEX accounts_payable_payment_key_uq
  ON accounts_payable(company_id,payment_idempotency_key)
  WHERE payment_idempotency_key IS NOT NULL;

ALTER TABLE financial_entries DROP CONSTRAINT financial_entries_source_type_check;
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_source_type_check
  CHECK (source_type IN ('SALE','MANUAL','PAYABLE','RECEIVABLE'));
ALTER TABLE financial_entries ADD COLUMN category text NOT NULL DEFAULT 'Vendas'
  CHECK (length(trim(category)) BETWEEN 1 AND 100);
ALTER TABLE financial_entries ADD COLUMN notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500);
ALTER TABLE financial_entries ADD COLUMN actor_id uuid REFERENCES users(id);

ALTER TABLE cash_movements ADD COLUMN financial_entry_id uuid;
ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_financial_entry_fk
  FOREIGN KEY (company_id,financial_entry_id) REFERENCES financial_entries(company_id,id);
CREATE UNIQUE INDEX cash_movements_financial_entry_uq
  ON cash_movements(company_id,financial_entry_id)
  WHERE financial_entry_id IS NOT NULL;
