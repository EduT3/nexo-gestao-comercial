import { expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { initializeLocalCatalog } from '../src/local/catalog';
import { restoreLocalBackup, validateLocalBackup } from '../src/local/recovery';

it('restaura cópia validada, preserva estado anterior e rejeita arquivo inválido sem tocar origem', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-recovery-'));
  const activeFile = path.join(folder, 'active.sqlite');
  let db = openLocalDatabase(activeFile);
  let previous;
  try {
    await initializeLocalCatalog(db);
    await db.query('INSERT INTO local_users VALUES(?,?,1)', ['first', 'Primeiro']);
    const backup = path.join(folder, 'backup.sqlite');
    await db.backup(backup);
    const incompatible = path.join(folder, 'incompatible.sqlite');
    await db.backup(incompatible);
    const altered = openLocalDatabase(incompatible);
    await altered.exec('DROP TRIGGER local_audit_immutable_delete');
    await altered.close();
    expect(() => validateLocalBackup(incompatible)).toThrow('incompatível');
    await db.query('INSERT INTO local_users VALUES(?,?,1)', ['later', 'Posterior']);
    const invalid = path.join(folder, 'invalid.sqlite');
    await writeFile(invalid, 'arquivo inválido');
    expect(() => validateLocalBackup(invalid)).toThrow();
    await expect(restoreLocalBackup(db, activeFile, invalid)).rejects.toThrow();
    expect(await db.query('SELECT id FROM local_users')).toHaveLength(2);
    await expect(restoreLocalBackup(db, activeFile, backup, async () => {
      throw new Error('Arquivo ocupado');
    })).rejects.toThrow('Arquivo ocupado');
    db = openLocalDatabase(activeFile);
    expect(await db.query('SELECT id FROM local_users')).toHaveLength(2);
    const result = await restoreLocalBackup(db, activeFile, backup);
    db = openLocalDatabase(activeFile);
    expect(await db.query('SELECT id FROM local_users')).toEqual([{ id: 'first' }]);
    previous = openLocalDatabase(result.previous);
    expect(await previous.query('SELECT id FROM local_users')).toHaveLength(2);
  } finally {
    if (previous) await previous.close();
    await db.close();
    await rm(folder, { recursive: true, force: true });
  }
});
