import type {Status} from '../LocalApp';
import type {FinanceSummary} from '../LocalFinance';
import type {SaleDetails,SaleHistoryRow,SaleHistoryFilter} from '../../shared/sale-history';
import type {CashSession} from '../LocalCash';
import type {ReceivableRow} from '../LocalReceivables';
import type {DailyReport} from '../LocalDailyReport';
import {localToday} from '../local-format';
export const PREVIEW_READ_ONLY='Esta é uma demonstração com dados fictícios. Esta operação não foi realizada. Use o aplicativo Windows para gravar ou recuperar dados.';
type Bridge=NonNullable<Window['nexoLocal']>;
const companies=[{id:'adega-jg',name:'Adega JG',role:'ADMIN' as const},{id:'deposito-jg',name:'Depósito JG',role:'ADMIN' as const}];
const today=localToday();
function dayOffset(days:number){const date=new Date(today+'T12:00:00');date.setDate(date.getDate()+days);return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
const exampleTime=(index:number)=>new Date(today+'T08:00:00').getTime()+index*60000;
function example(company:string){
 if(!companies.some(row=>row.id===company))throw new Error('Empresa indisponível nesta demonstração.');
 const adega=company==='adega-jg',prefix=adega?'ADEGA':'DEPOSITO';
 const products=adega?[
  {id:'demo-agua',name:'Água mineral 500 ml',internal_code:'AGUA-500',unit:'UNIT',cost_cents:200n,price_cents:500n,active:1n,category_id:'demo-category'},
  {id:'demo-cerveja',name:'Cerveja lata 350 ml',internal_code:'CERV-350',unit:'UNIT',cost_cents:450n,price_cents:800n,active:1n,category_id:'demo-category'},
  {id:'demo-gelo',name:'Gelo em cubos',internal_code:'GELO-KG',unit:'KG',cost_cents:1000n,price_cents:1800n,active:1n,category_id:null},
 ]:[
  {id:'demo-cimento',name:'Cimento 50 kg',internal_code:'CIM-50',unit:'BAG',cost_cents:2400n,price_cents:3500n,active:1n,category_id:'demo-category'},
  {id:'demo-areia',name:'Areia ensacada',internal_code:'AREIA-20',unit:'BAG',cost_cents:900n,price_cents:1500n,active:1n,category_id:'demo-category'},
 ];
 const count=adega?53:3,price=products[0]!.price_cents;
 const sales:SaleHistoryRow[]=Array.from({length:count},(_,index)=>({id:'DEMO-'+prefix+'-'+String(count-index).padStart(3,'0'),created_at:new Date(exampleTime(count-index)).toISOString(),customer_name:index%3===0?'Cliente da demonstração':null,total_cents:price,method:index%2===0?'CASH':'PIX',change_cents:index%2===0?price:0n,status:index===count-1?'CANCELLED':'CONFIRMED',cancellation_reason:index===count-1?'Exemplo fictício de cancelamento':null}));
 const payables:FinanceSummary['payables']=[
  {id:'DEMO-CONTA-'+prefix+'-1',purchase_id:'DEMO-COMPRA-'+prefix+'-1',supplier_name:adega?'Distribuidora de bebidas (exemplo)':'Materiais de construção (exemplo)',amount_cents:4500n,due_date:dayOffset(-1),status:'OPEN',payment_id:null},
  {id:'DEMO-CONTA-'+prefix+'-2',purchase_id:'DEMO-COMPRA-'+prefix+'-2',supplier_name:'Fornecedor da demonstração',amount_cents:3200n,due_date:today,status:'PAID',payment_id:'DEMO-PAGAMENTO-'+prefix+'-2'},
  {id:'DEMO-CONTA-'+prefix+'-3',purchase_id:'DEMO-COMPRA-'+prefix+'-3',supplier_name:'Fornecedor da demonstração',amount_cents:2000n,due_date:dayOffset(7),status:'OPEN',payment_id:null},
 ];
 const receivables:ReceivableRow[]=[
  {id:'DEMO-RECEBER-'+prefix+'-1',description:'Pedido de demonstração',customer_name:'Cliente da demonstração',amount_cents:2500n,due_date:dayOffset(-2),receipt_id:null,status:'OPEN'},
  {id:'DEMO-RECEBER-'+prefix+'-2',description:'Conta recebida (exemplo)',customer_name:null,amount_cents:1500n,due_date:today,receipt_id:'DEMO-RECEBIMENTO-'+prefix+'-2',status:'RECEIVED'},
  {id:'DEMO-RECEBER-'+prefix+'-3',description:'Entrega agendada (exemplo)',customer_name:'Cliente da demonstração',amount_cents:3500n,due_date:dayOffset(5),receipt_id:null,status:'OPEN'},
 ];
 const revenueCents=BigInt(count)*price,reversedCents=price,netRevenueCents=revenueCents-reversedCents;
 const finance:FinanceSummary={payables,revenueCents,reversedCents,netRevenueCents,receivedCents:1500n,reversedReceiptCents:0n,netReceivedCents:1500n,totalIncomeCents:netRevenueCents+1500n,paidExpenseCents:3200n,financialBalanceCents:netRevenueCents+1500n-3200n};
 const cashMovements=sales.filter(row=>row.method==='CASH').map(row=>({id:row.id,reason:'SALE',amount_cents:row.total_cents}));
 if(sales.at(-1)!.method==='CASH')cashMovements.push({id:'DEMO-ESTORNO-'+prefix,reason:'REVERSAL',amount_cents:-price});
 const cashBalance=10000n+cashMovements.reduce((sum,row)=>sum+row.amount_cents,0n);
 const cash:CashSession[]=[{id:'DEMO-CAIXA-'+prefix,actor_name:'Operador da demonstração',can_operate:true,closed:adega?0n:1n,balance_cents:cashBalance,movements:cashMovements,closure:adega?null:{expected_cents:cashBalance,counted_cents:cashBalance}}];
 return {adega,products,sales,finance,receivables,cash,cashBalance};
}
const copy=<T,>(value:T):T=>structuredClone(value);
const blocked=async():Promise<never>=>{throw new Error(PREVIEW_READ_ONLY);};
/** Fictitious read-only bridge. No database, HTTP requests or business persistence. */
export function createLocalPreviewBridge():Bridge {
 return Object.freeze({
  async status():Promise<Status>{return {configured:true,authenticated:true,needsPassword:false,userId:'preview-visitor',owner:'Visitante da demonstração',users:[],dataFolder:'Demonstração web: nenhuma base do computador é acessada.',companies:copy(companies)};},
  async products(company){return copy(example(company).products);},
  async people(company,kind){example(company);return [{id:'DEMO-'+kind+'-'+company,name:kind==='customer'?'Cliente da demonstração':'Fornecedor da demonstração',active:true}];},
  async categories(company){example(company);return [{id:'demo-category',name:company==='adega-jg'?'Bebidas (exemplo)':'Construção (exemplo)',description:'Categoria fictícia',active:1n}];},
  async stock(company){return example(company).products.map((row,index)=>({id:row.id,name:row.name,unit:row.unit,balance_milli:index===1?0n:24000n}));},
  async stockHistory(company,input){const data=example(company),filter=input as {productId?:string|null;offset?:number};const rows=data.products.filter(row=>!filter.productId||filter.productId===row.id).map(row=>({id:'DEMO-MOV-'+row.id,name:row.name,internal_code:row.internal_code,quantity_milli:24000n,reason:'PURCHASE',operation_id:'DEMO-COMPRA-'+company,created_at:new Date(exampleTime(0)).toISOString(),actor_name:'Operador da demonstração'}));return {rows:filter.offset?[]:rows,hasMore:false};},
  async purchases(company){const {finance}=example(company);return finance.payables.map(row=>({id:row.purchase_id,supplier_name:row.supplier_name,total_cents:row.amount_cents,due_date:row.due_date}));},
  async cash(company){return copy(example(company).cash);},
  async cashAvailability(company){const data=example(company);return data.adega?{open:true,canSell:true,operatorName:'Operador da demonstração',openedAt:new Date(exampleTime(0)).toISOString(),balanceCents:data.cashBalance}:{open:false};},
  async sales(company){return copy(example(company).sales);},
  async salesHistory(company,input:SaleHistoryFilter){let rows=example(company).sales;const query=(input.search||'').trim().toLocaleLowerCase('pt-BR');if(query)rows=rows.filter(row=>(row.id+' '+(row.customer_name||'Consumidor sem cadastro')).toLocaleLowerCase('pt-BR').includes(query));if(input.from)rows=rows.filter(row=>row.created_at>=input.from!);if(input.until)rows=rows.filter(row=>row.created_at<input.until!);if(input.status&&input.status!=='ALL')rows=rows.filter(row=>row.status===input.status);const pageSize=50,page=Math.max(0,Math.min(Number.isInteger(input.page)?input.page!:0,Math.max(0,Math.ceil(rows.length/pageSize)-1)));return {rows:copy(rows.slice(page*pageSize,(page+1)*pageSize)),total:rows.length,page,pageSize};},
  async saleDetails(company,id):Promise<SaleDetails>{const data=example(company),sale=data.sales.find(row=>row.id===id);if(!sale)throw new Error('Venda não encontrada nesta empresa da demonstração.');return copy({...sale,subtotal_cents:sale.total_cents,discount_cents:0n,received_cents:sale.total_cents+sale.change_cents,notes:'Venda fictícia para conhecer o histórico do NEXO.',items:[{product_id:data.products[0]!.id,product_name:data.products[0]!.name,quantity_milli:1000n,unit_price_cents:sale.total_cents,total_cents:sale.total_cents}]});},
  async finance(company){return copy(example(company).finance);},
  async receivables(company){return copy(example(company).receivables);},
  async dailyReport(company,input):Promise<DailyReport>{const data=example(company),period=input as {from:string;to:string};const rows=data.sales.filter(row=>row.created_at>=period.from&&row.created_at<period.to),grossSalesCents=rows.reduce((sum,row)=>sum+row.total_cents,0n),cancelledSalesCents=rows.filter(row=>row.status==='CANCELLED').reduce((sum,row)=>sum+row.total_cents,0n);const includesToday=period.from<new Date(exampleTime(1)).toISOString()&&period.to>new Date(exampleTime(1)).toISOString();return {period,saleCount:rows.length,grossSalesCents,cancelledSalesCents,netSalesCents:grossSalesCents-cancelledSalesCents,receivedCents:includesToday?1500n:0n,paidCents:includesToday?3200n:0n,financialBalanceCents:grossSalesCents-cancelledSalesCents+(includesToday?-1700n:0n),byPayment:(['CASH','PIX'] as const).map(method=>({method,amountCents:rows.filter(row=>row.method===method).reduce((sum,row)=>sum+row.total_cents,0n)})),products:rows.length?[{productId:data.products[0]!.id,name:data.products[0]!.name,quantityMilli:BigInt(rows.length)*1000n}]:[]};},
  configure:blocked,setupPassword:blocked,login:blocked,logout:blocked,createOperator:blocked,
  createProduct:blocked,updateProduct:blocked,createPerson:blocked,createCategory:blocked,
  receivePurchase:blocked,confirmSale:blocked,cancelSale:blocked,openCash:blocked,moveCash:blocked,closeCash:blocked,
  createReceivable:blocked,receiveReceivable:blocked,reverseReceivable:blocked,payPayable:blocked,reversePayable:blocked,
  backup:blocked,restore:blocked,checkDataHealth:blocked,exportExcel:blocked,
  productImportTemplate:blocked,productImportPreview:blocked,productImportConfirm:blocked,
  tutorialPreference:blocked,saveTutorialPreference:blocked,
 });
}
