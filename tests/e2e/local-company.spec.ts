import { test, expect } from '@playwright/test';

// Renderer-only regression: synthetic IPC responses, no Electron or business database.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let completePreview: (() => void) | undefined;
    Object.defineProperty(window, 'completeExcelPreview', {
      value: () => completePreview?.(),
    });
    Object.defineProperty(window, 'nexoLocal', {
      value: new Proxy(
        {},
        {
          get(_target, method) {
            if (method === 'status')
              return async () => ({
                authenticated: true,
                needsPassword: false,
                configured: true,
                owner: 'Operador de teste',
                users: [],
                dataFolder: 'Base temporária de teste',
                companies: [
                  { id: 'a', name: 'Empresa A de teste', role: 'ADMIN' },
                  { id: 'b', name: 'Empresa B de teste', role: 'ADMIN' },
                ],
              });
            if (method === 'products')
              return async (company: string) => [
                {
                  id: `${company}-product`,
                  name: `Produto ${company}`,
                  internal_code: company,
                  price_cents: 100n,
                  cost_cents: 50n,
                  unit: 'UNIT',
                  active: 1n,
                },
              ];
            if (method === 'stockHistory')
              return async () => ({ rows: [], hasMore: false });
            if (method === 'finance' || method === 'dailyReport')
              return async () => undefined;
            if (method === 'productImportPreview')
              return (company: string) =>
                new Promise((resolve) => {
                  completePreview = () =>
                    resolve({
                      canceled: false,
                      token: `${company}-token`,
                      rows: [
                        {
                          line: 2,
                          status: 'READY',
                          message: '',
                          product: {
                            name: `Importação ${company}`,
                            internalCode: 'TEST',
                          },
                        },
                      ],
                      ready: 1,
                      duplicates: 0,
                      errors: 0,
                    });
                });
            if (
              [
                'categories',
                'people',
                'sales',
                'cash',
                'stock',
                'purchases',
                'receivables',
              ].includes(String(method))
            )
              return async () => [];
            return async () => {
              throw Error(`IPC não previsto no teste: ${String(method)}`);
            };
          },
        },
      ),
    });
  });
  await page.goto('/');
  await expect(page.getByLabel('Empresa em uso')).toHaveValue('a');
});

test('rascunho permanece ao navegar, mas não atravessa empresas', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Produtos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  const form = page.getByRole('form', { name: 'Cadastro de produtos' });
  await form.getByLabel('Nome', { exact: true }).fill('Rascunho da empresa A');
  await page.getByRole('button', { name: 'Estoque', exact: true }).click();
  await page.getByRole('button', { name: 'Produtos', exact: true }).click();
  await expect(form.getByLabel('Nome', { exact: true })).toHaveValue(
    'Rascunho da empresa A',
  );
  await page.getByLabel('Empresa em uso').selectOption('b');
  await expect(form).not.toBeVisible();
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  await expect(form.getByLabel('Nome', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Buscar produto')).toHaveValue('');
});

test('Excel bloqueia troca durante leitura e descarta prévia ao trocar empresa', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Mais opções', exact: true }).click();
  await page
    .getByRole('button', { name: 'Planilhas Excel', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Selecionar planilha', exact: true })
    .click();
  await expect(page.getByLabel('Empresa em uso')).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Selecionar planilha', exact: true }),
  ).toBeDisabled();
  await page.evaluate(() =>
    (
      window as unknown as { completeExcelPreview(): void }
    ).completeExcelPreview(),
  );
  await expect(
    page.getByRole('table', { name: 'Prévia de produtos do Excel' }),
  ).toContainText('Importação a');
  await expect(page.getByLabel('Empresa em uso')).toBeEnabled();
  await page.getByLabel('Empresa em uso').selectOption('b');
  await expect(
    page.getByRole('table', { name: 'Prévia de produtos do Excel' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Confirmar importação', exact: true }),
  ).toHaveCount(0);
});
