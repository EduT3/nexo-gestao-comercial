-- Phase 2: company-scoped commercial catalog and people.
-- Stock is intentionally not stored here. It becomes authoritative through
-- inventory movements in the next phase.
CREATE TABLE categories (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);
CREATE UNIQUE INDEX categories_company_name_uq ON categories (company_id, lower(name));
CREATE INDEX categories_company_active_name_idx ON categories (company_id, active, name, id);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  tax_id text CHECK (tax_id IS NULL OR length(tax_id) BETWEEN 11 AND 30),
  phone text CHECK (phone IS NULL OR length(phone) <= 40),
  whatsapp text CHECK (whatsapp IS NULL OR length(whatsapp) <= 40),
  email text CHECK (email IS NULL OR length(email) <= 254),
  address text CHECK (address IS NULL OR length(address) <= 500),
  notes text CHECK (notes IS NULL OR length(notes) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);
CREATE UNIQUE INDEX suppliers_company_tax_id_uq ON suppliers (company_id, tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX suppliers_company_active_name_idx ON suppliers (company_id, active, name, id);

CREATE TABLE customers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  tax_id text CHECK (tax_id IS NULL OR length(tax_id) BETWEEN 11 AND 30),
  phone text CHECK (phone IS NULL OR length(phone) <= 40),
  whatsapp text CHECK (whatsapp IS NULL OR length(whatsapp) <= 40),
  address text CHECK (address IS NULL OR length(address) <= 500),
  notes text CHECK (notes IS NULL OR length(notes) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);
CREATE UNIQUE INDEX customers_company_tax_id_uq ON customers (company_id, tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX customers_company_active_name_idx ON customers (company_id, active, name, id);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  internal_code text NOT NULL CHECK (length(trim(internal_code)) BETWEEN 1 AND 60),
  barcode text CHECK (barcode IS NULL OR barcode ~ '^[0-9]{1,64}$'),
  category_id uuid,
  unit text NOT NULL CHECK (unit IN ('UNIT','PACKAGE','BOX','BAG','KG','METER','LITER')),
  cost_cents bigint NOT NULL CHECK (cost_cents >= 0),
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  stock_min numeric(14,3) NOT NULL DEFAULT 0 CHECK (stock_min >= 0),
  supplier_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, internal_code),
  CONSTRAINT products_category_company_fk FOREIGN KEY (company_id, category_id) REFERENCES categories(company_id, id),
  CONSTRAINT products_supplier_company_fk FOREIGN KEY (company_id, supplier_id) REFERENCES suppliers(company_id, id)
);
CREATE UNIQUE INDEX products_company_barcode_uq ON products (company_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX products_company_active_name_idx ON products (company_id, active, name, id);
CREATE INDEX products_company_category_idx ON products (company_id, category_id);
CREATE INDEX products_company_supplier_idx ON products (company_id, supplier_id);
