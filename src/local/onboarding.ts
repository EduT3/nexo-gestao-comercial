import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { localStoreNameSchema } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';

const nameSchema = z.string().trim().min(2).max(100);

/** First installation only; serialized with all database mutations. */
export async function initializeLocalOwner(db: LocalDatabase, input: unknown, storeInput?: unknown) {
  const name = nameSchema.parse(input);
  const storeName = storeInput === undefined ? undefined : localStoreNameSchema.parse(storeInput);
  return db.transaction(async tx => {
    if ((await tx.query('SELECT id FROM local_users LIMIT 1')).length) {
      throw new Error('O responsável desta instalação já foi cadastrado.');
    }
    const id = randomUUID();
    await tx.query('INSERT INTO local_users VALUES(?,?,1)', [id, name]);
    const companies = await tx.query('SELECT id FROM local_companies ORDER BY id');
    if (!companies.length) throw new Error('Não foi possível preparar a loja.');
    if (storeName !== undefined) {
      if (companies.length !== 1) throw new Error('Esta instalação já tem mais de uma loja. Edite os nomes em Configurações.');
      await tx.query('UPDATE local_companies SET name=? WHERE id=?', [storeName, String(companies[0]!.id)]);
    }
    for (const company of companies) {
      const companyId = String(company.id);
      await tx.query('INSERT INTO local_memberships VALUES(?,?,?,1)', [companyId, id, 'ADMIN']);
      await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',
        [randomUUID(), companyId, id, 'installation.owner.created', id, JSON.stringify({ name, storeName })]);
    }
    return { id, name };
  });
}
