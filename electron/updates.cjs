const { readFile, rename, rm, writeFile } = require('node:fs/promises');
const path = require('node:path');

function createUpdateReceipt(folder) {
 const file = path.join(folder, 'pending-update.json');
 return {
  async stage(from, target) {
   if (typeof target !== 'string' || !target || from === target) {
    throw new Error('Não foi possível identificar a versão da atualização.');
   }
   await writeFile(file + '.tmp', JSON.stringify({from, target}), {mode:0o600, flush:true});
   await rename(file + '.tmp', file);
  },
  clear: () => rm(file, {force:true}),
  async consume(version) {
   let contents;
   try { contents = await readFile(file, 'utf8'); }
   catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
   await rm(file, {force:true});
   let record;
   try { record = JSON.parse(contents); } catch { return {phase:'error'}; }
   if (typeof record?.from !== 'string' || !record.from || record.from === version || record.target !== version) {
    return {phase:'error'};
   }
   return {phase:'completed', version};
  },
 };
}

function createUpdates(updater) {
 updater.autoDownload = false;
 updater.autoInstallOnAppQuit = false;
 updater.allowPrerelease = false;
 updater.allowDowngrade = false;
 let state = {phase:'idle'};
 updater.on('error', () => { state={phase:'error'}; });
 updater.on('download-progress', progress => {
  if (state.phase === 'downloading' && Number.isFinite(progress.percent)) {
   state = {...state, percent: Math.max(0, Math.min(100, Math.round(progress.percent)))};
  }
 });
 return {
  status: () => ({...state}),
  reportStartup(receipt) {
   if (receipt && state.phase === 'idle') state = receipt;
  },
  async check() {
   if (['checking','downloading','ready','installing'].includes(state.phase)) return {...state};
   state={phase:'checking'};
   try {
    const result=await updater.checkForUpdates();
    const info = result?.updateInfo;
    const size = info?.files?.length === 1 ? info.files[0].size : undefined;
    state={phase:result?.isUpdateAvailable ? 'available':'current',version:info?.version};
    if (result?.isUpdateAvailable && Number.isSafeInteger(size) && size > 0) state.size = size;
   } catch { state={phase:'error'}; }
   return {...state};
  },
  async download() {
   if(state.phase!=='available') throw Error('Consulte uma atualização disponível.');
   const {version,size} = state;
   const metadata = size === undefined ? {version} : {version,size};
   state={...metadata,phase:'downloading'};
   try { await updater.downloadUpdate(); state={...metadata,phase:'ready'}; }
   catch { state={phase:'error'}; }
   return {...state};
  },
  install() {
   if(state.phase!=='ready') throw Error('A atualização ainda não foi baixada.');
   state={...state,phase:'installing'};
   try { updater.quitAndInstall(false,true); }
   catch { state={phase:'error'}; }
   return state.phase !== 'error';
  },
 };
}
module.exports={createUpdates,createUpdateReceipt};
