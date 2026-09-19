import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import { createDatabase } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';

it('concilia compra, venda, cancelamento, financeiro e fechamento nas duas empresas',async()=>{
  const db=await createDatabase({dataDir:'memory://'});
  const origin='http://127.0.0.1:5173',password='Integrated-cycle-test-password!';
  let app:Awaited<ReturnType<typeof buildApp>>|undefined;
  try{
    await migrate(db);const seed=await seedDevelopment(db,{password});
    app=await buildApp({db,origin,demo:true,logger:false});
    const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin},payload:{email:'admin@jg.local',password}});
    expect(login.statusCode).toBe(200);
    const headers={origin,cookie:String(login.headers['set-cookie']).split(';')[0]!,'x-csrf-token':login.json().csrfToken};
    const read=async(path:string)=>{const response=await app!.inject({url:`/api${path}`,headers});expect(response.statusCode,response.body).toBe(200);return response.json();};
    const post=async(path:string,payload:Record<string,unknown>,key=randomUUID())=>{const response=await app!.inject({method:'POST',url:`/api${path}`,headers:{...headers,'idempotency-key':key},payload});expect(response.statusCode,response.body).toBeGreaterThanOrEqual(200);expect(response.statusCode,response.body).toBeLessThan(300);return response.json();};
    const completed:Array<{company:string;product:string;sale:string}>=[];
    for(const company of seed.companyIds){
      const root=`/companies/${company}`;
      const product=(await read(`${root}/products?active=true`)).products[0];
      const supplier=(await read(`${root}/suppliers?active=true`)).suppliers[0];
      const purchase=await post(`${root}/purchases/receive`,{supplierId:supplier.id,items:[{productId:product.id,quantity:'5.000',unitCostCents:100}],notes:'Ciclo integrado',payable:{dueDate:'2026-11-01',notes:''}});
      await post(`${root}/finance/payables/${purchase.purchase.payable.id}/pay`,{paymentMethod:'PIX',notes:''});
      await post(`${root}/cash/open`,{openingCents:1000,notes:'Ciclo integrado'});
      const sale=await post(`${root}/sales`,{customerId:null,items:[{productId:product.id,quantity:'2.000'}],discountCents:0,paymentMethod:'CASH',notes:'Venda válida'});
      const cancelled=await post(`${root}/sales`,{customerId:null,items:[{productId:product.id,quantity:'1.000'}],discountCents:0,paymentMethod:'PIX',notes:'Venda a cancelar'});
      await post(`${root}/sales/${cancelled.sale.id}/cancel`,{reason:'Duplicidade corrigida no ciclo'});
      for(const [kind,amountCents] of [['EXPENSE',100],['REVENUE',50]] as const){await post(`${root}/finance/entries`,{kind,description:`Manual ${kind}`,category:'Operação',amountCents,paymentMethod:'CASH'});}
      const receivable=await post(`${root}/finance/receivables`,{description:'Serviço realizado',category:'Serviços',amountCents:200,dueDate:'2026-11-01'});
      await post(`${root}/finance/receivables/${receivable.receivableId}/receive`,{paymentMethod:'CASH',notes:''});
      const finance=await read(`${root}/finance`);
      expect(finance.totals).toEqual({payableOpenCents:0,receivableOpenCents:0,revenueRealizedCents:sale.sale.totalCents+250,expenseRealizedCents:600});
      const inventory=await read(`${root}/inventory`);
      expect(inventory.inventory.find((item:{productId:string})=>item.productId===product.id).quantity).toBe('3.000');
      const cash=(await read(`${root}/cash/current`)).cashRegister;
      const expected=1000+sale.sale.totalCents+150;
      expect(cash.expectedCashCents).toBe(expected);
      const closed=await post(`${root}/cash/close`,{countedCents:expected,notes:'Conciliação exata'});
      expect(closed.differenceCents).toBe(0);
      expect((await read(`${root}/cash/current`)).cashRegister).toBeNull();
      completed.push({company,product:product.id,sale:sale.sale.id});
      for(const other of completed.filter(item=>item.company!==company)){
        expect((await read(`${root}/sales`)).sales.some((item:{id:string})=>item.id===other.sale)).toBe(false);
        expect(inventory.inventory.some((item:{productId:string})=>item.productId===other.product)).toBe(false);
      }
    }
    expect(completed).toHaveLength(2);
  }finally{await app?.close();await db.close();}
});
