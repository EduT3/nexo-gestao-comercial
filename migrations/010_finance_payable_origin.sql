-- Enforce the payable origin in the database, including company isolation.
ALTER TABLE financial_entries ADD COLUMN payable_id uuid;
UPDATE financial_entries SET payable_id=source_id WHERE source_type='PAYABLE';
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_payable_company_fk
  FOREIGN KEY (company_id,payable_id) REFERENCES accounts_payable(company_id,id);
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_payable_origin_check CHECK (
  (source_type='PAYABLE' AND payable_id IS NOT NULL AND payable_id=source_id)
  OR (source_type<>'PAYABLE' AND payable_id IS NULL)
);
