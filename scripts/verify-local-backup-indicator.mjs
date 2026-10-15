import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const folder=await mkdtemp(path.join(tmpdir(),'nexo-backup-indicator-'));let app;
try {
 const executable=process.env.NEXO_VERIFY_EXECUTABLE;
 app=await electron.launch({...(executable?{executablePath:executable,args:[],cwd:folder}:{args:['electron/main.cjs']}),env:{...process.env,LOCALAPPDATA:folder,NEXO_TEST_HIDE_WINDOW:'1',...(executable?{PATH:`${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`,NODE_PATH:''}:{})}});
 await app.context().setOffline(true);const page=await app.firstWindow();page.setDefaultTimeout(7000);
 await page.getByLabel('Nome do responsável').fill('Teste backup');await page.getByRole('button',{name:'Começar',exact:true}).click();
 await page.getByLabel('Senha',{exact:true}).fill('Senha-teste-123');await page.getByLabel('Confirmar senha').fill('Senha-teste-123');await page.getByRole('button',{name:'Definir senha'}).click();
 await page.getByRole('button',{name:'Backup: Nunca feito',exact:true}).click();
 await expect(page.getByRole('button',{name:'Gerar backup'})).toBeVisible();
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},path.join(folder,'teste.sqlite'));
 await page.getByRole('button',{name:'Gerar backup'}).click();
 const indicator=page.getByRole('button',{name:/^Backup: Feito em /});await expect(indicator).toBeVisible();
 const timestamp=await page.evaluate(async()=>(await window.nexoLocal.status()).lastBackup);expect(timestamp).toBeTruthy();
 await page.getByRole('navigation').getByRole('button',{name:'Vender',exact:true}).click();await expect(indicator).toBeVisible();
 await indicator.click();await expect(page.getByRole('button',{name:'Restaurar backup'})).toBeVisible();
 await page.evaluate(()=>window.nexoLocal.createOperator({name:'Operador teste',password:'Senha-op-123',companies:['adega-jg']}));
 await page.getByRole('button',{name:'Sair',exact:true}).click();await page.getByLabel('Usuário',{exact:true}).selectOption({label:'Operador teste'});await page.getByLabel('Senha',{exact:true}).fill('Senha-op-123');await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Vender',exact:true})).toBeVisible();await expect(page.locator('.local-backup-indicator')).toHaveCount(0);
 console.log('Indicador aprovado: nunca feito, backup real, data atualizada, atalho e operador sem indicador.');
} finally {await app?.close();await rm(folder,{recursive:true,force:true});}
