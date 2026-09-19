import { expect, it } from 'vitest';
import { openLocalDatabase } from '../src/local/sqlite';
import { initializeLocalCatalog } from '../src/local/catalog';
import { initializeLocalOwner } from '../src/local/onboarding';

it('primeira configuração cria responsável e vínculos uma única vez, inclusive em chamadas concorrentes', async () => {
  const db = openLocalDatabase(':memory:');
  try {
    await initializeLocalCatalog(db);
    await expect(initializeLocalOwner(db, ' ')).rejects.toThrow();
    const results = await Promise.allSettled([
      initializeLocalOwner(db, 'Eduardo'), initializeLocalOwner(db, 'Outro responsável'),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.query('SELECT id FROM local_users')).toHaveLength(1);
    expect(await db.query('SELECT user_id FROM local_memberships')).toHaveLength(2);
    expect(await db.query('SELECT id FROM local_audit')).toHaveLength(2);
  } finally { await db.close(); }
});

it('falha na auditoria da configuração desfaz usuário e vínculos', async () => {
  const db = openLocalDatabase(':memory:');
  try {
    await initializeLocalCatalog(db);
    await db.exec("CREATE TRIGGER fail_setup BEFORE INSERT ON local_audit BEGIN SELECT RAISE(ABORT,'Falha de configuração'); END;");
    await expect(initializeLocalOwner(db, 'Eduardo')).rejects.toThrow('Falha de configuração');
    expect(await db.query('SELECT id FROM local_users')).toHaveLength(0);
    expect(await db.query('SELECT user_id FROM local_memberships')).toHaveLength(0);
  } finally { await db.close(); }
});
