const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{DatabaseSync}=require('node:sqlite');
const O=path.resolve('artifacts/cloud-qa');fs.mkdirSync(O,{recursive:true});const stage=process.cwd(),{_electron,expect}=require('@playwright/test');
const program=path.resolve(process.env.NEXO_QA_PROGRAM || 'artifacts/installer/win-unpacked');
const id=JSON.parse(fs.readFileSync(path.join(program,'resources/app/dist/build-info.json')));
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
async function open(){
 const began=performance.now();
 app=await _electron.launch({executablePath:path.join(program,'NEXO.exe'),args:['--user-data-dir='+d['user-data'],'--disk-cache-dir='+d.cache],cwd:O,env,chromiumSandbox:true,timeout:30000});
 child=app.process();result.launches.push({pid:child.pid});persist();page=await app.firstWindow();page.setDefaultTimeout(10000);
 page.on('pageerror',e=>{result.rendererErrors.push(String(e));persist();});await page.waitForURL('file:///**/index.html');
 const runtime=await app.evaluate(({app,BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {appPath:app.getAppPath(),userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration,electron:process.versions.electron,sqlite:process.versions.sqlite};});
 assert.equal(path.resolve(runtime.userData),d['user-data']);assert.equal(runtime.userData,runtime.sessionData);assert(runtime.sandbox&&runtime.contextIsolation&&!runtime.nodeIntegration);assert.equal((await call('buildInfo')).id,id.id);result.launches.at(-1).runtime=runtime;
 timings.push({operation:'launch',ms:Math.round(performance.now()-began)});
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
async function addBySearch(key){await search().fill(key);await search().press('Enter');await expect(qty()).toBeVisible();}
async function login(){const f=page.getByRole('form',{name:'Acesso local'});await expect(f.locator('input[type=password]')).toHaveCount(0);await f.getByLabel('Usuário',{exact:true}).selectOption({label:'Responsável QA Balcão'});await f.getByRole('button',{name:'Entrar',exact:true}).click();await expect(nav('Vender')).toBeVisible();}
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
 await call('logout');await call('login',owner);
 check('Cadastro de operador e troca de identidade por nome.');
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
 step='Excel e atualizador';
 assert.equal((await call('exportExcel',A)).canceled,false);
 assert.equal(fs.readFileSync(path.join(profile,'relatorio.xlsx')).subarray(0,2).toString(),'PK');
 assert.equal((await call('updateStatus')).phase,'idle');
 check('Exportação XLSX e inicialização do atualizador no app instalado.');
 step='backup e restauração';assert.equal((await call('backup')).canceled,false);assert(fs.existsSync(path.join(profile,'backup.sqlite')));
 await call('createProduct',A,{name:'Criado depois da cópia',internalCode:'TEMP-QA',unit:'KG',costCents:10,priceCents:20});
 assert.equal((await call('restore')).canceled,false);await page.reload();await login();assert(!(await call('products',A)).some(p=>p.internal_code==='TEMP-QA'));assert.equal((await call('salesHistory',A,{})).total,5);
 const health=await call('checkDataHealth');assert(health.integrityOk&&health.linksOk);
 await nav('Caixa').click();await page.getByText('Encerrar atendimento e fechar caixa',{exact:true}).click();f=page.getByRole('form',{name:'Fechamento de caixa'});await f.getByLabel('Dinheiro contado (R$)',{exact:true}).fill('12,00');await f.getByRole('button',{name:'Fechar caixa',exact:true}).click();await expect(page.locator('.nexo-status-chip.closed')).toHaveText('Caixa fechado');assert.equal(await call('activeCash',A),null);
 await close();const before=dbCheck();assert.equal(before.tables,27);assert.equal(before.sales,5);
 await open();await login();assert.equal((await call('status')).userId,owner);assert.equal((await call('salesHistory',A,{})).total,5);assert.equal(await call('activeCash',A),null);await close();assert.deepEqual(dbCheck(),before);assert.deepEqual(result.rendererErrors,[]);check('Backup/restauração, fechamento, login e reabertura com cinco vendas e 27 tabelas íntegras.');
 result.timings=timings;result.passed=true;
}catch(e){result.passed=false;result.step=step;result.errors.push(String(e.stack||e));process.exitCode=1;}
finally{if(app)try{await close();}catch(e){result.errors.push(String(e));}persist();console.log(JSON.stringify({profile,passed:result.passed,step:result.step,errors:result.errors,closed:result.launches.map(x=>x.exitCode)}));}})();
