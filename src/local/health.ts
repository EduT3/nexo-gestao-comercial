import type { LocalDatabase } from './sqlite.js';
import { authorizeLocalCatalog } from './catalog.js';

export type LocalHealth = {
  integrityOk: boolean; linksOk: boolean; databaseBytes: string; checkedAt: string;
};
/** Read-only diagnosis of the whole installation, restricted to its responsible admin. */
export async function checkLocalHealth(db: LocalDatabase, actorId: string): Promise<LocalHealth> {
  return db.transaction(async tx => {
    for (const company of ['adega-jg', 'deposito-jg']) await authorizeLocalCatalog(tx, actorId, company, true);
    const integrity = await tx.query('PRAGMA integrity_check(10)');
    const links = await tx.query('SELECT count(*) AS invalid FROM pragma_foreign_key_check');
    const pages = await tx.query('PRAGMA page_count');
    const size = await tx.query('PRAGMA page_size');
    return {
      integrityOk: integrity.length === 1 && integrity[0]?.integrity_check === 'ok',
      linksOk: links[0]?.invalid === 0n,
      databaseBytes: (BigInt(pages[0]?.page_count as bigint) * BigInt(size[0]?.page_size as bigint)).toString(),
      checkedAt: new Date().toISOString(),
    };
  });
}
