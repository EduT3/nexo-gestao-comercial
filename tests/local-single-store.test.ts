import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { authenticateLocalUser, createLocalOperator, setInitialLocalPassword } from '../src/local/access';
import { renameLocalStore } from '../src/local/catalog';
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
    await expect(initializeLocalOwner(old, 'Responsável legado', 'Nome indevido')).rejects.toThrow('mais de uma loja');
    const legacyOwner = await initializeLocalOwner(old, 'Responsável legado');
    const legacyLinks = await old.query('SELECT * FROM local_memberships ORDER BY company_id');
    expect(legacyLinks).toHaveLength(2);
    await renameLocalStore(old, legacyOwner.id, 'deposito-jg', 'Loja do Centro');
    expect(await old.query('SELECT * FROM local_memberships ORDER BY company_id')).toEqual(legacyLinks);
    expect(await old.query('SELECT * FROM local_companies ORDER BY id')).toEqual([
      original[0], { id: 'deposito-jg', name: 'Loja do Centro' },
    ]);

    await prepareLocalDatabase(db, fresh, { singleStore: true });
    expect(await db.query('SELECT * FROM local_companies')).toEqual([{ id: 'adega-jg', name: 'Minha loja' }]);
    const owner = await initializeLocalOwner(db, 'Responsável de teste', '  Loja QA  ');
    expect(await db.query('SELECT name FROM local_companies')).toEqual([{ name: 'Loja QA' }]);
    await setInitialLocalPassword(db, owner.id, 'senha-temporaria-qa');
    const operator = await createLocalOperator(db, owner.id, {
      name: 'Operador de teste', password: 'senha-operador-qa', companies: ['adega-jg'],
    });
    await expect(authenticateLocalUser(db, operator.id, 'senha-operador-qa')).resolves.toMatchObject({ id: operator.id });
    await expect(checkLocalHealth(db, owner.id)).resolves.toMatchObject({ integrityOk: true, linksOk: true });
    await expect(checkLocalHealth(db, operator.id)).rejects.toThrow('administrador');
    await expect(renameLocalStore(db, operator.id, 'adega-jg', 'Outra loja')).rejects.toThrow('administrador');
    await renameLocalStore(db, owner.id, 'adega-jg', 'Mercado QA');
    expect(await db.query("SELECT action FROM local_audit WHERE action='store.renamed'")).toEqual([{ action: 'store.renamed' }]);
    const backup = path.join(folder, 'backup.sqlite');
    await db.backup(backup);
    validateLocalBackup(backup);
    const staged = await stageStartupBackup(backup, folder);
    await expect(authorizeStartupBackup(staged.staged, owner.id)).resolves.toBeUndefined();
    await expect(authorizeStartupBackup(staged.staged, operator.id)).rejects.toThrow('administrador');
    await prepareLocalDatabase(db, fresh, { singleStore: true });
    expect(await db.query('SELECT id,name FROM local_companies')).toEqual([{ id: 'adega-jg', name: 'Mercado QA' }]);
  } finally {
    await db.close();
    await old.close();
    await rm(folder, { recursive: true, force: true });
  }
});
