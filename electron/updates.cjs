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
   state={...metadata,phase:'downloading',percent:0};
   try { await updater.downloadUpdate(); state={...metadata,phase:'ready'}; }
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
