import { createHash, randomUUID } from 'node:crypto';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';

export async function reverseManualEntry(db: Db, context: AuthContext, companyId: string, entryId: string, key: string, body: { reason: string }, origin: 'MANUAL' | 'TITLE' = 'MANUAL') {
  return db.transaction(tx => reverseEntryInTransaction(tx,context,companyId,entryId,key,body,origin));
}

export async function reverseEntryInTransaction(tx: Db, context: AuthContext, companyId: string, entryId: string, key: string, body: { reason: string }, origin: 'MANUAL' | 'TITLE' | 'SALE') {
  const hash = createHash('sha256').update(JSON.stringify({ entryId, ...body, origin })).digest('hex');
    await requireCompany(tx, context.user.id, companyId, origin === 'SALE' ? 'sales.cancel' : 'finance.manage', true);
    const replay = await tx.query<{ id: string; hash: string }>('SELECT id,command_hash AS hash FROM financial_reversals WHERE company_id=$1 AND idempotency_key=$2', [companyId, key]);
    if (replay.rows[0]) {
      if (replay.rows[0].hash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para outro estorno.');
      return { reversalId: replay.rows[0].id, replayed: true };
    }
    const selected = await tx.query<{ kind: string; status: string; source: string; amount: string; method: string; description: string }>(`SELECT kind,status,source_type AS source,amount_cents::text AS amount,payment_method AS method,description FROM financial_entries WHERE company_id=$1 AND id=$2 FOR UPDATE`, [companyId, entryId]);
    if (!selected.rows[0]) notFound();
    const entry = selected.rows[0];
    if (origin === 'TITLE' ? !['PAYABLE','RECEIVABLE'].includes(entry.source) : entry.source !== origin) throw new HttpError(409, 'LINKED_ENTRY', 'Esta operação deve ser revertida pelo fluxo da venda ou do título de origem.');
    if (entry.status !== 'REALIZED') throw new HttpError(409, 'ENTRY_NOT_REALIZED', 'Somente lançamentos realizados podem ser estornados.');
    if ((await tx.query('SELECT id FROM financial_reversals WHERE company_id=$1 AND entry_id=$2', [companyId, entryId])).rows.length) throw new HttpError(409, 'ENTRY_ALREADY_REVERSED', 'Este lançamento já foi estornado.');
    let cashId: string | null = null;
    if (entry.method === 'CASH') {
      const cash = await tx.query<{ id: string; operator: string; opening: string }>(`SELECT id,operator_id AS operator,opening_cents::text AS opening FROM cash_registers WHERE company_id=$1 AND status='OPEN' FOR UPDATE`, [companyId]);
      if (!cash.rows[0]) throw new HttpError(409, 'CASH_NOT_OPEN', 'Abra o caixa antes de estornar dinheiro.');
      if (cash.rows[0].operator !== context.user.id) throw new HttpError(409, 'CASH_OTHER_OPERATOR', 'O caixa aberto pertence a outro operador.');
      cashId = cash.rows[0].id;
      if (entry.kind === 'REVENUE') {
        const balance = await tx.query<{ amount: string }>(`SELECT COALESCE(sum(CASE WHEN direction='OUT' THEN -amount_cents WHEN type='OPENING' THEN 0 WHEN type='SALE' AND payment_method<>'CASH' THEN 0 ELSE amount_cents END),0)::text AS amount FROM cash_movements WHERE company_id=$1 AND cash_register_id=$2`, [companyId, cashId]);
        if (BigInt(entry.amount) > BigInt(cash.rows[0].opening) + BigInt(balance.rows[0]!.amount)) throw new HttpError(409, 'INSUFFICIENT_CASH', 'O caixa não possui dinheiro suficiente para devolver esta receita.');
      }
    }
    const id = randomUUID();
    await tx.query('INSERT INTO financial_reversals(id,company_id,entry_id,reason,actor_id,idempotency_key,command_hash) VALUES($1,$2,$3,$4,$5,$6,$7)', [id, companyId, entryId, body.reason, context.user.id, key, hash]);
    if (cashId) await tx.query(`INSERT INTO cash_movements(id,company_id,cash_register_id,type,direction,payment_method,amount_cents,notes,actor_id,financial_reversal_id)
      VALUES($1,$2,$3,$4,$5,'CASH',$6,$7,$8,$9)`, [randomUUID(), companyId, cashId, entry.kind === 'REVENUE' ? 'EXIT' : 'ENTRY', entry.kind === 'REVENUE' ? 'OUT' : 'IN', entry.amount, 'Estorno: ' + entry.description, context.user.id, id]);
    if (origin === 'TITLE') {
      const settlement = (await tx.query<{ payable: string | null; receivable: string | null }>('SELECT payable_id AS payable,receivable_id AS receivable FROM title_settlements WHERE company_id=$1 AND financial_entry_id=$2', [companyId,entryId])).rows[0];
      if (!settlement) throw new HttpError(409, 'SETTLEMENT_NOT_FOUND', 'A liquidação de origem não foi encontrada.');
      if (settlement.payable) {
        const reopened = await tx.query(`UPDATE accounts_payable SET status='OPEN',paid_at=NULL,payment_method=NULL,paid_by=NULL,payment_notes='',payment_idempotency_key=NULL,payment_command_hash=NULL WHERE company_id=$1 AND id=$2 AND status='PAID' RETURNING id`, [companyId,settlement.payable]);
        if (!reopened.rows.length) throw new HttpError(409,'TITLE_NOT_SETTLED','O título não está liquidado.');
      } else {
        const reopened = await tx.query(`UPDATE accounts_receivable SET status='OPEN',received_at=NULL,payment_method=NULL,received_by=NULL,receipt_notes='',receipt_idempotency_key=NULL,receipt_command_hash=NULL WHERE company_id=$1 AND id=$2 AND status='RECEIVED' RETURNING id`, [companyId,settlement.receivable]);
        if (!reopened.rows.length) throw new HttpError(409,'TITLE_NOT_SETTLED','O título não está liquidado.');
      }
    }
    await audit(tx, context.user, companyId, 'financial_entry.reversed', 'financial_entry', entryId, null, { reversalId: id, reason: body.reason, amountCents: Number(entry.amount), paymentMethod: entry.method, cashRegisterId: cashId });
    return { reversalId: id, replayed: false };
}
