CREATE TABLE accounts_receivable (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  customer_id uuid,
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 300),
  category text NOT NULL CHECK (length(trim(category)) BETWEEN 1 AND 100),
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN 1 AND 9999999999),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RECEIVED','CANCELLED')),
  notes text NOT NULL DEFAULT '' CHECK (length(notes)<=500),
  actor_id uuid NOT NULL REFERENCES users(id),
  idempotency_key uuid NOT NULL,
  command_hash text NOT NULL CHECK (length(command_hash)=64),
  received_at timestamptz,
  received_by uuid REFERENCES users(id),
  payment_method text CHECK (payment_method IN ('CASH','PIX','DEBIT','CREDIT')),
  receipt_notes text NOT NULL DEFAULT '' CHECK (length(receipt_notes)<=500),
  receipt_idempotency_key uuid,
  receipt_command_hash text CHECK (receipt_command_hash IS NULL OR length(receipt_command_hash)=64),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,id),
  UNIQUE(company_id,idempotency_key),
  UNIQUE(company_id,receipt_idempotency_key),
  FOREIGN KEY(company_id,customer_id) REFERENCES customers(company_id,id),
  CHECK (
    (status='RECEIVED' AND received_at IS NOT NULL AND received_by IS NOT NULL AND payment_method IS NOT NULL AND receipt_idempotency_key IS NOT NULL AND receipt_command_hash IS NOT NULL)
    OR (status<>'RECEIVED' AND received_at IS NULL AND received_by IS NULL AND payment_method IS NULL AND receipt_idempotency_key IS NULL AND receipt_command_hash IS NULL)
  )
);
CREATE INDEX accounts_receivable_company_due_idx ON accounts_receivable(company_id,status,due_date,id);

ALTER TABLE financial_entries ADD COLUMN receivable_id uuid;
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_receivable_company_fk
  FOREIGN KEY(company_id,receivable_id) REFERENCES accounts_receivable(company_id,id);
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_receivable_origin_check CHECK (
  (source_type='RECEIVABLE' AND receivable_id IS NOT NULL AND receivable_id=source_id)
  OR (source_type<>'RECEIVABLE' AND receivable_id IS NULL)
);
