import { itemTotalCents,quantityToMilli } from '../shared/scaled';
import { cents } from './local-format';
export type PurchaseLine = { id:string; productId:string; quantity:string; cost:string };
export function calculatePurchase(lines: readonly PurchaseLine[]) {
 const seen=new Set<string>();let total=0n;
 const rows=lines.map((line,index)=>{
  try {
   if(!line.productId)throw new Error('Selecione o produto.');
   if(seen.has(line.productId))throw new Error('O produto está repetido na compra.');seen.add(line.productId);
   const quantity=line.quantity.replace(',','.').trim();
   if(!/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/.test(quantity))throw new Error('Informe uma quantidade positiva com até três casas decimais.');
   const milli=quantityToMilli(quantity);if(milli===0n)throw new Error('A quantidade deve ser maior que zero.');
   const cost=cents(line.cost);const subtotal=itemTotalCents(milli,cost);total+=subtotal;
   if(total>9223372036854775807n)throw new Error('Total acima do limite permitido.');
   return { subtotal, item:{productId:line.productId,quantity,unitCostCents:Number(cost)}, error:'' };
  }catch(error){return {subtotal:null,item:null,error:'Item '+(index+1)+': '+(error as Error).message};}
 });
 return {rows,total:rows.some(row=>row.error)?null:total,valid:lines.length>0&&lines.length<=100&&rows.every(row=>!row.error)};
}
