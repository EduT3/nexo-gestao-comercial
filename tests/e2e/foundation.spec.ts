import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import type { Session } from '../../src/shared/contracts';

function password() {
  const value = process.env.NEXO_E2E_PASSWORD;
  if (!value) throw new Error('Credencial temporária E2E indisponível.');
  return value;
}

async function login(page: Page, email = 'admin@jg.local', loginPassword = password()) {
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(loginPassword);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page.getByLabel('Empresa em operação')).toBeVisible();
}

async function selectCompany(page: Page, name: string) {
  const selector = page.getByLabel('Empresa em operação');
  await selector.selectOption({ label: name });
  return selector.inputValue();
}

async function navigate(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page, description: string) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    scroll: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('main, section, form, fieldset, label, input, header, table')]
      .map(element => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right) }))
      .filter(element => element.right > innerWidth).slice(0, 12),
    tables: [...document.querySelectorAll('table')].map(table => {
      const holder = table.parentElement;
      const panel = holder?.parentElement;
      return {
        table: Math.round(table.getBoundingClientRect().width),
        holder: holder ? Math.round(holder.getBoundingClientRect().width) : null,
        holderOverflow: holder ? getComputedStyle(holder).overflowX : null,
        panel: panel ? Math.round(panel.getBoundingClientRect().width) : null,
      };
    }),
  }));
  expect(dimensions.scroll, `${description}: ${JSON.stringify({ overflowing: dimensions.overflowing, tables: dimensions.tables })}`).toBeLessThanOrEqual(dimensions.viewport);
}

test('login rejeita senha inválida, autentica e logout revoga acesso', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoHorizontalOverflow(page, `Login em ${width}px`);
    await page.screenshot({ path: testInfo.outputPath(`login-empty-${width}.png`), fullPage: true });
  }
  await page.getByLabel('E-mail', { exact: true }).fill('admin@jg.local');
  await page.getByLabel('Senha', { exact: true }).fill('invalid-temporary-password');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');
  await expect(page.getByLabel('Empresa em operação')).toHaveCount(0);
  await page.getByLabel('Senha', { exact: true }).fill(password());
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page.getByLabel('Empresa em operação')).toBeVisible();
  await page.getByRole('button', { name: 'Sair do sistema', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  expect((await page.request.get('/api/auth/session')).status()).toBe(401);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();
});

test('empresa salva no banco, recarrega e mantém contextos independentes em duas abas', async ({ page, context }) => {
  await login(page);
  await selectCompany(page, 'Adega JG');
  await navigate(page, 'Empresas');
  const legalName = `Adega validação ${randomUUID().slice(0, 8)}`;
  await page.getByLabel('Razão social').fill(legalName);
  await page.getByLabel('Endereço').fill('Rua do teste, 120');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status')).toContainText('atualizad');
  await page.reload();
  await expect(page.getByLabel('Razão social')).toHaveValue(legalName);
  await expect(page.getByLabel('Endereço')).toHaveValue('Rua do teste, 120');

  const second = await context.newPage();
  await second.goto('/#companies');
  await expect(second.getByLabel('Empresa em operação')).toBeVisible();
  const depositId = await selectCompany(second, 'Depósito JG');
  await expect(second.getByLabel('Razão social')).toHaveValue('Depósito JG');
  await expect(second.getByLabel('Endereço')).toHaveValue('');
  await expect(page.getByLabel('Razão social')).toHaveValue(legalName);
  expect(await page.getByLabel('Empresa em operação').inputValue()).not.toBe(depositId);

  await navigate(page, 'Auditoria');
  await expect(page.getByRole('row').filter({ hasText: 'Dados da empresa atualizados' })).toBeVisible();
  await navigate(second, 'Auditoria');
  await expect(second.getByRole('row').filter({ hasText: 'Dados da empresa atualizados' })).toHaveCount(0);
  await second.close();
});

test('usuário criado fica isolado e operador tem acesso administrativo negado pelo servidor', async ({ page, browser }) => {
  await login(page);
  const adegaId = await selectCompany(page, 'Adega JG');
  await navigate(page, 'Usuários');
  await page.getByRole('button', { name: 'Novo usuário' }).click();
  const suffix = randomUUID().slice(0, 8);
  const name = `Operador teste ${suffix}`;
  const email = `operator-${suffix}@example.test`;
  await page.getByLabel('Nome completo').fill(name);
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha inicial').fill(password());
  await page.getByLabel('Perfil de acesso').selectOption('OPERADOR');
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  const depositId = await selectCompany(page, 'Depósito JG');
  await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Equipe da empresa' })).toBeVisible();

  const operatorContext = await browser.newContext();
  try {
    const operator = await operatorContext.newPage();
    await login(operator, email);
    await expect(operator.getByLabel('Empresa em operação').locator('option')).toHaveCount(1);
    await expect(operator.getByRole('navigation').getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);
    await expect(operator.getByRole('navigation').getByRole('link', { name: 'Auditoria', exact: true })).toHaveCount(0);
    const sessionResponse = await operator.request.get('/api/auth/session');
    const session = await sessionResponse.json() as Session;
    expect(session.companies.map(company => company.id)).toEqual([adegaId]);
    expect((await operator.request.get(`/api/companies/${adegaId}/users`)).status()).toBe(403);
    expect((await operator.request.get(`/api/companies/${depositId}/overview`)).status()).toBe(404);
    const update = await operator.request.patch(`/api/companies/${adegaId}`, {
      headers: { Origin: 'http://127.0.0.1:5174', 'X-CSRF-Token': session.csrfToken },
      data: { name: 'Alteração não permitida' },
    });
    expect(update.status()).toBe(403);
    expect((await operator.request.get('/api/auth/session')).status()).toBe(200);
  } finally { await operatorContext.close(); }
});

test('senha atual incorreta preserva a sessão e permite continuar trabalhando', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Minha conta', exact: true }).click();
  await page.getByLabel('Senha atual', { exact: true }).fill('incorrect-current-password');
  await page.getByLabel(/^Nova senha/).fill('temporary-new-password-123');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('temporary-new-password-123');
  await page.getByRole('button', { name: 'Alterar senha e entrar novamente' }).click();
  await expect(page.getByRole('alert')).toContainText('Senha atual inválida');
  await expect(page.getByRole('heading', { name: 'Minha conta', exact: true })).toBeVisible();
  expect((await page.request.get('/api/auth/session')).status()).toBe(200);
  await navigate(page, 'Empresas');
  await expect(page.getByLabel('Nome fantasia')).toBeVisible();
});

test('falha da API exibe erro real, remove dados anteriores e permite tentar novamente', async ({ page }) => {
  await login(page);
  await navigate(page, 'Usuários');
  await expect(page.getByRole('heading', { name: 'Equipe da empresa' })).toBeVisible();
  const route = '**/api/companies/*/users';
  await page.route(route, request => request.abort('failed'));
  await selectCompany(page, 'Depósito JG');
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar ao servidor');
  await expect(page.getByRole('heading', { name: 'Equipe da empresa' })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.unroute(route);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Equipe da empresa' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('layout mantém navegação e formulários utilizáveis a 360 e 1440 pixels', async ({ page }, testInfo) => {
  await login(page);
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByLabel('Empresa em operação')).toBeVisible();
    await expectNoHorizontalOverflow(page, `Visão geral em ${width}px`);
    await page.screenshot({ path: testInfo.outputPath(`overview-${width}.png`), fullPage: true });
    for (const name of ['Empresas', 'Usuários', 'Auditoria']) {
      await navigate(page, name);
      if (name === 'Usuários') await page.getByRole('button', { name: 'Novo usuário' }).click();
      await expectNoHorizontalOverflow(page, `${name} em ${width}px`);
      await expect(page.getByLabel('Empresa em operação')).toBeVisible();
    }
    await page.goto('/');
    await expect(page.getByLabel('Empresa em operação')).toBeVisible();
  }
});
