import { randomUUID } from 'node:crypto';
import { categorySchema } from '../server/modules/commerce/schemas.js';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';

export async function createLocalCategory(db: LocalDatabase, userId: string, companyId: string, input: unknown) {
  const body = categorySchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, true);
    const id = randomUUID();
    await tx.query('INSERT INTO local_categories VALUES(?,?,?,?,1)', [id, companyId, body.name, body.description ?? null]);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',
      [randomUUID(), companyId, userId, 'category.created', id, JSON.stringify(body)]);
    return { id };
  });
}
export async function listLocalCategories(db: LocalDatabase, userId: string, companyId: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, false);
    return tx.query('SELECT id,name,description,active FROM local_categories WHERE company_id=? ORDER BY name,id', [companyId]);
  });
}
