const { contextBridge, ipcRenderer } = require('electron');
let promptForGuard;
let promptQueue = Promise.resolve();
async function invoke(channel, ...args) {
  try { return await ipcRenderer.invoke(channel, ...args); }
  catch (error) {
    const match = /NEXO_GUARD_REQUIRED:([0-9a-f-]{36})/.exec(error.message);
    if (!match || !promptForGuard) throw error;
    const id = match[1];
    const prompt = promptQueue.then(async () => {
      try {
        if (!promptForGuard) throw error;
        const { label, pinLength } = await ipcRenderer.invoke('nexo:guard-describe', id);
        return await promptForGuard(id, label, pinLength);
      } finally {
        await ipcRenderer.invoke('nexo:guard-cancel', id).catch(() => undefined);
      }
    });
    promptQueue = prompt.catch(() => undefined);
    return prompt;
  }
}
contextBridge.exposeInMainWorld('nexoLocal', Object.freeze({
  guardStatus: () => invoke('nexo:guard-status'),
  guardConfigure: input => invoke('nexo:guard-configure', input),
  guardRecover: input => invoke('nexo:guard-recover', input),
  guardApprove: (id, pin) => invoke('nexo:guard-approve', id, pin),
  guardCancel: id => invoke('nexo:guard-cancel', id),
  guardInvalidate: () => invoke('nexo:guard-invalidate'),
  registerGuardPrompt: callback => { promptForGuard = callback; },
  createOperator: input => invoke('nexo:create-operator', input),
  login: id => invoke('nexo:login', id),
  logout: () => invoke('nexo:logout'),
  stockHistory: (company, input) => invoke('nexo:stock-history', company, input),
  status: () => invoke('nexo:status'),
  updateStatus: () => invoke('nexo:update-status'),
  checkUpdate: () => invoke('nexo:update-check'),
  downloadUpdate: () => invoke('nexo:update-download'),
  installUpdate: () => invoke('nexo:update-install'),
  openReleases: () => invoke('nexo:open-releases'),
  buildInfo: () => invoke('nexo:build-info'),
  tutorialPreference: (company, expectedUserId) => invoke('nexo:tutorial-preference', company, expectedUserId),
  saveTutorialPreference: (company, expectedUserId, input) => invoke('nexo:save-tutorial-preference', company, expectedUserId, input),
  purchaseDetails: (company,id) => invoke('nexo:purchase-details',company,id),
  purchaseHistory: (company,input) => invoke('nexo:purchase-history',company,input),
  cashHistory: (company,input) => invoke('nexo:cash-history',company,input),
  activeCash: company => invoke('nexo:active-cash',company),
  cashAvailability: company => invoke('nexo:cash-availability', company),
  cash: companyId => invoke('nexo:cash', companyId),
  openCash: (companyId, key, input) => invoke('nexo:open-cash', companyId, key, input),
  moveCash: (companyId, key, input) => invoke('nexo:move-cash', companyId, key, input),
  closeCash: (companyId, id, input) => invoke('nexo:close-cash', companyId, id, input),
  salesHistory: (company, input) => invoke('nexo:sales-history', company, input),
  saleDetails: (company, id) => invoke('nexo:sale-details', company, id),
  sales: companyId => invoke('nexo:sales', companyId),
  confirmSale: (companyId, key, input) => invoke('nexo:confirm-sale', companyId, key, input),
  cancelSale: (companyId, id, key, input) => invoke('nexo:cancel-sale', companyId, id, key, input),
  payablesPage: (company,input) => invoke('nexo:payables-page',company,input),
  receivablesPage: (company,input) => invoke('nexo:receivables-page',company,input),
  financeTotals: company => invoke('nexo:finance-totals',company),
  finance: companyId => invoke('nexo:finance', companyId),
  dailyReport: (companyId, input) => invoke('nexo:daily-report', companyId, input),
  payPayable: (companyId, id, key, input) => invoke('nexo:pay-payable', companyId, id, key, input),
  reversePayable: (companyId, id, key, input) => invoke('nexo:reverse-payable', companyId, id, key, input),
  receivables: companyId => invoke('nexo:receivables', companyId),
  createReceivable: (companyId, key, input) => invoke('nexo:create-receivable', companyId, key, input),
  receiveReceivable: (companyId, id, key, input) => invoke('nexo:receive-receivable', companyId, id, key, input),
  reverseReceivable: (companyId, id, key, input) => invoke('nexo:reverse-receivable', companyId, id, key, input),
  stock: companyId => invoke('nexo:stock', companyId),
  purchases: companyId => invoke('nexo:purchases', companyId),
  receivePurchase: (companyId, key, input) => invoke('nexo:receive-purchase', companyId, key, input),
  checkDataHealth: () => invoke('nexo:data-health'),
  backup: () => invoke('nexo:backup'),
  restore: () => invoke('nexo:restore'),
  configure: name => invoke('nexo:configure', name),
  exportExcel: companyId => invoke('nexo:excel-export', companyId),
  productImportTemplate: companyId => invoke('nexo:product-import-template', companyId),
  productImportPreview: companyId => invoke('nexo:product-import-preview', companyId),
  productImportConfirm: token => invoke('nexo:product-import-confirm', token),
  products: companyId => invoke('nexo:products', companyId),
  categories: companyId => invoke('nexo:categories', companyId),
  createCategory: (companyId, input) => invoke('nexo:create-category', companyId, input),
  people: (companyId, kind) => invoke('nexo:people', companyId, kind),
  createPerson: (companyId, kind, input) => invoke('nexo:create-person', companyId, kind, input),
  createProduct: (companyId, input) => invoke('nexo:create-product', companyId, input),
  updateProduct: (companyId, id, input) => invoke('nexo:update-product', companyId, id, input),
}));
