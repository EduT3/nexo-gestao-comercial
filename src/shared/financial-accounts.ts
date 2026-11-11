export const FINANCIAL_PAGE_LIMIT=50;
export type AccountFilter={status:'OPEN'|'SETTLED'|'ALL';from:string;until:string;overdue:boolean;search:string};
export type AccountPageFilter=Partial<AccountFilter>&{page?:number;pageSize?:number;today?:string};
export type PayableRow={id:string;purchase_id:string;supplier_name:string;amount_cents:bigint;due_date:string;status:'OPEN'|'PAID';payment_id:string|null};
export type ReceivableRow={id:string;description:string;customer_name:string|null;amount_cents:bigint;due_date:string;receipt_id:string|null;status:'OPEN'|'RECEIVED'};
export type AccountPage<T>={rows:T[];total:number;totalCents:bigint;page:number;pageSize:number};
export type FinanceTotals={receivedCents:bigint;reversedReceiptCents:bigint;netReceivedCents:bigint;totalIncomeCents:bigint;financialBalanceCents:bigint;revenueCents:bigint;reversedCents:bigint;netRevenueCents:bigint;paidExpenseCents:bigint};
export function normalizeAccountSearch(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();}
