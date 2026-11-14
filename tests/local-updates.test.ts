import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it,vi} from 'vitest';
const {createUpdates,createUpdateReceipt}=createRequire(import.meta.url)('../electron/updates.cjs');
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
 expect(service.install()).toBe(true);
 expect(service.status()).toEqual({phase:'installing',version:'1.0.5'});
 expect(await service.check()).toEqual({phase:'installing',version:'1.0.5'});
 expect(()=>service.install()).toThrow();
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
 expect(service.status()).toEqual({phase:'downloading',version:'1.0.5'});
 updater.emit('download-progress',{percent:Number.NaN});
 expect(service.status().percent).toBeUndefined();
 updater.emit('download-progress',{percent:27.4});
 expect(service.status().percent).toBe(27);
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

it('reports synchronous installer launch failures and permits a fresh check', async () => {
 const {updater,service}=fixture();
 await service.check();
 await service.download();
 updater.quitAndInstall.mockImplementationOnce(() => updater.emit('error',new Error('Installer unavailable')));
 expect(service.install()).toBe(false);
 expect(service.status().phase).toBe('error');
 expect((await service.check()).phase).toBe('available');
 await service.download();
 updater.quitAndInstall.mockImplementationOnce(() => { throw new Error('Installer unavailable'); });
 expect(service.install()).toBe(false);
 expect(service.status().phase).toBe('error');
});

it('confirms an update once, when the requested version opens', async () => {
 const folder = await mkdtemp(join(tmpdir(), 'nexo-update-'));
 try {
  const receipt = createUpdateReceipt(folder);
  const {service} = fixture();
  expect(await receipt.consume('1.0.4')).toBeUndefined();
  await expect(receipt.stage('1.0.4', '1.0.4')).rejects.toThrow();
  await receipt.stage('1.0.4', '1.0.5');
  expect(service.status()).toEqual({phase:'idle'});
  service.reportStartup(await createUpdateReceipt(folder).consume('1.0.5'));
  expect(service.status()).toEqual({phase:'completed',version:'1.0.5'});
  expect(await receipt.consume('1.0.5')).toBeUndefined();
 } finally {
  await rm(folder, {recursive:true,force:true});
 }
});

it('never confirms the old version or a failed installer launch', async () => {
 const folder = await mkdtemp(join(tmpdir(), 'nexo-update-'));
 try {
  const receipt = createUpdateReceipt(folder);
  await receipt.stage('1.0.4', '1.0.5');
  expect(await receipt.consume('1.0.4')).toEqual({phase:'error'});
  expect(await receipt.consume('1.0.5')).toBeUndefined();
  await receipt.stage('1.0.4', '1.0.5');
  await receipt.clear();
  expect(await receipt.consume('1.0.5')).toBeUndefined();
 } finally {
  await rm(folder, {recursive:true,force:true});
 }
});
