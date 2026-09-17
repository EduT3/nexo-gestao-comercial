import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

function password() {
  const value = process.env.NEXO_E2E_PASSWORD;
  if (!value) throw new Error('Credencial temporária E2E indisponível.');
  return value;
}

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@jg.local');
  await page.getByLabel('Senha', { exact: true }).fill(password());
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page.getByLabel('Empresa em operação')).toBeVisible();
}

async function navigate(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
}

async function expectPageFitsViewport(page: Page, description: string) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    main: document.querySelector('main')?.scrollWidth ?? 0,
  }));
  expect(dimensions.document, `${description}: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.main, `${description}: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport);
}

test('catálogo comercial cadastra, persiste, isola e inativa um produto', async ({ page }, testInfo) => {
  await login(page);
  await page.getByLabel('Empresa em operação').selectOption({ label: 'Adega JG' });
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Produtos', 'Categorias', 'Clientes', 'Fornecedores']) {
      await navigate(page, name);
      await expect(page.getByLabel('Empresa em operação')).toHaveValue(/.+/);
      await expect(page.getByLabel('Pesquisar')).toBeVisible();
      await expectPageFitsViewport(page, `${name} em ${width}px`);
      await page.screenshot({ path: testInfo.outputPath(`${name.toLocaleLowerCase('pt-BR')}-${width}.png`), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const suffix = randomUUID().slice(0, 8);
  const category = `Categoria E2E ${suffix}`;
  const supplier = `Fornecedor E2E ${suffix}`;
  const product = `Produto E2E ${suffix}`;
  const code = `E2E-${suffix}`.toUpperCase();

  await navigate(page, 'Categorias');
  await page.getByRole('button', { name: 'Nova categoria' }).click();
  await page.getByLabel('Nome', { exact: true }).fill(category);
  await page.getByLabel(/Descrição/).fill('Categoria criada pelo fluxo real de navegador.');
  await page.getByRole('button', { name: 'Cadastrar categoria' }).click();
  const categoryRow = page.getByRole('row').filter({ hasText: category });
  await expect(categoryRow).toBeVisible();
  await categoryRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel(/Descrição/).fill('Categoria E2E revisada.');
  await page.getByRole('button', { name: 'Salvar categoria' }).click();
  await expect(page.getByRole('row').filter({ hasText: category })).toContainText('Categoria E2E revisada.');

  await navigate(page, 'Fornecedores');
  await page.getByRole('button', { name: 'Novo fornecedor' }).click();
  await page.getByLabel('Nome ou razão social').fill(supplier);
  await page.getByLabel(/Telefone/).fill('(11) 3333-2222');
  await page.getByRole('button', { name: 'Cadastrar fornecedor' }).click();
  const supplierRow = page.getByRole('row').filter({ hasText: supplier });
  await expect(supplierRow).toBeVisible();
  await supplierRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel(/E-mail/).fill(`compras-${suffix}@example.test`);
  await page.getByRole('button', { name: 'Salvar fornecedor' }).click();
  await expect(page.getByRole('row').filter({ hasText: supplier })).toContainText(`compras-${suffix}@example.test`);

  await navigate(page, 'Produtos');
  await page.getByRole('button', { name: 'Novo produto' }).click();
  await page.getByLabel('Nome do produto').fill(product);
  await page.getByLabel('Código interno').fill(code);
  await page.getByLabel('Unidade').selectOption('UNIT');
  await page.getByLabel('Custo', { exact: true }).fill('12,50');
  await page.getByLabel('Preço de venda').fill('18,90');
  await page.getByLabel('Estoque mínimo').fill('4');
  await page.getByLabel('Categoria').selectOption({ label: category });
  await page.getByLabel('Fornecedor principal').selectOption({ label: supplier });
  await page.getByRole('button', { name: 'Cadastrar produto' }).click();
  const productRow = page.getByRole('row').filter({ hasText: code });
  await expect(productRow).toContainText(product);
  await expect(productRow).toContainText('R$ 18,90');
  await productRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Preço de venda').fill('19,90');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  await expect(page.getByRole('row').filter({ hasText: code })).toContainText('R$ 19,90');

  await navigate(page, 'Estoque');
  await page.getByRole('button', { name: 'Nova movimentação' }).click();
  await page.getByLabel('Produto').selectOption({ label: `${product} · saldo 0.000` });
  await page.getByLabel('Quantidade').fill('5,125');
  await page.getByLabel('Observação').fill('Entrada validada pelo fluxo de navegador.');
  await page.getByRole('button', { name: 'Registrar movimentação' }).click();
  await expect(page.getByRole('status')).toContainText('saldo e o histórico foram atualizados');
  await expect(page.getByRole('row').filter({ hasText: code }).first()).toContainText('5.125');
  await expect(page.getByRole('row').filter({ hasText: 'Entrada validada pelo fluxo de navegador.' })).toContainText('+5.125');
  await page.setViewportSize({ width: 360, height: 900 });
  await expectPageFitsViewport(page, 'Estoque em 360px');
  await page.setViewportSize({ width: 1440, height: 900 });

  await navigate(page, 'Compras');
  await page.getByRole('button', { name: 'Registrar compra' }).click();
  await page.getByLabel('Fornecedor').selectOption({ label: supplier });
  await page.getByLabel('Produto').selectOption({ label: product });
  await page.getByLabel('Quantidade').fill('2,500');
  await page.getByLabel('Custo unitário').fill('13,20');
  await page.getByLabel('Observação da compra').fill('Compra E2E recebida e conferida.');
  await page.getByLabel('Gerar conta a pagar').check();
  await page.getByLabel('Vencimento').fill('2026-10-15');
  await page.getByRole('button', { name: 'Confirmar recebimento' }).click();
  await expect(page.getByRole('status').filter({hasText:'Estoque, custos, histórico e conta a pagar'})).toBeVisible();
  const purchaseRow = page.getByRole('row').filter({ hasText: 'Compra E2E recebida e conferida.' });
  await expect(purchaseRow).toContainText(supplier);
  await expect(purchaseRow).toContainText('R$ 33,00');
  await expect(purchaseRow).toContainText('A pagar');
  await page.setViewportSize({ width: 360, height: 900 });
  await expectPageFitsViewport(page, 'Compras em 360px');
  await page.setViewportSize({ width: 1440, height: 900 });

  await navigate(page, 'Estoque');
  await expect(page.getByRole('row').filter({ hasText: code }).first()).toContainText('7.625');
  await expect(page.getByRole('row').filter({ hasText: `Recebimento da compra` })).toContainText('+2.500');

  await navigate(page, 'Caixa');
  await page.getByLabel('Saldo inicial').fill('100,00');
  await page.getByRole('button', { name: 'Abrir caixa' }).click();
  await expect(page.getByRole('status')).toContainText('PDV está liberado');
  await expect(page.getByText('R$ 100,00').first()).toBeVisible();

  await navigate(page, 'PDV / Vendas');
  await page.getByLabel('Buscar produto').fill(code);
  await page.getByRole('button', { name: new RegExp(product) }).click();
  await page.getByLabel('Cliente').selectOption({ label: 'Churrasco do João' });
  await page.getByLabel('Pagamento').selectOption('PIX');
  await page.getByLabel('Desconto').fill('1,00');
  await page.getByLabel('Observação').fill('Venda E2E finalizada por Pix.');
  await page.getByRole('button', { name: 'Finalizar em Pix' }).click();
  await expect(page.getByText('Venda concluída. Pagamento, estoque, caixa e financeiro foram atualizados.')).toBeVisible();
  const saleRow = page.getByRole('row').filter({ hasText: 'Churrasco do João' }).first();
  await expect(saleRow).toContainText('Pix');
  await expect(saleRow).toContainText('R$ 18,90');
  await page.setViewportSize({ width: 360, height: 900 });
  await expectPageFitsViewport(page, 'PDV em 360px');
  await page.setViewportSize({ width: 1440, height: 900 });

  await navigate(page, 'Financeiro');
  const payableRow = page.getByRole('row').filter({ hasText: supplier }).filter({ hasText: 'Em aberto' });
  await expect(payableRow).toContainText('R$ 33,00');
  await payableRow.getByRole('combobox').selectOption('PIX');
  page.once('dialog', dialog => dialog.accept());
  await payableRow.getByRole('button', { name: 'Registrar pagamento' }).click();
  await expect(page.getByRole('status').filter({hasText:'Conta paga por Pix'})).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: supplier }).filter({ hasText: 'Pago' })).toContainText('Pix');
  await expect(page.getByRole('row').filter({ hasText: 'Conta a pagar' })).toContainText('−R$ 33,00');
  await validateReceivable(page);
  await validateManualFinance(page);
  await page.setViewportSize({ width: 360, height: 900 });
  await expectPageFitsViewport(page, 'Financeiro em 360px');
  await page.setViewportSize({ width: 1440, height: 900 });

  await navigate(page, 'Caixa');
  await expect(page.getByText('R$ 100,00').first()).toBeVisible();
  await expect(page.getByText('R$ 18,90').first()).toBeVisible();
  await page.getByLabel('Tipo').selectOption('ENTRY');
  await page.getByLabel('Valor').fill('10,00');
  await page.getByLabel('Motivo').fill('Troco adicional E2E');
  await page.getByRole('button', { name: 'Registrar movimento' }).click();
  await expect(page.getByText('Movimento registrado e saldo esperado atualizado.')).toBeVisible();
  await page.getByLabel('Tipo').selectOption('EXIT');
  await page.getByLabel('Valor').fill('5,00');
  await page.getByLabel('Motivo').fill('Retirada operacional E2E');
  await page.getByRole('button', { name: 'Registrar movimento' }).click();
  await expect(page.getByText('R$ 105,00').first()).toBeVisible();
  await page.getByLabel('Dinheiro contado').fill('104,75');
  await page.getByLabel('Observação do fechamento').fill('Conferência E2E com diferença.');
  await page.getByRole('button', { name: 'Conferir e fechar caixa' }).click();
  await expect(page.getByText('Caixa fechado. Diferença registrada: -R$ 0,25.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Abrir caixa' })).toBeVisible();
  await navigate(page, 'Estoque');
  await expect(page.getByRole('row').filter({ hasText: code }).first()).toContainText('6.625');

  await navigate(page, 'Produtos');
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: code })).toBeVisible();
  await page.getByLabel('Pesquisar').fill(code);
  await page.getByRole('button', { name: 'Pesquisar' }).click();
  await expect(page.getByRole('row').filter({ hasText: code })).toHaveCount(1);
  await page.getByLabel('Empresa em operação').selectOption({ label: 'Depósito JG' });
  await expect(page.getByRole('row').filter({ hasText: code })).toHaveCount(0);
  await page.getByLabel('Empresa em operação').selectOption({ label: 'Adega JG' });

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('row').filter({ hasText: code }).getByRole('button', { name: 'Inativar' }).click();
  await expect(page.getByRole('row').filter({ hasText: code })).toHaveCount(0);
  await page.getByLabel('Exibir').selectOption('all');
  await expect(page.getByRole('row').filter({ hasText: code })).toContainText('Inativo');
});

async function validateManualFinance(page: Page) {
  for (const entry of [
    { kind: 'EXPENSE', method: 'PIX', amount: '3,21', description: `Despesa Pix E2E ${randomUUID().slice(0,8)}` },
    { kind: 'REVENUE', method: 'CASH', amount: '2,00', description: `Receita dinheiro E2E ${randomUUID().slice(0,8)}` },
    { kind: 'EXPENSE', method: 'CASH', amount: '2,00', description: `Despesa dinheiro E2E ${randomUUID().slice(0,8)}` },
  ]) {
    await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
    await page.getByLabel('Tipo de lançamento', { exact: true }).selectOption(entry.kind);
    await page.getByLabel('Descrição do lançamento', { exact: true }).fill(entry.description);
    await page.getByLabel('Categoria do lançamento', { exact: true }).fill('Operação E2E');
    await page.getByLabel('Valor do lançamento', { exact: true }).fill(entry.amount);
    await page.getByLabel('Meio do lançamento', { exact: true }).selectOption(entry.method);
    await page.setViewportSize({ width: 360, height: 900 });
    await expectPageFitsViewport(page, 'Lançamento manual em 360px');
    await page.getByRole('button', { name: 'Registrar lançamento', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: entry.description })).toContainText(entry.amount);
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: entry.description })).toBeVisible();
    await page.getByLabel('Empresa em operação').selectOption({ label: 'Depósito JG' });
    await expect(page.getByRole('row').filter({ hasText: entry.description })).toHaveCount(0);
    await page.getByLabel('Empresa em operação').selectOption({ label: 'Adega JG' });
    await expect(page.getByRole('row').filter({ hasText: entry.description })).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function validateReceivable(page: Page) {
  await navigate(page,'Financeiro'); const description=`Recebível E2E ${randomUUID().slice(0,8)}`;
  await page.getByRole('button',{name:'Nova conta a receber'}).click();
  await page.getByLabel('Descrição da conta').fill(description);
  await page.getByLabel('Categoria financeira').fill('Outras receitas');
  await page.getByLabel('Valor a receber').fill('25,50');
  await page.getByLabel('Vencimento da conta').fill('2026-11-10');
  await page.getByRole('button',{name:'Cadastrar conta a receber'}).click();
  const row=page.getByRole('row').filter({hasText:description});
  await expect(row).toContainText('Em aberto'); await expect(row).toContainText('R$ 25,50');
  await page.getByLabel('Empresa em operação').selectOption({label:'Depósito JG'});
  await expect(page.getByRole('row').filter({hasText:description})).toHaveCount(0);
  await page.getByLabel('Empresa em operação').selectOption({label:'Adega JG'});
  page.once('dialog',dialog=>dialog.accept()); await row.getByRole('button',{name:'Registrar recebimento'}).click();
  await expect(page.getByRole('row').filter({hasText:description}).filter({hasText:'Recebido'})).toBeVisible();
  await page.setViewportSize({width:360,height:900}); await expectPageFitsViewport(page,'Contas a receber em 360px');
}

test('clientes ficam vinculados apenas à empresa em operação', async ({ page }) => {
  await login(page);
  await page.getByLabel('Empresa em operação').selectOption({ label: 'Adega JG' });
  const customer = `Cliente E2E ${randomUUID().slice(0, 8)}`;
  await navigate(page, 'Clientes');
  await page.getByRole('button', { name: 'Novo cliente' }).click();
  await page.getByLabel('Nome ou razão social').fill(customer);
  await page.getByLabel(/WhatsApp/).fill('(11) 98888-7777');
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click();
  const customerRow = page.getByRole('row').filter({ hasText: customer });
  await expect(customerRow).toBeVisible();
  await customerRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel(/Endereço/).fill('Rua da validação, 15');
  await page.getByRole('button', { name: 'Salvar cliente' }).click();
  await expect(page.getByRole('row').filter({ hasText: customer })).toContainText('Rua da validação, 15');
  await page.getByLabel('Empresa em operação').selectOption({ label: 'Depósito JG' });
  await expect(page.getByRole('row').filter({ hasText: customer })).toHaveCount(0);
});
