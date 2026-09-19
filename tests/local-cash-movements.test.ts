import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { openLocalCash, closeLocalCash, moveLocalCash, listLocalCash } from '../src/local/cash';
it('suprimento/sangria: saldo exato, reexecução, rollback, permissões e caixa fechado', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-cash-move-')); const file = path.join(folder, 'active.sqlite');
  const db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file); const owner = await initializeLocalOwner(db, 'Responsável');
    const session = await openLocalCash(db, owner.id, 'adega-jg', randomUUID(), { openingCents: 100 });
    const key = randomUUID(); const input = { sessionId: session.id, kind: 'SUPPLY', amountCents: 250, notes: 'Troco adicional' };
    await moveLocalCash(db, owner.id, 'adega-jg', key, input);
    expect((await moveLocalCash(db, owner.id, 'adega-jg', key, input)).replayed).toBe(true);
    await expect(moveLocalCash(db, owner.id, 'adega-jg', key, { ...input, notes: 'Diferente' })).rejects.toThrow('outro movimento');
    await expect(moveLocalCash(db, owner.id, 'deposito-jg', randomUUID(), input)).rejects.toThrow('nesta empresa');
    await expect(moveLocalCash(db, owner.id, 'adega-jg', randomUUID(), { ...input, kind: 'WITHDRAWAL', amountCents: 351 })).rejects.toThrow('insuficiente');
    await moveLocalCash(db, owner.id, 'adega-jg', randomUUID(), { ...input, kind: 'WITHDRAWAL', amountCents: 50 });
    await db.exec("CREATE TRIGGER fail_movement BEFORE INSERT ON local_audit WHEN NEW.action='cash.moved' BEGIN SELECT RAISE(ABORT,'Falha auditoria'); END;");
    await expect(moveLocalCash(db, owner.id, 'adega-jg', randomUUID(), input)).rejects.toThrow('Falha auditoria');
    expect((await listLocalCash(db, owner.id, 'adega-jg'))[0]?.balance_cents).toBe(300n);
    expect((await listLocalCash(db, owner.id, 'adega-jg'))[0]?.movements).toHaveLength(2);
    await db.exec('DROP TRIGGER fail_movement');
    await db.query("UPDATE local_memberships SET role='OPERADOR' WHERE company_id=? AND user_id=?", ['adega-jg', owner.id]);
    await expect(moveLocalCash(db, owner.id, 'adega-jg', randomUUID(), input)).rejects.toThrow('perfil');
    await db.query("UPDATE local_memberships SET role='ADMIN' WHERE company_id=? AND user_id=?", ['adega-jg', owner.id]);
    await closeLocalCash(db, owner.id, 'adega-jg', session.id, { countedCents: 299 });
    expect((await listLocalCash(db, owner.id, 'adega-jg'))[0]?.closure).toMatchObject({ expected_cents: 300n, counted_cents: 299n });
    await expect(moveLocalCash(db, owner.id, 'adega-jg', randomUUID(), input)).rejects.toThrow('Caixa fechado');
    expect((await moveLocalCash(db, owner.id, 'adega-jg', key, input)).replayed).toBe(true);
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});