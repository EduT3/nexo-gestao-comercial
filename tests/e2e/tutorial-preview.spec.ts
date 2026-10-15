import { test, expect } from '@playwright/test';

test('prévia: persistência por empresa, teclado, reativação e telas somente de demonstração', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const guide = page.getByRole('region', { name: 'Tutorial do NEXO', exact: true });
  const company = page.getByLabel('Empresa em operação');
  const choices = await company.locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
  const click = (name: string) => guide.getByRole('button', { name, exact: true }).click();
  await expect(guide).toContainText('DEMONSTRAÇÃO');
  await click('Começar tutorial');
  await expect(guide.getByRole('heading')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(guide.getByRole('button', { name: 'Fechar tutorial', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('nexo.preview.tutorial')).map(k => JSON.parse(localStorage.getItem(k)!)))).toMatchObject([{ state: 'paused' }]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide).toHaveCount(0);
  await company.selectOption(choices[1]!);
  await expect(guide.getByRole('button', { name: 'Começar tutorial', exact: true })).toBeVisible();
  await click('Desativar tutorial');
  await company.selectOption(choices[0]!);
  await expect(page.getByRole('button', { name: 'Ajuda e tutorial', exact: true })).toBeEnabled();
  await expect(guide).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await click('Reiniciar tutorial');
  await click('Ver esta tela');
  await expect(company).toBeFocused();
  await click('Próxima etapa');
  await click('Ver esta tela');
  await expect(page).toHaveURL(/#products$/);
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(guide).toContainText('não gravam alterações');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(guide).toBeVisible();
  expect(await guide.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/tutorial-preview-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.screenshot({ path: 'artifacts/tutorial-preview-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('prévia: erro de armazenamento é visível e não impede fechar ou usar a ajuda', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.startsWith('nexo.preview.tutorial')) throw new DOMException('Teste: armazenamento bloqueado', 'QuotaExceededError');
      Object.defineProperty(this, key, { value, writable: true, configurable: true });
    };
  });
  await page.goto('/');
  const guide = page.getByRole('region', { name: 'Tutorial do NEXO', exact: true });
  await guide.getByRole('button', { name: 'Desativar tutorial', exact: true }).click();
  await expect(page.getByText('Sua preferência não foi salva.', { exact: false })).toBeVisible();
  await expect(guide).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajuda e tutorial', exact: true }).click();
  await expect(guide.getByRole('button', { name: 'Reativar tutorial', exact: true })).toBeVisible();
});
