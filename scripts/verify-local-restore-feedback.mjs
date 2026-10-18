import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
const folder=await mkdtemp(path.join(tmpdir(),'nexo-restore-feedback-'));
const evidence=path.resolve('artifacts','restore-feedback-'+Date.now());await mkdir(evidence,{recursive:true});
const result={passed:false,errors:[],temporaryData:true,executable:process.env.NEXO_VERIFY_EXECUTABLE};let app;
const timer=setTimeout(()=>{app?.process().kill();process.exit(1);},60000);timer.unref();
try{
 app=await electron.launch({executablePath:process.env.NEXO_VERIFY_EXECUTABLE,args:[],cwd:folder,env:{...process.env,LOCALAPPDATA:folder,NEXO_TEST_HIDE_WINDOW:'1',PATH:process.env.SystemRoot+'\\System32;'+process.env.SystemRoot,NODE_PATH:'',NODE_OPTIONS:''}});
 await app.context().setOffline(true);const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',error=>result.errors.push(error.message));
 await page.getByLabel('Nome do responsável').fill('Teste de aviso');await page.getByRole('button',{name:'Começar',exact:true}).click();
 await page.getByLabel('Senha',{exact:true}).fill('Senha-teste-123');await page.getByLabel('Confirmar senha').fill('Senha-teste-123');await page.getByRole('button',{name:'Definir senha',exact:true}).click();
 await page.getByRole('region',{name:'Tutorial do NEXO',exact:true}).getByRole('button',{name:'Desativar tutorial',exact:true}).click();
 const backup=path.join(folder,'backup.sqlite');await app.evaluate(({dialog},backup)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:backup});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[backup]});dialog.showMessageBox=async()=>({response:1});},backup);
 await page.evaluate(()=>window.nexoLocal.backup());
 await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('button',{name:'Mais opções',exact:true}).click();await page.getByRole('button',{name:'Backup e dados',exact:true}).click();
 await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();
 await expect(page.getByRole('form',{name:'Acesso local',exact:true})).toBeVisible();await expect(page.getByText(/^Dados restaurados\. Entre com a senha da cópia selecionada/)).toBeVisible();
 await page.getByLabel('Senha',{exact:true}).fill('Senha-teste-123');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.getByRole('heading',{name:'Vender',exact:true})).toBeVisible();
 expect((await page.evaluate(()=>window.nexoLocal.status())).startupNotice).toBeUndefined();expect(result.errors).toEqual([]);result.passed=true;console.log('OK: Restauração administrativa mostra confirmação no login, mantém a senha e limpa o aviso após entrar.');
}catch(error){result.failure=error.stack;throw error;}
finally{await app?.close();clearTimeout(timer);await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2));console.log('EVIDENCE '+evidence);if(!path.resolve(folder).startsWith(path.resolve(tmpdir())+path.sep))throw Error('Pasta temporária inválida');await rm(folder,{recursive:true,force:true});}
