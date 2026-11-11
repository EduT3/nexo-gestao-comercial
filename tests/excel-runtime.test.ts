import { expect,it } from 'vitest'; import { createRequire } from 'node:module'; import { mkdtemp,rm } from 'node:fs/promises'; import { tmpdir } from 'node:os'; import path from 'node:path';
const require=createRequire(import.meta.url);const ExcelJS=require('exceljs');const excel=require('../electron/excel.cjs');
it('modelo XLSX é legível, formatado e rejeita conteúdo inseguro ou alterado',async()=>{const folder=await mkdtemp(path.join(tmpdir(),'nexo-xlsx-'));try{const file=path.join(folder,'modelo.xlsx');await excel.writeProductTemplate(file,'Adega JG',['Bebidas']);const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(file);const sheet=workbook.getWorksheet('Produtos');expect(sheet.getRow(1).values.slice(1)).toEqual(excel.HEADERS);expect(sheet.views[0]).toMatchObject({state:'frozen',ySplit:1,showGridLines:false});expect(sheet.getCell('C2').dataValidation).toMatchObject({type:'list'});expect(workbook.getWorksheet('Instruções').getCell('B1').value).toBe('Adega JG');sheet.getRow(2).values=['NOVO-1','Produto Excel','Unidade','00123',1.23,2.5,0.5,'Bebidas','Sim'];await workbook.xlsx.writeFile(file);expect(await excel.readProductRows(file)).toEqual([{line:2,internalCode:'NOVO-1',name:'Produto Excel',unit:'Unidade',barcode:'00123',cost:'1.23',price:'2.5',stockMin:'0.5',category:'Bebidas',active:'Sim'}]);const formulaBook=new ExcelJS.Workbook();await formulaBook.xlsx.readFile(file);formulaBook.getWorksheet('Produtos').getCell('F2').value={formula:'1+1',result:2};await formulaBook.xlsx.writeFile(file);await expect(excel.readProductRows(file)).rejects.toThrow('sem fórmula');const headerBook=new ExcelJS.Workbook();await headerBook.xlsx.readFile(file);headerBook.getWorksheet('Produtos').getCell('F2').value=2;headerBook.getWorksheet('Produtos').getCell('A1').value='Código mudado';await headerBook.xlsx.writeFile(file);await expect(excel.readProductRows(file)).rejects.toThrow('títulos');}finally{await rm(folder,{recursive:true,force:true});}});

for (const [name,bytes] of [
 ['texto com extensão XLSX',Buffer.from('Arquivo sintético sem formato XLSX')],
 ['ZIP interrompido',Buffer.from([0x50,0x4b,0x03,0x04,0x14,0,0,0])],
] as const) it('arquivo XLSX ilegível orienta em português: '+name,async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'nexo-xlsx-invalid-'));
 try{const file=path.join(folder,'arquivo.xlsx');await (await import('node:fs/promises')).writeFile(file,bytes);
  await expect(excel.readProductRows(file)).rejects.toThrow(/Não foi possível ler a planilha\..*XLSX válido/);
 }finally{await rm(folder,{recursive:true,force:true});}
});
