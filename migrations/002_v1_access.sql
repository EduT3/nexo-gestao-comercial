-- V1 has two profiles. The previous migration is immutable, including its checksum.
ALTER TABLE roles DROP CONSTRAINT roles_key_check;
INSERT INTO roles(key,label) VALUES ('ADMIN','Administrador'),('OPERADOR','Operador');

-- Keep a per-membership history before replacing legacy profile keys.
-- ESTOQUE/GARCOM did not have cash/sales access; their links need administrator review
-- before activation in OPERADOR. Users, passwords and previous audit events are preserved.
INSERT INTO audit_logs(id,company_id,actor_name,action,entity_type,entity_id,before_data,after_data)
SELECT gen_random_uuid(),company_id,'Migração de perfis V1','membership.profile_migrated','membership',id,
  jsonb_build_object('role',role_key,'active',active),
  jsonb_build_object('role',CASE WHEN role_key='ADMINISTRADOR' THEN 'ADMIN' ELSE 'OPERADOR' END,
    'active',active AND role_key NOT IN ('ESTOQUE','GARCOM'),
    'reviewRequired',active AND role_key IN ('ESTOQUE','GARCOM'))
FROM company_memberships;

UPDATE company_memberships SET
  active=active AND role_key NOT IN ('ESTOQUE','GARCOM'),
  role_key=CASE WHEN role_key='ADMINISTRADOR' THEN 'ADMIN' ELSE 'OPERADOR' END,
  updated_at=now();
DELETE FROM role_permissions WHERE role_key IN ('ADMINISTRADOR','GERENTE','CAIXA','ESTOQUE','GARCOM');
DELETE FROM roles WHERE key IN ('ADMINISTRADOR','GERENTE','CAIXA','ESTOQUE','GARCOM');
DELETE FROM permissions WHERE key IN ('cash.reopen','orders.manage','orders.cancel');
ALTER TABLE roles ADD CONSTRAINT roles_key_check CHECK (key IN ('ADMIN','OPERADOR'));
