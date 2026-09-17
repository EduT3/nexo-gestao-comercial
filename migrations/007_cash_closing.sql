ALTER TABLE cash_registers ADD COLUMN closing_difference_cents bigint;
ALTER TABLE cash_registers ADD COLUMN closing_notes text NOT NULL DEFAULT '' CHECK (length(closing_notes) <= 500);
ALTER TABLE cash_registers ADD COLUMN close_idempotency_key uuid;
ALTER TABLE cash_registers ADD COLUMN close_command_hash text CHECK (close_command_hash IS NULL OR length(close_command_hash)=64);
CREATE UNIQUE INDEX cash_registers_close_key_uq ON cash_registers(company_id,close_idempotency_key) WHERE close_idempotency_key IS NOT NULL;
