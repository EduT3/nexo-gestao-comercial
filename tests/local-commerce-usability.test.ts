import {expect,it} from 'vitest';
import {calculatePurchase} from '../src/client/purchase-draft';
import {defaultAccountFilter,filterAccounts} from '../src/client/account-filter';
import {errorMessage,money,shortDate} from '../src/client/local-format';
it('conferência da compra calcula por item com arredondamento comercial e sem perda de precisão',()=>{
 const result=calculatePurchase([{id:'a',productId:'a',quantity:'1,255',cost:'1,01'},{id:'b',productId:'b',quantity:'0.500',cost:'3,33'}]);
 expect(result.total).toBe(294n);expect(result.rows.map(row=>row.subtotal)).toEqual([127n,167n]);expect(result.valid).toBe(true);
 expect(result.rows[0]!.item).toEqual({productId:'a',quantity:'1.255',unitCostCents:101});
 const big=calculatePurchase([{id:'big',productId:'big',quantity:'1000000.001',cost:'99999999,99'}]);expect(big.total).toBe(10000000009000000n);
 expect(money(big.total!)).toBe('R$ 100000000090000,00');
});
it.each(['0','-1','1.0001','1e3','01','999999999999'])('quantidade %s inválida não produz total confirmado',quantity=>{
 const result=calculatePurchase([{id:'1',productId:'a',quantity,cost:'1,00'}]);expect(result.valid).toBe(false);expect(result.total).toBeNull();
});
it('conferência não soma total parcial como final, bloqueia duplicados e aceita custo zero',()=>{
 const line={id:'a',productId:'produto',quantity:'2',cost:'1,00'};
 expect(calculatePurchase([line,{...line,id:'b'}])).toMatchObject({valid:false,total:null});
 expect(calculatePurchase([line,{...line,id:'b',productId:'outro',cost:'abc'}])).toMatchObject({valid:false,total:null});
 expect(calculatePurchase([{...line,cost:'0,00'}])).toMatchObject({valid:true,total:0n});
 expect(calculatePurchase([]).valid).toBe(false);
});
it('contas filtram situação, período inclusivo e vencimento estrito ao dia local, sem confundir baixadas',()=>{
 const rows=[{id:'a',status:'OPEN',due_date:'2026-10-17',amount_cents:10n,name:'Fornecedor São João'},{id:'b',status:'OPEN',due_date:'2026-10-18',amount_cents:20n,name:'Hoje'},{id:'c',status:'PAID',due_date:'2026-10-17',amount_cents:30n,name:'Pago'},{id:'d',status:'OPEN',due_date:'2026-10-19',amount_cents:40n,name:'Amanhã'}];
 const base=defaultAccountFilter(),text=(row:typeof rows[number])=>row.name;
 expect(filterAccounts(rows,base,'2026-10-18',text).map(row=>row.id)).toEqual(['a','b','d']);
 expect(filterAccounts(rows,{...base,overdue:true},'2026-10-18',text).map(row=>row.id)).toEqual(['a']);
 expect(filterAccounts(rows,{...base,status:'ALL',from:'2026-10-17',until:'2026-10-18'},'2026-10-18',text).map(row=>row.id)).toEqual(['a','b','c']);
 expect(filterAccounts(rows,{...base,status:'SETTLED'},'2026-10-18',text).map(row=>row.id)).toEqual(['c']);
 expect(filterAccounts(rows,{...base,search:'sao joao'},'2026-10-18',text).map(row=>row.id)).toEqual(['a']);
 expect(filterAccounts(rows,{...base,from:'2026-10-19',until:'2026-10-18'},'2026-10-18',text)).toEqual([]);
 expect(shortDate('2026-03-01')).toBe('01/03/2026');expect(money(-105n)).toBe('-R$ 1,05');
});
it('mensagens da ponte não mostram prefixos internos nem erros SQL na interface',()=>{
 expect(errorMessage(new Error("Error invoking remote method 'nexo:sale': Error: Saldo de caixa insuficiente."))).toBe('Saldo de caixa insuficiente.');
 expect(errorMessage('Error: [{"message":"O produto está repetido na compra."}]')).toBe('O produto está repetido na compra.');
 expect(errorMessage('Error: [{"message":"Invalid input: expected number"}]')).toContain('Confira os campos');
 expect(errorMessage(new Error("Error invoking remote method 'nexo:create-product': Error: NEXO_GUARD_REQUIRED:request-id"))).toBe('Não foi possível abrir a autorização. Tente a operação novamente.');
 expect(errorMessage(new Error("Error invoking remote method 'nexo:create-product': Error: No handler registered for 'nexo:create-product'"))).toBe('Não foi possível enviar a solicitação ao NEXO. Tente novamente.');
 expect(errorMessage(new Error('SQLITE_CONSTRAINT: constraint failed'))).not.toContain('SQLITE');
});
