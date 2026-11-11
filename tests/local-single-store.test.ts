import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { authenticateLocalUser, createLocalOperator, setInitialLocalPassword } from '../src/local/access';
import { checkLocalHealth } from '../src/local/health';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { validateLocalBackup } from '../src/local/recovery';
import { authorizeStartupBackup, stageStartupBackup } from '../src/local/startup-recovery';
import { openLocalDatabase } from '../src/local/sqlite';

it('instala uma loja nova e preserva bases antigas de duas empresas', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-loja-unica-'));
  const fresh = path.join(folder, 'nova.sqlite');
  const legacy = path.join(folder, 'legado.sqlite');
  const db = openLocalDatabase(fresh);
  const old = openLocalDatabase(legacy);
  try {
    await prepareLocalDatabase(old, legacy);
    const original = await old.query('SELECT * FROM local_companies ORDER BY id');
    await prepareLocalDatabase(old, legacy, { singleStore: true });
    expect(await old.query('SELECT * FROM local_companies ORDER BY id')).toEqual(original);
    expect(original).toHaveLength(2);

    await prepareLocalDatabase(db, fresh, { singleStore: true });
    expect(await db.query('SELECT * FROM local_companies')).toEqual([{ id: 'adega-jg', name: 'Minha loja' }]);
    const owner = await initializeLocalOwner(db, 'Responsável de teste');
    await setInitialLocalPassword(db, owner.id, 'senha-temporaria-qa');
    const operator = await createLocalOperator(db, owner.id, {
      name: 'Operador de teste', password: 'senha-operador-qa', companies: ['adega-jg'],
    });
    await expect(authenticateLocalUser(db, operator.id, 'senha-operador-qa')).resolves.toMatchObject({ id: operator.id });
    await expect(checkLocalHealth(db, owner.id)).resolves.toMatchObject({ integrityOk: true, linksOk: true });
    await expect(checkLocalHealth(db, operator.id)).rejects.toThrow('administrador');
    const backup = path.join(folder, 'backup.sqlite');
    await db.backup(backup);
    validateLocalBackup(backup);
    const staged = await stageStartupBackup(backup, folder);
    await expect(authorizeStartupBackup(staged.staged, owner.id)).resolves.toBeUndefined();
    await expect(authorizeStartupBackup(staged.staged, operator.id)).rejects.toThrow('administrador');
    await prepareLocalDatabase(db, fresh, { singleStore: true });
    expect(await db.query('SELECT id FROM local_companies')).toEqual([{ id: 'adega-jg' }]);
  } finally {
    await db.close();
    await old.close();
    await rm(folder, { recursive: true, force: true });
  }
});
