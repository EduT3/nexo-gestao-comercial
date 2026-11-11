import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{generateBuildInfo}=require('../electron/build-info.cjs');
const {info,manifest}=await generateBuildInfo(path.resolve('.'));
console.log(`Build NEXO ${info.productVersion}: ${info.id} · ${info.builtAt} · ${manifest.files.length} arquivos`);
