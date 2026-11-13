import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {expect,it,vi} from 'vitest';
const {createUpdates}=createRequire(import.meta.url)('../electron/updates.cjs');
function fixture(){
 const updater=Object.assign(new EventEmitter(),{
  autoDownload:true,autoInstallOnAppQuit:true,allowPrerelease:true,allowDowngrade:true,
  checkForUpdates:vi.fn(async()=>({isUpdateAvailable:true,updateInfo:{version:'1.0.5'}})),
  downloadUpdate:vi.fn(async()=>{}),
  quitAndInstall:vi.fn(),
 });
 return {updater,service:createUpdates(updater)};
}
it('consulta, baixa e instala somente quando o download terminou',async()=>{
 const {updater,service}=fixture();
 expect(updater.autoInstallOnAppQuit).toBe(false);
 expect(updater.allowDowngrade).toBe(false);
 expect(()=>service.install()).toThrow();
 await expect(service.download()).rejects.toThrow();
 expect(await service.check()).toEqual({phase:'available',version:'1.0.5'});
 expect(await service.download()).toEqual({phase:'ready'});
 service.install();
 expect(updater.quitAndInstall).toHaveBeenCalledWith(false,true);
});
it('falha de download permite nova consulta e bloqueia instalação',async()=>{
 const {updater,service}=fixture();
 await service.check();
 updater.downloadUpdate.mockRejectedValueOnce(new Error('offline'));
 expect(await service.download()).toEqual({phase:'error'});
 expect(()=>service.install()).toThrow();
 expect((await service.check()).phase).toBe('available');
});
it('consulta concorrente não dispara outra requisição',async()=>{
 const {updater,service}=fixture();
 const pending=service.check();
 expect(await service.check()).toEqual({phase:'checking'});
 await pending;
 expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
});
