import { afterEach, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, access, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openLocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalOperator, setInitialLocalPassword } from '../src/local/access';
import { inspectStartupDatabase, stageStartupBackup, authorizeStartupBackup, installStartupBackup } from '../src/local/startup-recovery';
const folders: string[] = [];
afterEach(async () => { for (const folder of folders.splice(0)) { if (!path.resolve(folder).startsWith(path.resolve(tmpdir()) + path.sep)) throw new Error('Pasta temporária inválida.'); await rm(folder,{recursive:true,force:true}); } });
async function folder() { const value = await mkdtemp(path.join(tmpdir(),'nexo-recovery-test-')); folders.push(value); return value; }
async function backupAt(root: string, password = true) {
  const active = path.join(root,'source.sqlite'); const db = openLocalDatabase(active);
  try {
    await prepareLocalDatabase(db,active); const owner = await initializeLocalOwner(db,'Responsável da cópia');
    if (password) await setInitialLocalPassword(db,owner.id,'senha-segura');
    const operator = password ? await createLocalOperator(db,owner.id,{name:'Operador',password:'operador-123',companies:['adega-jg']}) : undefined;
    const file = path.join(root,'backup.sqlite'); await db.backup(file); return { file,owner,operator };
  } finally { await db.close(); }
}
it('permite primeira abertura sem criar arquivo na inspeção', async () => {
  const file=path.join(await folder(),'nexo.sqlite'); await inspectStartupDatabase(file); await expect(access(file)).rejects.toThrow();
});
it.each(['corrupt','future','empty','foreign'])('recusa %s sem alterar os bytes originais',async scenario=>{
  const file=path.join(await folder(),'nexo.sqlite');
  if(scenario==='corrupt')await writeFile(file,'arquivo inválido de teste');
  else if(scenario==='empty')await writeFile(file,'');
  else {const db=new DatabaseSync(file);db.exec(scenario==='future'?'PRAGMA user_version=13':'CREATE TABLE outro(id TEXT)');db.close();}
  const before=await readFile(file);await expect(inspectStartupDatabase(file)).rejects.toThrow();expect(await readFile(file)).toEqual(before);
});
it('marcador de interrupção impede criar instalação vazia quando a base foi movida',async()=>{
  const root=await folder();await writeFile(path.join(root,'recovery-pending.json'),'{}');
  await expect(inspectStartupDatabase(path.join(root,'nexo.sqlite'))).rejects.toThrow('interrompida');
});
it('backup inválido não toca a base ativa nem altera a origem',async()=>{
  const root=await folder(),file=path.join(root,'nexo.sqlite'),bad=path.join(root,'invalido.sqlite');await writeFile(file,'original');await writeFile(bad,'não é um backup');
  await expect(stageStartupBackup(bad,root)).rejects.toThrow();expect(await readFile(file,'utf8')).toBe('original');expect(await readFile(bad,'utf8')).toBe('não é um backup');
});
it('exige a senha do responsável da cópia e mantém a origem byte a byte',async()=>{
  const root=await folder(), {file,owner,operator}=await backupAt(root), before=await readFile(file);
  const staged=await stageStartupBackup(file,root);expect(staged.users).toEqual([{id:owner.id,name:owner.name}]);
  await expect(authorizeStartupBackup(staged.staged,owner.id,'errada-123')).rejects.toThrow('senha inválidos');
  await expect(authorizeStartupBackup(staged.staged,operator!.id,'operador-123')).rejects.toThrow('administrador');
  await authorizeStartupBackup(staged.staged,owner.id,'senha-segura');expect(await readFile(file)).toEqual(before);
});
it('exige cópia com credencial para recuperar na abertura',async()=>{
  const root=await folder(),{file}=await backupAt(root,false);
  await expect(stageStartupBackup(file,root)).rejects.toThrow('responsável com senha');
});
it('instala cópia validada preservando todos os arquivos anteriores e reabre os dados',async()=>{
  const root=await folder(),{file,owner}=await backupAt(root), active=path.join(root,'nexo.sqlite');
  for(const suffix of ['','-wal','-shm','-journal'])await writeFile(active+suffix,'anterior'+suffix);
  const stage=await stageStartupBackup(file,root);await authorizeStartupBackup(stage.staged,owner.id,'senha-segura');
  const result=await installStartupBackup(active,stage.staged);
  for(const suffix of ['','-wal','-shm','-journal'])expect(await readFile(path.join(result.retained,'nexo.sqlite'+suffix),'utf8')).toBe('anterior'+suffix);
  await expect(access(path.join(root,'recovery-pending.json'))).rejects.toThrow();await inspectStartupDatabase(active);
  const reopened=openLocalDatabase(active);try{await prepareLocalDatabase(reopened,active);expect((await reopened.query('SELECT name FROM local_users WHERE id=?',[owner.id]))[0]?.name).toBe(owner.name);}finally{await reopened.close();}
});
it('falha ao substituir faz rollback dos originais e permite nova tentativa',async()=>{
  const root=await folder(),{file}=await backupAt(root), active=path.join(root,'nexo.sqlite');await writeFile(active,'original');await writeFile(active+'-wal','wal original');
  const stage=await stageStartupBackup(file,root);
  await expect(installStartupBackup(active,stage.staged,async(source,destination)=>{if(source===stage.staged)throw new Error('Falha simulada na troca');await rename(source,destination);})).rejects.toThrow('Falha simulada');
  expect(await readFile(active,'utf8')).toBe('original');expect(await readFile(active+'-wal','utf8')).toBe('wal original');await expect(access(path.join(root,'recovery-pending.json'))).rejects.toThrow();
  await installStartupBackup(active,stage.staged);await inspectStartupDatabase(active);
});
it('não aceita instalar candidato de outra pasta',async()=>{
  const root=await folder(),other=await folder();await mkdir(path.join(root,'dados'));
  await expect(installStartupBackup(path.join(root,'nexo.sqlite'),path.join(other,'recovery-candidate-x.sqlite'))).rejects.toThrow('inválida');
});
