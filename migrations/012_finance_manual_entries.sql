ALTER TABLE financial_entries
  ADD COLUMN idempotency_key uuid,
  ADD COLUMN command_hash text,
  ADD CONSTRAINT financial_manual_command CHECK (
    (idempotency_key IS NULL AND command_hash IS NULL) OR
    (source_type='MANUAL' AND idempotency_key IS NOT NULL AND command_hash ~ '^[a-f0-9]{64}$')
  );
CREATE UNIQUE INDEX financial_manual_key ON financial_entries(company_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;
