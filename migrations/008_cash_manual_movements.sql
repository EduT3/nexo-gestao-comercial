ALTER TABLE cash_movements ADD COLUMN idempotency_key uuid;
ALTER TABLE cash_movements ADD COLUMN command_hash text CHECK (command_hash IS NULL OR length(command_hash)=64);
CREATE UNIQUE INDEX cash_movements_idempotency_uq ON cash_movements(company_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
