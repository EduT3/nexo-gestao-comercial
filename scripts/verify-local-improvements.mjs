import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import ExcelJS from 'exceljs';
import path from 'node:path';
const folder = await mkdtemp(path.join(tmpdir(), 'nexo-improvements-'));
const evidence = path.resolve('artifacts', `improvements-${Date.now()}`);
await mkdir(evidence, { recursive: true });
let app, page;
const errors = [], checks = [];
const watchdog = setTimeout(() => { app?.process().kill(); console.error('Tempo limite dos testes de melhorias.'); process.exit(1); }, 120000);
watchdog.unref();
function snapshot() {
  const db = new DatabaseSync(path.join(folder, 'NEXO', 'nexo.sqlite'), { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name").all();
    return createHash('sha256').update(JSON.stringify(tables.map(({ name }) => db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()))).digest('hex');
  } finally { db.close(); }
}
async function launch() {
  const executable = process.env.NEXO_VERIFY_EXECUTABLE;
  app = await electron.launch({ ...(executable ? { executablePath: executable, args: [], cwd: folder } : { args: ['electron/main.cjs'] }),
    env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1', ...(executable ? { PATH: `${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`, NODE_PATH: '' } : {}) } });
  await app.context().setOffline(true); page = await app.firstWindow(); page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(error.message));
}
async function capture(name) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await app.evaluate(async ({ BrowserWindow }) => { await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true }); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))));
  const encoded = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) throw new Error('Captura Electron vazia.');
    return image.toPNG().toString('base64');
  });
  await writeFile(path.join(evidence, name), Buffer.from(encoded, 'base64'));
}
const navigate = name => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true }).click();
try {
  await launch();
  await page.getByLabel('Nome do responsável').fill('Teste utilidades'); await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.getByLabel('Senha', { exact: true }).fill('Senha-teste-123'); await page.getByLabel('Confirmar senha').fill('Senha-teste-123');
  await page.getByRole('button', { name: 'Definir senha' }).click(); await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  await page.getByRole('region', { name: 'Tutorial do NEXO', exact: true }).getByRole('button', { name: 'Fechar tutorial', exact: true }).click();
  expect(await app.evaluate(({ app }) => { const { createRequire } = process.getBuiltinModule('module'); const { join } = process.getBuiltinModule('path'); return Object.keys(createRequire(join(app.getAppPath(), 'electron/main.cjs')).cache).some(file => /[\\/]electron[\\/]excel\.cjs$/.test(file)); })).toBe(false);
  checks.push('Biblioteca Excel ausente do carregamento inicial');
  await page.evaluate(async () => {
    const bridge = window.nexoLocal;
    const supplier = await bridge.createPerson('adega-jg', 'supplier', { name: 'Fornecedor temporário' });
    const water = await bridge.createProduct('adega-jg', { name: 'Água São João', internalCode: 'AGUA', unit: 'UNIT', costCents: 100, priceCents: 200 });
    const stocked = await bridge.createProduct('adega-jg', { name: 'Produto com estoque', internalCode: 'COM-SALDO', unit: 'UNIT', costCents: 100, priceCents: 200 });
    await bridge.receivePurchase('adega-jg', crypto.randomUUID(), { supplierId: supplier.id, items: [{ productId: stocked.id, quantity: '2', unitCostCents: 100 }] });
    for (let i = 0; i < 53; i++) await bridge.createProduct('adega-jg', { name: `Produto ${String(i).padStart(3, '0')}`, internalCode: `PAGE-${i}`, unit: 'UNIT', costCents: 100, priceCents: 200 });
  });
  await navigate('Produtos'); const table = page.locator('section.table-panel table');
  await expect(table.locator('tbody tr')).toHaveCount(50);
  await page.getByRole('group', { name: 'Páginas de produtos' }).getByRole('button', { name: 'Próxima página' }).click(); await expect(table.locator('tbody tr')).toHaveCount(5);
  await page.getByLabel('Buscar produto').fill('agua sao joao'); await expect(table.locator('tbody tr')).toHaveCount(1); await expect(table).toContainText('Água São João');
  await navigate('Estoque'); await page.getByLabel('Buscar no estoque').fill('Produto com estoque'); await expect(page.getByRole('table', { name: 'Saldo de estoque' })).toContainText('2,000');
  await page.getByLabel('Somente sem estoque').check(); await expect(page.getByRole('table', { name: 'Saldo de estoque' }).locator('tbody tr')).toHaveCount(0);
  await page.getByLabel('Buscar no estoque').fill('agua'); await expect(page.getByRole('table', { name: 'Saldo de estoque' })).toContainText('0,000');
  await page.setViewportSize({ width: 900, height: 650 });
  await capture('estoque.png');
  checks.push('Listas de 55 produtos, páginas, busca sem acento e saldo/filtro reais');
  await page.getByRole('button', { name: 'Backup: Nunca feito', exact: true }).click(); const before = snapshot();
  await page.getByRole('button', { name: 'Verificar dados', exact: true }).click(); await expect(page.getByRole('region', { name: 'Verificação dos dados' })).toContainText('estrutura e vínculos sem problemas');
  expect(snapshot()).toBe(before); checks.push('Diagnóstico via IPC preserva hash de todas as tabelas');
  await page.getByRole('button', { name: 'Verificar dados', exact: true }).scrollIntoViewIfNeeded(); await capture('dados.png');
  await navigate('Mais opções'); await page.getByRole('button', { name: 'Planilhas Excel', exact: true }).click();
  const templateFile = path.join(folder, 'template.xlsx');
  await app.evaluate(({ dialog }, file) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: file }); }, templateFile);
  await page.getByRole('button', { name: 'Baixar modelo Excel', exact: true }).click(); await expect(page.getByText(/Modelo Excel salvo/)).toBeVisible();
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(templateFile);
  workbook.getWorksheet('Produtos').addRow(['UTIL-IMPORT', 'Produto planilha', 'Unidade', '', 1, 2, 0, '', 'Sim']);
  const input = path.join(folder, 'import.xlsx'); await workbook.xlsx.writeFile(input);
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); }, input);
  await page.getByRole('button', { name: 'Selecionar planilha', exact: true }).click(); await expect(page.getByRole('table', { name: 'Prévia de produtos do Excel' })).toContainText('Produto planilha');
  expect(await page.evaluate(async () => (await window.nexoLocal.products('adega-jg')).length)).toBe(55);
  await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click(); await expect(page.getByText('1 produto(s) importado(s); 0 duplicado(s) ignorado(s).')).toBeVisible();
  const exported = path.join(folder, 'report.xlsx');
  await app.evaluate(({ dialog }, file) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: file }); }, exported);
  await page.getByRole('button', { name: 'Exportar relatório Excel', exact: true }).click(); await expect(page.getByText(/Relatório Excel exportado/)).toBeVisible();
  const report = new ExcelJS.Workbook(); await report.xlsx.readFile(exported); expect(report.worksheets).toHaveLength(8);
  checks.push('Excel adiado funciona no primeiro uso: modelo, prévia sem gravação, importação e oito abas exportadas');
  await page.getByRole('button', { name: /^Backup: Nunca feito$/ }).click();
  const backupFile = path.join(folder, 'backup.sqlite');
  await app.evaluate(({ dialog }, file) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: file }); }, backupFile);
  await page.getByRole('button', { name: 'Gerar backup', exact: true }).click(); await expect(page.getByRole('button', { name: /^Backup: Feito em / })).toBeVisible();
  const { validateLocalBackup } = await import('../dist/local-runtime/local/recovery.js'); validateLocalBackup(backupFile);
  await page.evaluate(() => window.nexoLocal.createOperator({ name: 'Operador teste', password: 'Senha-op-123', companies: ['adega-jg'] }));
  const saved = snapshot(); await app.close(); app = undefined; await launch();
  await page.getByLabel('Usuário', { exact: true }).selectOption({ label: 'Teste utilidades' });
  await page.getByLabel('Senha', { exact: true }).fill('Senha-teste-123'); await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible(); expect(snapshot()).toBe(saved);
  expect(await page.evaluate(async () => (await window.nexoLocal.products('adega-jg')).length)).toBe(56);
  expect(await page.evaluate(async () => (await window.nexoLocal.products('deposito-jg')).length)).toBe(0);
  checks.push('Backup íntegro, reabertura com 56 produtos e isolamento de empresas');
  await page.getByRole('button', { name: 'Sair', exact: true }).click(); await page.getByLabel('Usuário', { exact: true }).selectOption({ label: 'Operador teste' });
  await page.getByLabel('Senha', { exact: true }).fill('Senha-op-123'); await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verificar dados', exact: true })).toHaveCount(0);
  const denied = await page.evaluate(async () => { try { await window.nexoLocal.checkDataHealth(); return false; } catch { return true; } }); expect(denied).toBe(true);
  expect(errors).toEqual([]); checks.push('Operador sem diagnóstico global na interface nem por IPC; nenhum erro de renderer');
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify({ checks, errors, executable: process.env.NEXO_VERIFY_EXECUTABLE ?? 'development', offline: true, temporaryData: true }, null, 2));
  console.log(JSON.stringify({ checks, evidence }, null, 2));
} finally { clearTimeout(watchdog); await app?.close(); await rm(folder, { recursive: true, force: true }); }
