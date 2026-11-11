import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase, type LocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalProduct, initializeLocalCatalog, listLocalProducts, updateLocalProduct } from '../src/local/catalog';
import { createLocalPerson } from '../src/local/people';
import { createLocalCategory } from '../src/local/categories';
import { receiveLocalPurchase } from '../src/local/purchases';
import { listLocalStock } from '../src/local/stock';
import { openLocalCash } from '../src/local/cash';
import { confirmLocalSale } from '../src/local/sales';
import { cancelLocalSale } from '../src/local/cancellations';
import { commitLocalProductImport, previewLocalProductImport } from '../src/local/product-import';

const company = 'adega-jg';
const blocked = 'Não é possível alterar a unidade de um produto com movimentações de estoque. Mantenha a unidade ou cadastre outro produto para usar uma unidade diferente.';
type Fixture = { db: LocalDatabase; file: string; actor: string; product: string; supplier: string };
const productBody = { name: 'Mercadoria fracionada', internalCode: 'UNIT-GUARD', unit: 'KG', costCents: 101, priceCents: 200 };
async function withFixture(run: (fixture: Fixture) => Promise<void>) {
  const parent = path.resolve(tmpdir());
  const folder = await mkdtemp(path.join(parent, 'nexo-product-unit-'));
  if (!path.resolve(folder).startsWith(parent + path.sep)) throw new Error('Pasta temporária fora da bancada.');
  const file = path.join(folder, 'fixture.sqlite');
  const f: Fixture = { db: openLocalDatabase(file), file, actor: '', product: '', supplier: '' };
  try {
    await prepareLocalDatabase(f.db, file);
    f.actor = (await initializeLocalOwner(f.db, 'Responsável fictício')).id;
    f.product = (await createLocalProduct(f.db, f.actor, company, productBody)).id;
    f.supplier = (await createLocalPerson(f.db, f.actor, company, 'supplier', { name: 'Fornecedor fictício' })).id;
    await run(f);
  } finally { await f.db.close(); await rm(folder, { recursive: true, force: true }); }
}
async function receive(f: Fixture) {
  return receiveLocalPurchase(f.db, f.actor, company, randomUUID(), {
    supplierId: f.supplier, items: [{ productId: f.product, quantity: '1.255', unitCostCents: 101 }],
    payable: { dueDate: '2026-11-15' },
  });
}
async function snapshot(db: LocalDatabase) {
  const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const table of tables) {
    const name = String(table.name);
    result[name] = await db.query(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`);
  }
  return result;
}

it('recusa trocar unidade com estoque sem salvar nome, preço, categoria ou auditoria do mesmo pedido', async () => {
  await withFixture(async f => {
    expect((await receive(f)).totalCents).toBe(127n);
    const category = await createLocalCategory(f.db, f.actor, company, { name: 'Categoria fictícia' });
    const before = await snapshot(f.db);
    expect(Object.keys(before)).toHaveLength(27);
    await expect(updateLocalProduct(f.db, f.actor, company, f.product, {
      unit: 'UNIT', name: 'Nome que não pode salvar', priceCents: 999, categoryId: category.id, active: false,
    })).rejects.toThrow(blocked);
    expect(await snapshot(f.db)).toEqual(before);
    expect((await listLocalStock(f.db, f.actor, company))[0]).toMatchObject({ unit: 'KG', balance_milli: 1255n });
  });
});

it('recusa trocar unidade mesmo quando a venda deixou o saldo zerado', async () => {
  await withFixture(async f => {
    await receive(f);
    await openLocalCash(f.db, f.actor, company, randomUUID(), { openingCents: 0 });
    const sale = await confirmLocalSale(f.db, f.actor, company, randomUUID(), {
      items: [{ productId: f.product, quantity: '1.255' }], paymentMethod: 'PIX',
    });
    expect(sale.totalCents).toBe(251n);
    expect((await listLocalStock(f.db, f.actor, company))[0]?.balance_milli).toBe(0n);
    const before = await snapshot(f.db);
    await expect(updateLocalProduct(f.db, f.actor, company, f.product, { unit: 'BOX' })).rejects.toThrow(blocked);
    expect(await snapshot(f.db)).toEqual(before);
  });
});

it('mantém a proteção após cancelamento e reabertura sem reescrever valores históricos', async () => {
  await withFixture(async f => {
    await receive(f);
    await openLocalCash(f.db, f.actor, company, randomUUID(), { openingCents: 0 });
    const sale = await confirmLocalSale(f.db, f.actor, company, randomUUID(), {
      items: [{ productId: f.product, quantity: '1.255' }], paymentMethod: 'PIX',
    });
    await cancelLocalSale(f.db, f.actor, company, sale.id, randomUUID(), { reason: 'Cancelamento fictício' });
    const before = await snapshot(f.db);
    await f.db.close(); f.db = openLocalDatabase(f.file); await prepareLocalDatabase(f.db, f.file);
    expect(await snapshot(f.db)).toEqual(before);
    await expect(updateLocalProduct(f.db, f.actor, company, f.product, { unit: 'LITER' })).rejects.toThrow(blocked);
    expect(await snapshot(f.db)).toEqual(before);
    expect((await listLocalStock(f.db, f.actor, company))[0]).toMatchObject({ unit: 'KG', balance_milli: 1255n });
    expect(before.local_sale_items?.[0]).toMatchObject({ quantity_milli: 1255n, unit_price_cents: 200n, unit_cost_cents: 101n, total_cents: 251n });
    expect(await f.db.query('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await f.db.query('PRAGMA foreign_key_check')).toEqual([]);
  });
});

it('permite manter a unidade e editar nome, preço e situação sem tocar movimentos ou vendas', async () => {
  await withFixture(async f => {
    await receive(f);
    const before = await snapshot(f.db);
    await updateLocalProduct(f.db, f.actor, company, f.product, { unit: 'KG', name: 'Nome corrigido', priceCents: 399, active: false });
    const after = await snapshot(f.db);
    for (const [table, rows] of Object.entries(before)) {
      if (table !== 'local_products' && table !== 'local_audit') expect(after[table], table).toEqual(rows);
    }
    expect(after.local_audit).toHaveLength((before.local_audit?.length ?? 0) + 1);
    expect((await listLocalProducts(f.db, f.actor, company))[0]).toMatchObject({ unit: 'KG', name: 'Nome corrigido', price_cents: 399n, cost_cents: 101n, active: 0n });
    await updateLocalProduct(f.db, f.actor, company, f.product, { active: true });
    expect((await listLocalStock(f.db, f.actor, company))[0]?.balance_milli).toBe(1255n);
  });
});

it('permite corrigir unidade sem histórico próprio mesmo quando outro produto tem movimentos', async () => {
  await withFixture(async f => {
    await receive(f);
    const fresh = await createLocalProduct(f.db, f.actor, company, { ...productBody, internalCode: 'NO-HISTORY' });
    await updateLocalProduct(f.db, f.actor, company, fresh.id, { unit: 'BOX', priceCents: 402 });
    expect((await listLocalProducts(f.db, f.actor, company)).find(p => p.id === fresh.id)).toMatchObject({ unit: 'BOX', price_cents: 402n });
    expect((await listLocalStock(f.db, f.actor, company)).find(p => p.id === f.product)).toMatchObject({ unit: 'KG', balance_milli: 1255n });
  });
});

it('isola empresas e verifica perfil antes da regra de unidade', async () => {
  await withFixture(async f => {
    await receive(f);
    const otherCompany = 'deposito-jg';
    const fresh = await createLocalProduct(f.db, f.actor, otherCompany, productBody);
    await updateLocalProduct(f.db, f.actor, otherCompany, fresh.id, { unit: 'BOX' });
    const operator = randomUUID();
    await f.db.query('INSERT INTO local_users VALUES(?,?,1)', [operator, 'Operador fictício']);
    await f.db.query('INSERT INTO local_memberships VALUES(?,?,?,1)', [company, operator, 'OPERADOR']);
    const before = await snapshot(f.db);
    await expect(updateLocalProduct(f.db, operator, company, f.product, { unit: 'UNIT' })).rejects.toThrow('administrador');
    await expect(updateLocalProduct(f.db, operator, otherCompany, fresh.id, { unit: 'KG' })).rejects.toThrow('acesso ativo');
    await expect(updateLocalProduct(f.db, f.actor, otherCompany, f.product, { unit: 'UNIT' })).rejects.toThrow('nesta empresa');
    await expect(updateLocalProduct(f.db, f.actor, company, f.product, { unit: 'UNIT' })).rejects.toThrow(blocked);
    expect(await snapshot(f.db)).toEqual(before);
    expect((await listLocalProducts(f.db, f.actor, otherCompany))[0]).toMatchObject({ unit: 'BOX' });
  });
});

it('Excel não pode trocar unidade de produto existente: duplicado é ignorado sem escrita', async () => {
  await withFixture(async f => {
    await receive(f);
    const rows = [{ line: 2, name: 'Nome da planilha', internalCode: 'UNIT-GUARD', barcode: '', unit: 'BOX', cost: '1,01', price: '9,99', stockMin: '0', category: '', active: 'Sim' }];
    const before = await snapshot(f.db);
    const preview = await previewLocalProductImport(f.db, f.actor, company, rows);
    expect(preview).toMatchObject({ ready: 0, duplicates: 1, errors: 0 });
    expect(await commitLocalProductImport(f.db, f.actor, company, rows, preview.rows)).toEqual({ imported: 0, skipped: 1 });
    expect(await snapshot(f.db)).toEqual(before);
  });
});

it('compra e edição concorrentes na conexão local não permitem trocar unidade após o recebimento', async () => {
  await withFixture(async f => {
    const results = await Promise.allSettled([
      receive(f),
      updateLocalProduct(f.db, f.actor, company, f.product, { unit: 'UNIT', name: 'Não salvar' }),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({ status: 'rejected', reason: new Error(blocked) });
    expect((await listLocalStock(f.db, f.actor, company))[0]).toMatchObject({ unit: 'KG', name: productBody.name, balance_milli: 1255n });
    expect(await f.db.query("SELECT id FROM local_audit WHERE action='product.updated'")).toEqual([]);
  });
});

it('mantém edição de unidade do catálogo legado anterior à existência do estoque', async () => {
  const db = openLocalDatabase(':memory:');
  try {
    await initializeLocalCatalog(db);
    const actor = randomUUID();
    await db.query('INSERT INTO local_users VALUES(?,?,1)', [actor, 'Administrador fictício']);
    await db.query('INSERT INTO local_memberships VALUES(?,?,?,1)', [company, actor, 'ADMIN']);
    const product = await createLocalProduct(db, actor, company, productBody);
    await updateLocalProduct(db, actor, company, product.id, { unit: 'BOX' });
    expect((await listLocalProducts(db, actor, company))[0]).toMatchObject({ unit: 'BOX' });
  } finally { await db.close(); }
});
