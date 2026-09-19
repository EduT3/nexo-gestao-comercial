import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const folder = await mkdtemp(path.join(tmpdir(), 'nexo-operator-'));
let app;
try {
 app = await electron.launch({ args: ['electron/main.cjs'], env: { ...process.env, LOCALAPPDATA: folder, NEXO_TEST_HIDE_WINDOW: '1' } });
 await app.context().setOffline(true); let page = await app.firstWindow(); page.setDefaultTimeout(7000);
 await page.getByLabel('Nome do responsável').fill('Responsável teste');
 await page.getByRole('button', { name: 'Começar', exact: true }).click();
 await page.getByLabel('Senha', { exact: true }).fill('Senha-admin-123');
 await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha-admin-123');
 await page.getByRole('button', { name: 'Definir senha', exact: true }).click();
 const productId = await page.evaluate(async () => {
  const product = await window.nexoLocal.createProduct('adega-jg', { name: 'Produto teste operador', internalCode: 'OP-TEST', unit: 'UNIT', costCents: 50, priceCents: 100 });
  const supplier = await window.nexoLocal.createPerson('adega-jg', 'supplier', { name: 'Fornecedor teste' });
  await window.nexoLocal.receivePurchase('adega-jg', crypto.randomUUID(), { supplierId: supplier.id, items: [{ productId: product.id, quantity: '2', unitCostCents: 50 }] });
  return product.id;
 });
 await page.locator('summary').filter({ hasText: /^Operadores$/ }).click();
 const form = page.getByRole('form', { name: 'Cadastro de operadores' });
 await form.getByLabel('Nome do operador').fill('Operador Adega');
 await form.getByLabel('Senha do operador', { exact: true }).fill('Senha-op-123');
 await form.getByLabel('Confirmar senha do operador').fill('Senha-op-123');
 await form.getByLabel('Adega JG', { exact: true }).check();
 await form.getByRole('button', { name: 'Cadastrar operador' }).click();
 await expect(form.locator('button')).toBeEnabled();
 await expect(page.getByText('Operador cadastrado. Use Sair para entrar com o novo usuário.')).toBeVisible();
 await page.getByRole('button', { name: 'Sair', exact: true }).click();
 await page.getByLabel('Usuário', { exact: true }).selectOption({ label: 'Operador Adega' });
 await page.getByLabel('Senha', { exact: true }).fill('Senha-op-123');
 await page.getByRole('button', { name: 'Entrar', exact: true }).click();
 await expect(page.getByLabel('Empresa em uso')).toHaveValue('adega-jg');
 await expect(page.getByLabel('Empresa em uso').locator('option')).toHaveCount(1);
 await expect(page.getByRole('button', { name: 'Salvar produto' })).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Gerar backup' })).toHaveCount(0);
 await expect(page.locator('summary').filter({ hasText: /^Resumo do dia$/ })).toHaveCount(0);
 await expect(page.locator('summary').filter({ hasText: /^Excel: importar e exportar$/ })).toHaveCount(0);
 const results = await page.evaluate(async () => {
   const denied = async action => { try { await action(); return false; } catch { return true; } };
   return await Promise.all([
    denied(() => window.nexoLocal.products('deposito-jg')),
    denied(() => window.nexoLocal.createProduct('adega-jg', { name: 'Negado', internalCode: 'NEG', unit: 'UNIT', costCents: 0, priceCents: 100 })),
    denied(() => window.nexoLocal.finance('adega-jg')),
    denied(() => window.nexoLocal.exportExcel('adega-jg')),
    denied(() => window.nexoLocal.productImportTemplate('adega-jg')),
    denied(() => window.nexoLocal.productImportPreview('adega-jg')),
    denied(() => window.nexoLocal.productImportConfirm('00000000-0000-4000-8000-000000000000')),
    denied(() => window.nexoLocal.dailyReport('adega-jg', { from: '2000-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' })),
    denied(() => window.nexoLocal.backup()),
    denied(() => window.nexoLocal.restore()),
    denied(() => window.nexoLocal.createOperator({ name: 'Negado', password: 'Senha-op-123', companies: ['adega-jg'] }))
   ]);
 });
 expect(results).toEqual([true,true,true,true,true,true,true,true,true,true,true]);
 await page.locator('summary').filter({ hasText: /^Caixa$/ }).click();
 await page.getByRole('button', { name: 'Abrir caixa', exact: true }).click();
 await expect(page.getByLabel('Saldo do caixa')).toContainText('R$ 0,00');
 await page.locator('summary').filter({ hasText: /^Vendas$/ }).click();
 await page.getByLabel('Produto da venda 1', { exact: true }).selectOption(productId);
 await page.getByRole('button', { name: 'Concluir venda', exact: true }).click();
 await expect(page.getByRole('table', { name: 'Vendas realizadas' })).toContainText('Confirmada');
 await expect(page.getByLabel('Saldo do caixa')).toContainText('R$ 1,00');
 await expect(page.getByRole('button', { name: 'Cancelar venda', exact: true })).toHaveCount(0);
 const rows = await page.evaluate(() => window.nexoLocal.products('adega-jg'));
 expect(rows.every(row => row.cost_cents === undefined)).toBe(true);
 await page.getByLabel('Dinheiro contado (R$)').fill('1,00');
 await page.getByRole('button', { name: 'Fechar caixa', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Abrir caixa', exact: true })).toBeVisible();
 await expect(page.getByLabel('Desconto da venda (R$)')).toBeDisabled();
 await page.locator('summary').filter({ hasText: /^Estoque e movimentações$/ }).click();
 await expect(page.getByRole('table', { name: 'Saldo de estoque' })).toContainText('1,000');
 const historyTable = page.getByRole('table', { name: 'Histórico de estoque' });
 await expect(historyTable).toContainText('Compra');
 await expect(historyTable).toContainText('Venda');
 await expect(historyTable).toContainText('-1,000');
 await page.getByLabel('Produto do histórico').selectOption(productId);
 await expect(historyTable.locator('tbody tr')).toHaveCount(2);
 const historyDenied = await page.evaluate(async () => { try { await window.nexoLocal.stockHistory('deposito-jg',{}); return false; } catch { return true; } });
 expect(historyDenied).toBe(true);
 console.log('Operador pela janela: cadastro, login, empresa exclusiva, telas por perfil, IPC negado custos omitidos, venda e caixa próprio aprovados.');
} finally { if (app) await app.close(); await rm(folder, { recursive: true, force: true }); }
