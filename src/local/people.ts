import { randomUUID } from 'node:crypto';
import { customerSchema, supplierSchema } from '../server/modules/commerce/schemas.js';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';

type PersonKind = 'customer' | 'supplier';
function catalog(kind: PersonKind) {
  if (kind === 'customer') return { table: 'local_customers', schema: customerSchema };
  if (kind === 'supplier') return { table: 'local_suppliers', schema: supplierSchema };
  throw new Error('Tipo de cadastro inválido.');
}
export async function createLocalPerson(db: LocalDatabase, userId: string, companyId: string, kind: PersonKind, input: unknown) {
  const definition = catalog(kind);
  const body = definition.schema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, true);
    if (body.taxId) {
      const duplicate = await tx.query(`SELECT id FROM ${definition.table} WHERE company_id=? AND json_extract(payload,'$.taxId')=?`, [companyId, body.taxId]);
      if (duplicate.length) throw new Error('CPF/CNPJ já cadastrado nesta empresa. Consulte o cadastro existente.');
    }
    const id = randomUUID();
    await tx.query(`INSERT INTO ${definition.table} VALUES(?,?,?,?,1)`, [id, companyId, body.name, JSON.stringify(body)]);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',
      [randomUUID(), companyId, userId, `${kind}.created`, id, JSON.stringify(body)]);
    return { id };
  });
}
export async function listLocalPeople(db: LocalDatabase, userId: string, companyId: string, kind: PersonKind) {
  const definition = catalog(kind);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, false);
    const rows = await tx.query(`SELECT id,payload,active FROM ${definition.table} WHERE company_id=? ORDER BY name,id`, [companyId]);
    return rows.map(row => ({ ...definition.schema.parse(JSON.parse(String(row.payload))), id: String(row.id), active: row.active === 1n }));
  });
}
