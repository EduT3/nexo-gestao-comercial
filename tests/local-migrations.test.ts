import { expect, it } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { initializeLocalCatalog } from '../src/local/catalog';
import { prepareLocalDatabase } from '../src/local/migrations';
import { restoreLocalBackup, validateLocalBackup } from '../src/local/recovery';

it('adoção do schema preserva dados e cópia anterior; reexecução não altera registros; versão futura recusada', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-migration-'));
  const file = path.join(folder, 'active.sqlite');
  const db = openLocalDatabase(file);
  try {
    await initializeLocalCatalog(db);
    await db.query('INSERT INTO local_users VALUES(?,?,1)', ['owner', 'Responsável']);
    await prepareLocalDatabase(db, file);
    expect(await db.query('PRAGMA user_version')).toEqual([{ user_version: 12n }]);
    const copies = (await readdir(folder)).filter(name => name.includes('before-migration'));
    expect(copies).toHaveLength(1);
    const previous = openLocalDatabase(path.join(folder, copies[0]!));
    expect(await previous.query('PRAGMA user_version')).toEqual([{ user_version: 0n }]);
    expect(await previous.query('SELECT id FROM local_users')).toEqual([{ id: 'owner' }]);
    await previous.close();
    await prepareLocalDatabase(db, file);
    expect(await db.query('SELECT id FROM local_users')).toEqual([{ id: 'owner' }]);
    await db.exec('PRAGMA user_version=13');
    await expect(prepareLocalDatabase(db, file)).rejects.toThrow('outra versão');
    expect(await db.query('PRAGMA user_version')).toEqual([{ user_version: 13n }]);
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});

it('backup v1 restaurado em instalação atual preserva origem e cadastro e permite nova migração', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-v1-restore-'));
  const file = path.join(folder, 'active.sqlite');
  let db = openLocalDatabase(file);
  try {
    await initializeLocalCatalog(db);
    await db.exec('PRAGMA user_version=1');
    await db.query('INSERT INTO local_users VALUES(?,?,1)', ['owner', 'Anterior']);
    const backup = path.join(folder, 'v1.sqlite');
    await db.backup(backup);
    await prepareLocalDatabase(db, file);
    await db.query('INSERT INTO local_categories VALUES(?,?,?,?,1)', ['category', 'adega-jg', 'Posterior', '']);
    await restoreLocalBackup(db, file, backup);
    db = openLocalDatabase(file);
    await prepareLocalDatabase(db, file);
    expect(await db.query('PRAGMA user_version')).toEqual([{ user_version: 12n }]);
    expect(await db.query('SELECT id FROM local_users')).toEqual([{ id: 'owner' }]);
    expect(await db.query('SELECT id FROM local_categories')).toHaveLength(0);
    validateLocalBackup(backup);
    const origin = openLocalDatabase(backup);
    expect(await origin.query('PRAGMA user_version')).toEqual([{ user_version: 1n }]);
    await origin.close();
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
