import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import path from 'node:path';

const folder = await mkdtemp(path.join(tmpdir(), 'nexo-reevaluation-'));
const evidence = path.resolve('artifacts', `reevaluation-2026-10-18-${Date.now()}`);
await mkdir(evidence, { recursive: true });
const result = { date: '2026-10-18', executable: process.env.NEXO_VERIFY_EXECUTABLE, checks: [], observations: {}, captures: [], errors: [], temporaryData: true, offline: true };
let app, page;
const watchdog = setTimeout(() => { app?.process().kill(); console.error('Tempo limite da reavaliação.'); process.exit(1); }, process.env.NEXO_REVIEW_CAPTURE_PAUSE === '1' ? 900000 : 180000); watchdog.unref();
async function persist() { await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2)); }
async function fresh() { return page.locator('body').ariaSnapshot(); }
async function click(locator) { await fresh(); await expect(locator).toHaveCount(1); await expect(locator).toBeVisible(); await locator.click(); }
async function fill(name, value) { await fresh(); await page.getByLabel(name, { exact: true }).fill(value); }
async function select(name, value) { await fresh(); await page.getByLabel(name, { exact: name !== 'Empresa em uso' }).selectOption(value); }
async function nav(name) { await click(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true })); }
async function capture(name, note) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await app.evaluate(async ({ BrowserWindow }) => { await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true }); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))));
  const encoded = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) throw new Error('Captura vazia.'); return image.toPNG().toString('base64');
  });
  await writeFile(path.join(evidence, name + '.png'), Buffer.from(encoded, 'base64'));
  await writeFile(path.join(evidence, name + '.txt'), await fresh());
  result.captures.push({ file: name + '.png', note }); await persist();
  console.log('CAPTURE ' + path.join(evidence, name + '.png'));
  if (process.env.NEXO_REVIEW_CAPTURE_PAUSE === '1') {
    while (!(await access(path.join(evidence, name + '.continue')).then(() => true, () => false))) await new Promise(resolve => setTimeout(resolve, 250));
  }
}
function readDatabase(operation) {
  const db = new DatabaseSync(path.join(folder, 'NEXO', 'nexo.sqlite'), { readOnly: true });
  try { return operation(db); } finally { db.close(); }
}
function snapshot() {
  return readDatabase(db => createHash('sha256').update(JSON.stringify(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name").all().map(({ name }) => ({ name, rows: db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all() })))).digest('hex'));
}
async function launch() {
  app = await electron.launch({ executablePath: process.env.NEXO_VERIFY_EXECUTABLE, args: [], cwd: folder,
    env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1', PATH: `${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`, NODE_PATH: '', NODE_OPTIONS: '' } });
  await app.context().setOffline(true); page = await app.firstWindow(); page.setDefaultTimeout(8000);
  page.on('pageerror', error => result.errors.push(error.message));
}
try {
  await launch();
  await expect(page.getByRole('heading', { name: 'Primeiro acesso' })).toBeVisible();
  await capture('01-primeiro-acesso', 'Entrada local em instalação temporária nova.');
  await fill('Nome do responsável', 'Reavaliação NEXO'); await click(page.getByRole('button', { name: 'Começar', exact: true }));
  await fill('Senha', 'Senha-teste-123'); await fill('Confirmar senha', 'Senha-teste-123'); await click(page.getByRole('button', { name: 'Definir senha', exact: true }));
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  await capture('02-inicio-com-tutorial', 'Primeira entrada: Vender e boas-vindas do tutorial.');
  await click(page.getByRole('region', { name: 'Tutorial do NEXO', exact: true }).getByRole('button', { name: 'Fechar tutorial', exact: true }));
  result.checks.push('Primeiro acesso e senha local completos no pacote, offline, sem runtime no PATH');

  await nav('Produtos'); await click(page.getByRole('button', { name: 'Novo produto', exact: true }));
  const productForm = page.getByRole('form', { name: 'Cadastro de produtos' });
  await fresh(); await productForm.getByLabel('Nome', { exact: true }).fill('Água mineral');
  await fill('Código interno', 'AGUA'); await fill('Custo (R$)', '2,00'); await fill('Preço de venda (R$)', '5,00');
  await capture('03-cadastro-produto', 'Cadastro de produto com valores preenchidos.');
  await click(page.getByRole('button', { name: 'Salvar produto', exact: true }));
  await expect(page.getByRole('cell', { name: 'Água mineral', exact: true })).toBeVisible();
  result.observations.productSavedFeedbackVisible = await page.getByText('Produto salvo no computador.', { exact: true }).isVisible();
  await capture('04-produto-salvo', 'Produto persiste na lista; conferir se existe confirmação visível.');
  const fixture = await page.evaluate(async () => {
    const bridge = window.nexoLocal;
    const supplier = await bridge.createPerson('adega-jg', 'supplier', { name: 'Fornecedor da avaliação' });
    const other = await bridge.createProduct('adega-jg', { name: 'Refrigerante', internalCode: 'REFRI', unit: 'UNIT', costCents: 300, priceCents: 800 });
    const water = (await bridge.products('adega-jg')).find(row => row.internal_code === 'AGUA');
    return { supplier: supplier.id, water: water.id, other: other.id };
  });
  result.checks.push('Produto cadastrado pela interface; fornecedor e segundo produto preparados por IPC como massa fictícia');

  await nav('Compras'); await select('Fornecedor', fixture.supplier); await select('Produto 1', fixture.water);
  await fill('Quantidade 1', '2'); await fill('Custo unitário 1 (R$)', '2,00'); await click(page.getByRole('button', { name: 'Adicionar item', exact: true }));
  await select('Produto 2', fixture.other); await fill('Quantidade 2', '3'); await fill('Custo unitário 2 (R$)', '3,00');
  await fill('Vencimento da conta a pagar', '2026-10-21');
  result.observations.purchaseFormText = await page.getByRole('form', { name: 'Recebimento de compra' }).innerText();
  await page.getByRole('form', { name: 'Recebimento de compra' }).scrollIntoViewIfNeeded();
  await capture('05-compra-preenchida', 'Compra de 2 x R$2 + 3 x R$3: avaliar total antes de confirmar e correção de item.');
  await click(page.getByRole('button', { name: 'Receber compra', exact: true }));
  await expect(page.getByRole('table', { name: 'Compras recebidas' })).toContainText('R$ 13,00');
  const stock = await page.evaluate(() => window.nexoLocal.stock('adega-jg'));
  expect(stock.find(row => row.id === fixture.water).balance_milli).toBe(2000n); expect(stock.find(row => row.id === fixture.other).balance_milli).toBe(3000n);
  result.checks.push('Compra de R$13,00 criou estoque 2/3 unidades e conta a pagar na mesma operação');

  await nav('Vender'); await select('Produto da venda 1', fixture.water); await fill('Valor recebido (R$)', '10,00');
  await click(page.getByRole('button', { name: 'Concluir venda', exact: true }));
  await expect(page.getByText(/Abra o caixa antes de registrar uma venda/)).toBeVisible();
  await page.getByText(/Abra o caixa antes de registrar uma venda/).scrollIntoViewIfNeeded();
  await capture('06-venda-caixa-fechado', 'Tentativa real sem caixa: registro bloqueado, instrução só aparece ao concluir.');
  expect(await page.evaluate(async () => (await window.nexoLocal.sales('adega-jg')).length)).toBe(0);
  await nav('Caixa'); await click(page.getByRole('button', { name: 'Abrir caixa', exact: true })); await expect(page.getByLabel('Saldo do caixa')).toContainText('R$ 0,00');
  await nav('Vender'); await expect(page.getByLabel('Produto da venda 1')).toHaveValue(fixture.water);
  await click(page.getByRole('button', { name: 'Concluir venda', exact: true }));
  await expect(page.getByRole('table', { name: 'Vendas realizadas' }).locator('tbody tr')).toHaveCount(1);
  await select('Produto da venda 1', fixture.water); await fill('Valor recebido (R$)', '10,00'); await click(page.getByRole('button', { name: 'Concluir venda', exact: true }));
  const salesTable = page.getByRole('table', { name: 'Vendas realizadas' }); await expect(salesTable.locator('tbody tr')).toHaveCount(2);
  result.observations.saleRowTexts = await salesTable.locator('tbody tr').allInnerTexts();
  await salesTable.scrollIntoViewIfNeeded(); await capture('07-historico-duas-vendas', 'Duas vendas reais, mesmo total/pagamento/troco: avaliar identificação para cancelamento.');
  const cash = await page.evaluate(() => window.nexoLocal.cash('adega-jg')); expect(cash[0].balance_cents).toBe(1000n);
  result.checks.push('Venda sem caixa recusada sem gravação; abertura não perde rascunho; duas vendas, total/troco/estoque/caixa corretos');

  await nav('Financeiro'); await capture('08-financeiro-inicio', 'Entrada no financeiro: resumo do dia, recebíveis recolhidos e resumo geral abaixo.');
  await page.getByRole('button', { name: 'Pagar conta', exact: true }).scrollIntoViewIfNeeded(); await click(page.getByRole('button', { name: 'Pagar conta', exact: true }));
  await select('Forma de pagamento da conta', 'PIX'); await click(page.getByRole('button', { name: 'Confirmar pagamento', exact: true }));
  await expect(page.getByRole('button', { name: 'Estornar pagamento', exact: true })).toBeVisible();
  const receivables = page.locator('#contas-receber details').first();
  if (!(await receivables.evaluate(element => element.open))) await click(receivables.locator('summary'));
  await fill('Descrição da conta', 'Recebível da avaliação'); await fill('Valor a receber (R$)', '2,00'); await fill('Vencimento a receber', '2026-10-21');
  await click(page.getByRole('button', { name: 'Salvar conta a receber', exact: true }));
  await click(page.getByRole('button', { name: 'Receber conta', exact: true })); await select('Forma de recebimento', 'PIX'); await click(page.getByRole('button', { name: 'Confirmar recebimento', exact: true }));
  await expect(page.getByRole('table', { name: 'Contas a receber' })).toContainText('Recebida');
  const finance = await page.evaluate(() => window.nexoLocal.finance('adega-jg')); expect(finance.financialBalanceCents).toBe(-100n);
  expect((await page.evaluate(() => window.nexoLocal.cash('adega-jg')))[0].balance_cents).toBe(1000n);
  await page.getByRole('table', { name: 'Contas a receber' }).scrollIntoViewIfNeeded(); await capture('09-financeiro-contas', 'Contas pagas/recebidas por PIX; ISO na data e blocos da mesma tela.');
  result.checks.push('Pagamento de R$13 e recebimento de R$2 por PIX: financeiro -R$1 e caixa físico R$10 preservados');

  await nav('Produtos'); await click(page.getByRole('button', { name: 'Novo produto', exact: true }));
  await fresh(); await productForm.getByLabel('Nome', { exact: true }).fill('Rascunho não salvo'); await fill('Código interno', 'NAO-SALVO');
  await select('Empresa em uso', 'deposito-jg'); await expect(productForm).toBeHidden();
  await click(page.getByRole('button', { name: 'Novo produto', exact: true })); await expect(page.getByLabel('Código interno')).toHaveValue('');
  result.observations.companySwitchDiscardsDraft = true;
  await click(page.getByRole('button', { name: 'Cancelar', exact: true }));

  const oldestSale = await page.evaluate(async () => {
    const bridge = window.nexoLocal, company = 'deposito-jg';
    const supplier = await bridge.createPerson(company, 'supplier', { name: 'Fornecedor histórico' });
    const product = await bridge.createProduct(company, { name: 'Produto histórico', internalCode: 'HIST', unit: 'UNIT', costCents: 100, priceCents: 100 });
    await bridge.receivePurchase(company, crypto.randomUUID(), { supplierId: supplier.id, items: [{ productId: product.id, quantity: '150', unitCostCents: 100 }] });
    await bridge.openCash(company, crypto.randomUUID(), { openingCents: 0 });
    for (let index = 0; index < 101; index++) await bridge.confirmSale(company, crypto.randomUUID(), { items: [{ productId: product.id, quantity: '1' }], paymentMethod: 'CASH' });
    return (await bridge.sales(company)).length;
  });
  expect(oldestSale).toBe(100);
  result.observations.history = readDatabase(db => ({ databaseCount: db.prepare("SELECT count(*) AS n FROM local_sales WHERE company_id='deposito-jg'").get().n }));
  result.observations.history.returnedCount = oldestSale;
  expect(result.observations.history.databaseCount).toBe(101);
  await nav('Vender'); await expect(page.getByRole('table', { name: 'Vendas realizadas' }).locator('tbody tr')).toHaveCount(100);
  result.observations.history.headers = await page.getByRole('table', { name: 'Vendas realizadas' }).locator('thead').innerText();
  const lastRow = page.getByRole('table', { name: 'Vendas realizadas' }).locator('tbody tr').last(); await lastRow.scrollIntoViewIfNeeded();
  await capture('10-historico-limite-100', '101 vendas preservadas no banco, 100 disponíveis na lista e nenhuma página seguinte.');
  result.checks.push('Limitação reproduzida: 101 vendas na base e 100 retornadas/listadas, sem paginação na interface');
  await select('Empresa em uso', 'adega-jg');

  await click(page.getByRole('button', { name: 'Backup: Nunca feito', exact: true }));
  const beforeHealth = snapshot(); await click(page.getByRole('button', { name: 'Verificar dados', exact: true }));
  await expect(page.getByRole('region', { name: 'Verificação dos dados' })).toContainText('estrutura e vínculos sem problemas'); expect(snapshot()).toBe(beforeHealth);
  const backup = path.join(folder, 'review-backup.sqlite');
  await app.evaluate(({ dialog }, file) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: file }); }, backup);
  await click(page.getByRole('button', { name: 'Gerar backup', exact: true })); await expect(page.getByRole('button', { name: /^Backup: Feito em / })).toBeVisible();
  await page.getByRole('button', { name: 'Verificar dados', exact: true }).scrollIntoViewIfNeeded(); await capture('11-backup-e-diagnostico', 'Backup real criado e diagnóstico não altera registros.');
  const backupSnapshot = snapshot();
  await page.evaluate(() => window.nexoLocal.createProduct('adega-jg', { name: 'Posterior ao backup', internalCode: 'APOS', unit: 'UNIT', costCents: 1, priceCents: 1 }));
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false }); }, backup);
  await click(page.getByRole('button', { name: 'Restaurar backup', exact: true })); await expect(page.getByRole('form', { name: 'Acesso local' })).toBeVisible(); expect(snapshot()).toBe(backupSnapshot);
  await capture('12-pos-restauracao', 'Restauração retorna ao login; avaliar confirmação do resultado.');
  const previousFiles = await import('node:fs/promises').then(fs => fs.readdir(path.join(folder, 'NEXO')));
  expect(previousFiles.some(name => name.includes('.before-restore-'))).toBe(true);
  await fill('Senha', 'Senha-teste-123'); await click(page.getByRole('button', { name: 'Entrar', exact: true })); await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  result.checks.push('Backup e restauração reais reproduziram hash integral e guardaram cópia anterior');

  await page.evaluate(() => window.nexoLocal.createOperator({ name: 'Operador da avaliação', password: 'Senha-op-123', companies: ['adega-jg'] }));
  await click(page.getByRole('button', { name: 'Sair', exact: true })); await select('Usuário', { label: 'Operador da avaliação' }); await fill('Senha', 'Senha-op-123'); await click(page.getByRole('button', { name: 'Entrar', exact: true }));
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  await capture('13-operador', 'Perfil operador: menus limitados à operação; primeiro tutorial específico.');
  expect(await page.evaluate(async () => { try { await window.nexoLocal.finance('adega-jg'); return false; } catch { return true; } })).toBe(true);
  expect(await page.evaluate(async () => { try { await window.nexoLocal.products('deposito-jg'); return false; } catch { return true; } })).toBe(true);
  result.checks.push('Operador sem acesso financeiro e sem acesso à outra empresa também pela ponte local');
  expect(result.errors).toEqual([]);
  await app.close(); app = undefined; await launch();
  await select('Usuário', { label: 'Reavaliação NEXO' }); await fill('Senha', 'Senha-teste-123'); await click(page.getByRole('button', { name: 'Entrar', exact: true })); await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  expect((await page.evaluate(() => window.nexoLocal.products('adega-jg'))).length).toBe(2);
  result.checks.push('Reabertura do pacote conserva produtos/contas/vendas e autenticação');
  await persist(); console.log(JSON.stringify({ evidence, checks: result.checks, observations: result.observations, errors: result.errors }, null, 2));
} catch (error) {
  result.errors.push(String(error)); await persist(); throw error;
} finally { clearTimeout(watchdog); await app?.close(); const resolved = path.resolve(folder); if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep)) throw new Error('Pasta de teste fora do local temporário.'); await rm(resolved, { recursive: true, force: true }); }
