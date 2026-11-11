import { authorizeLocalCatalog } from './catalog.js';
import type { LocalDatabase } from './sqlite.js';
export async function getLocalFinanceSummary(db: LocalDatabase, actor: string, company: string) {
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, true);
    const revenues = await tx.query('SELECT amount_cents FROM local_sale_revenues WHERE company_id=?', [company]);
    const reversals = await tx.query('SELECT amount_cents FROM local_sale_cancellations WHERE company_id=?', [company]);
    const payables = await tx.query(`SELECT t.id,t.purchase_id,COALESCE(supplier.name,'Sem fornecedor informado') AS supplier_name,t.amount_cents,t.due_date,p.id AS payment_id,p.method,CASE WHEN p.id IS NULL THEN 'OPEN' ELSE 'PAID' END AS status FROM local_purchase_payables t JOIN local_purchases purchase ON purchase.company_id=t.company_id AND purchase.id=t.purchase_id LEFT JOIN local_suppliers supplier ON supplier.company_id=purchase.company_id AND supplier.id=purchase.supplier_id LEFT JOIN local_payable_payments p ON p.company_id=t.company_id AND p.payable_id=t.id AND NOT EXISTS(SELECT 1 FROM local_payable_reversals r WHERE r.company_id=p.company_id AND r.payment_id=p.id) WHERE t.company_id=? ORDER BY t.due_date,t.id`, [company]);
    const activePayments = await tx.query('SELECT p.amount_cents FROM local_payable_payments p WHERE p.company_id=? AND NOT EXISTS(SELECT 1 FROM local_payable_reversals r WHERE r.company_id=p.company_id AND r.payment_id=p.id)', [company]);
    const paidExpenseCents = activePayments.reduce((total, row) => total + BigInt(String(row.amount_cents)), 0n);
    const revenueCents = revenues.reduce((total, row) => total + BigInt(String(row.amount_cents)), 0n);
    const reversedCents = reversals.reduce((total, row) => total + BigInt(String(row.amount_cents)), 0n);
    const receipts = await tx.query('SELECT amount_cents FROM local_receivable_receipts WHERE company_id=?', [company]);
    const receiptReversals = await tx.query('SELECT p.amount_cents FROM local_receivable_reversals r JOIN local_receivable_receipts p ON p.company_id=r.company_id AND p.id=r.receipt_id WHERE r.company_id=?', [company]);
    const receivedCents = receipts.reduce((total, row) => total + BigInt(String(row.amount_cents)), 0n);
    const reversedReceiptCents = receiptReversals.reduce((total, row) => total + BigInt(String(row.amount_cents)), 0n);
    const netReceivedCents = receivedCents - reversedReceiptCents;
    const totalIncomeCents = revenueCents - reversedCents + netReceivedCents;
    return { receivedCents, reversedReceiptCents, netReceivedCents, totalIncomeCents, financialBalanceCents: totalIncomeCents - paidExpenseCents, paidExpenseCents, revenueCents, reversedCents, netRevenueCents: revenueCents - reversedCents, payables };
  });
}
/** Bounded scalar summary for the UI. Legacy summary remains compatible for existing consumers. */
export async function getLocalFinanceTotals(db:LocalDatabase,actor:string,company:string){
 return db.transaction(async tx=>{
  await authorizeLocalCatalog(tx,actor,company,true);
  const sum=async(sql:string)=>BigInt(String((await tx.query(sql,[company]))[0]!.amount));
  const revenueCents=await sum('SELECT nexo_sum_cents(amount_cents) AS amount FROM local_sale_revenues WHERE company_id=?');
  const reversedCents=await sum('SELECT nexo_sum_cents(amount_cents) AS amount FROM local_sale_cancellations WHERE company_id=?');
  const receivedCents=await sum('SELECT nexo_sum_cents(amount_cents) AS amount FROM local_receivable_receipts WHERE company_id=?');
  const reversedReceiptCents=await sum('SELECT nexo_sum_cents(p.amount_cents) AS amount FROM local_receivable_reversals r JOIN local_receivable_receipts p ON p.company_id=r.company_id AND p.id=r.receipt_id WHERE r.company_id=?');
  const paidExpenseCents=await sum('SELECT nexo_sum_cents(p.amount_cents) AS amount FROM local_payable_payments p WHERE p.company_id=? AND NOT EXISTS(SELECT 1 FROM local_payable_reversals r WHERE r.company_id=p.company_id AND r.payment_id=p.id)');
  const netReceivedCents=receivedCents-reversedReceiptCents,netRevenueCents=revenueCents-reversedCents,totalIncomeCents=netRevenueCents+netReceivedCents;
  return {receivedCents,reversedReceiptCents,netReceivedCents,totalIncomeCents,financialBalanceCents:totalIncomeCents-paidExpenseCents,paidExpenseCents,revenueCents,reversedCents,netRevenueCents};
 });
}
