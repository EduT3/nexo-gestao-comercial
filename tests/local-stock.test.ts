import { expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalProduct } from '../src/local/catalog';
import { appendStockMovement, listLocalStock, listLocalStockHistory } from '../src/local/stock';
import { validateLocalBackup } from '../src/local/recovery';

it('estoque local exato, sem saldo negativo, histórico imutável, isolamento e rollback', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-stock-'));
  const file = path.join(folder, 'active.sqlite');
  let db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Responsável');
    const product = await createLocalProduct(db, owner.id, 'adega-jg', { name: 'Mercadoria', internalCode: 'STOCK-1', unit: 'KG', costCents: 100, priceCents: 200 });
    const input = { companyId: 'adega-jg', productId: product.id, actorId: owner.id, quantityMilli: 1250n, unitCostCents: 100n, reason: 'PURCHASE' as const, operationId: 'purchase-1' };
    await db.transaction(tx => appendStockMovement(tx, input));
    await expect(db.transaction(tx => appendStockMovement(tx, input))).rejects.toThrow();
    await expect(db.transaction(tx => appendStockMovement(tx, { ...input, companyId: 'deposito-jg' }))).rejects.toThrow('nesta empresa');
    await expect(db.query('INSERT INTO local_stock_movements(id,company_id,product_id,actor_id,quantity_milli,unit_cost_cents,reason,operation_id) VALUES(?,?,?,?,?,?,?,?)', ['cross', 'deposito-jg', product.id, owner.id, 1n, 0n, 'PURCHASE', 'cross'])).rejects.toThrow();
    await expect(db.transaction(tx => appendStockMovement(tx, { ...input, quantityMilli: -1251n, reason: 'SALE', operationId: 'sale-fail' }))).rejects.toThrow('insuficiente');
    await db.transaction(tx => appendStockMovement(tx, { ...input, quantityMilli: -250n, reason: 'SALE', operationId: 'sale-1' }));
    await expect(db.transaction(async tx => {
      await appendStockMovement(tx, { ...input, operationId: 'rollback' });
      throw new Error('Falha posterior');
    })).rejects.toThrow('Falha posterior');
    expect((await listLocalStock(db, owner.id, 'adega-jg'))[0]?.balance_milli).toBe(1000n);
    expect(await listLocalStock(db, owner.id, 'deposito-jg')).toHaveLength(0);
    await expect(db.query('UPDATE local_stock_movements SET quantity_milli=1')).rejects.toThrow('imutável');
    await expect(db.query('DELETE FROM local_stock_movements')).rejects.toThrow('imutável');
    const history = await listLocalStockHistory(db, owner.id, 'adega-jg', { productId: product.id });
    expect(history.hasMore).toBe(false);
    expect(history.rows.map(row => row.quantity_milli)).toEqual([-250n,1250n]);
    expect(history.rows[0]).toMatchObject({ actor_name: 'Responsável', operation_id: 'sale-1' });
    expect(history.rows.every(row => row.unit_cost_cents === undefined)).toBe(true);
    expect((await listLocalStockHistory(db, owner.id, 'deposito-jg')).rows).toHaveLength(0);
    await expect(listLocalStockHistory(db, owner.id, 'deposito-jg', { productId: product.id })).rejects.toThrow('nesta empresa');
    await expect(listLocalStockHistory(db, owner.id, 'adega-jg', { offset: -1 })).rejects.toThrow();
    const backup = path.join(folder, 'backup.sqlite');
    await db.backup(backup); validateLocalBackup(backup);
    await db.close(); db = openLocalDatabase(file);
    await prepareLocalDatabase(db, file);
    expect((await listLocalStock(db, owner.id, 'adega-jg'))[0]?.balance_milli).toBe(1000n);
    for (let i = 0; i < 51; i++) await db.transaction(tx => appendStockMovement(tx, { ...input, quantityMilli: 1n, operationId: `page-${i}` }));
    const first = await listLocalStockHistory(db, owner.id, 'adega-jg');
    const second = await listLocalStockHistory(db, owner.id, 'adega-jg', { offset: 50 });
    expect(first.hasMore).toBe(true); expect(first.rows).toHaveLength(50);
    expect(second.hasMore).toBe(false); expect(second.rows).toHaveLength(3);
    expect(new Set([...first.rows,...second.rows].map(row => row.id)).size).toBe(53);
    await db.query('UPDATE local_memberships SET active=0 WHERE company_id=? AND user_id=?', ['adega-jg', owner.id]);
    await expect(listLocalStockHistory(db, owner.id, 'adega-jg')).rejects.toThrow('acesso ativo');
    await expect(listLocalStock(db, owner.id, 'adega-jg')).rejects.toThrow('acesso ativo');
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
