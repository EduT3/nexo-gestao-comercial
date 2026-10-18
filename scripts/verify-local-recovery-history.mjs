import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const folder = await mkdtemp(path.join(tmpdir(), 'nexo-recovery-history-'));
const evidence = path.resolve('artifacts', 'recovery-history-' + Date.now()); await mkdir(evidence,{recursive:true});
const result = { checks: [], errors: [], captures: [], executable: process.env.NEXO_VERIFY_EXECUTABLE || 'development', temporaryData: true, offline: true };
let app, page;
const watchdog=setTimeout(()=>{app?.process().kill();console.error('Tempo limite da verificação.');process.exit(1);},240000);watchdog.unref();
const activeFile=path.join(folder,'NEXO','nexo.sqlite'), backup=path.join(folder,'copiavalida.sqlite');
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
function passed(name){result.checks.push(name);console.log('OK: '+name);}
async function launch(root=folder) {
  const executable=process.env.NEXO_VERIFY_EXECUTABLE;
  app=await electron.launch({ ...(executable?{executablePath:executable,args:[],cwd:root}:{args:['electron/main.cjs']}),
    env:{...process.env,LOCALAPPDATA:root,NEXO_TEST_HIDE_WINDOW:'1',...(executable?{PATH:process.env.SystemRoot+'\\System32;'+process.env.SystemRoot,NODE_PATH:'',NODE_OPTIONS:''}:{})} });
  await app.context().setOffline(true); page=await app.firstWindow();watch(page);
}
function watch(target){target.setDefaultTimeout(12000);target.on('pageerror',error=>result.errors.push(error.message));}
async function capture(name){
  await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  for (let attempt=0;attempt<5;attempt++) { try { await app.evaluate(async({BrowserWindow})=>{await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined,{stayHidden:true});}); break; } catch(error) { if (!String(error).includes('UnknownVizError') || attempt===4) throw error; await new Promise(resolve=>setTimeout(resolve,250)); } }
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const png=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined,{stayHidden:true})).toPNG().toString('base64'));
  await writeFile(path.join(evidence,name+'.png'),Buffer.from(png,'base64'));result.captures.push(name+'.png');
}
const nav=name=>page.getByRole('navigation',{name:'Navegação principal'}).getByRole('button',{name,exact:true}).click();
const history=()=>page.getByRole('table',{name:'Vendas realizadas',exact:true});
const filters=()=>page.getByRole('form',{name:'Filtrar vendas',exact:true});
async function dialogs(file,response=0,save){await app.evaluate(({dialog},{file,response,save})=>{dialog.showOpenDialog=async()=>({canceled:!file,filePaths:file?[file]:[]});dialog.showMessageBox=async(_window,options)=>{globalThis.__nexoLastConfirmation=options;return {response};};dialog.showSaveDialog=async()=>({canceled:!save,filePath:save});},{file,response,save});}
async function login(){await page.getByLabel('Senha',{exact:true}).fill('Senha-teste-123');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.getByRole('heading',{name:'Vender',exact:true})).toBeVisible();}
async function replaceWindow(action){const next=app.waitForEvent('window');await action();page=await next;watch(page);await page.waitForLoadState();}
try {
  await launch();await page.getByLabel('Nome do responsável').fill('Teste de recuperação');await page.getByRole('button',{name:'Começar',exact:true}).click();
  await page.getByLabel('Senha',{exact:true}).fill('Senha-teste-123');await page.getByLabel('Confirmar senha').fill('Senha-teste-123');await page.getByRole('button',{name:'Definir senha',exact:true}).click();
  await page.getByRole('region',{name:'Tutorial do NEXO',exact:true}).getByRole('button',{name:'Desativar tutorial',exact:true}).click();
  const fixture=await page.evaluate(async()=>{
    const b=window.nexoLocal,c='adega-jg';const customer=await b.createPerson(c,'customer',{name:'Cliente das vendas'});const supplier=await b.createPerson(c,'supplier',{name:'Fornecedor do teste'});
    const product=await b.createProduct(c,{name:'Produto histórico',internalCode:'HIST-1',unit:'UNIT',costCents:40,priceCents:150});
    await b.receivePurchase(c,crypto.randomUUID(),{supplierId:supplier.id,items:[{productId:product.id,quantity:'200',unitCostCents:40}]});await b.openCash(c,crypto.randomUUID(),{openingCents:0});
    for(let i=0;i<101;i++)await b.confirmSale(c,crypto.randomUUID(),{customerId:i===0?customer.id:null,items:[{productId:product.id,quantity:'1'}],discountCents:1,paymentMethod:'CASH',receivedCents:200,notes:'Teste de histórico '+i});
    await b.updateProduct(c,product.id,{name:'Nome novo',priceCents:999});return {product:product.id};
  });
  await nav('Caixa');await nav('Vender');await expect(history().locator('tbody tr')).toHaveCount(50);await expect(page.getByRole('navigation',{name:'Páginas de vendas'})).toContainText('101 vendas');
  const ids=[];ids.push(...await history().locator('.sale-reference').allTextContents());
  await page.getByRole('button',{name:'Vendas mais antigas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(50);ids.push(...await history().locator('.sale-reference').allTextContents());
  await page.getByRole('button',{name:'Vendas mais antigas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);ids.push(...await history().locator('.sale-reference').allTextContents());assert.equal(new Set(ids).size,101);
  await expect(page.getByRole('button',{name:'Vendas mais antigas',exact:true})).toBeDisabled();passed('101 vendas acessíveis em três páginas, sem duplicação e com identificação própria');
  const chosen=ids.at(-1);await history().getByRole('button',{name:'Detalhes',exact:true}).click();
  const detail=page.getByRole('region',{name:'Detalhes da venda',exact:true});await expect(detail).toContainText(chosen);await expect(detail).toContainText('Produto histórico');await expect(detail).toContainText('R$ 1,49');await expect(detail).toContainText('R$ 0,51');await expect(detail).not.toContainText('Nome novo');passed('Detalhes preservam produto e preço históricos, desconto, recebido e troco');
  await detail.scrollIntoViewIfNeeded();await capture('01-historico-detalhes');
  await filters().getByLabel('Buscar venda',{exact:true}).fill(chosen);await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);await expect(history()).toContainText(chosen);
  await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);
  await filters().getByLabel('Buscar venda',{exact:true}).fill('Cliente das vendas');await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);await expect(history()).toContainText('Cliente das vendas');
  for(let i=0;i<2;i++){await filters().getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(50);}
  const today=await page.evaluate(()=>{const date=new Date();return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');});
  await filters().getByLabel('Vendas de',{exact:true}).fill(today);await filters().getByLabel('Vendas até',{exact:true}).fill(today);await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(page.getByRole('navigation',{name:'Páginas de vendas'})).toContainText('101 vendas');
  await filters().getByLabel('Vendas de',{exact:true}).fill('2099-01-01');await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(page.getByText('A data inicial deve ser anterior ou igual à data final.')).toBeVisible();
  await filters().getByLabel('Vendas até',{exact:true}).fill('2099-01-01');await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(0);await expect(page.getByText('Nenhuma venda encontrada nesta consulta.')).toBeVisible();
  await filters().getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(50);passed('Busca por identificação/cliente, período local, validação e repetição de busca/limpeza funcionam');
  await filters().getByLabel('Buscar venda',{exact:true}).fill(chosen);await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);
  await history().getByRole('button',{name:'Cancelar venda',exact:true}).click();await expect(detail).toContainText(chosen);await page.getByLabel('Motivo do cancelamento',{exact:true}).fill('Devolução do teste');
  await dialogs(undefined,0);await page.getByRole('button',{name:'Confirmar cancelamento',exact:true}).click();await expect(page.getByText('Cancelamento interrompido. A venda foi mantida.')).toBeVisible();
  const confirmation=await app.evaluate(()=>globalThis.__nexoLastConfirmation);assert(confirmation.message.includes(chosen));assert(confirmation.detail.includes('Produto histórico'));assert(confirmation.detail.includes('1,49'));
  await dialogs(undefined,1);await page.getByRole('button',{name:'Confirmar cancelamento',exact:true}).click();await expect(detail).toContainText('Motivo do cancelamento: Devolução do teste');await expect(page.getByText('Venda cancelada e valores estornados.',{exact:true})).toBeVisible();
  await filters().getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(50);await filters().getByLabel('Situação da venda',{exact:true}).selectOption('CANCELLED');await filters().getByRole('button',{name:'Buscar vendas',exact:true}).click();await expect(history().locator('tbody tr')).toHaveCount(1);await expect(history()).toContainText(chosen);passed('Cancelamento da venda antiga mostra os dados corretos, permite voltar e preserva o registro cancelado');
  const stock=await page.evaluate(()=>window.nexoLocal.stock('adega-jg'));assert.equal(stock.find(row=>row.id===fixture.product).balance_milli,100000n);
  await page.getByLabel('Empresa em uso',{exact:false}).selectOption('deposito-jg');await expect(history().locator('tbody tr')).toHaveCount(0);await page.getByLabel('Empresa em uso',{exact:false}).selectOption('adega-jg');await expect(history().locator('tbody tr')).toHaveCount(50);passed('Troca de empresa não expõe vendas e estorno devolve estoque exato');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(900,650));await filters().scrollIntoViewIfNeeded();await capture('02-historico-900');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2));await page.getByRole('heading',{name:'Histórico de vendas',exact:true}).scrollIntoViewIfNeeded();await capture('03-historico-zoom');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1);BrowserWindow.getAllWindows()[0].setSize(1200,800);});passed('Histórico utilizável a 900x650 e zoom 200% sem transbordamento da página');
  await dialogs(undefined,0,backup);await page.evaluate(()=>window.nexoLocal.backup());const backupHash=await hash(backup);await app.close();app=undefined;
  await launch();await login();await expect(page.getByRole('navigation',{name:'Páginas de vendas'})).toContainText('101 vendas');await app.close();app=undefined;passed('Fechar e reabrir mantém as 101 vendas e o cancelamento');
  const corrupt='BASE ILEGIVEL FICTICIA DO TESTE';await writeFile(activeFile,corrupt);const corruptHash=await hash(activeFile);await launch();
  await expect(page.getByRole('heading',{name:'Vamos recuperar seus dados'})).toBeVisible();assert.equal(await hash(activeFile),corruptHash);await capture('04-recuperacao');
  await replaceWindow(()=>page.getByRole('button',{name:'Tentar novamente',exact:true}).click());await expect(page.getByRole('heading',{name:'Vamos recuperar seus dados'})).toBeVisible();assert.equal(await hash(activeFile),corruptHash);passed('Base ilegível abre recuperação e nova tentativa preserva os bytes originais');
  await dialogs(undefined);await page.getByRole('button',{name:'Selecionar backup',exact:true}).click();await expect(page.getByText('Operação cancelada. Seus dados foram mantidos.')).toBeVisible();
  const bad=path.join(folder,'invalido.sqlite');await writeFile(bad,'inválido');await dialogs(bad);await page.getByRole('button',{name:'Selecionar backup',exact:true}).click();await expect(page.locator('#message')).not.toHaveText('Aguarde…');await expect(page.locator('#restore')).toBeHidden();assert.equal(await hash(activeFile),corruptHash);
  const diagnostic=path.join(folder,'diagnostico.json');await dialogs(undefined,0,diagnostic);await page.getByRole('button',{name:'Guardar diagnóstico',exact:true}).click();await expect(page.getByText('Diagnóstico guardado.')).toBeVisible();assert(!/Senha-teste|password_hash|salt/.test(await readFile(diagnostic,'utf8')));
  await dialogs(backup,0);await page.getByRole('button',{name:'Selecionar backup',exact:true}).click();await expect(page.locator('#selected')).toContainText('copiavalida.sqlite');
  await page.getByLabel('Senha da cópia',{exact:true}).fill('senha-errada');await page.getByRole('button',{name:'Restaurar cópia',exact:true}).click();await expect(page.locator('#message')).toContainText('senha inválidos');assert.equal(await hash(activeFile),corruptHash);
  await page.getByLabel('Senha da cópia',{exact:true}).fill('Senha-teste-123');await page.getByRole('button',{name:'Restaurar cópia',exact:true}).click();await expect(page.getByText('Operação cancelada. Seus dados foram mantidos.')).toBeVisible();assert.equal(await hash(activeFile),corruptHash);assert.equal(await hash(backup),backupHash);passed('Seleção cancelada, backup inválido, senha incorreta e confirmação recusada não alteram a base; diagnóstico não contém senha');
  await dialogs(backup,1);await page.getByLabel('Senha da cópia',{exact:true}).fill('Senha-teste-123');await replaceWindow(()=>page.getByRole('button',{name:'Restaurar cópia',exact:true}).click());
  await expect(page.getByText(/Cópia restaurada\. Entre com a senha/)).toBeVisible();await capture('05-copia-restaurada');await login();
  await expect(page.getByRole('navigation',{name:'Páginas de vendas'})).toContainText('101 vendas');
  const restored=await page.evaluate(id=>window.nexoLocal.saleDetails('adega-jg',id),chosen);assert.equal(restored.status,'CANCELLED');assert.equal(restored.cancellation_reason,'Devolução do teste');
  const archived=(await readdir(path.dirname(activeFile))).filter(name=>name.startsWith('recovery-saved-'));assert.equal(archived.length,1);assert.equal(await readFile(path.join(path.dirname(activeFile),archived[0],'nexo.sqlite'),'utf8'),corrupt);assert.equal(await hash(backup),backupHash);
  await app.close();app=undefined;await launch();await login();await expect(page.getByRole('navigation',{name:'Páginas de vendas'})).toContainText('101 vendas');await app.close();app=undefined;passed('Restauração autenticada preserva arquivo ilegível, recupera vendas/cancelamento e persiste após reabertura');
  for(const scenario of ['future','interrupted']){
    const root=await mkdtemp(path.join(tmpdir(),'nexo-recovery-negative-'));try{
      await mkdir(path.join(root,'NEXO'));const file=path.join(root,'NEXO','nexo.sqlite');let before;
      if(scenario==='future'){const db=new DatabaseSync(file);db.exec('PRAGMA user_version=12');db.close();before=await hash(file);}else await writeFile(path.join(root,'NEXO','recovery-pending.json'),'{}');
      await launch(root);await expect(page.getByRole('heading',{name:'Vamos recuperar seus dados'})).toBeVisible();await expect(page.locator('#error')).toContainText(scenario==='future'?'versão compatível':'interrompida');if(before)assert.equal(await hash(file),before);
      await app.close();app=undefined;passed(scenario==='future'?'Base de versão futura abre aviso sem alterar arquivo':'Interrupção anterior abre recuperação e não cria instalação vazia');
    }finally{if(app){await app.close();app=undefined;}if(!path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep))throw Error('Pasta inválida');await rm(root,{recursive:true,force:true});}
  }
  assert.deepEqual(result.errors,[]);result.passed=true;
}catch(error){result.failure=error.stack;throw error;}
finally{if(app)await app.close().catch(()=>undefined);clearTimeout(watchdog);await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2));console.log('EVIDENCE '+evidence);if(!path.resolve(folder).startsWith(path.resolve(tmpdir())+path.sep))throw Error('Pasta inválida');await rm(folder,{recursive:true,force:true});}
