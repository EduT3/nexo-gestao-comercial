import { expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalOperator, setInitialLocalPassword } from '../src/local/access';
import { createTutorialPreferences } from '../src/local/tutorial-preferences';

it('tutorial: persists independently by actor/company; rejects unauthorized scopes and invalid input without business writes', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-tutorial-unit-'));
  const file = path.join(folder, 'test.sqlite');
  const db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Teste tutorial');
    await setInitialLocalPassword(db, owner.id, 'Teste-local-123');
    const operator = await createLocalOperator(db, owner.id, { name: 'Operador fictício', password: 'Teste-local-123', companies: ['adega-jg'] });
    const auditBefore = await db.query('SELECT * FROM local_audit ORDER BY id');
    const store = createTutorialPreferences(db, folder);
    expect(await store.read(owner.id, 'adega-jg')).toEqual({ version: 1, state: 'welcome', step: 'company' });
    await Promise.all([
      store.write(owner.id, 'adega-jg', { version: 1, state: 'disabled', step: 'sales' }),
      store.write(owner.id, 'deposito-jg', { version: 1, state: 'paused', step: 'cash' }),
      store.write(operator.id, 'adega-jg', { version: 1, state: 'completed', step: 'sales' }),
    ]);
    const reopened = createTutorialPreferences(db, folder);
    expect((await reopened.read(owner.id, 'adega-jg')).state).toBe('disabled');
    expect((await reopened.read(owner.id, 'deposito-jg')).step).toBe('cash');
    expect((await reopened.read(operator.id, 'adega-jg')).state).toBe('completed');
    await expect(store.read(operator.id, 'deposito-jg')).rejects.toThrow('acesso ativo');
    await expect(store.write(operator.id, 'deposito-jg', { version: 1, state: 'active', step: 'company' })).rejects.toThrow('acesso ativo');
    await expect(store.write(owner.id, 'adega-jg', { version: 1, state: 'disabled', step: 'sales', userId: operator.id })).rejects.toThrow();
    await expect(store.write(owner.id, 'adega-jg', { version: 1, state: 'active', step: '../../file' })).rejects.toThrow();
    await db.query('UPDATE local_memberships SET active=0 WHERE user_id=?', [operator.id]);
    await expect(store.read(operator.id, 'adega-jg')).rejects.toThrow('acesso ativo');
    expect(await db.query('SELECT * FROM local_audit ORDER BY id')).toEqual(auditBefore);
    expect(await db.query('SELECT id FROM local_products')).toEqual([]);
    const files = await readdir(path.join(folder, 'tutorial-preferences'));
    expect(files).toHaveLength(3);
    expect(files.every(name => /^[a-f0-9]{64}\.json$/.test(name))).toBe(true);
  } finally { await db.close(); }
});

it('tutorial: reports malformed preferences without silently replacing the file; explicit save recovers', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-tutorial-corrupt-'));
  const file = path.join(folder, 'test.sqlite');
  const db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Teste tutorial');
    const store = createTutorialPreferences(db, folder);
    const choice = { version: 1, state: 'disabled', step: 'company' };
    await store.write(owner.id, 'adega-jg', choice);
    const preferenceFile = path.join(folder, 'tutorial-preferences', (await readdir(path.join(folder, 'tutorial-preferences')))[0]!);
    await writeFile(preferenceFile, '{broken', 'utf8');
    await expect(store.read(owner.id, 'adega-jg')).rejects.toThrow('Não foi possível ler');
    expect(await readFile(preferenceFile, 'utf8')).toBe('{broken');
    await store.write(owner.id, 'adega-jg', choice);
    expect(await store.read(owner.id, 'adega-jg')).toEqual(choice);
  } finally { await db.close(); }
});
