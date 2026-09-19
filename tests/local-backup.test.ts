import { it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';

it('backup inclui dados WAL confirmados, preserva origem e recusa sobrescrever cópia existente', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-backup-'));
  const db = openLocalDatabase(path.join(folder, 'active.sqlite'));
  let copy;
  try {
    await db.exec('CREATE TABLE entries(id INTEGER PRIMARY KEY,value INTEGER NOT NULL) STRICT');
    await db.query('INSERT INTO entries VALUES(?,?)', [1, 9007199254740993n]);
    const destination = path.join(folder, 'copy.sqlite');
    await db.backup(destination);
    await db.query('INSERT INTO entries VALUES(?,?)', [2, 42]);
    await expect(db.backup(destination)).rejects.toThrow();
    copy = openLocalDatabase(destination);
    expect(await copy.query('SELECT value FROM entries')).toEqual([{ value: 9007199254740993n }]);
    expect(await copy.query('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await db.query('SELECT id FROM entries')).toHaveLength(2);
    await expect(db.transaction(tx => tx.backup(path.join(folder, 'invalid.sqlite')))).rejects.toThrow('transação');
  } finally {
    if (copy) await copy.close();
    await db.close();
    await rm(folder, { recursive: true, force: true });
  }
});
