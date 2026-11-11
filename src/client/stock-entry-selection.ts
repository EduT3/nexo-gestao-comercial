import type {PurchaseLine} from './purchase-draft';
export const stockUnitLabels:Readonly<Record<string,string>>={UNIT:'un.',BOX:'cx.',KG:'kg',LITER:'L',PACKAGE:'pac.',BAG:'saco(s)',METER:'m'};
export type StockEntrySelection={company:string;productId:string;cost:string;request:number};
export function addEntrySelection(lines:readonly PurchaseLine[],selection:StockEntrySelection,company:string,createId:()=>string=()=>crypto.randomUUID()){
 if(selection.company!==company)return {lines:[...lines],focusId:null,message:''};
 const existing=lines.find(line=>line.productId===selection.productId);
 if(existing)return {lines:[...lines],focusId:existing.id,message:'Este produto já está na entrada. Confira a quantidade.'};
 const blank=lines.find(line=>!line.productId);
 if(blank)return {lines:lines.map(line=>line.id===blank.id?{...line,productId:selection.productId,cost:line.cost.trim()?line.cost:selection.cost}:line),focusId:blank.id,message:'Produto selecionado. Informe a quantidade que chegou.'};
 if(lines.length>=100)return {lines:[...lines],focusId:null,message:'Esta entrada já tem 100 itens. Conclua ou remova um item antes de adicionar outro.'};
 const id=createId();return {lines:[...lines,{id,productId:selection.productId,quantity:'1',cost:selection.cost}],focusId:id,message:'Produto adicionado à entrada em andamento.'};
}
export function stockQuantity(value:bigint|undefined,unit:string){
 if(value===undefined)return 'Não consultado';
 const absolute=value<0n?-value:value;
 const fraction=(absolute%1000n).toString().padStart(3,'0').replace(/0+$/,'');
 const amount=`${value<0n?'-':''}${absolute/1000n}${fraction?','+fraction:''}`;
 return amount+' '+(stockUnitLabels[unit]??unit);
}
