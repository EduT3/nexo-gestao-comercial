import { randomUUID } from 'node:crypto';
import { initializeLocalCatalog } from './catalog.js';
import { validateLocalBackup } from './recovery.js';
import type { LocalDatabase } from './sqlite.js';
import { LOCAL_RELATED_SCHEMA, LOCAL_PRODUCT_CATEGORY_SCHEMA } from './related-schema.js';
import { LOCAL_STOCK_SCHEMA } from './stock-schema.js';
import { LOCAL_PURCHASE_SCHEMA, OPTIONAL_SUPPLIER_MIGRATION } from './purchase-schema.js';

import { LOCAL_CASH_SCHEMA } from './cash-schema.js';
import { LOCAL_SALE_SCHEMA } from './sale-schema.js';
import { LOCAL_CANCELLATION_SCHEMA } from './cancellation-schema.js';
import { LOCAL_SETTLEMENT_SCHEMA } from './settlement-schema.js';
import { LOCAL_RECEIVABLE_SCHEMA } from './receivable-schema.js';
import { LOCAL_ACCESS_SCHEMA } from './access-schema.js';
export const LOCAL_SCHEMA_VERSION = 12;

export async function prepareLocalDatabase(db: LocalDatabase, activeFile: string, { singleStore = false } = {}) {
  const version = Number((await db.query('PRAGMA user_version'))[0]?.user_version);
  if (version > LOCAL_SCHEMA_VERSION || version < 0 || !Number.isInteger(version)) {
    throw new Error('Esta base foi criada por outra versão do NEXO. Use uma versão compatível do programa.');
  }
  const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (tables.length) {
    if (version < LOCAL_SCHEMA_VERSION) {
      // Preserve the unversioned foundation before marking it as version 1.
      const previous = `${activeFile}.before-migration-${randomUUID()}.sqlite`;
      await db.backup(previous);
      validateLocalBackup(previous);
    } else {
      // Validation uses a consistent copy, including committed WAL changes.
      const check = `${activeFile}.validation-${randomUUID()}.sqlite`;
      const { unlink } = await import('node:fs/promises');
      try { await db.backup(check); validateLocalBackup(check); }
      finally { await unlink(check).catch(() => undefined); }
    }
  } else if (version !== 0) {
    throw new Error('A base versionada está incompleta. Recupere uma cópia de segurança.');
  }
  if (!tables.length) await initializeLocalCatalog(db, singleStore);
  if (version < LOCAL_SCHEMA_VERSION) await db.transaction(async tx => {
    if (version < 2) await tx.exec(LOCAL_RELATED_SCHEMA);
    if (version < 3) await tx.exec(LOCAL_PRODUCT_CATEGORY_SCHEMA);
    if (version < 4) await tx.exec(LOCAL_STOCK_SCHEMA);
    if (version < 5) await tx.exec(LOCAL_PURCHASE_SCHEMA);
    if (version < 6) await tx.exec(LOCAL_CASH_SCHEMA);
    if (version < 7) await tx.exec(LOCAL_SALE_SCHEMA);
    if (version < 8) await tx.exec(LOCAL_CANCELLATION_SCHEMA);
    if (version < 9) await tx.exec(LOCAL_SETTLEMENT_SCHEMA);
    if (version < 10) await tx.exec(LOCAL_RECEIVABLE_SCHEMA);
    if(version<11)await tx.exec(LOCAL_ACCESS_SCHEMA);
    if(version>=5)await tx.exec(OPTIONAL_SUPPLIER_MIGRATION);
    if((await tx.query('PRAGMA foreign_key_check')).length)throw new Error('A atualização encontrou vínculos inválidos. A base anterior foi preservada.');
    await tx.exec(`PRAGMA user_version=${LOCAL_SCHEMA_VERSION}`);
  });
}
