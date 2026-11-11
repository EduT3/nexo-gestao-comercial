import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { LocalDatabase } from './sqlite.js';

const nameSchema = z.string().trim().min(2).max(100);

/** First installation only; serialized with all database mutations. */
export async function initializeLocalOwner(db: LocalDatabase, input: unknown) {
  const name = nameSchema.parse(input);
  return db.transaction(async tx => {
    if ((await tx.query('SELECT id FROM local_users LIMIT 1')).length) {
      throw new Error('O responsável desta instalação já foi cadastrado.');
    }
    const id = randomUUID();
    await tx.query('INSERT INTO local_users VALUES(?,?,1)', [id, name]);
    const companies = await tx.query('SELECT id FROM local_companies ORDER BY id');
    if (!companies.length) throw new Error('Não foi possível preparar a loja.');
    for (const company of companies) {
      const companyId = String(company.id);
      await tx.query('INSERT INTO local_memberships VALUES(?,?,?,1)', [companyId, id, 'ADMIN']);
      await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',
        [randomUUID(), companyId, id, 'installation.owner.created', id, JSON.stringify({ name })]);
    }
    return { id, name };
  });
}
