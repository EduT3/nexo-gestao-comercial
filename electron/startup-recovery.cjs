const { BrowserWindow, ipcMain, dialog, shell, app } = require('electron');
const path = require('node:path');
const { unlink, writeFile } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
exports.showStartupRecovery = async function ({ folder, error, services, pendingOperations }) {
  let candidate, busy = false, continuing = false;
  const channels = [];
  const window = new BrowserWindow({ width: 900, height: 740, minWidth: 700, minHeight: 600,
    show: process.env.NEXO_TEST_HIDE_WINDOW !== '1',
    webPreferences: { preload: path.join(__dirname, 'recovery-preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true, backgroundThrottling: process.env.NEXO_TEST_HIDE_WINDOW !== '1' } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  let resolveResult;
  const result = new Promise(resolve => { resolveResult = resolve; });
  const cleanCandidate = async () => {
    const previous = candidate; candidate = undefined;
    if (previous) for (const suffix of ['', '-wal', '-shm', '-journal']) await unlink(previous.staged + suffix).catch(() => undefined);
  };
  const finish = value => { continuing = true; resolveResult(value); };
  const handle = (name, action) => {
    const channel = 'nexo-recovery:' + name; channels.push(channel);
    ipcMain.handle(channel, async (event, ...args) => {
      if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Origem inválida.');
      if (busy) return { error: 'Aguarde a operação terminar.' };
      busy = true;
      const operation = Promise.resolve().then(() => action(...args)); pendingOperations.add(operation);
      try { return await operation; } catch (failure) { return { error: failure.message || 'Não foi possível concluir a recuperação.' }; }
      finally { busy = false; pendingOperations.delete(operation); }
    });
  };
  const explanation = /file is not a database|database disk image is malformed/i.test(error.message)
    ? 'O arquivo de dados está ilegível. Selecione uma cópia de segurança válida.'
    : /database is locked|SQLITE_BUSY/i.test(error.message) ? 'Os dados estão em uso. Feche outras instâncias do NEXO e tente novamente.'
    : error.message;
  handle('status', () => ({ folder, message: 'Não foi possível abrir os dados. ' + explanation }));
  handle('retry', () => { finish({ restored: false }); return {}; });
  handle('folder', async () => { const failure = await shell.openPath(folder); if (failure) throw new Error(failure); return {}; });
  handle('diagnostic', async () => {
    const choice = await dialog.showSaveDialog(window, { title: 'Guardar diagnóstico', defaultPath: 'NEXO-diagnostico.json', filters: [{ name: 'Diagnóstico', extensions: ['json'] }] });
    if (choice.canceled || !choice.filePath) return { canceled: true };
    await writeFile(choice.filePath, JSON.stringify({ application: 'NEXO', version: app.getVersion(), date: new Date().toISOString(), dataFolder: folder, error: error.message }, null, 2), { flag: 'wx' });
    return { saved: true };
  });
  handle('select', async () => {
    await cleanCandidate();
    const choice = await dialog.showOpenDialog(window, { title: 'Selecionar backup NEXO', properties: ['openFile'], filters: [{ name: 'Backup NEXO', extensions: ['sqlite'] }] });
    if (choice.canceled || !choice.filePaths[0]) return { canceled: true };
    const staged = await services.stageStartupBackup(choice.filePaths[0], folder);
    candidate = { ...staged, name: path.basename(choice.filePaths[0]), token: randomUUID() };
    return { token: candidate.token, name: path.basename(choice.filePaths[0]), users: candidate.users };
  });
  handle('restore', async (token, userId) => {
    const current = candidate;
    if (!current || current.token !== token) throw new Error('Selecione novamente o backup.');
    if (!current.users.some(user => user.id === userId)) throw new Error('Selecione o responsável desta cópia.');
    await services.authorizeStartupBackup(current.staged, userId);
    const confirmation = await dialog.showMessageBox(window, { type: 'warning', title: 'Recuperar NEXO',
      message: 'Substituir os dados pela cópia ' + current.name + '?',
      detail: 'Os dados posteriores ao backup não aparecerão na base recuperada. Os arquivos atuais serão guardados na pasta dos dados. Entre depois selecionando seu nome.',
      buttons: ['Voltar', 'Restaurar dados'], defaultId: 0, cancelId: 0 });
    if (confirmation.response !== 1) return { canceled: true };
    const installed = await services.installStartupBackup(path.join(folder, 'nexo.sqlite'), current.staged);
    candidate = undefined;
    finish({ restored: true, retained: installed.retained }); return { restored: true };
  });
  handle('exit', () => { app.quit(); return {}; });
  window.on('close', event => { if (busy) event.preventDefault(); });
  window.on('closed', () => { if (!continuing) { resolveResult({ exit: true }); app.quit(); } });
  try { await window.loadFile(path.join(__dirname, 'recovery.html')); return await result; }
  finally {
    for (const channel of channels) ipcMain.removeHandler(channel);
    await cleanCandidate();
    if (!window.isDestroyed()) { continuing = true; window.destroy(); }
  }
};
