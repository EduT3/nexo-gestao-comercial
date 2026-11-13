import { z } from 'zod';
import type { SQLInputValue } from 'node:sqlite';
import type { LocalDatabase } from './sqlite.js';
import { authorizeLocalCatalog } from './catalog.js';
import type { SaleHistoryRow, SaleHistoryPage, SaleDetails } from '../shared/sale-history.js';
const filterSchema = z.object({ page: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER / 50 - 1).default(0), search: z.string().trim().max(120).default(''),
  from: z.iso.datetime().optional(), until: z.iso.datetime().optional(), status: z.enum(['ALL','CONFIRMED','CANCELLED']).default('ALL') }).strict()
  .refine(value => !value.from || !value.until || Date.parse(value.from) < Date.parse(value.until), 'Confira o período informado.');
const joins = 'FROM local_sales s JOIN local_sale_payments p ON p.company_id=s.company_id AND p.sale_id=s.id LEFT JOIN local_customers customer ON customer.company_id=s.company_id AND customer.id=s.customer_id LEFT JOIN local_sale_cancellations c ON c.company_id=s.company_id AND c.sale_id=s.id';
const fields = "s.id,s.created_at,customer.name AS customer_name,s.total_cents,p.method,p.change_cents,CASE WHEN c.id IS NULL THEN 'CONFIRMED' ELSE 'CANCELLED' END AS status,c.reason AS cancellation_reason";
/** Count and bounded page share one snapshot and recheck company access. No historical rows are removed. */
export async function listLocalSaleHistory(db: LocalDatabase, actor: string, company: string, input: unknown = {}): Promise<SaleHistoryPage> {
  const filter = filterSchema.parse(input);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    const clauses = ['s.company_id=?']; const params: SQLInputValue[] = [company];
    if (filter.search) { clauses.push("(instr(lower(s.id),lower(?))>0 OR instr(lower(COALESCE(customer.name,'Consumidor sem cadastro')),lower(?))>0)"); params.push(filter.search,filter.search); }
    if (filter.from) { clauses.push('s.created_at>=?'); params.push(new Date(filter.from).toISOString()); }
    if (filter.until) { clauses.push('s.created_at<?'); params.push(new Date(filter.until).toISOString()); }
    if (filter.status !== 'ALL') clauses.push(filter.status === 'CONFIRMED' ? 'c.id IS NULL' : 'c.id IS NOT NULL');
    const where = ' WHERE ' + clauses.join(' AND ');
    const directPage = !filter.search && filter.status === 'ALL';
    const salesSource = 'FROM local_sales s';
    const paid = ' AND EXISTS (SELECT 1 FROM local_sale_payments payment WHERE payment.company_id=s.company_id AND payment.sale_id=s.id)';
    const totalSource = directPage ? salesSource : joins;
    const totalWhere = directPage ? where + paid : where;
    const total = Number((await tx.query('SELECT COUNT(*) AS total ' + totalSource + totalWhere, params))[0]!.total);
    const pageSize = 50; const page = Math.min(filter.page, Math.max(0, Math.ceil(total/pageSize) - 1));
    const order = ' ORDER BY s.created_at DESC,s.id ASC';
    const pagination = order + ' LIMIT ? OFFSET ?';
    const bindings = [...params, pageSize, page * pageSize];
    const rows = directPage
      ? await tx.query('WITH page AS (SELECT s.* ' + salesSource + totalWhere + pagination + ') SELECT '
          + fields + ' ' + joins.replace(salesSource, 'FROM page s') + order, bindings)
      : await tx.query('SELECT ' + fields + ' ' + joins + where + pagination, bindings);
    return { rows: rows as SaleHistoryRow[], total, page, pageSize };
  });
}
export async function getLocalSaleDetails(db: LocalDatabase, actor: string, company: string, id: string): Promise<SaleDetails> {
  z.uuid().parse(id);
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, actor, company, false);
    const row = (await tx.query('SELECT ' + fields + ',s.subtotal_cents,s.discount_cents,s.notes,p.received_cents ' + joins + ' WHERE s.company_id=? AND s.id=?', [company,id]))[0];
    if (!row) throw new Error('Venda não encontrada nesta empresa.');
    const items = await tx.query('SELECT product_id,product_name,quantity_milli,unit_price_cents,total_cents FROM local_sale_items WHERE company_id=? AND sale_id=? ORDER BY product_name,product_id',[company,id]);
    return { ...row, items } as SaleDetails;
  });
}
