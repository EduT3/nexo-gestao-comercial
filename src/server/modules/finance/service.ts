import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { AccountPayable, AccountReceivable, FinanceOverview, FinancialEntry } from '../../../shared/contracts.js';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import type { financeListSchema, settlePayableSchema } from './schemas.js';

type ListQuery = z.infer<typeof financeListSchema>;
type SettleInput = z.infer<typeof settlePayableSchema>;
type DateValue = Date | string;
type ReceivableRow = Omit<AccountReceivable,'amountCents'|'dueDate'|'receivedAt'|'createdAt'> & { amountCents: string|number; dueDate: DateValue; receivedAt: DateValue|null; createdAt: DateValue };
type PayableRow = Omit<AccountPayable, 'amountCents' | 'dueDate' | 'paidAt' | 'createdAt'> & {
  amountCents: string | number; dueDate: DateValue; paidAt: DateValue | null; createdAt: DateValue;
};
type EntryRow = Omit<FinancialEntry, 'amountCents' | 'realizedAt' | 'createdAt'> & {
  amountCents: string | number; realizedAt: DateValue | null; createdAt: DateValue;
};

const payableSelect = `SELECT a.id,a.company_id AS "companyId",a.purchase_id AS "purchaseId",s.name AS "supplierName",
  a.description,a.category,a.amount_cents AS "amountCents",a.due_date AS "dueDate",a.status,a.paid_at AS "paidAt",
  a.payment_method AS "paymentMethod",a.paid_by AS "paidBy",u.name AS "paidByName",a.notes,a.payment_notes AS "paymentNotes",a.created_at AS "createdAt"
  FROM accounts_payable a
  JOIN purchases p ON p.company_id=a.company_id AND p.id=a.purchase_id
  JOIN suppliers s ON s.company_id=p.company_id AND s.id=p.supplier_id
  LEFT JOIN users u ON u.id=a.paid_by`;
const entrySelect = `SELECT f.id,f.company_id AS "companyId",f.kind,f.status,f.description,f.category,
  f.amount_cents AS "amountCents",f.payment_method AS "paymentMethod",f.source_type AS "sourceType",f.source_id AS "sourceId",
  f.notes,f.actor_id AS "actorId",u.name AS "actorName",f.realized_at AS "realizedAt",f.created_at AS "createdAt"
  FROM financial_entries f LEFT JOIN users u ON u.id=f.actor_id`;

function commandHash(payableId: string, body: SettleInput) {
  return createHash('sha256').update(JSON.stringify({ payableId, ...body })).digest('hex');
}
function toPayable(row: PayableRow): AccountPayable {
  return { ...row, amountCents: Number(row.amountCents), dueDate: new Date(row.dueDate).toISOString().slice(0, 10), paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null, createdAt: new Date(row.createdAt).toISOString() };
}
function toEntry(row: EntryRow): FinancialEntry {
  return { ...row, amountCents: Number(row.amountCents), realizedAt: row.realizedAt ? new Date(row.realizedAt).toISOString() : null, createdAt: new Date(row.createdAt).toISOString() };
}

export function createFinanceService(db: Db) {
  return {
    async overview(context: AuthContext, companyId: string, query: ListQuery): Promise<FinanceOverview> {
      await requireCompany(db, context.user.id, companyId, 'finance.read');
      const [payables, entries, totals, receivables] = await Promise.all([
        db.query<PayableRow>(`${payableSelect} WHERE a.company_id=$1 ORDER BY CASE WHEN a.status='OPEN' THEN 0 ELSE 1 END,a.due_date,a.id LIMIT $2`, [companyId, query.limit]),
        db.query<EntryRow>(`${entrySelect} WHERE f.company_id=$1 ORDER BY f.created_at DESC,f.id DESC LIMIT $2`, [companyId, query.limit]),
        db.query<{ payable: string | number; receivable: string|number; revenue: string | number; expense: string | number }>(`SELECT
          COALESCE((SELECT sum(amount_cents) FROM accounts_receivable WHERE company_id=$1 AND status='OPEN'),0) AS receivable,
          COALESCE((SELECT sum(amount_cents) FROM accounts_payable WHERE company_id=$1 AND status='OPEN'),0) AS payable,
          COALESCE((SELECT sum(amount_cents) FROM financial_entries WHERE company_id=$1 AND kind='REVENUE' AND status='REALIZED'),0) AS revenue,
          COALESCE((SELECT sum(amount_cents) FROM financial_entries WHERE company_id=$1 AND kind='EXPENSE' AND status='REALIZED'),0) AS expense`, [companyId]),
        db.query<ReceivableRow>(`SELECT a.id,a.company_id AS "companyId",a.customer_id AS "customerId",c.name AS "customerName",a.description,a.category,a.amount_cents AS "amountCents",a.due_date AS "dueDate",a.status,a.notes,a.received_at AS "receivedAt",a.payment_method AS "paymentMethod",a.created_at AS "createdAt" FROM accounts_receivable a LEFT JOIN customers c ON c.company_id=a.company_id AND c.id=a.customer_id WHERE a.company_id=$1 ORDER BY CASE WHEN a.status='OPEN' THEN 0 ELSE 1 END,a.due_date,a.id LIMIT $2`,[companyId,query.limit]),
      ]);
      const total = totals.rows[0]!;
      return { payables: payables.rows.map(toPayable), receivables: receivables.rows.map(row=>({...row,amountCents:Number(row.amountCents),dueDate:new Date(row.dueDate).toISOString().slice(0,10),receivedAt:row.receivedAt?new Date(row.receivedAt).toISOString():null,createdAt:new Date(row.createdAt).toISOString()})), entries: entries.rows.map(toEntry), totals: { payableOpenCents: Number(total.payable), receivableOpenCents: Number(total.receivable), revenueRealizedCents: Number(total.revenue), expenseRealizedCents: Number(total.expense) } };
    },

    async payPayable(context: AuthContext, companyId: string, payableId: string, key: string, body: SettleInput) {
      const hash = commandHash(payableId, body);
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'finance.manage', true);
        const replay = await tx.query<{ id: string; commandHash: string }>('SELECT id,payment_command_hash AS "commandHash" FROM accounts_payable WHERE company_id=$1 AND payment_idempotency_key=$2', [companyId, key]);
        if (replay.rows[0]) {
          if (replay.rows[0].id !== payableId || replay.rows[0].commandHash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para outra liquidação.');
          const repeated = await tx.query<PayableRow>(`${payableSelect} WHERE a.company_id=$1 AND a.id=$2`, [companyId, payableId]);
          return { payable: toPayable(repeated.rows[0]!), replayed: true };
        }
        const selected = await tx.query<PayableRow>(`${payableSelect} WHERE a.company_id=$1 AND a.id=$2 FOR UPDATE OF a`, [companyId, payableId]);
        if (!selected.rows[0]) notFound();
        const payable = toPayable(selected.rows[0]);
        if (payable.status !== 'OPEN') throw new HttpError(409, 'PAYABLE_NOT_OPEN', 'Esta conta não está aberta para pagamento.');

        let cashRegisterId: string | null = null;
        if (body.paymentMethod === 'CASH') {
          const cash = await tx.query<{ id: string; operatorId: string; openingCents: string | number }>(`SELECT id,operator_id AS "operatorId",opening_cents AS "openingCents" FROM cash_registers WHERE company_id=$1 AND status='OPEN' FOR UPDATE`, [companyId]);
          if (!cash.rows[0]) throw new HttpError(409, 'CASH_NOT_OPEN', 'Abra o caixa antes de pagar em dinheiro.');
          if (cash.rows[0].operatorId !== context.user.id) throw new HttpError(409, 'CASH_OTHER_OPERATOR', 'O caixa aberto pertence a outro operador.');
          const movements = await tx.query<{ incoming: string | number; outgoing: string | number }>(`SELECT
            COALESCE(sum(amount_cents) FILTER (WHERE direction='IN' AND type<>'OPENING' AND (type<>'SALE' OR payment_method='CASH')),0) AS incoming,
            COALESCE(sum(amount_cents) FILTER (WHERE direction='OUT'),0) AS outgoing
            FROM cash_movements WHERE company_id=$1 AND cash_register_id=$2`, [companyId, cash.rows[0].id]);
          const available = Number(cash.rows[0].openingCents) + Number(movements.rows[0]!.incoming) - Number(movements.rows[0]!.outgoing);
          if (payable.amountCents > available) throw new HttpError(409, 'INSUFFICIENT_CASH', 'O caixa não possui dinheiro suficiente para pagar esta conta.');
          cashRegisterId = cash.rows[0].id;
        }

        const entryId = randomUUID();
        await tx.query(`INSERT INTO financial_entries(id,company_id,kind,status,description,amount_cents,payment_method,source_type,source_id,realized_at,category,notes,actor_id,payable_id)
          VALUES($1,$2,'EXPENSE','REALIZED',$3,$4,$5,'PAYABLE',$6,now(),$7,$8,$9,$6)`, [entryId, companyId, payable.description, payable.amountCents, body.paymentMethod, payable.id, payable.category, body.notes, context.user.id]);
        if (cashRegisterId) {
          await tx.query(`INSERT INTO cash_movements(id,company_id,cash_register_id,type,direction,payment_method,amount_cents,notes,actor_id,financial_entry_id)
            VALUES($1,$2,$3,'EXIT','OUT','CASH',$4,$5,$6,$7)`, [randomUUID(), companyId, cashRegisterId, payable.amountCents, `Pagamento: ${payable.description}`, context.user.id, entryId]);
        }
        await tx.query(`UPDATE accounts_payable SET status='PAID',paid_at=now(),payment_method=$1,paid_by=$2,payment_notes=$3,payment_idempotency_key=$4,payment_command_hash=$5
          WHERE company_id=$6 AND id=$7`, [body.paymentMethod, context.user.id, body.notes, key, hash, companyId, payable.id]);
        await audit(tx, context.user, companyId, 'payable.paid', 'account_payable', payable.id, { status: 'OPEN' }, { status: 'PAID', amountCents: payable.amountCents, paymentMethod: body.paymentMethod, financialEntryId: entryId, cashRegisterId });
        const updated = await tx.query<PayableRow>(`${payableSelect} WHERE a.company_id=$1 AND a.id=$2`, [companyId, payable.id]);
        return { payable: toPayable(updated.rows[0]!), replayed: false };
      });
    },
  };
}
