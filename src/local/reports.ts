import { z } from 'zod';
import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
const periodSchema = z.object({ from: z.iso.datetime({ offset: true }), to: z.iso.datetime({ offset: true }) }).strict().refine(value => Date.parse(value.from) < Date.parse(value.to), 'O início do período deve ser anterior ao fim.');
function total(rows: Record<string, unknown>[], field: string) { return rows.reduce((sum,row) => sum + BigInt(String(row[field])), 0n); }
/** Both bounds round up on the stored millisecond grid to preserve [from, to). */
function reportBoundary(value: string) {
 const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1] ?? '';
 const extraMillisecond = /[1-9]/.test(fraction.slice(3)) ? 1 : 0;
 return new Date(Date.parse(value) + extraMillisecond).toISOString();
}
export async function getLocalDailyReport(db: LocalDatabase, actor: string, company: string, input: unknown) {
 const period = periodSchema.parse(input);
 return db.transaction(async tx => {
  await authorizeLocalCatalog(tx, actor, company, true); const range = [company,reportBoundary(period.from),reportBoundary(period.to)];
  const sales = await tx.query(`SELECT s.id,s.total_cents,p.method FROM local_sales s JOIN local_sale_payments p ON p.company_id=s.company_id AND p.sale_id=s.id WHERE s.company_id=? AND s.created_at>=? AND s.created_at<? ORDER BY s.created_at,s.id`,range);
  const cancellations = await tx.query('SELECT amount_cents FROM local_sale_cancellations WHERE company_id=? AND created_at>=? AND created_at<?',range);
  const receipts = await tx.query('SELECT amount_cents FROM local_receivable_receipts WHERE company_id=? AND created_at>=? AND created_at<?',range);
  const receiptReversals = await tx.query('SELECT p.amount_cents FROM local_receivable_reversals r JOIN local_receivable_receipts p ON p.company_id=r.company_id AND p.id=r.receipt_id WHERE r.company_id=? AND r.created_at>=? AND r.created_at<?',range);
  const payments = await tx.query('SELECT amount_cents FROM local_payable_payments WHERE company_id=? AND created_at>=? AND created_at<?',range);
  const paymentReversals = await tx.query('SELECT p.amount_cents FROM local_payable_reversals r JOIN local_payable_payments p ON p.company_id=r.company_id AND p.id=r.payment_id WHERE r.company_id=? AND r.created_at>=? AND r.created_at<?',range);
  const items = await tx.query(`SELECT i.product_id,i.product_name,i.quantity_milli FROM local_sale_items i JOIN local_sales s ON s.company_id=i.company_id AND s.id=i.sale_id WHERE s.company_id=? AND s.created_at>=? AND s.created_at<?`,range);
  const byPayment = ['CASH','PIX','DEBIT','CREDIT'].map(method => ({ method, amountCents: total(sales.filter(row => row.method === method),'total_cents') }));
  const products = new Map<string,{ productId:string;name:string;quantityMilli:bigint }>();
  for (const row of items) { const id=String(row.product_id), current=products.get(id); products.set(id,{ productId:id,name:String(row.product_name),quantityMilli:(current?.quantityMilli??0n)+BigInt(String(row.quantity_milli)) }); }
  const grossSalesCents=total(sales,'total_cents'), cancelledSalesCents=total(cancellations,'amount_cents');
  const receivedCents=total(receipts,'amount_cents')-total(receiptReversals,'amount_cents'), paidCents=total(payments,'amount_cents')-total(paymentReversals,'amount_cents');
  return { period,saleCount:sales.length,grossSalesCents,cancelledSalesCents,netSalesCents:grossSalesCents-cancelledSalesCents,receivedCents,paidCents,financialBalanceCents:grossSalesCents-cancelledSalesCents+receivedCents-paidCents,byPayment,products:[...products.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')) };
 });
}
