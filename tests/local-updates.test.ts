import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {expect,it,vi} from 'vitest';
const {createUpdates}=createRequire(import.meta.url)('../electron/updates.cjs');
function fixture(){
 const updater=Object.assign(new EventEmitter(),{
  autoDownload:true,autoInstallOnAppQuit:true,allowPrerelease:true,allowDowngrade:true,
  checkForUpdates:vi.fn(async(): Promise<{isUpdateAvailable:boolean;updateInfo:{version:string;files?:{size:number}[]}}>=>({isUpdateAvailable:true,updateInfo:{version:'1.0.5'}})),
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
 expect(await service.download()).toEqual({phase:'ready',version:'1.0.5'});
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

it('does not allow installation on a download event before successful completion', async () => {
 const {updater,service}=fixture();
 await service.check();
 let rejectDownload!: (error: Error) => void;
 updater.downloadUpdate.mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectDownload = reject; }));
 const download=service.download();
 updater.emit('update-downloaded');
 expect(service.status().phase).toBe('downloading');
 expect(() => service.install()).toThrow();
 rejectDownload(new Error('hash inválido'));
 expect(await download).toEqual({phase:'error'});
 updater.emit('download-progress',{percent:100});
 expect(service.status().phase).toBe('error');
 expect(updater.quitAndInstall).not.toHaveBeenCalled();
});

it('recovers from offline check failure and reports when no update is available', async () => {
 const {updater,service}=fixture();
 updater.checkForUpdates.mockRejectedValueOnce(new Error('offline'));
 expect(await service.check()).toEqual({phase:'error'});
 updater.checkForUpdates.mockResolvedValueOnce({isUpdateAvailable:false,updateInfo:{version:'1.0.5'}});
 expect(await service.check()).toEqual({phase:'current',version:'1.0.5'});
 await expect(service.download()).rejects.toThrow();
 expect(updater.downloadUpdate).not.toHaveBeenCalled();
});

it('rejects a second download while the first is active', async () => {
 const {updater,service}=fixture();
 await service.check();
 const download=service.download();
 await expect(service.download()).rejects.toThrow();
 expect(await download).toEqual({phase:'ready',version:'1.0.5'});
 expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
});

it('keeps verified release metadata through successful download', async () => {
 const {updater,service}=fixture();
 updater.checkForUpdates.mockResolvedValueOnce({isUpdateAvailable:true,updateInfo:{version:'1.0.5',files:[{size:124000000}]}});
 expect(await service.check()).toEqual({phase:'available',version:'1.0.5',size:124000000});
 expect(await service.download()).toEqual({phase:'ready',version:'1.0.5',size:124000000});
});
