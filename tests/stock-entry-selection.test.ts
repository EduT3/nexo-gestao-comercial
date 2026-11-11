import {expect,it} from 'vitest';
import {addEntrySelection,stockQuantity,type StockEntrySelection} from '../src/client/stock-entry-selection';
import {calculatePurchase,type PurchaseLine} from '../src/client/purchase-draft';
const selection:StockEntrySelection={company:'adega-jg',productId:'new',cost:'1,01',request:1};
it('selecionar produto mantém fornecedor fora do helper e preserva quantidades/custos já digitados',()=>{
 const original:PurchaseLine[]=[{id:'filled',productId:'old',quantity:'2,500',cost:'2,30'},{id:'blank',productId:'',quantity:'1,255',cost:''}];
 const result=addEntrySelection(original,selection,'adega-jg');
 expect(result.lines).toEqual([original[0],{id:'blank',productId:'new',quantity:'1,255',cost:'1,01'}]);expect(original[1]?.productId).toBe('');expect(result.focusId).toBe('blank');
 const monetary=calculatePurchase(result.lines);expect(monetary.valid).toBe(true);expect(monetary.total).toBe(702n);
});
it('preserva custo preenchido manualmente e não duplica produto já presente',()=>{
 const lines:PurchaseLine[]=[{id:'a',productId:'',quantity:'2',cost:'3,45'}];
 const first=addEntrySelection(lines,selection,'adega-jg');expect(first.lines[0]?.cost).toBe('3,45');
 const next=addEntrySelection(first.lines,selection,'adega-jg');expect(next.lines).toEqual(first.lines);expect(next.focusId).toBe('a');expect(next.message).toContain('já está');
});
it('acrescenta produto sem descartar rascunho e respeita limite de100itens',()=>{
 const lines:PurchaseLine[]=[{id:'a',productId:'old',quantity:'3',cost:'2,00'}];
 expect(addEntrySelection(lines,selection,'adega-jg',()=> 'b').lines).toEqual([...lines,{id:'b',productId:'new',quantity:'1',cost:'1,01'}]);
 const full=Array.from({length:100},(_,i)=>({id:String(i),productId:String(i),quantity:'1',cost:'0,01'}));const result=addEntrySelection(full,selection,'adega-jg');expect(result.lines).toEqual(full);expect(result.focusId).toBeNull();expect(result.message).toContain('100');
});
it('não aplica seleção de produto em outra empresa',()=>{
 const lines:PurchaseLine[]=[{id:'a',productId:'',quantity:'1',cost:''}];expect(addEntrySelection(lines,selection,'deposito-jg')).toEqual({lines,focusId:null,message:''});
});
it('saldo legível preserva BigInt exato e diferencia desconhecido de zero',()=>{
 expect(stockQuantity(undefined,'UNIT')).toBe('Não consultado');expect(stockQuantity(0n,'UNIT')).toBe('0 un.');expect(stockQuantity(1255n,'KG')).toBe('1,255 kg');expect(stockQuantity(1500n,'KG')).toBe('1,5 kg');expect(stockQuantity(9007199254740993000n,'UNIT')).toBe('9007199254740993 un.');
});
