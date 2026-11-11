const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const {readBuildInfo}=require('./build-info.cjs');
const { pathToFileURL } = require('node:url');
const { mkdir, readFile, writeFile, rename } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
let excel;
const getExcel = () => excel ??= require('./excel.cjs');
let db;
let window;
let actor;
let productImportPreview;
let recovering = false;
let booting = true;
let quitting = false;
let readyToQuit = false;
const pendingOperations = new Set();
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(async () => {
  const root = path.resolve(__dirname, '..');
  const runtime = relative => import(pathToFileURL(path.join(root, 'dist/local-runtime', relative)).href);
  const { checkLocalHealth } = await runtime('local/health.js');
  const { openLocalDatabase } = await runtime('local/sqlite.js');
  const { listLocalProducts, createLocalProduct, updateLocalProduct } = await runtime('local/catalog.js');
  const { prepareLocalDatabase } = await runtime('local/migrations.js');
  const { listNamedUsers, selectNamedUser, createNamedOperator } = await runtime('local/access.js');
  const { createTutorialPreferences } = await runtime('local/tutorial-preferences.js');
  const { initializeLocalOwner } = await runtime('local/onboarding.js');
  const { previewLocalProductImport, commitLocalProductImport, getLocalProductImportTemplateData } = await runtime('local/product-import.js');
  const { createLocalCategory, listLocalCategories } = await runtime('local/categories.js');
  const { createLocalPerson, listLocalPeople } = await runtime('local/people.js');
  const { listLocalPurchaseHistory, getLocalPurchaseDetails } = await runtime('local/purchase-history.js');
  const { listLocalCashHistory, getLocalActiveCash } = await runtime('local/cash-history.js');
  const { receiveLocalPurchase, listLocalPurchases } = await runtime('local/purchases.js');
  const { openLocalCash, closeLocalCash, moveLocalCash, listLocalCash, getLocalCashAvailability } = await runtime('local/cash.js');
  const { listLocalSaleHistory, getLocalSaleDetails } = await runtime('local/sale-history.js');
  const { confirmLocalSale, listLocalSales } = await runtime('local/sales.js');
  const { cancelLocalSale } = await runtime('local/cancellations.js');
  const { getLocalFinanceSummary, getLocalFinanceTotals } = await runtime('local/finance.js');
  const { listLocalPayablesPage, listLocalReceivablesPage } = await runtime('local/financial-accounts.js');
  const { getLocalDailyReport } = await runtime('local/reports.js');
  const { getLocalExcelExport } = await runtime('local/exports.js');
  const { payLocalPayable, reverseLocalPayablePayment } = await runtime('local/settlements.js');
  const { createLocalReceivable, receiveLocalReceivable, reverseLocalReceivableReceipt, listLocalReceivables } = await runtime('local/receivables.js');
  const { listLocalStock, listLocalStockHistory } = await runtime('local/stock.js');
  const { validateLocalBackup, restoreLocalBackup } = await runtime('local/recovery.js');
  if (!process.env.LOCALAPPDATA) throw new Error('A pasta local do Windows não está disponível.');
  const dataFolder = path.join(process.env.LOCALAPPDATA, 'NEXO');
  await mkdir(dataFolder, { recursive: true });
  const backupMetadata = path.join(dataFolder, 'backup.json');
  let lastBackup;
  try { lastBackup = JSON.parse(await readFile(backupMetadata, 'utf8')).createdAt; }
  catch (error) { if (error.code !== 'ENOENT') console.error('Não foi possível ler a data do backup.'); }
  const startupServices = await runtime('local/startup-recovery.js');
  let startupNotice;
  while (!quitting) {
    try {
      await startupServices.inspectStartupDatabase(path.join(dataFolder, 'nexo.sqlite'));
      db = openLocalDatabase(path.join(dataFolder, 'nexo.sqlite'));
      await prepareLocalDatabase(db, path.join(dataFolder, 'nexo.sqlite'), { singleStore: true });
      break;
    } catch (error) {
      await db?.close().catch(() => undefined); db = undefined;
      const result = await require('./startup-recovery.cjs').showStartupRecovery({ folder: dataFolder, error, services: startupServices, pendingOperations });
      if (result.exit || quitting) return;
      if (result.restored) startupNotice = 'Cópia restaurada. Entre selecionando seu nome. Os arquivos anteriores estão guardados em ' + result.retained;
    }
  }
  if (quitting) return;
  let tutorialPreferences = createTutorialPreferences(db, dataFolder);
  actor = undefined;
  const handle = (channel, action) => ipcMain.handle(channel, async (event, ...args) => {
    if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) {
      throw new Error('Origem da operação inválida.');
    }
    if (quitting) throw new Error('O programa está sendo fechado.');
    if (recovering) throw new Error('Aguarde a recuperação dos dados terminar.');
    const operation = Promise.resolve(action(...args));
    pendingOperations.add(operation);
    try { return await operation; }
    finally { pendingOperations.delete(operation); }
  });
  let switchingSession = false;
  const changeSession = async action => {
    if (switchingSession) throw new Error('Aguarde a troca de acesso terminar.');
    const previousOperations = [...pendingOperations];
    switchingSession = true;
    try { await Promise.allSettled(previousOperations); return await action(); } finally { switchingSession = false; }
  };
  handle('nexo:build-info', () => readBuildInfo(root));
  handle('nexo:status', async () => {
    const users = await listNamedUsers(db);
    const configured = (await db.query('SELECT id FROM local_users LIMIT 1')).length > 0;
    return { configured, authenticated: !!actor,
      users, userId: actor?.id, owner: actor?.name, dataFolder, lastBackup, startupNotice,
      companies: actor ? await db.query('SELECT c.id,c.name,m.role FROM local_companies c JOIN local_memberships m ON m.company_id=c.id WHERE m.user_id=? AND m.active=1', [actor.id]) : [] };
  });
  handle('nexo:configure', name => changeSession(async () => { await initializeLocalOwner(db, name); return { configured: true }; }));
  handle('nexo:login', id => changeSession(async () => {
    if (actor) throw new Error('Saia do acesso atual antes de entrar com outro usuário.');
    actor = await selectNamedUser(db, id); startupNotice = undefined;
  }));
  handle('nexo:logout', () => changeSession(async () => { actor = undefined; productImportPreview = undefined; }));
  const requireActor = () => { if (switchingSession || !actor) throw new Error('Entre com seu usuário antes de continuar.'); return actor.id; };
  const requireTutorialActor = expectedUserId => {
    const userId = requireActor();
    if (userId !== expectedUserId) throw new Error('O usuário mudou. Abra a ajuda novamente.');
    return userId;
  };
  handle('nexo:tutorial-preference', (company, expectedUserId) => tutorialPreferences.read(requireTutorialActor(expectedUserId), company));
  handle('nexo:save-tutorial-preference', (company, expectedUserId, input) => tutorialPreferences.write(requireTutorialActor(expectedUserId), company, input));
  handle('nexo:create-operator', input => createNamedOperator(db, requireActor(), input));
  handle('nexo:excel-export', async companyId => {
    const data=await getLocalExcelExport(db,requireActor(),companyId); const selection=await dialog.showSaveDialog(window,{title:'Exportar relatório Excel',defaultPath:`NEXO-relatorio-${companyId}-${Date.now()}.xlsx`,filters:[{name:'Planilha Excel',extensions:['xlsx']}]});
    if(selection.canceled||!selection.filePath)return {canceled:true}; await getExcel().writeFullExport(selection.filePath,data); return {canceled:false};
  });
  handle('nexo:product-import-template', async companyId => {
    const userId=requireActor(); const data=await getLocalProductImportTemplateData(db,userId,companyId);
    const selection=await dialog.showSaveDialog(window,{title:'Salvar modelo de produtos',defaultPath:`NEXO-modelo-produtos-${companyId}.xlsx`,filters:[{name:'Planilha Excel',extensions:['xlsx']}]});
    if(selection.canceled||!selection.filePath)return {canceled:true}; await getExcel().writeProductTemplate(selection.filePath,data.company,data.categories); return {canceled:false};
  });
  handle('nexo:product-import-preview', async companyId => {
    const userId=requireActor(); await getLocalProductImportTemplateData(db,userId,companyId); const selection=await dialog.showOpenDialog(window,{title:'Selecionar planilha de produtos',properties:['openFile'],filters:[{name:'Planilha Excel',extensions:['xlsx']}]});
    if(selection.canceled||!selection.filePaths[0])return {canceled:true}; const rows=await getExcel().readProductRows(selection.filePaths[0]); const preview=await previewLocalProductImport(db,userId,companyId,rows); const token=randomUUID(); productImportPreview={token,userId,companyId,rows,expected:preview.rows}; return {canceled:false,token,...preview};
  });
  handle('nexo:product-import-confirm', async token => {
    const userId=requireActor(); const current=productImportPreview; if(!current||current.token!==token||current.userId!==userId)throw new Error('A prévia não está mais disponível. Selecione a planilha novamente.');
    try{return await commitLocalProductImport(db,userId,current.companyId,current.rows,current.expected);}finally{productImportPreview=undefined;}
  });
  handle('nexo:products', companyId => listLocalProducts(db, requireActor(), companyId));
  handle('nexo:create-product', (companyId, input) => createLocalProduct(db, requireActor(), companyId, input));
  handle('nexo:categories', companyId => listLocalCategories(db, requireActor(), companyId));
  handle('nexo:create-category', (companyId, input) => createLocalCategory(db, requireActor(), companyId, input));
  handle('nexo:people', (companyId, kind) => listLocalPeople(db, requireActor(), companyId, kind));
  handle('nexo:purchase-details', (company,id) => getLocalPurchaseDetails(db,requireActor(),company,id));
  handle('nexo:purchase-history', (company,input) => listLocalPurchaseHistory(db,requireActor(),company,input));
  handle('nexo:cash-history', (company,input) => listLocalCashHistory(db,requireActor(),company,input));
  handle('nexo:active-cash', company => getLocalActiveCash(db,requireActor(),company));
  handle('nexo:cash-availability', company => getLocalCashAvailability(db, requireActor(), company));
  handle('nexo:cash', companyId => listLocalCash(db, requireActor(), companyId));
  handle('nexo:open-cash', (companyId, key, input) => openLocalCash(db, requireActor(), companyId, key, input));
  handle('nexo:move-cash', (companyId, key, input) => moveLocalCash(db, requireActor(), companyId, key, input));
  handle('nexo:close-cash', (companyId, id, input) => closeLocalCash(db, requireActor(), companyId, id, input));
  handle('nexo:sales-history', (company, input) => listLocalSaleHistory(db, requireActor(), company, input));
  handle('nexo:sale-details', (company, id) => getLocalSaleDetails(db, requireActor(), company, id));
  handle('nexo:sales', companyId => listLocalSales(db, requireActor(), companyId));
  handle('nexo:confirm-sale', (companyId, key, input) => confirmLocalSale(db, requireActor(), companyId, key, input));
  handle('nexo:cancel-sale', async (companyId, id, key, input) => {
    const userId = requireActor();
    const sale = await getLocalSaleDetails(db, userId, companyId, id);
    const saleTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(sale.total_cents)/100);
    const result = await dialog.showMessageBox(window, { type: 'warning', buttons: ['Voltar', 'Cancelar venda'], defaultId: 0, cancelId: 0, title: 'Cancelar venda', message: 'Cancelar a venda ' + sale.id + '?', detail: new Date(sale.created_at).toLocaleString('pt-BR') + ' · ' + (sale.customer_name || 'Consumidor sem cadastro') + ' · ' + saleTotal + '\n' + sale.items.map(item => item.product_name).join(', ') + '\nO estoque será devolvido e o valor será estornado. O histórico permanecerá salvo.' });
    if (result.response !== 1) return { canceled: true };
    await cancelLocalSale(db, userId, companyId, id, key, input);
    return { canceled: false };
  });
  handle('nexo:payables-page', (company,input) => listLocalPayablesPage(db,requireActor(),company,input));
  handle('nexo:receivables-page', (company,input) => listLocalReceivablesPage(db,requireActor(),company,input));
  handle('nexo:finance-totals', company => getLocalFinanceTotals(db,requireActor(),company));
  handle('nexo:finance', companyId => getLocalFinanceSummary(db, requireActor(), companyId));
  handle('nexo:daily-report', (companyId, input) => getLocalDailyReport(db, requireActor(), companyId, input));
  handle('nexo:pay-payable', (companyId, id, key, input) => payLocalPayable(db, requireActor(), companyId, id, key, input));
  handle('nexo:reverse-payable', async (companyId, id, key, input) => {
    const userId = requireActor();
    const result = await dialog.showMessageBox(window, { type: 'warning', buttons: ['Voltar', 'Estornar pagamento'], defaultId: 0, cancelId: 0, title: 'Estornar pagamento', message: 'Confirmar o estorno deste pagamento?', detail: 'A conta ficará em aberto. Pagamento em dinheiro retorna ao caixa atual. O histórico será preservado.' });
    if (result.response !== 1) return { canceled: true };
    await reverseLocalPayablePayment(db, userId, companyId, id, key, input);
    return { canceled: false };
  });
  handle('nexo:receivables', companyId => listLocalReceivables(db, requireActor(), companyId));
  handle('nexo:create-receivable', (companyId, key, input) => createLocalReceivable(db, requireActor(), companyId, key, input));
  handle('nexo:receive-receivable', (companyId, id, key, input) => receiveLocalReceivable(db, requireActor(), companyId, id, key, input));
  handle('nexo:reverse-receivable', async (companyId, id, key, input) => {
    const userId = requireActor();
    const result = await dialog.showMessageBox(window, { type: 'warning', buttons: ['Voltar', 'Estornar recebimento'], defaultId: 0, cancelId: 0, title: 'Estornar recebimento', message: 'Confirmar o estorno deste recebimento?', detail: 'A conta ficará em aberto. Em dinheiro, o valor será retirado do caixa atual. O histórico será preservado.' });
    if (result.response !== 1) return { canceled: true };
    await reverseLocalReceivableReceipt(db, userId, companyId, id, key, input);
    return { canceled: false };
  });
  handle('nexo:stock-history', (company, input) => listLocalStockHistory(db, requireActor(), company, input));
  handle('nexo:stock', companyId => listLocalStock(db, requireActor(), companyId));
  handle('nexo:purchases', companyId => listLocalPurchases(db, requireActor(), companyId));
  handle('nexo:receive-purchase', (companyId, key, input) => receiveLocalPurchase(db, requireActor(), companyId, key, input));
  handle('nexo:create-person', (companyId, kind, input) => createLocalPerson(db, requireActor(), companyId, kind, input));
  handle('nexo:update-product', async (companyId, id, input) => {
    const userId = requireActor();
    if (input?.active === false) {
      const confirmation = await dialog.showMessageBox(window, { type: 'warning', title: 'Inativar produto?',
        message: 'Inativar este produto?', detail: 'O cadastro e o histórico serão preservados.',
        buttons: ['Voltar', 'Inativar'], defaultId: 0, cancelId: 0 });
      if (confirmation.response !== 1) return { canceled: true };
    }
    return updateLocalProduct(db, userId, companyId, id, input);
  });
  const requireBackupAdministrator = async () => {
    const id = requireActor();
    const allowed = await db.query("SELECT u.id FROM local_users u WHERE u.id=? AND u.active=1 AND EXISTS(SELECT 1 FROM local_companies) AND NOT EXISTS(SELECT 1 FROM local_companies company WHERE NOT EXISTS(SELECT 1 FROM local_memberships m WHERE m.user_id=u.id AND m.company_id=company.id AND m.active=1 AND m.role='ADMIN'))", [id]);
    if (!allowed.length) throw new Error('Somente o responsável por toda a instalação pode gerar ou restaurar a cópia completa.');
  };
  handle('nexo:data-health', () => checkLocalHealth(db, requireActor()));
  handle('nexo:backup', async () => {
    await requireBackupAdministrator();
    const selection = await dialog.showSaveDialog(window, { title: 'Guardar cópia de segurança',
      defaultPath: `NEXO-backup-${Date.now()}.sqlite`, filters: [{ name: 'Backup NEXO', extensions: ['sqlite'] }] });
    if (selection.canceled || !selection.filePath) return { canceled: true };
    await db.backup(selection.filePath);
    lastBackup = new Date().toISOString();
    await writeFile(`${backupMetadata}.tmp`, JSON.stringify({ createdAt: lastBackup }), 'utf8');
    await rename(`${backupMetadata}.tmp`, backupMetadata);
    return { canceled: false, createdAt: lastBackup };
  });
  handle('nexo:restore', async () => {
    await requireBackupAdministrator();
    recovering = true;
    try {
      const selection = await dialog.showOpenDialog(window, { title: 'Selecionar backup NEXO',
        properties: ['openFile'], filters: [{ name: 'Backup NEXO', extensions: ['sqlite'] }] });
      if (selection.canceled || !selection.filePaths[0]) return { canceled: true };
      const source = selection.filePaths[0];
      validateLocalBackup(source);
      const confirmation = await dialog.showMessageBox(window, { type: 'warning', title: 'Restaurar dados?',
        message: 'Substituir os dados atuais pela cópia selecionada?',
        detail: 'Cadastros posteriores ao backup sairão da base ativa. Uma cópia do estado atual será guardada antes da restauração.',
        buttons: ['Voltar', 'Restaurar dados'], defaultId: 0, cancelId: 0 });
      if (confirmation.response !== 1) return { canceled: true };
      const activeFile = path.join(dataFolder, 'nexo.sqlite');
      try { await restoreLocalBackup(db, activeFile, source); }
      finally {
        // If validation failed before close, retain the connection; if swap failed after close, reopen original.
        try { await db.query('SELECT 1'); }
        catch { db = openLocalDatabase(activeFile); }
      }
      actor = undefined; productImportPreview = undefined;
      await prepareLocalDatabase(db, activeFile);
      tutorialPreferences = createTutorialPreferences(db, dataFolder);
      startupNotice = 'Dados restaurados. Entre selecionando seu nome. O estado anterior foi guardado na pasta dos dados.';
      return { canceled: false };
    } finally { recovering = false; }
  });
  window = new BrowserWindow({ width: 1200, height: 800, minWidth: 900, minHeight: 650, icon: path.join(root, 'dist/client/nexo-icon.png'),
    show: process.env.NEXO_TEST_HIDE_WINDOW !== '1',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: process.env.NEXO_TEST_HIDE_WINDOW !== '1' } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  await window.loadFile(path.join(root, 'dist/client/index.html'));
  booting = false;
}).catch(error => { console.error('Falha ao abrir NEXO:', error.message); dialog.showErrorBox('NEXO — Falha na abertura', 'Não foi possível iniciar o programa. ' + error.message); app.quit(); });
app.on('window-all-closed', () => { if (!booting) app.quit(); });
app.on('before-quit', event => {
  if (readyToQuit) return;
  event.preventDefault();
  if (quitting) return;
  quitting = true;
  void (async () => {
    await Promise.allSettled([...pendingOperations]);
    if (db) await db.close().catch(error => console.error('Falha ao fechar a base:', error.message));
    readyToQuit = true;
    app.quit();
  })();
});
