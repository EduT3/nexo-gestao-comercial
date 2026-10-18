import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import path from 'node:path';

const folder = await mkdtemp(path.join(tmpdir(), 'nexo-tutorial-window-'));
const evidence = path.resolve('artifacts', `tutorial-${Date.now()}`);
await mkdir(evidence, { recursive: true });
const errors = [];
let app, page;
const watchdog = setTimeout(() => { console.error('Tempo limite do teste de tutorial.'); app?.process().kill(); process.exit(1); }, 120000);
watchdog.unref();
function businessSnapshot() {
  const db = new DatabaseSync(path.join(folder, 'NEXO', 'nexo.sqlite'), { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name").all();
    const rows = tables.map(({ name }) => ({ name, rows: db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all() }));
    return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  } finally { db.close(); }
}
async function launch() {
  const executable = process.env.NEXO_VERIFY_EXECUTABLE;
  app = await electron.launch({ ...(executable ? { executablePath: executable, args: [], cwd: folder } : { args: ['electron/main.cjs'] }),
    env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1' } });
  await app.context().setOffline(true);
  page = await app.firstWindow(); page.setDefaultTimeout(9000);
  page.on('pageerror', error => errors.push(error.message));
}
async function capture(name) {
  // Electron's capturePage supports hidden packaged windows; CDP screenshots can wait indefinitely for a frame.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // The first hidden capture wakes the compositor; wait for the following layout frame.
  await app.evaluate(async ({ BrowserWindow }) => { await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true }); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))));
  const encoded = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) throw new Error('Captura Electron vazia.');
    return image.toPNG().toString('base64');
  });
  await writeFile(path.join(evidence, name), Buffer.from(encoded, 'base64'));
}
async function saved(state, step, company = 'adega-jg') {
  await expect.poll(() => page.evaluate(async c => await window.nexoLocal.tutorialPreference(c, (await window.nexoLocal.status()).userId), company)).toMatchObject({ state, ...(step ? { step } : {}) });
}
async function login(name, password = 'Senha-tutorial-123') {
  await page.getByLabel('Usuário', { exact: true }).selectOption({ label: name });
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
const guide = () => page.getByRole('region', { name: 'Tutorial do NEXO', exact: true });
const click = name => guide().getByRole('button', { name, exact: true }).click();
try {
  await launch();
  await page.getByLabel('Nome do responsável').fill('Tutorial fictício');
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.getByLabel('Senha', { exact: true }).fill('Senha-tutorial-123');
  await page.getByLabel('Confirmar senha').fill('Senha-tutorial-123');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await expect(guide()).toBeVisible();
  const before = businessSnapshot();
  await capture('01-welcome.png');
  console.log('Etapa: boas-vindas capturadas; testar teclado.');
  await guide().getByRole('button', { name: 'Começar tutorial', exact: true }).focus();
  await page.keyboard.press('Enter');
  console.log('Etapa: Enter enviado.');
  await expect(guide().getByRole('heading', { name: 'Comece pela empresa certa' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(guide().getByRole('button', { name: 'Fechar tutorial', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeFocused();
  await click('Ver esta tela');
  console.log('Etapa: foco na empresa.');
  await expect(page.getByLabel('Empresa em uso')).toBeFocused();
  await click('Próxima etapa');
  await expect(guide().getByRole('heading', { name: 'Encontre seus produtos' })).toBeFocused();
  await click('Ver esta tela');
  await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  await page.getByLabel('Código interno').fill('RASCUNHO-FICTICIO');
  await page.getByRole('navigation').getByRole('button', { name: 'Caixa', exact: true }).click();
  await click('Ajuda desta tela');
  await expect(guide().getByRole('heading', { name: 'Prepare e encerre o atendimento' })).toBeVisible();
  await click('Próxima etapa');
  await click('Ver esta tela');
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeFocused();
  await page.getByRole('navigation').getByRole('button', { name: 'Produtos', exact: true }).click();
  await expect(page.getByLabel('Código interno')).toHaveValue('RASCUNHO-FICTICIO');
  await click('Fechar tutorial');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeFocused();
  await expect(guide()).toHaveCount(0);
  await saved('paused', 'sales');
  console.log('Etapa: rascunho preservado e pausa salva; fechar/reabrir.');
  await app.close(); app = undefined;
  await launch(); await login('Tutorial fictício');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide()).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await click('Retomar tutorial');
  await expect(guide().getByRole('heading', { name: 'Venda com os valores conferidos' })).toBeVisible();
  await click('Desativar tutorial'); await saved('disabled', 'sales');
  console.log('Etapa: retomada e desativação persistidas.');
  await page.getByLabel('Empresa em uso').selectOption('deposito-jg');
  await expect(guide().getByRole('button', { name: 'Começar tutorial', exact: true })).toBeVisible();
  await click('Pular tutorial'); await saved('paused', 'company', 'deposito-jg');
  await page.getByLabel('Empresa em uso').selectOption('adega-jg');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide()).toHaveCount(0);
  await app.close(); app = undefined;
  await launch(); await login('Tutorial fictício');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide()).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await expect(guide()).toContainText('O tutorial está desativado');
  await click('Reativar tutorial'); await saved('active', 'sales');
  await page.keyboard.press('Escape'); await saved('paused', 'sales');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await click('Reiniciar tutorial'); await saved('active', 'company');
  await app.close(); app = undefined;
  await launch(); await login('Tutorial fictício');
  await expect(guide().getByRole('heading', { name: 'Comece pela empresa certa' })).toBeVisible();
  console.log('Etapa: reinício e isolamento aprovados; testar layout.');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(900, 650));
  await capture('02-compact.png');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2));
  const zoomLayout = await page.evaluate(() => {
    const box = document.querySelector('.tutorial-panel').getBoundingClientRect();
    return { viewport: innerWidth, document: document.documentElement.scrollWidth, left: box.left, right: box.right };
  });
  console.log('Layout a 200%:', zoomLayout);
  expect(zoomLayout.left).toBeGreaterThanOrEqual(0);
  expect(zoomLayout.right).toBeLessThanOrEqual(zoomLayout.viewport);
  expect(zoomLayout.document).toBeLessThanOrEqual(zoomLayout.viewport);
  await guide().evaluate(node => node.scrollIntoView({ block: 'start' }));
  await capture('03-zoom-200.png');
  expect(await guide().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1); BrowserWindow.getAllWindows()[0].setSize(1200, 800); });
  const titles = [];
  for (let index = 0; index < 10; index++) {
    titles.push(await guide().getByRole('heading').textContent());
    await click('Ver esta tela');
    if (index < 9) await click('Próxima etapa');
  }
  await capture('04-backup.png');
  await click('Concluir tutorial'); await saved('completed', 'backup');
  expect(businessSnapshot()).toBe(before);
  console.log('Etapa: roteiro completo sem alteração comercial; testar operador.');
  const originalUser = await page.evaluate(async () => (await window.nexoLocal.status()).userId);
  await page.evaluate(() => window.nexoLocal.createOperator({ name: 'Operador fictício', password: 'Senha-operador-123', companies: ['adega-jg'] }));
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.evaluate(id => window.nexoLocal.tutorialPreference('adega-jg', id), originalUser)).rejects.toThrow();
  await login('Operador fictício', 'Senha-operador-123');
  await expect(guide().getByRole('button', { name: 'Começar tutorial', exact: true })).toBeVisible();
  await expect(page.evaluate(async () => window.nexoLocal.tutorialPreference('deposito-jg', (await window.nexoLocal.status()).userId))).rejects.toThrow();
  await expect(page.evaluate(id => window.nexoLocal.saveTutorialPreference('adega-jg', id, { version: 1, state: 'disabled', step: 'cash' }), originalUser)).rejects.toThrow('O usuário mudou');
  await click('Começar tutorial');
  await expect(guide()).toContainText('Etapa 1 de 5');
  await click('Desativar tutorial'); await saved('disabled', 'company');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login('Tutorial fictício'); await saved('completed', 'backup');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide()).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await click('Fechar tutorial'); await saved('completed', 'backup');
  expect(errors).toEqual([]);
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify({ passed: true, executable: process.env.NEXO_VERIFY_EXECUTABLE ?? 'Electron development build', temporaryData: folder, businessTablesUnchangedDuringTutorial: true, steps: titles, errors }, null, 2));
  console.log(`Tutorial Windows aprovado: preferências, 4 aberturas, usuário/empresa/sessão antiga, teclado/foco/Escape, 900x650, zoom 200%, 10 etapas admin/5 operador, nenhum registro comercial alterado. Evidência: ${evidence}`);
} catch (error) {
  if (page && !page.isClosed()) await capture('failure.png').catch(() => {});
  console.error(`Evidência da falha: ${evidence}`); throw error;
} finally { await app?.close(); clearTimeout(watchdog); }
