import { test, expect, type Page } from '@playwright/test';

async function configure(page: Page) {
  await page.addInitScript(() => {
    const productRows = Array.from({ length: 125 }, (_, i) => ({ id: `p${i}`, name: i === 124 ? 'Água São João' : `Produto ${String(i).padStart(3, '0')}`, internal_code: `CODE-${i}`, price_cents: 100n, cost_cents: 50n, active: 1n, unit: 'UNIT', category_id: i === 0 ? 'cat1' : null }));
    const finance = { receivedCents: 0n, reversedReceiptCents: 0n, netReceivedCents: 0n, totalIncomeCents: 100n, financialBalanceCents: 100n, revenueCents: 100n, reversedCents: 0n, netRevenueCents: 100n, paidExpenseCents: 0n, payables: [{ id: 'pay1', purchase_id: 'purchase1', supplier_name: 'Fornecedor teste', amount_cents: 100n, due_date: '2026-10-14', status: 'OPEN', payment_id: null }] };
    const control = {
      calls: [] as { method: string; company: string; input?: unknown }[],
      deferred: [] as string[],
      pending: [] as { method: string; resolve(value?: unknown): void; reject(error: Error): void }[],
      values: {
        salesHistory: { rows: [{ id: 'sale1', created_at: '2026-10-18T12:00:00.000Z', customer_name: null, total_cents: 100n, method: 'PIX', change_cents: 0n, status: 'CONFIRMED', cancellation_reason: null }], total: 1, page: 0, pageSize: 50 },
        cashAvailability: { open: true, canSell: true, operatorName: 'Teste', openedAt: '2026-10-18T12:00:00Z', balanceCents: 100n },
        activeCash: { id:'cash1',can_operate:true,actor_name:'Teste',closed:0n,balance_cents:100n,movements:[],closure:null },
        cashHistory: {rows:[{ id: 'cash1', can_operate: true, actor_name: 'Teste', closed: 0n, balance_cents: 100n, movements: [], closure: null, created_at:'2026-10-18T12:00:00Z' }],total:1,page:0,pageSize:50},
        payablesPage: {rows:finance.payables,total:1,totalCents:100n,page:0,pageSize:50},
        financeTotals:finance,
        receivablesPage: {rows:[{ id: 'r1', description: 'Conta teste', customer_name: null, amount_cents: 100n, due_date: '2026-10-14', receipt_id: null, status: 'OPEN' }],total:1,totalCents:100n,page:0,pageSize:50},
        purchaseHistory: {rows:[{ id: 'purchase1', supplier_name: 'Fornecedor teste', total_cents: 100n, due_date: null, created_at:'2026-10-18T12:00:00Z' }],total:1,page:0,pageSize:50},
      } as Record<string, unknown>,
    };
    Object.assign(window, { nexoTest: control });
    Object.defineProperty(window, 'nexoLocal', { value: new Proxy({}, { get(_target, property) {
      const method = String(property);
      return async (company: string, input?: unknown) => {
        control.calls.push({ method, company, input });
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
        if(typeof value==='function')value=value(company,input);
        if (control.deferred.includes(method)) return new Promise((resolve, reject) => control.pending.push({ method, resolve: (result = value) => resolve(result), reject }));
        return value;
      };
    } }) });
  });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Vender', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vender', exact: true })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Buscar produto para venda' });
  await search.fill('Água São João');
  await expect(page.locator('#nexo-product-results')).toContainText('Água São João');
  await search.fill('');
  await search.press('Escape');
}
const areas = [
  { method: 'salesHistory', area: 'Vender', table: 'Vendas realizadas' },
  { method: 'purchaseHistory', area: 'Compras', table: 'Compras recebidas' },
  { method: 'receivablesPage', area: 'Financeiro', table: 'Contas a receber' },
  { method: 'cashHistory', area: 'Caixa', table: 'Histórico de caixas' },
  { method: 'payablesPage', area: 'Financeiro', table: 'Contas a pagar' },
];
async function visit(page: Page, name: string, financialView = 'Pagar') {
  if (name === 'Mais opções') {
    await page.getByRole('button', { name: 'Configurações', exact: true }).click();
    return;
  }
  const label = name === 'Financeiro' ? 'Contas' : ['Produtos', 'Compras', 'Estoque'].includes(name) ? 'Estoque' : name;
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: label, exact: true }).click();
  if (name === 'Compras') await page.getByRole('button', { name: 'Adicionar ao estoque', exact: true }).click();
  if (name === 'Estoque') await page.getByRole('button', { name: 'Ver movimentações', exact: true }).click();
  if (name === 'Vender') {
    const history = page.locator('.nexo-sales-history');
    if (await history.getAttribute('open') === null) await history.locator('summary').click();
  }
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
    control.values[method] = ['payablesPage','receivablesPage','salesHistory','purchaseHistory','cashHistory'].includes(method)
      ? { ...value, totalCents:200n, rows:value.rows.map((row:object)=>({...row,total_cents:200n,amount_cents:200n,balance_cents:200n})) }
      : value.map((row:object)=>({...row,total_cents:200n,amount_cents:200n,balance_cents:200n}));
  }, method);
}

test('não carrega áreas fechadas nem atualiza módulos escondidos; mantém rascunho', async ({ page }) => {
  await configure(page);
  const first = await page.evaluate(() => (window as any).nexoTest.calls.map((call: any) => call.method));
  expect(first.filter((method: string) => method === 'products')).toHaveLength(1);
  expect(first).not.toContain('stock'); expect(first).not.toContain('payablesPage'); expect(first).not.toContain('cashHistory');
  await visit(page, 'Produtos');
  await page.getByRole('button', { name: 'Cadastrar produto' }).click();
  await page.getByLabel('Código interno').fill('RASCUNHO');
  await visit(page, 'Caixa'); await visit(page, 'Produtos');
  await expect(page.getByLabel('Código interno')).toHaveValue('RASCUNHO');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls);
  expect(calls.filter((c: any) => c.method === 'cashHistory')).toHaveLength(1);
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
  await page.getByLabel('Buscar produto', { exact: true }).fill('agua sao joao');
  await expect(table.locator('tbody tr')).toHaveCount(1); await expect(table).toContainText('Água São João');
  await page.getByLabel('Buscar produto', { exact: true }).fill('CODE-124'); await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar produto', { exact: true }).fill('');
  await page.getByLabel('Somente sem estoque').check();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar produto', { exact: true }).fill('agua'); await expect(table).toContainText('Água São João');
  await visit(page, 'Mais opções'); await page.getByRole('button', { name: 'Backup e dados', exact: true }).click();
  await page.getByRole('button', { name: 'Verificar dados', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Verificação dos dados' })).toContainText('estrutura e vínculos sem problemas');
});

for (const scenario of areas) {
  test(`${scenario.method}: resposta e erro atrasados não substituem consulta recente`, async ({ page }) => {
    await configure(page); await defer(page, scenario.method);
    await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 2);
    await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    await expect(table).toContainText('R$ 2,00');
    await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
    await expect(table).not.toContainText('R$ 1,00');
    await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 3);
    await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 4);
    await page.evaluate(() => { const pending = (window as any).nexoTest.pending; pending[3].resolve(); pending[2].reject(new Error('ERRO ANTIGO')); });
    await expect(table).toContainText('R$ 2,00');
    await expect(page.getByText(/ERRO ANTIGO/)).toHaveCount(0);
  });

  test(`${scenario.method}: consulta anterior à gravação não regride o saldo`, async ({ page }) => {
    await configure(page); await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar');
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    await expect(table).toContainText('R$ 1,00');
    await defer(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method);
    if (scenario.method === 'salesHistory') {
      await page.getByRole('textbox', { name: 'Buscar produto para venda' }).fill('CODE-0'); await page.getByRole('textbox', { name: 'Buscar produto para venda' }).press('Enter'); await page.getByRole('button', { name: 'Concluir venda', exact: true }).click();
    } else if (scenario.method === 'purchaseHistory') {
      await page.getByText('Informar fornecedor (opcional)', { exact: true }).click(); await page.getByLabel('Fornecedor', { exact: true }).selectOption('person1'); await page.getByLabel('Produto 1', { exact: true }).selectOption('p0');
      await page.getByLabel('Custo unitário 1 (R$)').fill('1,00'); await page.getByRole('button', { name: 'Salvar entrada no estoque', exact: true }).click();
    } else if (scenario.method === 'receivablesPage') {
      await page.getByRole('button', { name: 'Nova conta a receber', exact: true }).click();
      await page.getByLabel('Descrição da conta').fill('Conta nova'); await page.getByLabel('Valor a receber (R$)').fill('2,00');
      await page.getByLabel('Vencimento a receber').fill('2026-10-14'); await page.getByRole('button', { name: 'Salvar conta a receber', exact: true }).click();
    } else if (scenario.method === 'cashHistory') {
      await page.getByText('Adicionar ou retirar dinheiro', { exact: true }).click(); await page.getByLabel('Valor do movimento (R$)').fill('1,00');
      await page.getByLabel('Motivo do movimento').fill('Teste temporário'); await page.getByRole('button', { name: 'Registrar movimento', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Pagar conta', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
    }
    await waitPending(page, 2);
    // onSaved may trigger a second fresh query; release both, then the oldest snapshot.
    await waitPending(page, ['receivablesPage', 'payablesPage'].includes(scenario.method) ? 3 : 2);
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
  expect(calls.filter((c: any) => c.method === 'cashHistory')).toHaveLength(12);
  expect(calls.filter((c: any) => c.method === 'products')).toHaveLength(13);
  expect(calls.filter((c: any) => c.method === 'salesHistory')).toHaveLength(1);
  await page.evaluate(() => { (window as any).nexoTest.values.stockHistory = { rows: [], hasMore: true }; });
  await visit(page, 'Estoque');
  const balanceCallsBeforePaging = await page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => c.method === 'stock').length);
  await page.getByRole('button', { name: 'Mais antigas', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => c.method === 'stockHistory').length)).toBe(2);
  const balanceCalls = await page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => c.method === 'stock').length);
  expect(balanceCalls).toBe(balanceCallsBeforePaging);
});

for (const scenario of areas) {
  test(scenario.method + ': resposta de outra empresa é ignorada', async ({ page }) => {
    await configure(page); await defer(page, scenario.method); await visit(page, scenario.area, scenario.method === 'receivablesPage' ? 'Receber' : 'Pagar'); await waitPending(page, 1);
    await updateValue(page, scenario.method);
    await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b'); await waitPending(page, 2);
    await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
    const table = page.getByRole('table', { name: scenario.table, exact: true });
    if (scenario.method === 'salesHistory' || scenario.method === 'purchaseHistory') {
      const history = page.locator(scenario.method === 'salesHistory' ? '.nexo-sales-history' : '#compras .purchase-history');
      if (await history.getAttribute('open') === null) await history.locator('summary').click();
    }
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
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); await page.getByRole('button', { name: 'Cadastrar produto', exact: true }).click();
  await expect(page.getByLabel('Categoria', { exact: true })).toHaveValue('');
});


test('caixa informa falha da consulta após gravação e não a substitui por sucesso', async ({ page }) => {
  await configure(page); await visit(page, 'Caixa');
  await expect(page.getByLabel('Saldo do caixa')).toContainText('R$ 1,00');
  await defer(page, 'cashHistory'); await visit(page, 'Caixa'); await waitPending(page, 1);
  await page.getByText('Adicionar ou retirar dinheiro', { exact: true }).click();
  await page.getByLabel('Valor do movimento (R$)').fill('1,00'); await page.getByLabel('Motivo do movimento').fill('Teste de erro');
  await page.getByRole('button', { name: 'Registrar movimento', exact: true }).click(); await waitPending(page, 2);
  await page.evaluate(() => (window as any).nexoTest.pending[1].reject(new Error('Falha ao consultar caixa')));
  await expect(page.getByRole('alert')).toContainText('Falha ao consultar caixa');
  await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
  await expect(page.getByRole('alert')).toContainText('Falha ao consultar caixa');
});


test('PDV falha fechado ao consultar caixa e orienta caixa de outro operador sem prefixo técnico',async({page})=>{
 await configure(page);await defer(page,'cashAvailability');await visit(page,'Vender');await waitPending(page,1);
 await expect(page.getByRole('button',{name:'Concluir venda',exact:true})).toBeDisabled();
 await page.evaluate(()=>(window as any).nexoTest.pending[0].reject(new Error("Error invoking remote method 'nexo:cash-availability': Error: Falha de leitura")));
 const guidance=page.locator('.nexo-cash-notice');await expect(guidance).toContainText('Falha de leitura');await expect(guidance).not.toContainText('invoking');
 await page.evaluate(()=>{const control=(window as any).nexoTest;control.deferred=[];control.values.cashAvailability={open:true,canSell:false,operatorName:'Outro operador',balanceCents:100n,openedAt:'2026-10-18T12:00:00Z'};control.values.activeCash={id:'cash1',closed:0n,can_operate:false,actor_name:'Outro operador',balance_cents:100n,movements:[],closure:null};});
 await guidance.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(guidance).toContainText('Caixa em uso por outro operador');await expect(guidance).toContainText('Outro operador');await expect(page.getByRole('button',{name:'Concluir venda',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Ir ao caixa',exact:true}).click();await expect(page.getByRole('button',{name:'Fechar caixa',exact:true})).toHaveCount(0);await expect(page.getByText(/Somente esse operador pode/)).toBeVisible();
});
test('financeiro mostra uma tarefa por vez, adia consultas e preserva rascunho de conta',async({page})=>{
 await configure(page);await visit(page,'Financeiro');await expect(page.getByRole('table',{name:'Contas a pagar',exact:true})).toBeVisible();await expect(page.getByRole('table',{name:'Contas a receber',exact:true})).toHaveCount(0);
 let methods=await page.evaluate(()=>(window as any).nexoTest.calls.map((call:any)=>call.method));expect(methods).not.toContain('receivablesPage');expect(methods).not.toContain('dailyReport');
 await visit(page,'Financeiro','Receber');await expect(page.getByRole('form',{name:'Nova conta a receber',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Nova conta a receber',exact:true}).click();await page.getByLabel('Descrição da conta').fill('Rascunho financeiro');
 await visit(page,'Financeiro','Resumo');await expect(page.getByRole('table',{name:'Contas a pagar',exact:true})).toHaveCount(0);await expect(page.getByLabel('Descrição da conta')).toBeHidden();
 await visit(page,'Financeiro','Receber');await expect(page.getByLabel('Descrição da conta')).toHaveValue('Rascunho financeiro');
 await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b');await expect(page.getByRole('form',{name:'Nova conta a receber',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Nova conta a receber',exact:true}).click();await expect(page.getByLabel('Descrição da conta')).toHaveValue('');
 methods=await page.evaluate(()=>(window as any).nexoTest.calls.map((call:any)=>call.method));expect(methods).toContain('dailyReport');
});
test('compra remove a linha do meio mantendo os demais valores, foco, total e rascunho',async({page})=>{
 await configure(page);await visit(page,'Compras');await page.getByText('Informar fornecedor (opcional)',{exact:true}).click();await page.getByLabel('Fornecedor',{exact:true}).selectOption('person1');
 for(let index=1;index<=3;index++){if(index>1)await page.getByRole('button',{name:'Adicionar item',exact:true}).click();await page.getByLabel('Produto '+index,{exact:true}).selectOption('p'+(index-1));await page.getByLabel('Quantidade '+index,{exact:true}).fill(index===1?'1,255':index===3?'0,5':'2');await page.getByLabel('Custo unitário '+index+' (R$)',{exact:true}).fill(index===1?'1,01':index===3?'3,33':'2,00');}
 await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 6,94');await page.getByRole('button',{name:'Remover item da compra 2',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Produto 2',{exact:true})).toHaveValue('p2');await expect(page.getByLabel('Produto 2',{exact:true})).toBeFocused();await expect(page.getByLabel('Custo unitário 2 (R$)',{exact:true})).toHaveValue('3,33');await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 2,94');
 await visit(page,'Estoque');await visit(page,'Compras');await expect(page.getByLabel('Quantidade 1',{exact:true})).toHaveValue('1,255');await expect(page.getByLabel('Total da compra',{exact:true})).toContainText('R$ 2,94');
});
// Additional UI regressions use delayed responses, not SQLite. Real-data oracles live in local-financial-pages.test.ts.
for(const task of [{method:'payablesPage',view:'Pagar',kind:'pagar',table:'Contas a pagar'},{method:'receivablesPage',view:'Receber',kind:'receber',table:'Contas a receber'}]){
 test(task.method+': filtros e páginas não aceitam resposta antiga; total vem do conjunto filtrado',async({page})=>{
  await configure(page);await visit(page,'Financeiro',task.view);
  await page.evaluate(method=>{const test=(window as any).nexoTest;test.values[method]={...test.values[method],total:125,totalCents:99900n};},task.method);
  await visit(page,'Financeiro',task.view);
  const pager=page.getByRole('group',{name:'Páginas de contas a '+task.kind}),panel=page.locator(task.kind==='pagar'?'#contas-pagar':'#contas-receber');
  await expect(pager).toContainText('125 resultado(s)');await expect(panel).toContainText('R$ 999,00');
  await defer(page,task.method);await pager.getByRole('button',{name:'Próxima página',exact:true}).click();await waitPending(page,1);
  await page.evaluate(method=>{const t=(window as any).nexoTest;t.values[method]={...t.values[method],rows:[{...t.values[method].rows[0],id:'nova',amount_cents:700n}],total:1,totalCents:700n,page:0};},task.method);
  await page.getByLabel('Buscar conta a '+task.kind,{exact:true}).fill('nova');await waitPending(page,2);
  await page.evaluate(()=>{const t=(window as any).nexoTest;t.pending[1].resolve();});
  await expect(page.getByRole('table',{name:task.table,exact:true})).toContainText('R$ 7,00');
  await page.evaluate(()=>{const t=(window as any).nexoTest;t.pending[0].resolve();});
  await expect(panel).toContainText('R$ 7,00');await expect(pager).toContainText('1 resultado(s)');
  const inputs=await page.evaluate(method=>(window as any).nexoTest.calls.filter((c:any)=>c.method===method).map((c:any)=>c.input),task.method);
  expect(inputs.some((v:any)=>v.page===1)).toBe(true);expect(inputs.at(-1)).toMatchObject({page:0,search:'nova'});
 });
}
test('criar recebível em outra página/filtro renova a consulta sem prender formulário ou botões',async({page})=>{
 await configure(page);await visit(page,'Financeiro','Receber');await page.getByLabel('Situação das contas a receber').selectOption('SETTLED');
 await page.getByRole('button',{name:'Nova conta a receber',exact:true}).click();await page.getByLabel('Descrição da conta').fill('Conta nova');await page.getByLabel('Valor a receber (R$)').fill('2,00');await page.getByLabel('Vencimento a receber').fill('2026-10-20');await page.getByRole('button',{name:'Salvar conta a receber',exact:true}).click();
 await expect(page.getByLabel('Situação das contas a receber')).toHaveValue('OPEN');await expect(page.getByRole('button',{name:'Nova conta a receber',exact:true})).toBeEnabled();await expect(page.getByRole('form',{name:'Nova conta a receber',exact:true})).toHaveCount(0);
});

test('baixa pendente conserva seu ciclo ao virar o dia e voltar à mesma empresa',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-19T12:00:00Z'));await configure(page);await visit(page,'Financeiro');await defer(page,'payPayable');
 await page.getByRole('button',{name:'Pagar conta',exact:true}).click();await page.getByRole('button',{name:'Confirmar pagamento',exact:true}).click();await waitPending(page,1);
 await page.clock.setFixedTime(new Date('2026-10-20T12:00:00Z'));await visit(page,'Produtos');await visit(page,'Financeiro');
 await updateValue(page,'payablesPage');await page.evaluate(()=>(window as any).nexoTest.pending[0].resolve());
 await expect(page.getByText('Pagamento registrado.',{exact:true})).toBeVisible();await expect(page.getByLabel('Situação das contas a pagar')).toBeEnabled();await expect(page.getByRole('table',{name:'Contas a pagar',exact:true})).toContainText('R$ 2,00');
});
// The renderer must retain the effective page when the service clamps a smaller result.
for (const task of [
 { method: 'payablesPage', view: 'Pagar', kind: 'pagar', table: 'Contas a pagar' },
 { method: 'receivablesPage', view: 'Receber', kind: 'receber', table: 'Contas a receber' },
]) for (const remaining of [0, 50]) {
 test(`${task.method}: página ajustada após ${remaining} contas permanece ao crescer novamente`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await configure(page);
  await page.evaluate(({ method }) => {
   const control = (window as any).nexoTest;
   control.accountCount = 51;
   Object.defineProperty(control.values, method, { configurable: true, get: () => {
    const request = control.calls.at(-1).input;
    const total = control.accountCount;
    const effective = total > 50 && request.page > 0 ? 1 : 0;
    const all = Array.from({ length: total }, (_, index) => ({
     id: `account-${index}`, purchase_id: `purchase-${index}`, supplier_name: `Fornecedor ${String(index).padStart(3, '0')}`,
     description: `Conta ${String(index).padStart(3, '0')}`, customer_name: null, amount_cents: 100n,
     due_date: '2026-10-20', status: 'OPEN', payment_id: null, receipt_id: null,
    }));
    return { rows: all.slice(effective * 50, effective * 50 + 50), total, totalCents: BigInt(total) * 100n, page: effective, pageSize: 50 };
   } });
  }, { method: task.method });
  await visit(page, 'Financeiro', task.view);
  const pager = page.getByRole('group', { name: 'Páginas de contas a ' + task.kind });
  const table = page.getByRole('table', { name: task.table, exact: true });
  await expect(pager).toContainText('51 resultado(s) · Página 1 de 2');
  await pager.getByRole('button', { name: 'Próxima página', exact: true }).click();
  await expect(pager).toContainText('Página 2 de 2'); await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.evaluate(count => { (window as any).nexoTest.accountCount = count; }, remaining);
  await visit(page, 'Financeiro', task.view);
  await expect(pager).toContainText(`${remaining} resultado(s) · Página 1 de 1`);
  await expect(table.locator('tbody tr')).toHaveCount(remaining);
  if (!remaining) await expect(page.getByText(`Nenhuma conta a ${task.kind} nesta consulta.`, { exact: true })).toBeVisible();
  await expect(pager.getByRole('button', { name: 'Página anterior', exact: true })).toBeDisabled();
  await page.evaluate(() => { (window as any).nexoTest.accountCount = 51; });
  await visit(page, 'Financeiro', task.view);
  await expect(pager).toContainText('51 resultado(s) · Página 1 de 2');
  await expect(table.locator('tbody tr')).toHaveCount(50);
  await expect(table.locator('tbody tr').first()).toContainText(task.kind === 'pagar' ? 'Fornecedor 000' : 'Conta 000');
  const panel = page.locator(task.kind === 'pagar' ? '#contas-pagar' : '#contas-receber');
  await expect(panel).toContainText('Total da consulta: R$ 51,00');
  const request = await page.evaluate(method => (window as any).nexoTest.calls.filter((call: any) => call.method === method).at(-1).input, task.method);
  expect(request.page).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('page-stays-at-first.png'), fullPage: true });
 });
}
// Financial read errors must not present cached totals as a current successful summary.
test('resumo financeiro: falha retira totais anteriores e permite tentar novamente pelo teclado sem gravar', async ({ page }) => {
 await configure(page); await visit(page, 'Financeiro', 'Resumo');
 await expect(page.getByLabel('Saldo financeiro', { exact: true })).toContainText('R$ 1,00');
 await defer(page, 'financeTotals'); await visit(page, 'Financeiro', 'Resumo'); await waitPending(page, 1);
 await page.evaluate(() => (window as any).nexoTest.pending[0].reject(new Error("Error invoking remote method 'nexo:finance-totals': Error: Falha temporária de leitura")));
 await expect(page.getByText('Falha temporária de leitura', { exact: false })).toBeVisible();
 await expect(page.getByLabel('Saldo financeiro', { exact: true })).toHaveCount(0);
 await expect(page.getByLabel('Receita líquida', { exact: true })).toHaveCount(0);
 const error = page.getByRole('alert'); await expect(error).toContainText('Não foi possível consultar o resumo financeiro.'); await expect(error).not.toContainText('invoking');
 await page.screenshot({ path: test.info().outputPath('summary-read-unavailable.png'), fullPage: true });
 await page.evaluate(() => { const t = (window as any).nexoTest; t.values.financeTotals = { ...t.values.financeTotals, revenueCents: 200n, netRevenueCents: 200n, totalIncomeCents: 200n, financialBalanceCents: 200n }; });
 const retry = error.getByRole('button', { name: 'Tentar novamente', exact: true }); await retry.focus(); await page.keyboard.press('Enter'); await waitPending(page, 2);
 await expect(page.getByText('Consultando resumo financeiro…', { exact: true })).toBeVisible(); await expect(page.getByLabel('Saldo financeiro', { exact: true })).toHaveCount(0);
 await page.evaluate(() => (window as any).nexoTest.pending[1].resolve());
 await expect(page.getByLabel('Saldo financeiro', { exact: true })).toContainText('R$ 2,00'); await expect(page.getByRole('alert')).toHaveCount(0);
 const writes = await page.evaluate(() => (window as any).nexoTest.calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method)));
 expect(writes).toEqual([]); await page.screenshot({ path: test.info().outputPath('summary-read-recovered.png'), fullPage: true });
});

test('resumo financeiro: erro na empresa atual não aceita resposta atrasada de outra empresa e recupera sem gravar', async ({ page }) => {
 await configure(page); await visit(page, 'Financeiro', 'Resumo'); await expect(page.getByLabel('Saldo financeiro', { exact: true })).toContainText('R$ 1,00');
 await defer(page, 'financeTotals'); await visit(page, 'Financeiro', 'Resumo'); await waitPending(page, 1);
 await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b'); await waitPending(page, 2);
 await page.evaluate(() => (window as any).nexoTest.pending[1].reject(new Error('Falha da Empresa B')));
 await expect(page.getByText('Falha da Empresa B', { exact: false })).toBeVisible(); await expect(page.getByLabel('Saldo financeiro', { exact: true })).toHaveCount(0);
 await page.evaluate(() => (window as any).nexoTest.pending[0].resolve());
 const error = page.getByRole('alert'); await expect(error).toContainText('Falha da Empresa B'); await expect(page.getByLabel('Saldo financeiro', { exact: true })).toHaveCount(0);
 await page.evaluate(() => { const t = (window as any).nexoTest; t.values.financeTotals = { ...t.values.financeTotals, revenueCents: 300n, netRevenueCents: 300n, totalIncomeCents: 300n, financialBalanceCents: 300n }; });
 await error.getByRole('button', { name: 'Tentar novamente', exact: true }).click(); await waitPending(page, 3); await page.evaluate(() => (window as any).nexoTest.pending[2].resolve());
 await expect(page.getByLabel('Saldo financeiro', { exact: true })).toContainText('R$ 3,00'); await expect(page.getByRole('combobox', { name: 'Empresa em operação' })).toHaveValue('b');
 const calls = await page.evaluate(() => (window as any).nexoTest.calls); expect(calls.filter((c: any) => c.method === 'financeTotals').at(-1).company).toBe('b'); expect(calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method))).toEqual([]);
});
// Retrying a failed account read must preserve its context and never invoke a write.
for (const task of [
 { method: 'payablesPage', view: 'Pagar', kind: 'pagar', table: 'Contas a pagar', panel: '#contas-pagar' },
 { method: 'receivablesPage', view: 'Receber', kind: 'receber', table: 'Contas a receber', panel: '#contas-receber' },
]) {
 test(`${task.method}: tentar novamente mantém filtro e página após erro persistente, pelo teclado e sem gravar`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await configure(page); await page.evaluate(method => { const t = (window as any).nexoTest; t.values[method] = { ...t.values[method], total: 75, totalCents: 7500n }; }, task.method);
  await visit(page, 'Financeiro', task.view);
  await page.getByLabel('Buscar conta a ' + task.kind, { exact: true }).fill('sao');
  await page.getByLabel('Situação das contas a ' + task.kind).selectOption('ALL');
  await page.getByLabel('Vencimento inicial a ' + task.kind).fill('2026-10-01');
  await page.getByLabel('Vencimento final a ' + task.kind).fill('2026-10-31');
  await page.evaluate(method => { const t = (window as any).nexoTest; t.values[method] = { ...t.values[method], page: 1 }; }, task.method);
  const pager = page.getByRole('group', { name: 'Páginas de contas a ' + task.kind }), panel = page.locator(task.panel);
  await pager.getByRole('button', { name: 'Próxima página', exact: true }).click(); await expect(pager).toContainText('Página 2 de 2');
  await defer(page, task.method); await visit(page, 'Financeiro', task.view); await waitPending(page, 1);
  const failedRequest = await page.evaluate(method => (window as any).nexoTest.calls.filter((call: any) => call.method === method).at(-1), task.method);
  await page.evaluate(() => (window as any).nexoTest.pending[0].reject(new Error("Error invoking remote method 'nexo:account-page': Error: Consulta indisponível")));
  await expect(page.getByText('Consulta indisponível', { exact: false })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true }); await expect(retry).toBeVisible();
  await expect(panel).toContainText('Total da consulta: Indisponível'); await expect(panel).not.toContainText('Total da consulta: R$ 0,00');
  await expect(page.getByText(`Nenhuma conta a ${task.kind} nesta consulta.`, { exact: true })).toHaveCount(0); await expect(pager).toHaveCount(0);
  await retry.focus(); await page.keyboard.press('Enter'); await waitPending(page, 2); await expect(retry).toHaveCount(0); await expect(panel).toContainText('Consultando…');
  await page.evaluate(() => (window as any).nexoTest.pending[1].reject(new Error('Falha persistente')));
  await expect(page.getByRole('alert')).toContainText('Falha persistente'); await expect(retry).toBeEnabled(); await expect(panel).toContainText('Total da consulta: Indisponível'); await expect(pager).toHaveCount(0);
  await expect(page.getByText(`Nenhuma conta a ${task.kind} nesta consulta.`, { exact: true })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('account-read-error.png'), fullPage: true });
  await page.evaluate(method => { const t = (window as any).nexoTest; t.values[method] = { ...t.values[method], totalCents: 9900n, rows: t.values[method].rows.map((r: any) => ({ ...r, id: 'read-recovered', amount_cents: 700n, supplier_name: 'Fornecedor recuperado', description: 'Conta recuperada' })) }; }, task.method);
  await retry.focus(); await page.keyboard.press('Enter'); await waitPending(page, 3); await page.evaluate(() => (window as any).nexoTest.pending[2].resolve());
  await expect(page.getByRole('table', { name: task.table, exact: true })).toContainText('R$ 7,00'); await expect(panel).toContainText('Total da consulta: R$ 99,00'); await expect(pager).toContainText('75 resultado(s) · Página 2 de 2'); await expect(retry).toHaveCount(0);
  await expect(page.getByLabel('Buscar conta a ' + task.kind, { exact: true })).toHaveValue('sao'); await expect(page.getByLabel('Situação das contas a ' + task.kind)).toHaveValue('ALL');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls); const readCalls = calls.filter((call: any) => call.method === task.method);
  expect(readCalls.slice(-2)).toEqual([failedRequest, failedRequest]); expect(failedRequest).toMatchObject({ company: 'a', input: { search: 'sao', status: 'ALL', from: '2026-10-01', until: '2026-10-31', page: 1 } });
  expect(calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method))).toEqual([]); expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('account-read-recovered.png'), fullPage: true });
 });
 test(`${task.method}: tentar novamente ignora resposta de outra empresa e lê somente a atual sem gravar`, async ({ page }) => {
  await configure(page); await defer(page, task.method); await visit(page, 'Financeiro', task.view); await waitPending(page, 1);
  await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b'); await waitPending(page, 2);
  await page.evaluate(() => (window as any).nexoTest.pending[1].reject(new Error('Falha da empresa atual')));
  await expect(page.getByText('Falha da empresa atual', { exact: false })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true }); await expect(retry).toBeVisible();
  await page.evaluate(() => (window as any).nexoTest.pending[0].resolve()); await expect(page.locator(task.panel)).toContainText('Total da consulta: Indisponível'); await expect(page.getByRole('table', { name: task.table, exact: true }).locator('tbody tr')).toHaveCount(0);
  await page.evaluate(method => { const t = (window as any).nexoTest; t.values[method] = { ...t.values[method], totalCents: 300n, rows: t.values[method].rows.map((r: any) => ({ ...r, id: 'company-b-account', amount_cents: 300n, supplier_name: 'Fornecedor Empresa B', description: 'Conta Empresa B' })) }; }, task.method);
  await retry.click(); await waitPending(page, 3); await page.evaluate(() => (window as any).nexoTest.pending[2].resolve());
  await expect(page.getByRole('table', { name: task.table, exact: true })).toContainText('Empresa B'); await expect(page.locator(task.panel)).toContainText('Total da consulta: R$ 3,00'); await expect(page.getByRole('combobox', { name: 'Empresa em operação' })).toHaveValue('b');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls); expect(calls.filter((c: any) => c.method === task.method).at(-1)).toMatchObject({ company: 'b', input: { page: 0, search: '', status: 'OPEN' } }); expect(calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method))).toEqual([]);
 });
}
// Explicit cancellation restores keyboard focus without performing a financial operation.
for (const task of [
 { view: 'Pagar', method: 'payablesPage', panel: '#contas-pagar', action: 'Pagar conta', cancel: 'Voltar ao financeiro', form: 'Operação financeira', kind: 'pagar' },
 { view: 'Receber', method: 'receivablesPage', panel: '#contas-receber', action: 'Receber conta', cancel: 'Voltar às contas', form: 'Baixa de recebível', kind: 'receber' },
]) {
 test(`${task.method}: cancelamento explícito devolve foco ao botão de origem da empresa atual`, async ({ page }) => {
  await configure(page); await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b'); await visit(page, 'Financeiro', task.view);
  const panel = page.locator(task.panel), trigger = panel.getByRole('button', { name: task.action, exact: true });
  await panel.getByRole('button', { name: 'Limpar filtros', exact: true }).focus();
  for (let step = 0; step < 6 && !(await trigger.evaluate(element => element === document.activeElement)); step++) await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused(); await page.keyboard.press('Enter'); const form = page.getByRole('form', { name: task.form, exact: true }); await expect(form).toBeVisible();
  const cancel = form.getByRole('button', { name: task.cancel, exact: true });
  for (let step = 0; step < 6 && !(await cancel.evaluate(element => element === document.activeElement)); step++) await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused(); await page.keyboard.press('Enter'); await expect(form).toHaveCount(0);
  await test.info().attach('focus-after-cancel', { body: await page.evaluate(() => JSON.stringify({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent })), contentType: 'application/json' });
  await expect(trigger).toBeFocused(); await expect(page.getByRole('combobox', { name: 'Empresa em operação' })).toHaveValue('b');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls); expect(calls.filter((c: any) => c.method === task.method).at(-1).company).toBe('b'); expect(calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method))).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('cancel-focus-origin.png'), fullPage: true });
 });
 test(`${task.method}: cancelamento explícito usa resumo da lista quando o botão de origem saiu da consulta`, async ({ page }) => {
  await configure(page); await visit(page, 'Financeiro', task.view); const panel = page.locator(task.panel), trigger = panel.getByRole('button', { name: task.action, exact: true });
  await trigger.focus(); await page.keyboard.press('Enter'); const form = page.getByRole('form', { name: task.form, exact: true }); await expect(form).toBeVisible();
  await page.evaluate(method => { const t = (window as any).nexoTest; t.values[method] = { ...t.values[method], rows: [], total: 0, totalCents: 0n, page: 0 }; }, task.method);
  await page.getByLabel('Buscar conta a ' + task.kind, { exact: true }).fill('sem resultado'); await expect(trigger).toHaveCount(0); await expect(form).toBeVisible();
  const cancel = form.getByRole('button', { name: task.cancel, exact: true }); await cancel.focus(); await page.keyboard.press('Enter'); await expect(form).toHaveCount(0);
  await expect(panel.locator('details.panel > summary').first()).toBeFocused(); await expect(page.getByRole('combobox', { name: 'Empresa em operação' })).toHaveValue('a');
  const calls = await page.evaluate(() => (window as any).nexoTest.calls); expect(calls.filter((c: any) => /^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(c.method))).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('cancel-focus-list.png'), fullPage: true });
 });
}

// A failed/canceled mock operation must replace the read it invalidated, not leave loading stuck.
for (const task of [
 { method:'payablesPage', view:'Pagar', kind:'pagar', table:'Contas a pagar', action:'Pagar conta', confirm:'Confirmar pagamento', form:'Operação financeira', write:'payPayable', reverse:'reversePayable', reverseAction:'Estornar pagamento', reverseConfirm:'Confirmar estorno', reason:'Motivo do estorno', filter:'Fornecedor teste' },
 { method:'receivablesPage', view:'Receber', kind:'receber', table:'Contas a receber', action:'Receber conta', confirm:'Confirmar recebimento', form:'Baixa de recebível', write:'receiveReceivable', reverse:'reverseReceivable', reverseAction:'Estornar recebimento', reverseConfirm:'Confirmar estorno do recebimento', reason:'Motivo do estorno do recebimento', filter:'Conta teste' },
]) for (const outcome of ['error','canceled'] as const) {
 test(task.method+': consulta interrompida recupera após operação '+outcome,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await configure(page);
  if(outcome==='canceled')await page.evaluate(method=>{
   const control=(window as any).nexoTest,value=control.values[method];
   control.values[method]={...value,rows:value.rows.map((row:any)=>({...row,status:method==='payablesPage'?'PAID':'RECEIVED',payment_id:'payment-test',receipt_id:'receipt-test'}))};
  },task.method);
  await visit(page,'Financeiro',task.view);
  const table=page.getByRole('table',{name:task.table,exact:true});
  await expect(table).toContainText('R$ 1,00');
  await page.getByLabel('Buscar conta a '+task.kind,{exact:true}).fill(task.filter);
  if(outcome==='canceled')await page.getByLabel('Situação das contas a '+task.kind,{exact:true}).selectOption('SETTLED');
  await expect(table).toHaveAttribute('aria-busy','false');
  await page.getByRole('button',{name:outcome==='canceled'?task.reverseAction:task.action,exact:true}).click();
  const form=page.getByRole('form',{name:task.form,exact:true});
  if(outcome==='canceled')await page.getByLabel(task.reason,{exact:true}).fill('Motivo fictício preservado');
  else await form.locator('select').selectOption('PIX');
  const write=outcome==='canceled'?task.reverse:task.write;
  await page.evaluate(({method,write})=>{(window as any).nexoTest.deferred=[method,write];},{method:task.method,write});
  await visit(page,'Financeiro',task.view);await waitPending(page,1);
  await expect(table).toHaveAttribute('aria-busy','true');
  await form.getByRole('button',{name:outcome==='canceled'?task.reverseConfirm:task.confirm,exact:true}).click();await waitPending(page,2);
  await updateValue(page,task.method);
  await page.evaluate(outcome=>{
   const request=(window as any).nexoTest.pending[1];
   if(outcome==='error')request.reject(new Error('Falha fictícia da operação'));
   else request.resolve({canceled:true});
  },outcome);
  // The old query is deliberately still pending; another current read must recover the list.
  await waitPending(page,3);
  await page.evaluate(()=>(window as any).nexoTest.pending[2].resolve());
  await expect(table).toHaveAttribute('aria-busy','false');await expect(table).toContainText('R$ 2,00');
  await expect(form.getByRole('button',{name:outcome==='canceled'?task.reverseConfirm:task.confirm,exact:true})).toBeEnabled();
  await expect(page.getByLabel('Buscar conta a '+task.kind,{exact:true})).toHaveValue(task.filter);
  if(outcome==='canceled')await expect(page.getByLabel(task.reason,{exact:true})).toHaveValue('Motivo fictício preservado');
  else{await expect(form.locator('select')).toHaveValue('PIX');await expect(page.getByText('Falha fictícia da operação',{exact:true})).toBeVisible();}
  const pager=page.getByRole('group',{name:'Páginas de contas a '+task.kind,exact:true});
  await expect(pager).toContainText('1 resultado(s) · Página 1 de 1');
  await page.evaluate(()=>(window as any).nexoTest.pending[0].resolve());
  await expect(table).not.toContainText('R$ 1,00');await expect(table).toContainText('R$ 2,00');
  const calls=await page.evaluate(method=>{
   const control=(window as any).nexoTest;
   return {writes:control.calls.filter((call:any)=>/^(create|update|confirm|reverse|payPayable|receiveReceivable|openCash|closeCash|moveCash|backup|restore)/.test(call.method)),latest:control.calls.filter((call:any)=>call.method===method).at(-1)};
  },task.method);
  expect(calls.writes).toHaveLength(1);expect(calls.writes[0].method).toBe(write);expect(calls.writes[0].company).toBe('a');
  expect(calls.latest.company).toBe('a');expect(calls.latest.input.search).toBe(task.filter);expect(calls.latest.input.page).toBe(0);
  expect(errors).toEqual([]);await page.screenshot({path:test.info().outputPath('recovered-list.png'),fullPage:true});
 });
}

async function pagedHistoryFixture(page:Page){
 await page.evaluate(()=>{
  const control=(window as any).nexoTest;
  for(const method of ['purchaseHistory','cashHistory'])control.values[method]=(company:string,input:any={})=>{
   let rows=Array.from({length:company==='a'?101:1},(_,i)=>({id:company+'-history-'+String(i).padStart(3,'0'),created_at:new Date(Date.UTC(2025,0,1+i,12)).toISOString(),supplier_name:'Fornecedor '+company,actor_name:'Responsável '+company,total_cents:127n,closed:1n,balance_cents:10001n,due_date:'2025-12-31',closure:{expected_cents:10001n,counted_cents:10000n}})).reverse();
   if(input.search)rows=rows.filter(row=>row.id.includes(input.search));if(input.from)rows=rows.filter(row=>row.created_at>=input.from);if(input.until)rows=rows.filter(row=>row.created_at<input.until);if(input.status==='OPEN')rows=[];
   const current=Math.min(input.page??0,Math.max(0,Math.ceil(rows.length/50)-1));return {rows:rows.slice(current*50,current*50+50),total:rows.length,page:current,pageSize:50};
  };
 });
}
for(const scenario of [{area:'Compras',noun:'compras',method:'purchaseHistory',table:'Compras recebidas',dates:'Compras'},{area:'Caixa',noun:'caixas',method:'cashHistory',table:'Histórico de caixas',dates:'Caixas'}]){
 test(scenario.noun+': páginas e busca/período alcançam o antigo e mostram lista vazia',async({page})=>{
  await configure(page);await pagedHistoryFixture(page);await visit(page,scenario.area);
  const table=page.getByRole('table',{name:scenario.table,exact:true}),pager=page.getByRole('group',{name:'Páginas de '+scenario.noun});
  await expect(table.locator('tbody tr')).toHaveCount(50);await pager.getByRole('button',{name:'Mais antigas'}).click();await expect(pager).toContainText('Página 2 de 3');await pager.getByRole('button',{name:'Mais antigas'}).click();await expect(table.locator('tbody tr')).toHaveCount(1);await expect(table.locator('[data-history-id="a-history-000"]')).toBeVisible();
  await page.getByLabel('Buscar '+scenario.noun,{exact:true}).fill('a-history-000');await page.getByLabel(scenario.dates+' de',{exact:true}).fill('2025-01-01');await page.getByLabel(scenario.dates+' até',{exact:true}).fill('2025-01-01');await page.getByRole('button',{name:'Consultar '+scenario.noun,exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(1);
  const last=await page.evaluate(method=>(window as any).nexoTest.calls.filter((x:any)=>x.method===method).at(-1),scenario.method);expect(last.input.page).toBe(0);expect(Date.parse(last.input.until)-Date.parse(last.input.from)).toBe(86400000);
  await page.getByLabel('Buscar '+scenario.noun,{exact:true}).fill('ausente');await page.getByRole('button',{name:'Consultar '+scenario.noun,exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(0);await expect(page.getByText('Nenhum registro encontrado para estes filtros.',{exact:true})).toBeVisible();
 });
 test(scenario.noun+': troca rápida de filtro e empresa descarta respostas antigas',async({page})=>{
  await configure(page);await pagedHistoryFixture(page);await visit(page,scenario.area);const table=page.getByRole('table',{name:scenario.table,exact:true});await expect(table.locator('tbody tr')).toHaveCount(50);await defer(page,scenario.method);
  await page.getByLabel('Buscar '+scenario.noun,{exact:true}).fill('a-history-000');await page.getByRole('button',{name:'Consultar '+scenario.noun,exact:true}).click();await waitPending(page,1);
  await page.getByLabel('Buscar '+scenario.noun,{exact:true}).fill('a-history-001');await page.getByRole('button',{name:'Consultar '+scenario.noun,exact:true}).click();await waitPending(page,2);
  await page.evaluate(()=>{const p=(window as any).nexoTest.pending;p[1].resolve();p[0].reject(new Error('FILTRO ANTIGO'));});await expect(table.locator('[data-history-id="a-history-001"]')).toBeVisible();await expect(page.getByText('FILTRO ANTIGO',{exact:false})).toHaveCount(0);
  await page.getByLabel('Buscar '+scenario.noun,{exact:true}).fill('a-history-002');await page.getByRole('button',{name:'Consultar '+scenario.noun,exact:true}).click();await waitPending(page,3);await page.getByRole('combobox', { name: 'Empresa em operação' }).selectOption('b');await waitPending(page,4);
  await page.evaluate(()=>{const c=(window as any).nexoTest;c.deferred=[];c.pending[3].resolve();c.pending[2].resolve();});if(scenario.area==='Compras')await page.locator('#compras .purchase-history > summary').click();await expect(table.locator('[data-history-id="b-history-000"]')).toBeVisible();await expect(table.locator('[data-history-id^="a-"]')).toHaveCount(0);
 });
}
test('caixa ativo e ações permanecem em página antiga, filtro vazio e erro do histórico',async({page})=>{
 await configure(page);await pagedHistoryFixture(page);await visit(page,'Caixa');await expect(page.getByRole('heading',{name:'Caixa aberto',exact:true})).toBeVisible();
 const pager=page.getByRole('group',{name:'Páginas de caixas'});await pager.getByRole('button',{name:'Mais antigas'}).click();await pager.getByRole('button',{name:'Mais antigas'}).click();await expect(page.getByText('Responsável pelo caixa: Teste',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Abrir caixa',exact:true})).toHaveCount(0);
 await page.getByLabel('Buscar caixas',{exact:true}).fill('ausente');await page.getByRole('button',{name:'Consultar caixas',exact:true}).click();await expect(page.getByText('Nenhum registro encontrado para estes filtros.',{exact:true})).toBeVisible();await expect(page.getByText('Encerrar atendimento e fechar caixa',{exact:true})).toBeVisible();
 await defer(page,'cashHistory');await page.getByRole('button',{name:'Consultar caixas',exact:true}).click();await waitPending(page,1);await page.evaluate(()=>(window as any).nexoTest.pending[0].reject(new Error('HISTORICO INDISPONIVEL')));await expect(page.getByRole('alert')).toContainText('HISTORICO INDISPONIVEL');await expect(page.getByRole('heading',{name:'Caixa aberto',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Abrir caixa',exact:true})).toHaveCount(0);
});
test('erro da consulta ativa não oferece abertura indevida e permite tentar novamente',async({page})=>{
 await configure(page);await defer(page,'activeCash');await visit(page,'Caixa');await waitPending(page,1);await page.evaluate(()=>(window as any).nexoTest.pending[0].reject(new Error('CONSULTA ATIVA FALHOU')));await expect(page.getByRole('alert')).toContainText('CONSULTA ATIVA FALHOU');await expect(page.getByRole('button',{name:'Abrir caixa',exact:true})).toHaveCount(0);await page.evaluate(()=>(window as any).nexoTest.deferred=[]);await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(page.getByRole('heading',{name:'Caixa aberto',exact:true})).toBeVisible();
});
