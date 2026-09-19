import { expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalPerson, listLocalPeople } from '../src/local/people';

it.each(['customer', 'supplier'] as const)('%s preserva dados, valida documentos, isola empresas e desfaz falha tardia', async kind => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-people-'));
  const file = path.join(folder, 'base.sqlite');
  let db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const actor = await initializeLocalOwner(db, 'Responsável');
    const body = { name: 'Pessoa de teste', taxId: '12345678901', phone: '11999999999', whatsapp: '11999999999', address: 'Endereço fictício', notes: 'Teste local' };
    await expect(createLocalPerson(db, actor.id, 'adega-jg', kind, { ...body, taxId: '12' })).rejects.toThrow();
    await createLocalPerson(db, actor.id, 'adega-jg', kind, body);
    await expect(createLocalPerson(db, actor.id, 'adega-jg', kind, body)).rejects.toThrow('já cadastrado');
    expect(await listLocalPeople(db, actor.id, 'deposito-jg', kind)).toHaveLength(0);
    await createLocalPerson(db, actor.id, 'deposito-jg', kind, body);
    await db.close(); db = openLocalDatabase(file);
    expect((await listLocalPeople(db, actor.id, 'adega-jg', kind))[0]).toMatchObject({ ...body, active: true });
    await db.query('UPDATE local_memberships SET role=? WHERE company_id=? AND user_id=?', ['OPERADOR', 'deposito-jg', actor.id]);
    await expect(createLocalPerson(db, actor.id, 'deposito-jg', kind, { name: 'Negado' })).rejects.toThrow('consultar');
    await db.exec("CREATE TRIGGER fail_person BEFORE INSERT ON local_audit BEGIN SELECT RAISE(ABORT,'Falha tardia'); END;");
    await expect(createLocalPerson(db, actor.id, 'adega-jg', kind, { name: 'Rollback' })).rejects.toThrow('Falha tardia');
    expect(await listLocalPeople(db, actor.id, 'adega-jg', kind)).toHaveLength(1);
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
