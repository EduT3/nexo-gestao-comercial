import { DatabaseSync } from 'node:sqlite';
import { copyFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { LocalDatabase } from './sqlite.js';
import { LOCAL_CATALOG_SCHEMA } from './catalog.js';
import { LOCAL_RELATED_SCHEMA, LOCAL_PRODUCT_CATEGORY_SCHEMA } from './related-schema.js';
import { LOCAL_STOCK_SCHEMA } from './stock-schema.js';
import { LOCAL_PURCHASE_SCHEMA, LEGACY_LOCAL_PURCHASE_SCHEMA } from './purchase-schema.js';

import { LOCAL_CASH_SCHEMA } from './cash-schema.js';
import { LOCAL_SALE_SCHEMA } from './sale-schema.js';
import { LOCAL_CANCELLATION_SCHEMA } from './cancellation-schema.js';
import { LOCAL_SETTLEMENT_SCHEMA } from './settlement-schema.js';
import { LOCAL_RECEIVABLE_SCHEMA } from './receivable-schema.js';
import { LOCAL_ACCESS_SCHEMA } from './access-schema.js';
/** Inspect only: opening an unknown backup must never migrate or modify it. */
export function validateLocalBackup(file: string) {
  const engine = new DatabaseSync(file, { readOnly: true });
  const reference = new DatabaseSync(':memory:');
  try {
    const version = Number(engine.prepare('PRAGMA user_version').get()?.user_version);
    if (![0,1,2,3,4,5,6,7,8,9,10,11,12].includes(version)) throw new Error('Versão de backup incompatível com este NEXO.');
    reference.exec(LOCAL_CATALOG_SCHEMA);
    if (version >= 2) reference.exec(LOCAL_RELATED_SCHEMA);
    if (version >= 3) reference.exec(LOCAL_PRODUCT_CATEGORY_SCHEMA);
    if (version >= 4) reference.exec(LOCAL_STOCK_SCHEMA);
    if (version >= 5) reference.exec(version>=12?LOCAL_PURCHASE_SCHEMA:LEGACY_LOCAL_PURCHASE_SCHEMA);
    if (version >= 6) reference.exec(LOCAL_CASH_SCHEMA);
    if (version >= 7) reference.exec(LOCAL_SALE_SCHEMA);
    if (version >= 8) reference.exec(LOCAL_CANCELLATION_SCHEMA);
    if (version >= 9) reference.exec(LOCAL_SETTLEMENT_SCHEMA);
    if (version >= 10) reference.exec(LOCAL_RECEIVABLE_SCHEMA);
    if (version >= 11) reference.exec(LOCAL_ACCESS_SCHEMA);
    const definitions = "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name";
    if (JSON.stringify(engine.prepare(definitions).all()) !== JSON.stringify(reference.prepare(definitions).all())) {
      throw new Error('Formato de backup incompatível com esta versão do NEXO.');
    }
    const integrity = engine.prepare('PRAGMA integrity_check').all();
    if (integrity.length !== 1 || integrity[0]?.integrity_check !== 'ok') throw new Error('Cópia de segurança danificada.');
    if (engine.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Cópia contém vínculos inválidos.');
    const companies = engine.prepare('SELECT id FROM local_companies ORDER BY id').all();
    const ids = companies.map(row => row.id);
    if (ids[0] !== 'adega-jg' || ids.length < 1 || ids.length > 2 || (ids.length === 2 && ids[1] !== 'deposito-jg')) {
      throw new Error('O arquivo não pertence ao NEXO.');
    }
    engine.prepare('SELECT id,name,internal_code,price_cents FROM local_products LIMIT 1').all();
    engine.prepare('SELECT company_id,user_id,role,active FROM local_memberships LIMIT 1').all();
    engine.prepare('SELECT id,name,active FROM local_users LIMIT 1').all();
    engine.prepare('SELECT id,company_id,actor_id,action,entity_id,details FROM local_audit LIMIT 1').all();
  } finally { reference.close(); engine.close(); }
}

/** Caller stops operations and owns confirmation before invoking this function. */
export async function restoreLocalBackup(db: LocalDatabase, activeFile: string, backupFile: string,
  replace: (source: string, destination: string) => Promise<void> = rename) {
  const token = randomUUID();
  const staged = `${activeFile}.restore-${token}`;
  const previous = `${activeFile}.before-restore-${token}.sqlite`;
  await copyFile(backupFile, staged);
  try {
    validateLocalBackup(staged);
    await db.backup(previous);
    await db.close();
    // Closed SQLite has checkpointed its WAL. A fresh connection must not see old sidecars.
    for (const suffix of ['-wal', '-shm']) {
      await unlink(`${activeFile}${suffix}`).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
    await replace(staged, activeFile);
    return { previous };
  } catch (error) {
    await unlink(staged).catch(() => undefined);
    throw error;
  }
}
