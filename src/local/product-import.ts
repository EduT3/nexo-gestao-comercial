import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { productSchema } from '../server/modules/commerce/schemas.js';
import { quantityToMilli } from '../shared/scaled.js';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
const rowSchema=z.object({ line:z.number().int().min(2).max(1002),name:z.string(),internalCode:z.string(),barcode:z.string(),unit:z.string(),cost:z.string(),price:z.string(),stockMin:z.string(),category:z.string(),active:z.string() }).strict();
const rowsSchema=z.array(rowSchema).max(1000);
const units:Record<string,string>={ UNIDADE:'UNIT',UNIT:'UNIT',CAIXA:'BOX',BOX:'BOX',QUILO:'KG',KG:'KG',LITRO:'LITER',LITER:'LITER',PACOTE:'PACKAGE',PACKAGE:'PACKAGE',SACO:'BAG',BAG:'BAG',METRO:'METER',METER:'METER' };
function cents(text:string){ const value=text.trim().replace(',','.'); if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))throw new Error('Use valor positivo com até duas casas decimais.'); const [whole='0',fraction='']=value.split('.'); return Number(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'))); }
function active(text:string){ const value=text.trim().toLocaleUpperCase('pt-BR'); if(['SIM','TRUE','1','ATIVO'].includes(value))return true; if(['NÃO','NAO','FALSE','0','INATIVO'].includes(value))return false; throw new Error('Use Sim ou Não na coluna Ativo.'); }
async function analyze(tx:LocalDatabase,actor:string,company:string,input:unknown){
 await authorizeLocalCatalog(tx,actor,company,true); const rows=rowsSchema.parse(input);
 const categories=await tx.query('SELECT id,name FROM local_categories WHERE company_id=? AND active=1',[company]);
 const categoryMap=new Map(categories.map(row=>[String(row.name).trim().toLocaleUpperCase('pt-BR'),String(row.id)]));
 const existing=await tx.query('SELECT internal_code,barcode FROM local_products WHERE company_id=?',[company]);
 const existingCodes=new Set(existing.map(row=>String(row.internal_code).toLocaleUpperCase('pt-BR'))), existingBarcodes=new Set(existing.filter(row=>row.barcode!==null).map(row=>String(row.barcode)));
 const codeCount=new Map<string,number>(), barcodeCount=new Map<string,number>();
 for(const raw of rows){ const code=raw.internalCode.trim().toLocaleUpperCase('pt-BR'),barcode=raw.barcode.trim(); codeCount.set(code,(codeCount.get(code)??0)+1); if(barcode)barcodeCount.set(barcode,(barcodeCount.get(barcode)??0)+1); }
 const result=[];
 for(const raw of rows){
  try { const unit=units[raw.unit.trim().toLocaleUpperCase('pt-BR')]; if(!unit)throw new Error('Unidade inválida. Use Unidade, Caixa, Quilo, Litro, Pacote, Saco ou Metro.');
   const categoryName=raw.category.trim(),categoryId=categoryName?categoryMap.get(categoryName.toLocaleUpperCase('pt-BR')):null; if(categoryName&&!categoryId)throw new Error('Categoria não encontrada ou inativa nesta empresa.');
   const body=productSchema.parse({ name:raw.name,internalCode:raw.internalCode,barcode:raw.barcode||null,unit,costCents:cents(raw.cost),priceCents:cents(raw.price),stockMin:raw.stockMin.trim().replace(',','.')||'0',categoryId,supplierId:null,active:active(raw.active||'Sim') });
   if((codeCount.get(body.internalCode)??0)>1||(body.barcode&&(barcodeCount.get(body.barcode)??0)>1))throw new Error('Código interno ou código de barras repetido na planilha.');
   const duplicate=existingCodes.has(body.internalCode)||(body.barcode?existingBarcodes.has(body.barcode):false);
   result.push({ line:raw.line,status:duplicate?'DUPLICATE':'READY',message:duplicate?'Já cadastrado nesta empresa; será ignorado.':'Pronto para importar.',product:body });
  }catch(error){ result.push({ line:raw.line,status:'ERROR',message:error instanceof Error?error.message:'Linha inválida.',product:null }); }
 }
 return result;
}
export async function previewLocalProductImport(db:LocalDatabase,actor:string,company:string,input:unknown){ return db.transaction(async tx=>{ const rows=await analyze(tx,actor,company,input); return { rows,ready:rows.filter(r=>r.status==='READY').length,duplicates:rows.filter(r=>r.status==='DUPLICATE').length,errors:rows.filter(r=>r.status==='ERROR').length }; }); }
export async function commitLocalProductImport(db:LocalDatabase,actor:string,company:string,input:unknown,expected:unknown){ return db.transaction(async tx=>{
 const rows=await analyze(tx,actor,company,input); if(JSON.stringify(rows)!==JSON.stringify(expected))throw new Error('A prévia ficou desatualizada. Selecione a planilha novamente.');
 if(rows.some(row=>row.status==='ERROR'))throw new Error('Corrija as linhas inválidas antes de importar.'); let imported=0,skipped=0;
 for(const row of rows){ if(row.status==='DUPLICATE'){skipped++;continue;} const body=row.product!; const id=randomUUID(); await tx.query('INSERT INTO local_products VALUES(?,?,?,?,?,?,?,?,?,?)',[id,company,body.name,body.internalCode,body.barcode??null,body.unit,body.costCents,body.priceCents,quantityToMilli(body.stockMin),body.active?1:0]); if(body.categoryId)await tx.query('INSERT INTO local_product_categories VALUES(?,?,?)',[company,id,body.categoryId]); await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',[randomUUID(),company,actor,'product.imported',id,JSON.stringify({ ...body,line:row.line })]); imported++; }
 return { imported,skipped };
 }); }

export async function getLocalProductImportTemplateData(db:LocalDatabase,actor:string,company:string){ return db.transaction(async tx=>{ await authorizeLocalCatalog(tx,actor,company,true); const selected=(await tx.query('SELECT name FROM local_companies WHERE id=?',[company]))[0]; if(!selected)throw new Error('Empresa não encontrada.'); const categories=await tx.query('SELECT name FROM local_categories WHERE company_id=? AND active=1 ORDER BY name',[company]); return { company:String(selected.name),categories:categories.map(row=>String(row.name)) }; }); }
