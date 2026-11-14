function createUpdates(updater) {
 updater.autoDownload = false;
 updater.autoInstallOnAppQuit = false;
 updater.allowPrerelease = false;
 updater.allowDowngrade = false;
 let state = {phase:'idle'};
 updater.on('error', () => { state={phase:'error'}; });
 updater.on('download-progress', progress => {
  if (state.phase==='downloading') state={...state,percent:Math.round(progress.percent)};
 });
 return {
  status: () => ({...state}),
  async check() {
   if (['checking','downloading','ready'].includes(state.phase)) return {...state};
   state={phase:'checking'};
   try {
    const result=await updater.checkForUpdates();
    state={phase:result?.isUpdateAvailable ? 'available':'current',version:result?.updateInfo.version};
   } catch { state={phase:'error'}; }
   return {...state};
  },
  async download() {
   if(state.phase!=='available') throw Error('Consulte uma atualização disponível.');
   state={phase:'downloading',percent:0};
   try { await updater.downloadUpdate(); state={phase:'ready'}; }
   catch { state={phase:'error'}; }
   return {...state};
  },
  install() {
   if(state.phase!=='ready') throw Error('A atualização ainda não foi baixada.');
   updater.quitAndInstall(false,true);
  },
 };
}
module.exports={createUpdates};
