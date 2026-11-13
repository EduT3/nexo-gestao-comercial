const {copyFile}=require('node:fs/promises');
const path=require('node:path');
module.exports=async context=>{
 await copyFile(path.join(context.packager.projectDir,'node_modules/exceljs/dist/exceljs.min.js'),
  path.join(context.appOutDir,'resources','exceljs.cjs'));
};
