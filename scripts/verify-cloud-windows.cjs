const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{DatabaseSync}=require('node:sqlite');
const O=path.resolve('artifacts/cloud-qa');fs.mkdirSync(O,{recursive:true});const stage=process.cwd(),{_electron,expect}=require('@playwright/test');
const program=path.resolve(process.env.NEXO_QA_PROGRAM || 'artifacts/installer/win-unpacked');
const baseline=process.env.NEXO_QA_BASELINE;
const buildAt=folder=>JSON.parse(fs.readFileSync(path.join(folder,'resources/app/dist/build-info.json')));
const id=JSON.parse(fs.readFileSync(path.join('artifacts/installer/win-unpacked','resources/app/dist/build-info.json')));
const profile=fs.mkdtempSync(path.join(O,'qa-balcao-')),d={};
for(const n of ['local','roaming','user-data','cache','tmp'])fs.mkdirSync(d[n]=path.join(profile,n));
const env={...process.env,LOCALAPPDATA:d.local,APPDATA:d.roaming,TEMP:d.tmp,TMP:d.tmp,NEXO_TEST_HIDE_WINDOW:'1',NODE_OPTIONS:'',NODE_PATH:''};
delete env.ELECTRON_RUN_AS_NODE;delete env.ELECTRON_DISABLE_SANDBOX;
const A='adega-jg',B='deposito-jg',pass=crypto.randomBytes(20).toString('hex')+'aA7!',dbfile=path.join(d.local,'NEXO/nexo.sqlite');
const result={build:id.id,program,profile,checks:[],screenshots:[],launches:[],errors:[],rendererErrors:[]};
const report=path.join(profile,'result.json');
const persist=()=>fs.writeFileSync(report,JSON.stringify(result,null,2));
const check=message=>{result.checks.push(message);persist();console.log(message);};
let app,page,child,owner,product,step='abrir';
const timings=[];
const call=(method,...args)=>page.evaluate(async ({method,args})=>window.nexoLocal[method](...args),{method,args});
const nav=(name)=>page.getByRole('navigation',{name:'Navegação principal',exact:true}).getByRole('button',{name,exact:true});
const picker=()=>page.locator('[data-tutorial-company]');
const search=()=>page.getByRole('textbox',{name:'Buscar produto para venda',exact:true});
const sale=()=>page.getByRole('form',{name:'Nova venda',exact:true});
const qty=()=>sale().getByLabel('Quantidade da venda 1',{exact:true});
const submit=()=>sale().getByRole('button',{name:'Concluir venda',exact:true});
const statusText=(s)=>page.getByRole('status').filter({hasText:s}).filter({visible:true});
async function open(folder=program){
 const expected=buildAt(folder);
 const began=performance.now();
 app=await _electron.launch({executablePath:path.join(folder,'NEXO.exe'),args:['--user-data-dir='+d['user-data'],'--disk-cache-dir='+d.cache],cwd:O,env,chromiumSandbox:true,timeout:30000});
 child=app.process();result.launches.push({pid:child.pid});persist();page=await app.firstWindow();page.setDefaultTimeout(10000);
 page.on('pageerror',e=>{result.rendererErrors.push(String(e));persist();});await page.waitForURL('file:///**/index.html');
 const runtime=await app.evaluate(({app,BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {appPath:app.getAppPath(),userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration,electron:process.versions.electron,sqlite:process.versions.sqlite};});
 assert.equal(path.resolve(runtime.userData),d['user-data']);assert.equal(runtime.userData,runtime.sessionData);assert(runtime.sandbox&&runtime.contextIsolation&&!runtime.nodeIntegration);assert.equal((await call('buildInfo')).id,expected.id);result.launches.at(-1).runtime=runtime;
 timings.push({operation:'launch',version:expected.productVersion,ms:Math.round(performance.now()-began)});
 await app.evaluate(({dialog},folder)=>{
  dialog.showSaveDialog=async(_w,o)=>{if(o.title==='Exportar relatório Excel')return {canceled:false,filePath:folder+'/relatorio.xlsx'};if(o.title!=='Guardar cópia de segurança')throw Error('Diálogo inesperado');return {canceled:false,filePath:folder+'/backup.sqlite'};};
  dialog.showOpenDialog=async(_w,o)=>{if(o.title!=='Selecionar backup NEXO')throw Error('Diálogo inesperado');return {canceled:false,filePaths:[folder+'/backup.sqlite']};};
  dialog.showMessageBox=async(_w,o)=>{if(o.title!=='Restaurar dados?'&&o.title!=='Cancelar venda')throw Error('Diálogo inesperado');return {response:1};};
 },profile);
}
async function close(){
 const exit=child.exitCode!==null?Promise.resolve(child.exitCode):new Promise(resolve=>child.once('exit',resolve));
 await app.close();result.launches.at(-1).exitCode=await exit;app=undefined;assert.equal(result.launches.at(-1).exitCode,0);persist();
}
async function size(w,h){await app.evaluate(({BrowserWindow},args)=>BrowserWindow.getAllWindows()[0].setContentSize(...args),[w,h]);await expect.poll(()=>page.evaluate(()=>innerWidth)).toBe(w);}
async function shot(name,{top=true}={}){
 if(top)await page.evaluate(()=>window.scrollTo(0,0));
 const capture=()=>app.evaluate(async({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0].webContents;w.setBackgroundThrottling(false);const im=await w.capturePage(undefined,{stayHidden:true,stayAwake:true});return im.toPNG().toString('base64');});
 await capture();await page.waitForTimeout(220);
 const png=await capture();assert(png.length>3000);fs.writeFileSync(path.join(profile,name+'.png'),Buffer.from(png,'base64'));result.screenshots.push(name+'.png');persist();
}
function commercialSnapshot(file){
 const tables=['local_users','local_memberships','local_products','local_stock_movements',
  'local_purchases','local_purchase_items','local_purchase_payables','local_sales','local_sale_items',
  'local_sale_payments','local_sale_revenues','local_cash_sessions','local_cash_movements',
  'local_receivables','local_receivable_receipts','local_payable_payments'];
 const db=new DatabaseSync(file,{readOnly:true});
 try {
  return Object.fromEntries(tables.map(table=>{
   const query=db.prepare('SELECT * FROM '+table+' ORDER BY rowid');
   query.setReadBigInts(true);
   return [table,query.all()];
  }));
 } finally { db.close(); }
}
async function addBySearch(key){await search().fill(key);await search().press('Enter');await expect(qty()).toBeVisible();}
async function login(){const f=page.getByRole('form',{name:'Acesso local'});await expect(f.locator('input[type=password]')).toHaveCount(0);await f.getByLabel('Usuário',{exact:true}).selectOption({label:'Responsável QA Balcão'});await f.getByRole('button',{name:'Entrar',exact:true}).click();await expect(nav('Vender')).toBeVisible({timeout:20000});}
function dbCheck(){const db=new DatabaseSync(dbfile,{readOnly:true});try{assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(db.prepare('PRAGMA user_version').get().user_version,12);assert.equal(db.prepare('SELECT count(*) n FROM local_credentials').get().n,0);return {sales:db.prepare('SELECT count(*) n FROM local_sales').get().n,tables:db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get().n};}finally{db.close();}}
(async()=>{try{
 await open();await size(1487,1058);
 step='primeiro acesso';await page.getByLabel('Nome do responsável',{exact:true}).fill('Responsável QA Balcão');await page.getByRole('button',{name:'Começar',exact:true}).click();
 let f=page.getByRole('form',{name:'Acesso local'});await expect(f.getByLabel('Usuário',{exact:true})).toBeVisible();await shot('01-login');
 await login();
 owner=(await call('status')).userId;const companies=await call('status');assert.deepEqual(companies.companies,[{id:A,name:'Minha loja',role:'ADMIN'}]);await expect(picker()).toHaveCount(0);
 await nav('Início').click();await expect(page.locator('.nexo-brand strong')).toHaveText('EXO');await expect(page.locator('.nexo-brand strong img')).toBeVisible();assert(await page.locator('.nexo-brand strong img').evaluate(img=>img.complete && img.naturalWidth>0));await shot('02-inicio');check('Primeiro acesso por nome; uma loja e nenhum seletor.');
 step='operador por nome';
 const operator=await call('createOperator',{name:'Operador QA',companies:[A]});
 await call('logout');await call('login',operator.id);
 assert.equal((await call('status')).companies[0].role,'OPERADOR');
 await assert.rejects(()=>call('createOperator',{name:'Operador indevido',companies:[A]}));
 await call('logout');await call('login',owner);
 assert.equal((await call('status')).companies[0].role,'ADMIN');
 check('Operador bloqueado no cadastro da equipe. Selecionar o nome do responsável concede acesso administrativo sem senha.');
 step='atualização pelo GitHub';
 await app.evaluate(({shell})=>{shell.openExternal=async url=>{globalThis.__nexoOpened=url;};});
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 await page.getByRole('button',{name:'Ver versões no GitHub'}).click();

 assert.equal(await app.evaluate(()=>globalThis.__nexoOpened),'https://github.com/EduT3/nexo-gestao-comercial/releases');
 check('Botão de atualização encaminha para a página oficial de versões do GitHub.');
 step='preparar estoque';product=(await call('createProduct',A,{name:'Café QA fracionado',internalCode:'QA-KG',unit:'KG',costCents:200,priceCents:500})).id;
 await size(1000,650);
 await nav('Estoque').click();
 await page.getByRole('button',{name:'Adicionar ao estoque',exact:true}).click();
 const entry=page.getByRole('form',{name:'Entrada de mercadorias'});
 await entry.getByLabel('Produto 1',{exact:true}).selectOption(product);
 await entry.getByLabel('Quantidade 1',{exact:true}).fill('8');
 await entry.getByLabel('Observações da compra').evaluate(el=>el.scrollIntoView({block:'center'}));
 const saveEntry=entry.getByRole('button',{name:'Salvar entrada no estoque',exact:true});
 await expect(saveEntry).toBeInViewport();
 assert(await saveEntry.evaluate(el=>{const box=el.getBoundingClientRect();return el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));}));
 await shot('02b-entrada-salvar',{top:false});
 await saveEntry.click();
 await expect(statusText('Entrada registrada. Estoque atualizado.')).toBeVisible();
 await size(1487,1058);
 check('Entrada de estoque salva pela interface com botão visível mesmo ao rolar em 1000 × 650.');
 await nav('Vender').click();await expect(page.getByRole('button',{name:'Ir ao caixa',exact:true})).toBeVisible();
 step='busca e carrinho';await page.keyboard.press('F2');await expect(search()).toBeFocused();await search().fill('SEM-RESULTADO');await expect(page.getByText('Nenhum produto encontrado nesta empresa.')).toBeVisible();
 await addBySearch('QA-KG');await expect(qty()).toHaveValue('1');
 await search().fill('cafe qa');await page.locator('#nexo-product-results').getByRole('button',{name:/Café QA fracionado/}).click();await expect(qty()).toHaveValue('2');
 await qty().fill('0,500');await sale().getByRole('button',{name:/Aumentar quantidade/}).click();await expect(qty()).toHaveValue('1,5');await sale().getByRole('button',{name:/Diminuir quantidade/}).click();await expect(qty()).toHaveValue('0,5');
 page.once('dialog',dialog=>dialog.dismiss());await sale().getByRole('button',{name:/Remover item 1/}).click();await expect(qty()).toHaveValue('0,5');
 page.once('dialog',dialog=>dialog.accept());await sale().getByRole('button',{name:/Remover item 1/}).click();await expect(qty()).toHaveCount(0);
 await addBySearch('QA-KG');await expect(submit()).toBeDisabled();await shot('03-venda-caixa-fechado');
 await qty().fill('0,500');
 check('F2, busca por nome/código, produto ausente, duplicata, quantidade fracionária, botões e remoção com confirmação.');
 step='abrir caixa';await page.getByRole('button',{name:'Ir ao caixa',exact:true}).click();f=page.getByRole('form',{name:'Abertura de caixa'});await f.getByLabel('Valor inicial (R$)',{exact:true}).fill('10,00');await f.getByRole('button',{name:'Abrir caixa',exact:true}).click();await expect(page.locator('.nexo-status-chip.open')).toHaveText('Caixa aberto');await shot('04-caixa');
 await nav('Vender').click();await expect(qty()).toHaveValue('0,500');await expect(submit()).toBeEnabled();
 step='erros de venda';await qty().fill('99');await submit().click();await expect(page.getByRole('alert').filter({hasText:/estoque|saldo/i})).toBeVisible();assert.equal((await call('salesHistory',A,{})).total,0);
 await qty().fill('0,500');await expect(page.getByRole('alert').filter({hasText:/estoque|saldo/i})).toHaveCount(0);assert.equal(await sale().locator('.nexo-sale-extras').getAttribute('open'),null);await sale().locator('.nexo-sale-extras summary').click();const discount=sale().getByLabel('Desconto da venda (R$)',{exact:true});
 await discount.fill('9,00');await expect(page.getByRole('alert').filter({hasText:'Desconto acima do subtotal'})).toBeVisible();await expect(submit()).toBeDisabled();
 await discount.fill('0,50');const received=sale().getByLabel('Recebido (R$)',{exact:true});await received.fill('1,99');await expect(page.getByRole('alert').filter({hasText:'Valor recebido insuficiente'})).toBeVisible();await expect(submit()).toBeDisabled();await shot('05-venda-erro');
 await received.fill('5,00');await expect(sale().locator('.nexo-change')).toHaveText('R$ 3,00');await expect(submit()).toBeEnabled();await shot('06-venda-aberta-1487');await size(1280,900);await shot('07-venda-aberta-1280');await expect.poll(()=>submit().evaluate(b=>b.getBoundingClientRect().bottom)).toBeLessThan(900);await size(900,750);await shot('08-venda-compacta-900');
 for(const [w,h] of [[900,750],[1280,900],[1487,1058]]){await size(w,h);const dims=await page.evaluate(()=>({w:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(dims.scroll<=dims.client+1,JSON.stringify(dims));}
 check('Caixa fechado bloqueia venda; caixa aberto habilita e preserva rascunho. Falta de estoque, desconto e valor insuficiente são apresentados.');
 step='confirmação';await submit().dblclick();await expect(statusText(/Venda salva\. Total: R\$ 2,00\. Troco: R\$ 3,00/)).toBeVisible();assert.equal((await call('salesHistory',A,{})).total,1);assert.equal((await call('activeCash',A)).balance_cents,1200n);await shot('09-venda-concluida');
 for(const [label,method] of [['PIX','PIX'],['Cartão de débito','DEBIT'],['Cartão de crédito','CREDIT']]){
  await addBySearch('QA-KG');await qty().fill('0,250');await sale().getByRole('radio',{name:label,exact:true}).check();await submit().click();await expect(statusText(/Venda salva\. Total: R\$ 1,25/)).toBeVisible();const h=await call('salesHistory',A,{});assert.equal(h.rows[0].method,method);
 }
 assert.equal((await call('activeCash',A)).balance_cents,1200n);
 const key=crypto.randomUUID(),body={items:[{productId:product,quantity:'0.250'}],paymentMethod:'PIX'};
 const v=await call('confirmSale',A,key,body),again=await call('confirmSale',A,key,body);assert.equal(again.id,v.id);assert.equal(again.replayed,true);assert.equal((await call('salesHistory',A,{})).total,5);
 await page.locator('.nexo-sales-history > summary').click();await expect(page.getByRole('table',{name:'Vendas realizadas',exact:true})).toBeVisible();await shot('10-historico',{top:false});check('Dinheiro com troco, Pix, débito e crédito; clique duplo grava uma vez e IPC repete com a mesma chave sem duplicar.');
 step='telas auxiliares';await nav('Estoque').click();await expect(page.getByRole('table',{name:'Produtos e quantidades em estoque'})).toBeVisible();await shot('11-estoque');await page.getByRole('button',{name:'Ver movimentações',exact:true}).click();await expect(page.getByRole('table',{name:'Histórico de estoque',exact:true})).toContainText('Venda');await shot('15-movimentacoes');
 await nav('Contas').click();await expect(page.getByRole('heading',{name:'Contas',exact:true})).toBeVisible();await page.getByRole('button',{name:'Resumo',exact:true}).click();await shot('12-resumo');
 await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByRole('button',{name:'Clientes, fornecedores e categorias',exact:true}).click();await shot('13-cadastros');
 await page.getByRole('button',{name:'Abrir Backup e dados',exact:true}).click();await shot('14-backup');
 if(baseline){
  const sourceBuild=buildAt(program);
  const supportsGuard=await page.evaluate(()=>typeof window.nexoLocal.guardConfigure==='function');
  if(process.env.NEXO_QA_REQUIRE_GUARD_SOURCE==='1') assert(supportsGuard,'Versão de origem sem Guard');
  let originalGuard;
  if(supportsGuard){
   await call('guardConfigure',{enabled:true,all:false,actions:['backup'],pin:'0123',confirmation:'0123'});
   originalGuard=await call('guardStatus');
   assert.equal(originalGuard.enabled,true);
  }
  step='consulta e download pelo atualizador instalado';
  const setup = path.basename(process.env.NEXO_QA_SETUP);
  const {startUpdateQaFeed}=require('./update-qa-feed.cjs');
  const feed=await startUpdateQaFeed(path.dirname(process.env.NEXO_QA_SETUP),['latest.yml',setup,setup+'.blockmap']);
  try {
   await app.evaluate((_electron,url)=>{
    process.mainModule.require('electron-updater').autoUpdater.setFeedURL({provider:'generic',url});
   },feed.url);
   const updatePanel=page.getByRole('region',{name:'Atualização do NEXO'});
   const verify=updatePanel.getByRole('button',{name:'Verificar atualização',exact:true});
   const download=updatePanel.getByRole('button',{name:'Baixar versão '+id.productVersion,exact:true});
   const manifest=path.join(path.dirname(process.env.NEXO_QA_SETUP),'latest.yml');
   const original=fs.readFileSync(manifest,'utf8');
   const currentManifest=path.join(profile,'current-latest.yml');
   const current=original.replace(/^version:[^\r\n]+/m,'version: '+sourceBuild.productVersion);
   assert.notEqual(current,original);
   fs.writeFileSync(currentManifest,current);
   await feed.setManifest(currentManifest);
   step='consulta sem atualização disponível';
   await verify.click();
   await expect(updatePanel.getByRole('status')).toHaveText('Seu NEXO está atualizado.',{timeout:30000});
   await expect(download).toHaveCount(0);
   assert.equal((await call('updateStatus')).phase,'current');
   check('A versão instalada igual à versão do canal é reconhecida como atualizada.');
   step='perda de conexão durante a consulta';
   feed.interruptDownload('latest.yml');
   await verify.click();
   await expect(updatePanel.getByRole('status')).toContainText('Não foi possível atualizar',{timeout:30000});
   assert(feed.requests.some(request=>request.pathname==='/latest.yml'&&request.interrupted));
   await expect(download).toHaveCount(0);
   check('Falha de conexão na consulta é exibida e permite nova tentativa.');
   feed.interruptDownload(null);
   await feed.setManifest(manifest);
   await verify.click();
   await expect(download).toBeVisible({timeout:30000});
   step='rejeição de hash inválido pelo atualizador';
   const invalidManifest=path.join(profile,'invalid-latest.yml');
   const invalid=original.replace(/^(\s*sha512:\s*)[^\r\n]+/gm,(_,key)=>key+Buffer.alloc(64).toString('base64'));
   assert.notEqual(invalid,original);
   fs.writeFileSync(invalidManifest,invalid);
   await feed.setManifest(invalidManifest);
   await updatePanel.getByRole('button',{name:'Verificar atualização',exact:true}).click();
   await download.click();
   await expect.poll(async()=>(await call('updateStatus')).phase,{timeout:120000}).toBe('error');
   assert.equal(buildAt(program).id,sourceBuild.id);
   await expect(updatePanel.getByRole('button',{name:'Reiniciar e atualizar',exact:true})).toHaveCount(0);
   check('O atualizador rejeitou o instalador com hash divergente e manteve a versão anterior.');
   await feed.setManifest(manifest);
   step='download interrompido pelo canal de atualização';
   feed.interruptDownload(setup);
   await updatePanel.getByRole('button',{name:'Verificar atualização',exact:true}).click();
   await expect(download).toBeVisible({timeout:30000});
   await download.click();
   await expect.poll(async()=>(await call('updateStatus')).phase,{timeout:120000}).toBe('error');
   assert(feed.requests.some(request=>request.method==='GET'&&request.interrupted));
   assert.equal(buildAt(program).id,sourceBuild.id);
   await expect(updatePanel.getByRole('button',{name:'Reiniciar e atualizar',exact:true})).toHaveCount(0);
   check('Download interrompido manteve a versão anterior e bloqueou a instalação.');
   feed.interruptDownload(null);
   await updatePanel.getByRole('button',{name:'Verificar atualização',exact:true}).click();
   const started=performance.now();
   await download.click();
   await expect(updatePanel.getByRole('button',{name:'Reiniciar e atualizar',exact:true})).toBeVisible({timeout:120000});
   timings.push({operation:'update-download',version:id.productVersion,ms:Math.round(performance.now()-started)});
   assert(feed.requests.some(request=>request.pathname==='/latest.yml'));
   assert(feed.requests.some(request=>request.method==='GET'&&request.pathname==='/'+setup));
   assert.equal((await call('updateStatus')).phase,'ready');
   result.updateFeedRequests=feed.requests;
   check('Aplicativo instalado consultou o manifesto e baixou o instalador pelo atualizador.');
  } finally { await feed.close(); }
  step='instalação pelo atualizador';
  const previous=dbCheck();
  const previousRecords=commercialSnapshot(dbfile);
  assert.equal(buildAt(program).id,sourceBuild.id);
  await app.evaluate(({dialog})=>{
   const updater=process.mainModule.require('electron-updater').autoUpdater;
   const install=updater.quitAndInstall.bind(updater);
   // Keep the real installer launch; reopen under the isolated profile ourselves.
   updater.quitAndInstall=()=>install(true,false);
   let confirmations=0;
   dialog.showMessageBox=async(_window,options)=>{
    if(options.title!=='Atualizar NEXO') throw Error('Diálogo inesperado: '+options.title);
    return {response:confirmations++ === 0 ? 0 : 1};
   };
  });
  const backupsBefore=fs.readdirSync(path.dirname(dbfile)).filter(name=>name.startsWith('before-update-'));
  await call('installUpdate');
  assert.equal(child.exitCode,null);
  assert.equal(buildAt(program).id,sourceBuild.id);
  assert.equal((await call('updateStatus')).phase,'ready');
  assert.deepEqual(fs.readdirSync(path.dirname(dbfile)).filter(name=>name.startsWith('before-update-')),backupsBefore);
  check('Cancelar a instalação manteve a versão anterior aberta e o download pronto para nova tentativa.');
  const exited=new Promise(resolve=>child.once('exit',resolve));
  const installStarted=performance.now();
  await page.getByRole('button',{name:'Reiniciar e atualizar',exact:true}).click();
  await expect.poll(()=>child.exitCode,{timeout:60000}).toBe(0);
  assert.equal(await exited,0);
  result.launches.at(-1).exitCode=0;
  app=undefined;
  await expect.poll(()=>{try{return buildAt(program).id;}catch{return null;}},{timeout:180000}).toBe(id.id);
  // The installer writes build-info before all application dependencies are extracted.
  const packedApp=path.resolve('artifacts/installer/win-unpacked/resources/app');
  const installedApp=path.join(program,'resources/app');
  const expectedFiles=fs.readdirSync(packedApp,{recursive:true,withFileTypes:true})
   .filter(entry=>entry.isFile())
   .map(entry=>{
    const file=path.join(entry.parentPath,entry.name);
    return {relative:path.relative(packedApp,file),size:fs.statSync(file).size};
   });
  await expect.poll(()=>expectedFiles.every(file=>{
   try{return fs.statSync(path.join(installedApp,file.relative)).size===file.size;}
   catch{return false;}
  }),{timeout:180000}).toBe(true);
  for (const {relative} of expectedFiles) {
   const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
   assert.equal(digest(path.join(installedApp,relative)),digest(path.join(packedApp,relative)),relative);
  }
  timings.push({operation:'update-install',version:id.productVersion,ms:Math.round(performance.now()-installStarted)});
  const updateBackups=fs.readdirSync(path.dirname(dbfile))
   .filter(name=>/^before-update-.*\.sqlite$/.test(name)&&!backupsBefore.includes(name));
  assert.equal(updateBackups.length,1);
  const updateBackup=path.join(path.dirname(dbfile),updateBackups[0]);
  const backupDb=new DatabaseSync(updateBackup,{readOnly:true});
  try {
   assert.equal(backupDb.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  } finally { backupDb.close(); }
  assert.deepEqual(commercialSnapshot(updateBackup),previousRecords);
  check('Botão de atualização acionou o instalador baixado e gerou backup antes do fechamento.');
  await open();await login();
  assert.equal((await call('salesHistory',A,{})).total,5);
  assert.deepEqual(dbCheck(),previous);
  assert.deepEqual(commercialSnapshot(dbfile),previousRecords);
  assert.equal((await call('status')).userId,owner);
  check('Após atualizar, o Windows reabriu a candidata com os mesmos usuários, vínculos e registros comerciais.');
  if(originalGuard){
   const updatedGuard=await call('guardStatus');
   assert.equal(updatedGuard.enabled,originalGuard.enabled);
   assert.equal(updatedGuard.all,originalGuard.all);
   assert.deepEqual(updatedGuard.actions,originalGuard.actions);
   const persistedBackup=path.join(profile,'guard-preserved-backup.sqlite');
   await app.evaluate(({dialog},file)=>{
    dialog.showSaveDialog=async()=>({canceled:false,filePath:file});
   },persistedBackup);
   const pendingBackup=call('backup').then(value=>({value}),error=>({error}));
   const preservedPrompt=page.getByRole('dialog',{name:'Autorização administrativa'});
   await expect(preservedPrompt.getByText('Gerar backup',{exact:true})).toBeVisible();
   assert.equal(fs.existsSync(persistedBackup),false);
   await page.keyboard.type('0123');
   await preservedPrompt.getByRole('button',{name:'Autorizar',exact:true}).click();
   const pendingBackupResult=await pendingBackup; if ('error' in pendingBackupResult) throw pendingBackupResult.error;
 assert.equal(pendingBackupResult.value.canceled,false);
   assert(fs.existsSync(persistedBackup));
   await app.evaluate(({dialog},folder)=>{
    dialog.showSaveDialog=async(_window,options)=>{
     if(options.title==='Exportar relatório Excel')return {canceled:false,filePath:folder+'/relatorio.xlsx'};
     if(options.title==='Guardar cópia de segurança')return {canceled:false,filePath:folder+'/backup.sqlite'};
     throw Error('Diálogo inesperado: '+options.title);
    };
   },profile);
   await assert.rejects(()=>call('guardConfigure',{enabled:false,all:true,actions:[],currentPin:'9999'}),/PIN incorreto/i);
   await call('guardConfigure',{enabled:false,all:true,actions:[],currentPin:'0123'});
   check('A atualização preservou a política do Guard e o PIN de origem.');
  }
 }
 step='ajuda global e identificação da loja';
 await size(1000,650);
 const header=page.getByRole('banner');
 await expect(header.getByText('Modo local',{exact:true})).toBeVisible();
 const activeCompany=(await call('status')).companies[0].name;
 await expect(header.getByText(activeCompany,{exact:true})).toBeVisible();
 const help=header.getByRole('button',{name:'Ajuda e tutorial',exact:true});
 await expect(help).toBeInViewport();
 await help.click();
 const guide=page.getByRole('region',{name:'Tutorial do NEXO'});
 await expect(guide).toBeVisible();
 await expect(help).toHaveAttribute('aria-expanded','true');
 await shot('ajuda-global-1000x650',{top:false});
 await page.keyboard.press('Escape');
 await expect(guide).toHaveCount(0);
 await expect(help).toBeFocused();
 check('Ajuda global abre em janela compacta e devolve o foco ao fechar.');
 await size(1280,900);
 step='layout nas resoluções de homologação';
 for (const [width,height] of [[1280,720],[1366,768],[1920,1080]]) {
  await size(width,height);
  await expect.poll(()=>page.evaluate(()=>innerHeight)).toBe(height);
  for (const [name,section] of [['Vender','vendas'],['Estoque','estoque'],['Caixa','caixa'],['Contas','contas']]) {
   const button=nav(name);
   await button.focus();
   await expect(button).toBeFocused();
   await page.keyboard.press('Enter');
   await expect(button).toHaveAttribute('aria-current','page');
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
   await shot(section+'-'+width+'x'+height);
  }
 }
 check('Navegação por teclado e largura da página verificadas em Vender, Estoque, Caixa e Contas nas três resoluções de homologação.');
 await size(1280,900);
 step='filtros e estados vazios de Contas';
 await nav('Contas').click();
 const financeTabs=page.getByRole('group',{name:'Tarefas do financeiro'});
 for (const [tab,kind] of [['Pagar','pagar'],['Receber','receber']]) {
  await financeTabs.getByRole('button',{name:tab,exact:true}).click();
  const filters=page.getByRole('group',{name:'Filtrar contas a '+kind});
  const accountSearch=filters.getByRole('textbox',{name:'Buscar conta a '+kind});
  await accountSearch.fill('sem-resultado-qa-'+crypto.randomUUID());
  await expect(statusText('Nenhuma conta a '+kind+' corresponde aos filtros.')).toBeVisible();
  await filters.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(accountSearch).toHaveValue('');
  await expect(filters.getByRole('combobox',{name:'Situação das contas a '+kind})).toHaveValue('OPEN');
  await expect(statusText('Nenhuma conta a '+kind+' corresponde aos filtros.')).toHaveCount(0);
 }
 check('Pagar e Receber explicaram a busca vazia e voltaram às pendências ao limpar os filtros.');
 step='Excel e atualizador';
 assert.equal((await call('exportExcel',A)).canceled,false);
 assert.equal(fs.readFileSync(path.join(profile,'relatorio.xlsx')).subarray(0,2).toString(),'PK');
 assert.equal((await call('updateStatus')).phase,'idle');
 check('Exportação XLSX e inicialização do atualizador no app instalado.');
 step='falha imediata ao iniciar instalador na candidata';
 const beforeLaunchFailure=commercialSnapshot(dbfile);
 const existingUpdateBackups=new Set(fs.readdirSync(path.dirname(dbfile)));
 await app.evaluate(({dialog})=>{
  const updater=process.mainModule.require('electron-updater').autoUpdater;
  updater.checkForUpdates=async()=>({isUpdateAvailable:true,updateInfo:{version:'99.0.0'}});
  updater.downloadUpdate=async()=>[];
  updater.quitAndInstall=()=>updater.emit('error',new Error('Falha de execução simulada'));
  const confirm=dialog.showMessageBox;
  const report=dialog.showErrorBox;
  dialog.showMessageBox=async()=>{dialog.showMessageBox=confirm;return {response:1};};
  dialog.showErrorBox=(title)=>{dialog.showErrorBox=report;globalThis.nexoQaUpdateError=title;};
 });
 assert.equal((await call('checkUpdate')).phase,'available');
 assert.equal((await call('downloadUpdate')).phase,'ready');
 await call('installUpdate');
 await expect.poll(()=>app.evaluate(()=>globalThis.nexoQaUpdateError),{timeout:30000}).toMatch(/NEXO.*Atualização interrompida/);
 assert.equal(child.exitCode,null);
 assert.equal(buildAt(program).id,id.id);
 assert.equal((await call('updateStatus')).phase,'error');
 assert.equal((await call('salesHistory',A,{})).total,5);
 assert.deepEqual(commercialSnapshot(dbfile),beforeLaunchFailure);
 const failureBackups=fs.readdirSync(path.dirname(dbfile))
  .filter(name=>name.startsWith('before-update-')&&!existingUpdateBackups.has(name));
 assert.equal(failureBackups.length,1);
 assert.deepEqual(commercialSnapshot(path.join(path.dirname(dbfile),failureBackups[0])),beforeLaunchFailure);
 check('Falha imediata simulada ao iniciar o instalador manteve a candidata aberta, reabriu o banco e preservou o backup.');
 step='backup e restauração';assert.equal((await call('backup')).canceled,false);assert(fs.existsSync(path.join(profile,'backup.sqlite')));
 await call('createProduct',A,{name:'Criado depois da cópia',internalCode:'TEMP-QA',unit:'KG',costCents:10,priceCents:20});
 assert.equal((await call('restore')).canceled,false);await page.reload();await login();assert(!(await call('products',A)).some(p=>p.internal_code==='TEMP-QA'));assert.equal((await call('salesHistory',A,{})).total,5);
 const health=await call('checkDataHealth');assert(health.integrityOk&&health.linksOk);
 step='conferência e fechamento do caixa';
 await nav('Caixa').click();
 await page.getByText('Encerrar atendimento e fechar caixa',{exact:true}).click();
 f=page.getByRole('form',{name:'Fechamento de caixa'});
 const balance=(await call('activeCash',A)).balance_cents;
 const formatCash=value=>{
  const absolute=value<0n?-value:value;
  return (value<0n?'-':'')+'R$ '+absolute/100n+','+(absolute%100n).toString().padStart(2,'0');
 };
 await expect(f.locator('p').filter({hasText:'Saldo esperado:'})).toHaveText('Saldo esperado: '+formatCash(balance));
 const counted=f.getByLabel('Dinheiro contado (R$)',{exact:true});
 await counted.fill('11,00');
 await expect(f.locator('p').filter({hasText:'Diferença prevista:'})).toHaveText('Diferença prevista: '+formatCash(1100n-balance));
 await counted.fill('12,00');
 await expect(f.locator('p').filter({hasText:'Diferença prevista:'})).toHaveText('Diferença prevista: '+formatCash(1200n-balance));
 await f.getByRole('button',{name:'Fechar caixa',exact:true}).click();
 await expect(page.locator('.nexo-status-chip.closed')).toHaveText('Caixa fechado');
 await expect(page.getByRole('region',{name:'Operação do caixa'}).getByRole('status').filter({hasText:'Caixa fechado. Confira a diferença no histórico.'})).toBeVisible();assert.equal(await call('activeCash',A),null);
 await close();const before=dbCheck();assert.equal(before.tables,27);assert.equal(before.sales,5);
 await open();await login();assert.equal((await call('status')).userId,owner);assert.equal((await call('salesHistory',A,{})).total,5);assert.equal(await call('activeCash',A),null);await close();assert.deepEqual(dbCheck(),before);assert.deepEqual(result.rendererErrors,[]);check('Backup/restauração, fechamento, login e reabertura com cinco vendas e 27 tabelas íntegras.');
 step='NEXO Guard no Windows';
 await open();await login();await size(1000,650);
 assert.equal((await call('guardStatus')).enabled,false);
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 await page.getByText('Segurança',{exact:true}).click();
 await page.getByLabel('Ativar NEXO Guard').check();
 await page.getByRole('button',{name:'Revisar configuração'}).click();
 await page.getByLabel('Novo PIN',{exact:true}).fill('0123');
 await page.getByLabel('Confirmar novo PIN',{exact:true}).fill('0123');
 await page.getByRole('button',{name:'Confirmar configuração'}).click();
 await expect(statusText('Configuração salva.')).toBeVisible();
 await page.getByRole('button',{name:'Já guardei a chave'}).click();
 await page.getByLabel('Ativar NEXO Guard').scrollIntoViewIfNeeded();
 await shot('16-guard-configuracao',{top:false});
 await size(1280,900);
 await expect(page.getByLabel('Ativar NEXO Guard')).toBeVisible();
 await page.getByLabel('Ativar NEXO Guard').scrollIntoViewIfNeeded();
 await shot('16b-guard-configuracao-1280',{top:false});
 await size(1000,650);
 const guardedBackup=path.join(profile,'guard-backup.sqlite');
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},guardedBackup);
 await page.evaluate(()=>{window.nexoLocal.registerGuardPrompt(null);});
 const directFailure=await call('backup').then(()=>{throw Error('Backup sem autorização');},error=>String(error));
 const staleId=/NEXO_GUARD_REQUIRED:([0-9a-f-]{36})/.exec(directFailure)?.[1];
 assert(staleId,'A chamada direta deve exigir Guard');
 assert.equal(fs.existsSync(guardedBackup),false);
 await page.reload();await expect(nav('Vender')).toBeVisible();
 await assert.rejects(()=>call('guardApprove',staleId,'0123'),/expirada/i);
 const backupPromise=call('backup').then(value=>({value}),error=>({error}));
 const modal=page.getByRole('dialog',{name:'Autorização administrativa'});
 await expect(modal).toBeVisible();
 await expect(modal.getByText('Gerar backup',{exact:true})).toBeVisible();
 await expect(modal.getByRole('button',{name:'1',exact:true})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(modal.getByRole('button',{name:'2',exact:true})).toBeFocused();
 await page.keyboard.type('01');
 await expect(modal.getByLabel('2 de 4 dígitos preenchidos')).toBeVisible();
 assert(!(await modal.innerText()).includes('01'));
 await page.keyboard.press('Backspace');
 await expect(modal.getByLabel('1 de 4 dígitos preenchidos')).toBeVisible();
 await modal.getByRole('button',{name:'Apagar último dígito'}).click();
 await expect(modal.getByLabel('0 de 4 dígitos preenchidos')).toBeVisible();
 await shot('17-guard-teclado');
 await expect(modal.getByRole('button',{name:'Autorizar',exact:true})).toBeInViewport();
 await size(1280,900);
 await expect(modal.getByRole('button',{name:'Autorizar',exact:true})).toBeInViewport();
 await shot('17b-guard-teclado-1280');
 await size(1000,650);
 await page.keyboard.type('9999');
 await modal.getByRole('button',{name:'Autorizar',exact:true}).click();
 await expect(modal.getByRole('status')).toContainText('PIN incorreto');
 for(const digit of '0123') await modal.getByRole('button',{name:digit,exact:true}).click();
 await modal.getByRole('button',{name:'Autorizar',exact:true}).click();
 const backupPromiseResult=await backupPromise; if ('error' in backupPromiseResult) throw backupPromiseResult.error;
 assert.equal(backupPromiseResult.value.canceled,false);
 await expect(page.getByRole('status').filter({hasText:'Autorização confirmada: Gerar backup.'})).toBeVisible();
 assert(fs.existsSync(guardedBackup));
 step='rascunho de produto durante autorização';
 await nav('Estoque').click();
 await page.getByRole('button',{name:'Cadastrar produto',exact:true}).click();
 const productDraft=page.getByRole('form',{name:'Cadastro de produtos'});
 await productDraft.getByLabel('Nome',{exact:true}).fill('Produto QA após autorização');
 await productDraft.getByLabel('Código interno').fill('QA-GUARD-M2');
 await productDraft.getByLabel('Preço de venda (R$)').fill('4,50');
 await productDraft.getByRole('button',{name:'Salvar produto'}).click();
 await expect(modal.getByText('Cadastrar produto',{exact:true})).toBeVisible();
 await expect(productDraft.getByRole('button',{name:'Autorização em andamento…',includeHidden:true})).toBeDisabled();
 await page.keyboard.type('9999');
 await modal.getByRole('button',{name:'Autorizar',exact:true}).click();
 await expect(modal.getByRole('status')).toContainText('PIN incorreto');
 await expect(productDraft.getByLabel('Código interno')).toHaveValue('QA-GUARD-M2');
 assert(!(await call('products',A)).some(item=>item.internal_code==='QA-GUARD-M2'));
 await page.keyboard.press('Escape');
 await expect(modal).toHaveCount(0);
 await expect(page.getByText('Autorização cancelada.',{exact:true}).filter({visible:true})).toBeVisible();
 await expect(productDraft.getByLabel('Nome',{exact:true})).toHaveValue('Produto QA após autorização');
 await expect(productDraft.getByLabel('Código interno')).toHaveValue('QA-GUARD-M2');
 assert(!(await call('products',A)).some(item=>item.internal_code==='QA-GUARD-M2'));
 await productDraft.getByRole('button',{name:'Salvar produto'}).click();
 await expect(modal.getByText('Cadastrar produto',{exact:true})).toBeVisible();
 await page.keyboard.type('0123');
 await modal.getByRole('button',{name:'Autorizar',exact:true}).click();
 await expect(page.getByText(/Produto salvo\. O cadastro/).filter({visible:true})).toBeVisible();
 assert.equal((await call('products',A)).filter(item=>item.internal_code==='QA-GUARD-M2').length,1);
 const emptyProduct=page.getByRole('row').filter({hasText:'QA-GUARD-M2'});
 await expect(emptyProduct.getByText('Sem estoque',{exact:true})).toBeVisible();
 const stockSearch=page.getByRole('searchbox',{name:'Buscar produto',exact:true});
 await stockSearch.fill('QA-GUARD-M2');
 await page.getByRole('checkbox',{name:'Somente sem estoque'}).check();
 await expect(emptyProduct).toBeVisible();
 await stockSearch.fill('QA-PRODUTO-INEXISTENTE');
 await expect(emptyProduct).toHaveCount(0);
 await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
 await expect(stockSearch).toHaveValue('');
 await expect(page.getByRole('checkbox',{name:'Somente sem estoque'})).not.toBeChecked();
 await expect(emptyProduct).toBeVisible();

 check('Produto recém-cadastrado aparece com saldo zero identificado na lista.');
 check('Cadastro protegido mantém rascunho e não grava com PIN incorreto ou ao cancelar. Nova autorização grava um produto.');

 await size(1280,900);
 const cash=await call('openCash',A,crypto.randomUUID(),{openingCents:0});
 assert(cash.id);
 const ordinary=await call('confirmSale',A,crypto.randomUUID(),body);
 assert(ordinary.id);
 await expect(modal).toHaveCount(0);
 const discountRequest=call('confirmSale',A,crypto.randomUUID(),{...body,discountCents:10});
 const canceledDiscount=assert.rejects(discountRequest,/cancelada/i);
 await expect(modal.getByText('Aplicar desconto na venda',{exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await canceledDiscount;
 assert.equal((await call('salesHistory',A,{})).total,6);
 const restoreRequest=call('restore');
 await expect(modal.getByText('Restaurar backup',{exact:true})).toBeVisible();
 await shot('18-guard-restauracao');
 await page.keyboard.type('0123');
 await modal.getByRole('button',{name:'Autorizar',exact:true}).click();
 assert.equal((await restoreRequest).canceled,false);
 await page.reload();await login();
 assert.equal((await call('salesHistory',A,{})).total,5);
 assert.equal((await call('guardStatus')).enabled,true);
 check('Venda comum sem PIN, desconto cancelado sem gravação e política mantida após restaurar.');
 await close();await open();await login();
 assert.equal((await call('guardStatus')).enabled,true);
 step='troca de usuário e permissões do Guard';
 await page.evaluate(()=>{window.nexoLocal.registerGuardPrompt(null);});
 const pendingFailure=await call('backup').then(()=>{throw Error('Backup sem autorização');},error=>String(error));
 const pendingId=/NEXO_GUARD_REQUIRED:([0-9a-f-]{36})/.exec(pendingFailure)?.[1];
 assert(pendingId,'O backup deve aguardar autorização');
 await call('logout');await call('login',operator.id);
 await assert.rejects(()=>call('guardApprove',pendingId,'0123'),/expirada/i);
 await assert.rejects(()=>call('guardConfigure',{enabled:false,all:true,actions:[],currentPin:'0123'}));
 await assert.rejects(()=>call('backup'));
 await call('logout');await call('login',owner);
 assert.equal((await call('guardStatus')).enabled,true);
 check('Troca de usuário invalida solicitação; operador não configura Guard nem executa backup.');
 step='recuperação na abertura com Guard';
 await close();
 assert(path.resolve(dbfile).startsWith(path.resolve(profile)+path.sep));
 fs.writeFileSync(dbfile,'base sintética corrompida');
 const corrupted=fs.readFileSync(dbfile);
 app=await _electron.launch({executablePath:path.join(program,'NEXO.exe'),args:['--user-data-dir='+d['user-data'],'--disk-cache-dir='+d.cache],cwd:O,env,chromiumSandbox:true,timeout:30000});
 child=app.process();result.launches.push({pid:child.pid});persist();
 page=await app.firstWindow();
 await page.waitForURL('file:///**/recovery.html');
 await app.evaluate(({dialog},file)=>{
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});
  dialog.showMessageBox=async()=>({response:1});
 },guardedBackup);
 await page.locator('#select').click();
 await expect(page.locator('#guard-pin')).toBeVisible();
 await page.locator('#guard-pin').fill('9999');
 await page.getByRole('button',{name:'Restaurar cópia'}).click();
 await expect(page.locator('#message')).toContainText('PIN incorreto');
 assert.deepEqual(fs.readFileSync(dbfile),corrupted);
 const nextWindow=app.waitForEvent('window',{timeout:30000});
 await page.locator('#guard-pin').fill('0123');
 await page.getByRole('button',{name:'Restaurar cópia'}).click();
 page=await nextWindow;
 await page.waitForURL('file:///**/index.html');
 await login();
 assert.equal((await call('salesHistory',A,{})).total,5);
 assert.equal((await call('guardStatus')).enabled,true);
 check('Recuperação na abertura recusou PIN incorreto sem alterar bytes e restaurou com o PIN correto.');
 await call('guardConfigure',{enabled:false,all:true,actions:[],currentPin:'0123'});
 await close();
 check('Guard ativado na interface, IPC direto bloqueado, teclado validado, backup autorizado e política persistida.');
 if(baseline){
  step='retorno à versão anterior';
  await open(baseline);await login();
  assert.equal((await call('salesHistory',A,{})).total,5);
  await close();assert.deepEqual(dbCheck(),before);
  check('Dados preservados na candidata e acessíveis ao voltar ao executável anterior.');
  step='retorno bloqueado com versão SQLite incompatível';
  assert(path.resolve(dbfile).startsWith(path.resolve(profile)+path.sep));
  const compatible=fs.readFileSync(dbfile);
  const future=new DatabaseSync(dbfile);
  try {
   const version=Number(future.prepare('PRAGMA user_version').get().user_version);
   future.exec('PRAGMA user_version='+ (version+1));
  } finally { future.close(); }
  const incompatible=fs.readFileSync(dbfile);
  assert.notDeepEqual(incompatible,compatible);
  app=await _electron.launch({executablePath:path.join(baseline,'NEXO.exe'),args:['--user-data-dir='+d['user-data'],'--disk-cache-dir='+d.cache],cwd:O,env,chromiumSandbox:true,timeout:30000});
  child=app.process();result.launches.push({pid:child.pid});persist();
  page=await app.firstWindow();
  await page.waitForURL('file:///**/recovery.html');
  await expect(page.locator('body')).toContainText(/outra versão do NEXO|versão compatível/i);
  await close();
  assert.deepEqual(fs.readFileSync(dbfile),incompatible);
  fs.writeFileSync(dbfile,compatible);
  await open(baseline);await login();
  assert.equal((await call('salesHistory',A,{})).total,5);
  await close();assert.deepEqual(dbCheck(),before);
  check('Executável anterior recusou a cópia com versão SQLite futura sem alterar seus bytes. A cópia compatível reabriu com as cinco vendas.');

 }
 step='troca de empresa em base fictícia legada';
 assert(path.resolve(dbfile).startsWith(path.resolve(profile)+path.sep));
 const legacyDb=new DatabaseSync(dbfile);
 try {
  legacyDb.prepare('INSERT INTO local_companies(id,name) VALUES(?,?)').run(B,'Outra loja QA');
  legacyDb.prepare("INSERT INTO local_memberships(company_id,user_id,role,active) VALUES(?,?,'ADMIN',1)").run(B,owner);
 } finally { legacyDb.close(); }
 await open();await login();
 assert.equal((await call('status')).companies.length,2);
 await call('guardConfigure',{enabled:true,all:true,actions:[],pin:'0123',confirmation:'0123'});
 await page.evaluate(()=>{window.nexoLocal.registerGuardPrompt(null);});
 const crossCompany=await call('createProduct',A,{name:'Não gravar QA',internalCode:'GUARD-CROSS',unit:'UNIT',costCents:1,priceCents:2}).then(()=>{throw Error('Produto criado sem PIN');},error=>String(error));
 const companyRequest=/NEXO_GUARD_REQUIRED:([0-9a-f-]{36})/.exec(crossCompany)?.[1];
 assert(companyRequest,'Cadastro deve aguardar autorização');
 await picker().selectOption(B);
 await assert.rejects(()=>call('guardApprove',companyRequest,'0123'),/expirada/i);
 assert(!(await call('products',A)).some(item=>item.internal_code==='GUARD-CROSS'));
 assert(!(await call('products',B)).some(item=>item.internal_code==='GUARD-CROSS'));
 await close();
 check('Troca de empresa invalida autorização pendente em base fictícia de duas empresas.');
 result.timings=timings;result.passed=true;
}catch(e){console.error('Falha na etapa: '+step,e);if(page){try{result.visibleText=(await page.locator('body').innerText()).slice(0,4000);await shot('failure-'+step.replace(/[^a-z0-9-]/gi,'-'));}catch(captureError){result.captureError=String(captureError);}}result.passed=false;result.step=step;result.errors.push(String(e.stack||e));process.exitCode=1;}
finally{if(app)try{await close();}catch(e){result.errors.push(String(e));}persist();console.log(JSON.stringify({profile,passed:result.passed,step:result.step,errors:result.errors,closed:result.launches.map(x=>x.exitCode)}));}})();
