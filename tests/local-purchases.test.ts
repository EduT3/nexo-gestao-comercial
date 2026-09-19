import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalProduct } from '../src/local/catalog';
import { createLocalPerson } from '../src/local/people';
import { receiveLocalPurchase } from '../src/local/purchases';
import { listLocalStock } from '../src/local/stock';
import { validateLocalBackup } from '../src/local/recovery';

it('compra local grava estoque, título e auditoria atomicamente; reexecução e isolamento', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-purchase-'));
  const file = path.join(folder, 'active.sqlite');
  let db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Responsável');
    const supplier = await createLocalPerson(db, owner.id, 'adega-jg', 'supplier', { name: 'Fornecedor' });
    const product = await createLocalProduct(db, owner.id, 'adega-jg', { name: 'Mercadoria', internalCode: 'PUR-1', unit: 'KG', costCents: 100, priceCents: 200 });
    const body = { supplierId: supplier.id, items: [{ productId: product.id, quantity: '1.255', unitCostCents: 101 }], payable: { dueDate: '2026-10-01' } };
    const key = randomUUID();
    const results = await Promise.all([receiveLocalPurchase(db, owner.id, 'adega-jg', key, body), receiveLocalPurchase(db, owner.id, 'adega-jg', key, body)]);
    expect(results.map(result => result.replayed)).toEqual([false, true]);
    expect(results[0]?.totalCents).toBe(127n);
    expect((await listLocalStock(db, owner.id, 'adega-jg'))[0]?.balance_milli).toBe(1255n);
    expect(await db.query('SELECT amount_cents FROM local_purchase_payables')).toEqual([{ amount_cents: 127n }]);
    expect(await db.query("SELECT id FROM local_audit WHERE action='purchase.received'")).toHaveLength(1);
    await expect(receiveLocalPurchase(db, owner.id, 'adega-jg', key, { ...body, notes: 'Alterado' })).rejects.toThrow('outra compra');
    await expect(receiveLocalPurchase(db, owner.id, 'deposito-jg', randomUUID(), body)).rejects.toThrow('fornecedor ativo');
    await db.exec("CREATE TRIGGER fail_purchase_audit BEFORE INSERT ON local_audit WHEN NEW.action='purchase.received' BEGIN SELECT RAISE(ABORT,'Falha de auditoria'); END;");
    await expect(receiveLocalPurchase(db, owner.id, 'adega-jg', randomUUID(), body)).rejects.toThrow('Falha de auditoria');
    expect(await db.query('SELECT id FROM local_purchases')).toHaveLength(1);
    expect(await db.query('SELECT id FROM local_stock_movements')).toHaveLength(1);
    expect(await db.query('SELECT id FROM local_purchase_payables')).toHaveLength(1);
    await db.exec('DROP TRIGGER fail_purchase_audit');
    const backup = path.join(folder, 'backup.sqlite');
    await db.backup(backup); validateLocalBackup(backup);
    await db.close(); db = openLocalDatabase(file); await prepareLocalDatabase(db, file);
    expect((await receiveLocalPurchase(db, owner.id, 'adega-jg', key, body)).replayed).toBe(true);
    await db.query("UPDATE local_memberships SET role='OPERADOR' WHERE company_id=? AND user_id=?", ['adega-jg', owner.id]);
    await expect(receiveLocalPurchase(db, owner.id, 'adega-jg', randomUUID(), body)).rejects.toThrow('perfil');
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
