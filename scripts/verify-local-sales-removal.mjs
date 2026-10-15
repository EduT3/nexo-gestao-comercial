import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import path from 'node:path';

// All records and preferences belong to this disposable test installation.
const folder = await mkdtemp(path.join(tmpdir(), 'nexo-sales-removal-'));
const evidence = path.resolve('artifacts', `sales-removal-${Date.now()}`);
await mkdir(evidence, { recursive: true });
const checks = [], errors = [];
let app, page;
const watchdog = setTimeout(() => { app?.process().kill(); console.error('Tempo limite da verificação de itens.'); process.exit(1); }, 120000);
watchdog.unref();
function database(read) {
  const db = new DatabaseSync(path.join(folder, 'NEXO', 'nexo.sqlite'), { readOnly: true });
  try { return read(db); } finally { db.close(); }
}
function snapshot() {
  return database(db => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name").all();
    return createHash('sha256').update(JSON.stringify(tables.map(({ name }) => db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()))).digest('hex');
  });
}
async function launch() {
  const executable = process.env.NEXO_VERIFY_EXECUTABLE;
  app = await electron.launch({ ...(executable ? { executablePath: executable, args: [], cwd: folder } : { args: ['electron/main.cjs'] }),
    env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1', ...(executable ? { PATH: `${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`, NODE_PATH: '' } : {}) } });
  await app.context().setOffline(true);
  page = await app.firstWindow(); page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(error.message));
}
const form = () => page.getByRole('form', { name: 'Nova venda', exact: true });
const product = n => form().getByLabel(`Produto da venda ${n}`, { exact: true });
const quantity = n => form().getByLabel(`Quantidade da venda ${n}`, { exact: true });
const remove = n => form().getByRole('group', { name: `Item da venda ${n}`, exact: true }).getByRole('button', { name: /^Remover item/ });
const nav = name => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true }).click();
async function add(id, amount) {
  await form().getByRole('button', { name: 'Adicionar produto à venda', exact: true }).click();
  const n = await form().getByRole('group', { name: /^Item da venda/ }).count();
  await product(n).selectOption(id); await quantity(n).fill(amount);
}
async function totals(total, change) {
  await expect(form().getByLabel('Total da venda', { exact: true })).toHaveText(`Total: R$ ${total}`);
  await expect(form().getByLabel('Troco da venda', { exact: true })).toHaveText(`Troco: R$ ${change}`);
}
async function capture(name) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await app.evaluate(async ({ BrowserWindow }) => { await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true }); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const png = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) throw new Error('Captura vazia.');
    return image.toPNG().toString('base64');
  });
  await writeFile(path.join(evidence, name), Buffer.from(png, 'base64'));
}
function passed(name) { checks.push(name); console.log(`OK: ${name}`); }
try {
  await launch();
  await page.getByLabel('Nome do responsável').fill('Teste fictício de itens');
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.getByLabel('Senha', { exact: true }).fill('Senha-ficticia-123');
  await page.getByLabel('Confirmar senha').fill('Senha-ficticia-123');
  await page.getByRole('button', { name: 'Definir senha', exact: true }).click();
  await page.getByRole('region', { name: 'Tutorial do NEXO', exact: true }).getByRole('button', { name: 'Desativar tutorial', exact: true }).click();
  const fixture = await page.evaluate(async () => {
    const bridge = window.nexoLocal, company = 'adega-jg';
    const products = [];
    for (const [name, priceCents] of [['A', 1001], ['B', 2000], ['C', 3001]]) {
      products.push(await bridge.createProduct(company, { name: `Produto fictício ${name}`, internalCode: `FICT-${name}`, unit: 'KG', costCents: 100, priceCents }));
    }
    const customer = await bridge.createPerson(company, 'customer', { name: 'Cliente fictício' });
    const supplier = await bridge.createPerson(company, 'supplier', { name: 'Fornecedor fictício' });
    await bridge.receivePurchase(company, crypto.randomUUID(), { supplierId: supplier.id, items: products.map(p => ({ productId: p.id, quantity: '20', unitCostCents: 100 })) });
    await bridge.openCash(company, crypto.randomUUID(), { openingCents: 0 });
    return { products: products.map(p => p.id), customer: customer.id };
  });
  const [a, b, c] = fixture.products;
  await nav('Caixa'); await nav('Vender');
  await product(1).selectOption(a); await quantity(1).fill('1,250');
  await add(b, '2'); await add(c, '0,500');
  await form().getByLabel('Cliente da venda', { exact: true }).selectOption(fixture.customer);
  await form().getByLabel('Observações da venda', { exact: true }).fill('Rascunho fictício A/B/C');
  await form().getByLabel('Desconto da venda (R$)', { exact: true }).fill('7,52');
  await form().getByLabel('Valor recebido (R$)', { exact: true }).fill('100,00');
  await totals('60,00', '40,00');
  const before = snapshot();
  await page.evaluate(() => { window.testSaleNodes = Array.from(document.querySelectorAll('#vendas .sale-line')); });
  await remove(2).focus(); await page.keyboard.press('Enter');
  await expect(product(1)).toHaveValue(a); await expect(quantity(1)).toHaveValue('1,250');
  await expect(product(2)).toHaveValue(c); await expect(quantity(2)).toHaveValue('0,500');
  await expect(product(2)).toBeFocused();
  expect(await page.evaluate(() => {
    const current = document.querySelectorAll('#vendas .sale-line');
    return current[0] === window.testSaleNodes[0] && current[1] === window.testSaleNodes[2];
  })).toBe(true);
  await totals('20,00', '80,00'); expect(snapshot()).toBe(before);
  await expect(page.locator('#vendas').getByRole('status')).toHaveText('Item 2 removido da venda.');
  await capture('01-middle-removed.png');
  passed('A/B/C → A/C: quantidades, identidade DOM, teclado, foco, arredondamento, desconto e troco; banco inalterado');
  await nav('Produtos'); await nav('Vender');
  await expect(product(2)).toHaveValue(c); await expect(quantity(2)).toHaveValue('0,500');
  await expect(form().getByLabel('Cliente da venda', { exact: true })).toHaveValue(fixture.customer);
  await expect(form().getByLabel('Observações da venda', { exact: true })).toHaveValue('Rascunho fictício A/B/C');
  await totals('20,00', '80,00');
  passed('Rascunho mantém itens, cliente, observação, desconto e recebido ao navegar entre telas');
  await remove(1).click(); await expect(product(1)).toHaveValue(c); await expect(product(1)).toBeFocused();
  await totals('7,49', '92,51');
  await remove(1).click(); await expect(product(1)).toHaveValue(''); await expect(quantity(1)).toHaveValue('1');
  await expect(product(1)).toBeFocused(); await totals('0,00', '0,00');
  await expect(form().getByText('Desconto acima do subtotal.', { exact: true })).toBeVisible();
  expect(snapshot()).toBe(before);
  passed('Primeiro e único item: nova linha vazia, foco, desconto excessivo explícito, nenhuma gravação');
  await form().getByLabel('Desconto da venda (R$)', { exact: true }).fill('0,00');
  await form().getByLabel('Valor recebido (R$)', { exact: true }).fill('');
  await product(1).selectOption(a); await quantity(1).fill('1,250'); await add(b, '2'); await add(c, '0,500');
  await remove(3).click(); await expect(product(2)).toBeFocused(); await expect(product(2)).toHaveValue(b);
  await totals('52,51', '0,00');
  await add(c, '0,500'); await expect(product(2)).toHaveValue(b); await expect(product(3)).toHaveValue(c);
  passed('Último item: foco no anterior; adicionar novamente mantém os sobreviventes');
  await form().getByLabel('Desconto da venda (R$)', { exact: true }).fill('60,00');
  await remove(2).click();
  await form().getByRole('button', { name: 'Concluir venda', exact: true }).click();
  await expect(page.locator('#vendas').getByRole('status')).toContainText('Desconto acima do subtotal.');
  expect(snapshot()).toBe(before);
  await form().getByLabel('Desconto da venda (R$)', { exact: true }).fill('0,00');
  await form().getByLabel('Valor recebido (R$)', { exact: true }).fill('1,00');
  await expect(form().getByText('Valor recebido insuficiente.', { exact: true })).toBeVisible();
  await form().getByLabel('Pagamento', { exact: true }).selectOption('PIX'); await totals('27,52', '0,00');
  await form().getByLabel('Pagamento', { exact: true }).selectOption('CASH');
  await form().getByLabel('Valor recebido (R$)', { exact: true }).fill('100,00'); await totals('27,52', '72,48');
  passed('Desconto excessivo bloqueia conclusão; recebido insuficiente e PIX recalculam corretamente');
  await remove(2).click(); await quantity(1).fill('1'); await add(a, '3');
  await form().getByRole('button', { name: 'Concluir venda', exact: true }).click();
  await expect(page.locator('#vendas').getByRole('status')).toContainText('repetido');
  expect(snapshot()).toBe(before);
  await remove(1).click(); await expect(product(1)).toHaveValue(a); await expect(quantity(1)).toHaveValue('3');
  await totals('30,03', '69,97');
  passed('Produto repetido continua recusado pelo contrato; remover uma ocorrência preserva a outra');
  await page.getByLabel('Empresa em uso').selectOption('deposito-jg'); await expect(product(1)).toHaveValue('');
  await page.getByLabel('Empresa em uso').selectOption('adega-jg'); await expect(product(1)).toHaveValue('');
  await expect(quantity(1)).toHaveValue('1');
  passed('Troca de empresa continua descartando o rascunho e impedindo vazamento');
  await product(1).selectOption(a); await quantity(1).fill('1,250'); await add(b, '2'); await add(c, '0,500');
  await form().getByLabel('Desconto da venda (R$)', { exact: true }).fill('7,52');
  await form().getByLabel('Valor recebido (R$)', { exact: true }).fill('100,00');
  await remove(2).click();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(900, 650));
  await product(2).scrollIntoViewIfNeeded(); await capture('02-compact.png');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2));
  await remove(2).focus(); await remove(2).scrollIntoViewIfNeeded();
  await capture('03-zoom-200.png');
  const bounds = await remove(2).boundingBox();
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth }));
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  expect(viewport.scroll).toBeLessThanOrEqual(viewport.width);
  await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.webContents.setZoomFactor(1); w.setSize(1200, 800); });
  passed('Controle visível em 900×650 e zoom de 200%, sem transbordamento horizontal');
  // One genuinely persisted sale, exclusively in the temporary fictional database.
  await form().getByRole('button', { name: 'Concluir venda', exact: true }).click();
  await expect(page.locator('#vendas').getByRole('status')).toContainText('Venda salva. Total: R$ 20,00. Troco: R$ 80,00.');
  const saved = database(db => ({
    sale: db.prepare('SELECT subtotal_cents, discount_cents, total_cents FROM local_sales').all(),
    items: db.prepare('SELECT product_id, quantity_milli FROM local_sale_items ORDER BY product_name').all(),
  }));
  expect(saved.sale).toEqual([{ subtotal_cents: 2752, discount_cents: 752, total_cents: 2000 }]);
  expect(saved.items).toEqual([{ product_id: a, quantity_milli: 1250 }, { product_id: c, quantity_milli: 500 }]);
  await expect(product(1)).toHaveValue(''); await product(1).selectOption(b);
  const stock = await page.evaluate(() => window.nexoLocal.stock('adega-jg'));
  expect(stock.find(p => p.id === b).balance_milli).toBe(20000n);
  expect(stock.find(p => p.id === a).balance_milli).toBe(18750n);
  expect(stock.find(p => p.id === c).balance_milli).toBe(19500n);
  passed('Venda fictícia salva contém somente A/C; totais/estoque corretos e formulário reiniciado');
  await app.close(); app = undefined; await launch();
  await page.getByLabel('Senha', { exact: true }).fill('Senha-ficticia-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(product(1)).toHaveValue('');
  await expect(page.getByRole('table', { name: 'Vendas realizadas', exact: true })).toContainText('R$ 20,00');
  expect(await page.evaluate(async () => { const s = await window.nexoLocal.status(); return (await window.nexoLocal.tutorialPreference('adega-jg', s.userId)).state; })).toBe('disabled');
  passed('Reabertura mantém venda fictícia e preferência do tutorial; rascunho não persiste ao fechar, como antes');
  expect(errors).toEqual([]);
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify({ passed: true, checks, errors, temporaryData: folder, executable: process.env.NEXO_VERIFY_EXECUTABLE ?? 'development' }, null, 2));
  console.log(`Evidências: ${evidence}`);
} catch (error) {
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify({ passed: false, checks, errors, error: String(error.stack ?? error), temporaryData: folder }, null, 2));
  throw error;
} finally { clearTimeout(watchdog); await app?.close(); }
