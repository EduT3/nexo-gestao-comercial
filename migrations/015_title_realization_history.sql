ALTER TABLE financial_entries DROP CONSTRAINT financial_entries_company_id_source_type_source_id_key;
CREATE UNIQUE INDEX financial_entries_single_origin_uq
ON financial_entries(company_id,source_type,source_id)
WHERE source_type NOT IN ('PAYABLE','RECEIVABLE');

CREATE FUNCTION validate_title_settlement_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM financial_entries f WHERE f.company_id=NEW.company_id AND f.id=NEW.financial_entry_id
    AND ((f.source_type='PAYABLE' AND f.payable_id=NEW.payable_id AND NEW.receivable_id IS NULL)
      OR (f.source_type='RECEIVABLE' AND f.receivable_id=NEW.receivable_id AND NEW.payable_id IS NULL))
  ) THEN
    RAISE EXCEPTION 'Settlement does not match financial entry origin' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER title_settlements_origin BEFORE INSERT ON title_settlements
FOR EACH ROW EXECUTE FUNCTION validate_title_settlement_origin();
