CREATE TABLE roles (
  key text PRIMARY KEY CHECK (key IN ('ADMINISTRADOR','GERENTE','CAIXA','ESTOQUE','GARCOM')),
  label text NOT NULL
);
CREATE TABLE permissions (key text PRIMARY KEY);
CREATE TABLE role_permissions (
  role_key text NOT NULL REFERENCES roles(key),
  permission_key text NOT NULL REFERENCES permissions(key),
  PRIMARY KEY (role_key, permission_key)
);
CREATE TABLE companies (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  legal_name text NOT NULL CHECK (length(trim(legal_name)) BETWEEN 2 AND 200),
  tax_id text UNIQUE CHECK (tax_id IS NULL OR tax_id ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  kind text NOT NULL CHECK (kind IN ('DEPOSITO','ADEGA')),
  address text NOT NULL DEFAULT '' CHECK (length(address) <= 500),
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE stores (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  address text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);
CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  system_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE company_memberships (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role_key text NOT NULL REFERENCES roles(key),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id),
  UNIQUE (company_id, id)
);
CREATE INDEX memberships_user_active_idx ON company_memberships (user_id, company_id) WHERE active;
CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expires_idx ON sessions(expires_at);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  actor_id uuid REFERENCES users(id),
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (before_data IS NULL OR jsonb_typeof(before_data) = 'object'),
  CHECK (after_data IS NULL OR jsonb_typeof(after_data) = 'object')
);
CREATE INDEX audit_company_created_idx ON audit_logs(company_id, created_at DESC, id DESC);
CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are append-only' USING ERRCODE = '42501';
END;
$$;
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
