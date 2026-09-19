import { it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalCategory, listLocalCategories } from '../src/local/categories';
import { createLocalProduct, listLocalProducts, updateLocalProduct } from '../src/local/catalog';

it('categorias reais isoladas, duplicidade recusada, autorização e auditoria atômicas', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-category-'));
  const file = path.join(folder, 'base.sqlite');
  const db = openLocalDatabase(file);
  try {
    await prepareLocalDatabase(db, file);
    const owner = await initializeLocalOwner(db, 'Responsável');
    const body = { name: 'Bebidas', description: 'Categoria de teste' };
    const adega = await createLocalCategory(db, owner.id, 'adega-jg', body);
    await expect(createLocalCategory(db, owner.id, 'adega-jg', body)).rejects.toThrow();
    expect(await listLocalCategories(db, owner.id, 'deposito-jg')).toHaveLength(0);
    const deposito = await createLocalCategory(db, owner.id, 'deposito-jg', body);
    const productBody = { name: 'Produto categorizado', internalCode: 'CATEGORY-1', unit: 'UNIT', costCents: 100, priceCents: 200, stockMin: '0', categoryId: adega.id };
    const product = await createLocalProduct(db, owner.id, 'adega-jg', productBody);
    await updateLocalProduct(db, owner.id, 'adega-jg', product.id, { priceCents: 250 });
    expect((await listLocalProducts(db, owner.id, 'adega-jg'))[0]).toHaveProperty('category_id', adega.id);
    await expect(createLocalProduct(db, owner.id, 'adega-jg', { ...productBody, internalCode: 'CROSS-1', categoryId: deposito.id })).rejects.toThrow('desta empresa');
    await expect(db.query('UPDATE local_product_categories SET category_id=? WHERE product_id=?', [deposito.id, product.id])).rejects.toThrow();
    await updateLocalProduct(db, owner.id, 'adega-jg', product.id, { categoryId: null });
    expect((await listLocalProducts(db, owner.id, 'adega-jg'))[0]).toHaveProperty('category_id', null);
    await db.query('UPDATE local_memberships SET active=0 WHERE company_id=? AND user_id=?', ['deposito-jg', owner.id]);
    await expect(listLocalCategories(db, owner.id, 'deposito-jg')).rejects.toThrow('acesso ativo');
    await db.exec("CREATE TRIGGER fail_category BEFORE INSERT ON local_audit BEGIN SELECT RAISE(ABORT,'Falha de auditoria'); END;");
    await expect(createLocalCategory(db, owner.id, 'adega-jg', { ...body, name: 'Outra' })).rejects.toThrow('Falha de auditoria');
    expect(await listLocalCategories(db, owner.id, 'adega-jg')).toHaveLength(1);
  } finally { await db.close(); await rm(folder, { recursive: true, force: true }); }
});
