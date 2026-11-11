const {readFile,writeFile,mkdir,readdir,stat}=require('node:fs/promises');
const {createReadStream}=require('node:fs');const path=require('node:path');const {createHash}=require('node:crypto');
const INFO_LIMIT=2048,VERSION=/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,SHA=/^[A-F0-9]{64}$/;
async function json(file,limit){const size=await stat(file);if(!size.isFile()||size.size>limit)throw Error('Metadados inválidos.');const bytes=await readFile(file);if(bytes.length>limit)throw Error('Metadados inválidos.');return JSON.parse(bytes.toString('utf8'));}
async function productVersion(root){try{const value=(await json(path.join(root,'package.json'),32768)).version;return typeof value==='string'&&VERSION.test(value)?value:null;}catch{return null;}}
function publicInfo(value,version){
 const keys=['schemaVersion','productVersion','builtAt','id','payloadSha256'];
 if(!value||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key))||value.schemaVersion!==1||!version||value.productVersion!==version||typeof value.payloadSha256!=='string'||!SHA.test(value.payloadSha256)||value.id!=='NEXO-'+value.payloadSha256.slice(0,16)||typeof value.builtAt!=='string')return {available:false,version};
 const date=new Date(value.builtAt);if(!Number.isFinite(date.getTime())||date.toISOString()!==value.builtAt)return {available:false,version};
 return {available:true,version,builtAt:value.builtAt,id:value.id,payloadSha256:value.payloadSha256};
}
async function readBuildInfo(root){
 const version=await productVersion(root);let file=path.join(root,'build-info.json');
 try{await stat(file);}catch(error){if(error.code!=='ENOENT')return {available:false,version};file=path.join(root,'dist/build-info.json');}
 try{return publicInfo(await json(file,INFO_LIMIT),version);}catch{return {available:false,version};}
}
const descriptor=version=>({name:'nexo-local',version,type:'module',main:'electron/main.cjs'});
function digest(value){return createHash('sha256').update(value).digest('hex').toUpperCase();}
async function fileHash(file){const hash=createHash('sha256');for await(const bytes of createReadStream(file))hash.update(bytes);return hash.digest('hex').toUpperCase();}
const sort=(a,b)=>a.file<b.file?-1:a.file>b.file?1:0;
async function collectPayload(root){
 for(const file of ['electron/main.cjs','electron/preload.cjs','electron/build-info.cjs','dist/client/index.html','dist/local-runtime/local/sqlite.js','node_modules/electron/dist/electron.exe'])if(!(await stat(path.join(root,file))).isFile())throw Error('Build incompleto.');
 const entries=new Map();
 async function directory(source,prefix,filter=()=>true,rename=value=>value){
  async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const sourceFile=path.join(folder,entry.name),relative=path.relative(source,sourceFile);if(!filter(relative))continue;if(entry.isDirectory())await walk(sourceFile);else if(entry.isFile())entries.set(prefix+rename(relative.replaceAll('\\','/')),{source:sourceFile});else throw Error('Tipo de arquivo de build não suportado.');}}
  await walk(source);
 }
 await directory(path.join(root,'node_modules/electron/dist'),'',()=>true,file=>file==='electron.exe'?'NEXO.exe':file);
 for(const folder of ['electron','dist/client','dist/local-runtime'])await directory(path.join(root,folder),'resources/app/'+folder+'/');
 entries.set('resources/app/electron/exceljs.cjs',{source:path.join(root,'node_modules/exceljs/dist/exceljs.min.js')});
 await directory(path.join(root,'node_modules/zod'),'resources/app/node_modules/zod/',relative=>!relative.split(path.sep).includes('src')&&!/\.d\.(?:ts|cts|mts)$/.test(relative));
 const version=await productVersion(root);if(!version)throw Error('A versão NEXO não foi identificada no package.json.');
 entries.set('resources/app/package.json',{bytes:Buffer.from(JSON.stringify(descriptor(version)))});
 const files=[];for(const[file,input]of entries){const size=input.bytes?input.bytes.length:(await stat(input.source)).size;files.push({file,bytes:size,sha256:input.bytes?digest(input.bytes):await fileHash(input.source)});}return files.sort(sort);
}
async function generateBuildInfo(root,builtAt=new Date().toISOString()){
 const files=await collectPayload(root),manifest={format:1,files},payloadSha256=digest(JSON.stringify(manifest));
 const info={schemaVersion:1,productVersion:await productVersion(root),builtAt,id:'NEXO-'+payloadSha256.slice(0,16),payloadSha256};
 if(!publicInfo(info,info.productVersion).available)throw Error('A identificação gerada não é válida.');
 await mkdir(path.join(root,'dist'),{recursive:true});await writeFile(path.join(root,'dist/build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');await writeFile(path.join(root,'dist/build-info.json'),JSON.stringify(info,null,2)+'\n');return {info,manifest};
}
async function loadBuildArtifacts(root){
 let info,manifest;try{info=await json(path.join(root,'dist/build-info.json'),INFO_LIMIT);manifest=await json(path.join(root,'dist/build-manifest.json'),2*1024*1024);}catch{throw Error('Identificação do build ausente ou inválida. Execute npm run build:local antes de empacotar.');}
 if(!publicInfo(info,await productVersion(root)).available||!manifest||manifest.format!==1||!Array.isArray(manifest.files)||info.payloadSha256!==digest(JSON.stringify(manifest)))throw Error('Identificação do build inválida. Execute npm run build:local novamente.');
 const current={format:1,files:await collectPayload(root)};if(JSON.stringify(current)!==JSON.stringify(manifest))throw Error('Os arquivos mudaram após o build. Execute npm run build:local novamente.');return {info,manifest};
}
async function verifyPackagedPayload(destination,manifest){
 const skip=new Set(['LEIA-ME.txt','resources/app/build-info.json','resources/app/build-manifest.json']),files=[];
 async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())await walk(file);else{const relative=path.relative(destination,file).replaceAll('\\','/');if(!skip.has(relative))files.push({file:relative,bytes:(await stat(file)).size,sha256:await fileHash(file)});}}}
 await walk(destination);if(JSON.stringify(files.sort(sort))!==JSON.stringify(manifest.files))throw Error('O conteúdo empacotado difere do manifesto do build.');
}
module.exports={readBuildInfo,productVersion,descriptor,collectPayload,generateBuildInfo,loadBuildArtifacts,verifyPackagedPayload};
