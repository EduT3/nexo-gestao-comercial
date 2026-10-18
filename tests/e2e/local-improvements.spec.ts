import { test, expect, type Page } from '@playwright/test';

async function configure(page: Page) {
  await page.addInitScript(() => {
    const productRows = Array.from({ length: 125 }, (_, i) => ({ id: `p${i}`, name: i === 124 ? 'Água São João' : `Produto ${String(i).padStart(3, '0')}`, internal_code: `CODE-${i}`, price_cents: 100n, cost_cents: 50n, active: 1n, unit: 'UNIT', category_id: i === 0 ? 'cat1' : null }));
    const finance = { receivedCents: 0n, reversedReceiptCents: 0n, netReceivedCents: 0n, totalIncomeCents: 100n, financialBalanceCents: 100n, revenueCents: 100n, reversedCents: 0n, netRevenueCents: 100n, paidExpenseCents: 0n, payables: [{ id: 'pay1', purchase_id: 'purchase1', supplier_name: 'Fornecedor teste', amount_cents: 100n, due_date: '2026-10-14', status: 'OPEN', payment_id: null }] };
    const control = {
      calls: [] as { method: string; company: string }[],
      deferred: [] as string[],
      pending: [] as { method: string; resolve(value?: unknown): void; reject(error: Error): void }[],
      values: {
        salesHistory: { rows: [{ id: 'sale1', created_at: '2026-10-18T12:00:00.000Z', customer_name: null, total_cents: 100n, method: 'PIX', change_cents: 0n, status: 'CONFIRMED', cancellation_reason: null }], total: 1, page: 0, pageSize: 50 },
        cashAvailability: { open: true, canSell: true, operatorName: 'Teste', openedAt: '2026-10-18T12:00:00Z', balanceCents: 100n },
        cash: [{ id: 'cash1', can_operate: true, actor_name: 'Teste', closed: 0n, balance_cents: 100n, movements: [], closure: null }],
        finance,
        receivables: [{ id: 'r1', description: 'Conta teste', customer_name: null, amount_cents: 100n, due_date: '2026-10-14', receipt_id: null, status: 'OPEN' }],
        purchases: [{ id: 'purchase1', supplier_name: 'Fornecedor teste', total_cents: 100n, due_date: null }],
      } as Record<string, unknown>,
    };
    Object.assign(window, { nexoTest: control });
    Object.defineProperty(window, 'nexoLocal', { value: new Proxy({}, { get(_target, property) {
      const method = String(property);
      return async (company: string) => {
        control.calls.push({ method, company });
        let value: unknown;
        if (method === 'status') value = { configured: true, authenticated: true, needsPassword: false, users: [], owner: 'Teste', dataFolder: 'Base fictícia', companies: [{ id: 'a', name: 'Empresa A', role: 'ADMIN' }, { id: 'b', name: 'Empresa B', role: 'ADMIN' }] };
        else if (method === 'products') value = productRows;
        else if (method === 'stock') value = productRows.map((p, i) => ({ ...p, balance_milli: i === 124 ? 0n : 1000n }));
        else if (method === 'stockHistory') value = control.values.stockHistory ?? { rows: [], hasMore: false };
        else if (method === 'people') value = [{ id: 'person1', name: 'Pessoa teste', active: true }];
        else if (method === 'categories') value = control.values.categories ?? [];
        else if (method === 'dailyReport') value = undefined;
        else if (method === 'confirmSale') value = { totalCents: 200n, changeCents: 0n };
        else if (method === 'checkDataHealth') value = { integrityOk: true, linksOk: true, databaseBytes: '1048576', checkedAt: '2026-10-14T12:00:00Z' };
        else value = control.values[method];
        if (control.deferred.includes(method)) return new Promise((resolve, reject) => control.pending.push({ method, resolve: (result = value) => resolve(result), reject }));
        return value;
      };
    } }) });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  await expect(page.getByLabel('Produto da venda 1')).toContainText('Água São João');
}
const areas = [
  { method: 'salesHistory', area: 'Vender', table: 'Vendas realizadas' },
  { method: 'purchases', area: 'Compras', table: 'Compras recebidas' },
  { method: 'receivables', area: 'Financeiro', table: 'Contas a receber' },
  { method: 'cash', area: 'Caixa', table: 'Histórico de caixas' },
  { method: 'finance', area: 'Financeiro', table: 'Contas a pagar' },
];
async function visit(page: Page, name: string, financialView = 'Pagar') {
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true }).click();
  if (name === 'Financeiro') { const button = page.getByRole('group', { name: 'Tarefas do financeiro' }).getByRole('button', { name: financialView, exact: true }); if (await button.getAttribute('aria-pressed') !== 'true') await button.click(); }
  if (name === 'Compras') { const history = page.locator('#compras .purchase-history'); if (!(await history.evaluate(element => (element as HTMLDetailsElement).open))) await history.locator('summary').click(); }
}
async function defer(page: Page, method: string) {
  await page.evaluate(method => { (window as any).nexoTest.deferred = [method]; }, method);
}
async function waitPending(page: Page, count: number) {
  await expect.poll(() => page.evaluate(() => (window as any).nexoTest.pending.length)).toBeGreaterThanOrEqual(count);
}
async function updateValue(page: Page, method: string) {
  await page.evaluate(method => {
    const control = (window as any).nexoTest;
    const value = control.values[method];
    control.values[method] = method === 'finance'
      ? { ...value, payables: value.payables.map((row: object) => ({ ...row, amount_cents: 200n })) }
      : method === 'salesHistory' ? { ...value, rows: value.rows.map((row: object) => ({ ...row, total_cents: 200n })) }
      : value.map((row: object) => ({ ...row, total_cents: 200n, amount_cents: 200n, balance_cents: 200n }));
  }, method);
}

test('não carrega áreas fechadas nem atualiza módulos escondidos; mantém rascunho', async ({ page }) => {
  await configure(page);
  const first = await page.evaluate(() => (window as any).nexoTest.calls.map((call: any) => call.method));
  expect(first.filter((method: string) => method === 'products')).toHaveLength(1);
  expect(first).not.toContain('stock'); expect(first).not.toContain('finance'); expect(first).not.toContain('cash');
  await visit(page, 'Produtos');
  await page.getByRole('button', { name: 'Novo produto' }).click();
  await page.getByLabel('Código interno').fill('RASCUNHO');
  await visit(page, 'Caixa'); await visit(page, 'Produtos');
  await expect(page.getByLabel('Código interno')).toHaveValue('RASCUNHO');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls);
  expect(calls.filter((c: any) => c.method === 'cash')).toHaveLength(1);
  expect(calls.filter((c: any) => c.method === 'salesHistory')).toHaveLength(1);
});

test('busca sem acento, paginação e filtro de estoque funcionam com 125 produtos', async ({ page }) => {
  await configure(page); await visit(page, 'Produtos');
  const table = page.locator('section.table-panel table');
  await expect(table.locator('tbody tr')).toHaveCount(50);
  await page.getByRole('group', { name: 'Páginas de produtos' }).getByRole('button', { name: 'Próxima página' }).click();
  await expect(table.locator('tbody tr')).toHaveCount(50);
  await page.getByRole('group', { name: 'Páginas de produtos' }).getByRole('button', { name: 'Próxima página' }).click();
  await expect(table.locator('tbody tr')).toHaveCount(25);
  await page.getByLabel('Buscar produto').fill('agua sao joao');
  await expect(table.locator('tbody tr')).toHaveCount(1); await expect(table).toContainText('Água São João');
  await page.getByLabel('Buscar produto').fill('CODE-124'); await expect(table.locator('tbody tr')).toHaveCount(1);
  await visit(page, 'Estoque');
  await page.getByLabel('Somente sem estoque').check();
  await expect(page.getByRole('table', { name: 'Saldo de estoque' }).locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar no estoque').fill('agua'); await expect(page.getByRole('table', { name: 'Saldo de estoque' })).toContainText('Água São João');
  await visit(page, 'Mais opções'); await page.getByRole('button', { name: 'Backup e dados', exact: true }).click();
  await page.getByRole('button', { name: 'Verificar dados', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Verificação dos dados' })).toContainText('estrutura e vínculos sem problemas');
});

for (const scenario of areas) {
  test(`${scenario.method}: resposta e erro atrasados não substituem consulta recente`, async ({ page }) => {
    await configure(page); await defer(page, scenario.method);
    await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 2);
    await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    await expect(table).toContainText('R$ 2,00');
    await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
    await expect(table).not.toContainText('R$ 1,00');
    await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 3);
    await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 4);
    await page.evaluate(() => { const pending = (window as any).nexoTest.pending; pending[3].resolve(); pending[2].reject(new Error('ERRO ANTIGO')); });
    await expect(table).toContainText('R$ 2,00');
    await expect(page.getByText(/ERRO ANTIGO/)).toHaveCount(0);
  });

  test(`${scenario.method}: consulta anterior à gravação não regride o saldo`, async ({ page }) => {
    await configure(page); await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar');
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    await expect(table).toContainText('R$ 1,00');
    await defer(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method);
    if (scenario.method === 'salesHistory') {
      await page.getByLabel('Produto da venda 1').selectOption('p0'); await page.getByRole('button', { name: 'Concluir venda', exact: true }).click();
    } else if (scenario.method === 'purchases') {
      await page.getByLabel('Fornecedor', { exact: true }).selectOption('person1'); await page.getByLabel('Produto 1', { exact: true }).selectOption('p0');
      await page.getByLabel('Custo unitário 1 (R$)').fill('1,00'); await page.getByRole('button', { name: 'Receber compra', exact: true }).click();
    } else if (scenario.method === 'receivables') {
      await page.getByRole('button', { name: 'Nova conta a receber', exact: true }).click();
      await page.getByLabel('Descrição da conta').fill('Conta nova'); await page.getByLabel('Valor a receber (R$)').fill('2,00');
      await page.getByLabel('Vencimento a receber').fill('2026-10-14'); await page.getByRole('button', { name: 'Salvar conta a receber', exact: true }).click();
    } else if (scenario.method === 'cash') {
      await page.getByText('Adicionar ou retirar dinheiro', { exact: true }).click(); await page.getByLabel('Valor do movimento (R$)').fill('1,00');
      await page.getByLabel('Motivo do movimento').fill('Teste temporário'); await page.getByRole('button', { name: 'Registrar movimento', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Pagar conta', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
    }
    await waitPending(page, 2);
    // onSaved may trigger a second fresh query; release both, then the oldest snapshot.
    await waitPending(page, ['receivables', 'finance'].includes(scenario.method) ? 3 : 2);
    await page.evaluate(() => { const pending = (window as any).nexoTest.pending; for (const query of pending.slice(1)) query.resolve(); });
    await expect(table).toContainText('R$ 2,00');
    await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
    await expect(table).not.toContainText('R$ 1,00');
  });
}


test('navegação repetida não acumula consultas e histórico não recalcula o saldo', async ({ page }) => {
  await configure(page);
  for (let visitNumber = 0; visitNumber < 12; visitNumber++) { await visit(page, 'Caixa'); await visit(page, 'Produtos'); }
  const calls = await page.evaluate(() => (window as any).nexoTest.calls);
  expect(calls.filter((c: any) => c.method === 'cash')).toHaveLength(12);
  expect(calls.filter((c: any) => c.method === 'products')).toHaveLength(13);
  expect(calls.filter((c: any) => c.method === 'salesHistory')).toHaveLength(1);
  await page.evaluate(() => { (window as any).nexoTest.values.stockHistory = { rows: [], hasMore: true }; });
  await visit(page, 'Estoque'); await page.getByRole('button', { name: 'Mais antigas', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => c.method === 'stockHistory').length)).toBe(2);
  const balanceCalls = await page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => c.method === 'stock').length);
  expect(balanceCalls).toBe(1);
});

for (const scenario of areas) {
  test(scenario.method + ': resposta de outra empresa é ignorada', async ({ page }) => {
    await configure(page); await defer(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivables' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method);
    await page.getByLabel('Empresa em uso').selectOption('b'); await waitPending(page, 2);
    await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    if (scenario.method === 'purchases') await page.locator('#compras .purchase-history > summary').click();
    await expect(table).toContainText('R$ 2,00');
    await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
    await expect(table).not.toContainText('R$ 1,00');
  });
}


test('categoria de edição e rascunho é preservada após carregamento adiado e navegação', async ({ page }) => {
  await configure(page); await visit(page, 'Produtos');
  await page.evaluate(() => { (window as any).nexoTest.values.categories = [{ id: 'cat1', name: 'Categoria teste', active: 1n }]; });
  await defer(page, 'categories');
  await page.locator('section.table-panel').getByRole('button', { name: 'Editar', exact: true }).first().click();
  await waitPending(page, 1); await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
  await expect(page.getByLabel('Categoria', { exact: true })).toHaveValue('cat1');
  await visit(page, 'Caixa'); await visit(page, 'Produtos'); await waitPending(page, 2);
  await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
  await expect(page.getByLabel('Categoria', { exact: true })).toHaveValue('cat1');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  await expect(page.getByLabel('Categoria', { exact: true })).toHaveValue('');
});


test('caixa informa falha da consulta após gravação e não a substitui por sucesso', async ({ page }) => {
  await configure(page); await visit(page, 'Caixa');
  await expect(page.getByLabel('Saldo do caixa')).toContainText('R$ 1,00');
  await defer(page, 'cash'); await visit(page, 'Caixa'); await waitPending(page, 1);
  await page.getByText('Adicionar ou retirar dinheiro', { exact: true }).click();
  await page.getByLabel('Valor do movimento (R$)').fill('1,00'); await page.getByLabel('Motivo do movimento').fill('Teste de erro');
  await page.getByRole('button', { name: 'Registrar movimento', exact: true }).click(); await waitPending(page, 2);
  await page.evaluate(() => (window as any).nexoTest.pending[1].reject(new Error('Falha ao consultar caixa')));
  await expect(page.getByText('Falha ao consultar caixa', { exact: true })).toBeVisible();
  await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
  await expect(page.getByText('Falha ao consultar caixa', { exact: true })).toBeVisible();
});


test('PDV falha fechado ao consultar caixa e orienta caixa de outro operador sem prefixo técnico',async({page})=>{
 await configure(page);await defer(page,'cashAvailability');await visit(page,'Vender');await waitPending(page,1);
 await expect(page.getByRole('button',{name:'Concluir venda',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).nexoTest.pending[0].reject(new Error("Error invoking remote method 'nexo:cash-availability': Error: Falha de leitura")));
 const guidance=page.getByRole('region',{name:'Situação do caixa para venda'});await expect(guidance).toContainText('Falha de leitura');await expect(guidance).not.toContainText('invoking');
 await page.evaluate(()=>{const control=(window as any).nexoTest;control.deferred=[];control.values.cashAvailability={open:true,canSell:false,operatorName:'Outro operador',balanceCents:100n,openedAt:'2026-10-18T12:00:00Z'};control.values.cash=[{id:'cash1',closed:0n,can_operate:false,actor_name:'Outro operador',balance_cents:100n,movements:[],closure:null}];});
 await page.getByRole('button',{name:'Conferir caixa novamente',exact:true}).click();await expect(guidance).toContainText('Caixa em uso por Outro operador');await expect(page.getByRole('button',{name:'Concluir venda',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Ir ao caixa',exact:true}).click();await expect(page.getByRole('button',{name:'Fechar caixa',exact:true})).toHaveCount(0);await expect(page.getByText(/Somente esse operador pode/)).toBeVisible();
});
test('financeiro mostra uma tarefa por vez, adia consultas e preserva rascunho de conta',async({page})=>{
 await configure(page);await visit(page,'Financeiro');await expect(page.getByRole('table',{name:'Contas a pagar',exact:true})).toBeVisible();await expect(page.getByRole('table',{name:'Contas a receber',exact:true})).toHaveCount(0);
 let methods=await page.evaluate(()=>(window as any).nexoTest.calls.map((call:any)=>call.method));expect(methods).not.toContain('receivables');expect(methods).not.toContain('dailyReport');
 await visit(page,'Financeiro','Receber');await expect(page.getByRole('form',{name:'Nova conta a receber',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Nova conta a receber',exact:true}).click();await page.getByLabel('Descrição da conta').fill('Rascunho financeiro');
 await visit(page,'Financeiro','Resumo');await expect(page.getByRole('table',{name:'Contas a pagar',exact:true})).toHaveCount(0);await expect(page.getByLabel('Descrição da conta')).toBeHidden();
 await visit(page,'Financeiro','Receber');await expect(page.getByLabel('Descrição da conta')).toHaveValue('Rascunho financeiro');
 await page.getByLabel('Empresa em uso').selectOption('b');await expect(page.getByRole('form',{name:'Nova conta a receber',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Nova conta a receber',exact:true}).click();await expect(page.getByLabel('Descrição da conta')).toHaveValue('');
 methods=await page.evaluate(()=>(window as any).nexoTest.calls.map((call:any)=>call.method));expect(methods).toContain('dailyReport');
});
test('compra remove a linha do meio mantendo os demais valores, foco, total e rascunho',async({page})=>{
 await configure(page);await visit(page,'Compras');await page.getByLabel('Fornecedor',{exact:true}).selectOption('person1');
 for(let index=1;index<=3;index++){if(index>1)await page.getByRole('button',{name:'Adicionar item',exact:true}).click();await page.getByLabel('Produto '+index,{exact:true}).selectOption('p'+(index-1));await page.getByLabel('Quantidade '+index,{exact:true}).fill(index===1?'1,255':index===3?'0,5':'2');await page.getByLabel('Custo unitário '+index+' (R$)',{exact:true}).fill(index===1?'1,01':index===3?'3,33':'2,00');}
 await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 6,94');await page.getByRole('button',{name:'Remover item da compra 2',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Produto 2',{exact:true})).toHaveValue('p2');await expect(page.getByLabel('Produto 2',{exact:true})).toBeFocused();await expect(page.getByLabel('Custo unitário 2 (R$)',{exact:true})).toHaveValue('3,33');await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 2,94');
 await visit(page,'Estoque');await visit(page,'Compras');await expect(page.getByLabel('Quantidade 1',{exact:true})).toHaveValue('1,255');await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 2,94');
});
