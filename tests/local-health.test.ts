import { expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalProduct } from '../src/local/catalog';
import { checkLocalHealth } from '../src/local/health';

it('diagnóstico real preserva registros, exige responsável por ambas empresas e detecta vínculos inválidos', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-health-'));
  const file = path.join(folder, 'test.sqlite'), db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Teste diagnóstico');
    await createLocalProduct(db, owner.id, 'adega-jg', { name: 'Produto teste', internalCode: 'TEST', unit: 'UNIT', priceCents: 100, costCents: 50 });
    const before = await db.query('SELECT * FROM local_products');
    const changes = await db.query('SELECT total_changes() AS changes');
    const health = await checkLocalHealth(db, owner.id);
    expect(health).toMatchObject({ integrityOk: true, linksOk: true });
    expect(BigInt(health.databaseBytes)).toBeGreaterThan(0n);
    expect(Number.isNaN(Date.parse(health.checkedAt))).toBe(false);
    expect(await db.query('SELECT total_changes() AS changes')).toEqual(changes);
    expect(await db.query('SELECT * FROM local_products')).toEqual(before);
    await db.query("INSERT INTO local_users VALUES('operator','Operador teste',1)");
    await db.query("INSERT INTO local_memberships VALUES('adega-jg','operator','OPERADOR',1)");
    await expect(checkLocalHealth(db, 'operator')).rejects.toThrow('administrador');
    await expect(checkLocalHealth(db, 'unknown')).rejects.toThrow('acesso ativo');
    await db.query("UPDATE local_memberships SET role='ADMIN' WHERE user_id='operator'");
    await expect(checkLocalHealth(db, 'operator')).rejects.toThrow('acesso ativo');
    await db.exec('PRAGMA foreign_keys=OFF');
    await db.query("INSERT INTO local_memberships VALUES('missing-company','operator','OPERADOR',1)");
    expect(await checkLocalHealth(db, owner.id)).toMatchObject({ integrityOk: true, linksOk: false });
    await db.exec('PRAGMA foreign_keys=ON');
    await db.exec('PRAGMA ignore_check_constraints=ON');
    await db.query("UPDATE local_products SET active=2");
    await db.exec('PRAGMA ignore_check_constraints=OFF');
    expect((await checkLocalHealth(db, owner.id)).integrityOk).toBe(false);
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
