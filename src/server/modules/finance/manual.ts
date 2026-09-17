import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError } from '../../core/errors.js';
import type { Db } from '../../db.js';
import type { createManualEntrySchema } from './schemas.js';

export async function createManualEntry(db: Db, context: AuthContext, companyId: string, key: string, body: z.infer<typeof createManualEntrySchema>) {
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return db.transaction(async tx => {
    await requireCompany(tx, context.user.id, companyId, 'finance.manage', true);
    const replay = await tx.query<{ id: string; hash: string }>('SELECT id,command_hash AS hash FROM financial_entries WHERE company_id=$1 AND idempotency_key=$2', [companyId, key]);
    if (replay.rows[0]) {
      if (replay.rows[0].hash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para outro lançamento.');
      return { entryId: replay.rows[0].id, replayed: true };
    }
    let cashId: string | null = null;
    if (body.paymentMethod === 'CASH') {
      const cash = await tx.query<{ id: string; operator: string; opening: string }>(`SELECT id,operator_id AS operator,opening_cents::text AS opening FROM cash_registers WHERE company_id=$1 AND status='OPEN' FOR UPDATE`, [companyId]);
      if (!cash.rows[0]) throw new HttpError(409, 'CASH_NOT_OPEN', 'Abra o caixa antes de lançar dinheiro.');
      if (cash.rows[0].operator !== context.user.id) throw new HttpError(409, 'CASH_OTHER_OPERATOR', 'O caixa aberto pertence a outro operador.');
      cashId = cash.rows[0].id;
      if (body.kind === 'EXPENSE') {
        const balance = await tx.query<{ amount: string }>(`SELECT COALESCE(sum(CASE WHEN direction='OUT' THEN -amount_cents WHEN type='OPENING' THEN 0 WHEN type='SALE' AND payment_method<>'CASH' THEN 0 ELSE amount_cents END),0)::text AS amount FROM cash_movements WHERE company_id=$1 AND cash_register_id=$2`, [companyId, cashId]);
        if (BigInt(body.amountCents) > BigInt(cash.rows[0].opening) + BigInt(balance.rows[0]!.amount)) throw new HttpError(409, 'INSUFFICIENT_CASH', 'O caixa não possui dinheiro suficiente para esta despesa.');
      }
    }
    const id = randomUUID();
    await tx.query(`INSERT INTO financial_entries(id,company_id,kind,status,description,category,amount_cents,payment_method,source_type,source_id,realized_at,notes,actor_id,idempotency_key,command_hash)
      VALUES($1,$2,$3,'REALIZED',$4,$5,$6,$7,'MANUAL',$1,now(),$8,$9,$10,$11)`, [id, companyId, body.kind, body.description, body.category, body.amountCents, body.paymentMethod, body.notes, context.user.id, key, hash]);
    if (cashId) await tx.query(`INSERT INTO cash_movements(id,company_id,cash_register_id,type,direction,payment_method,amount_cents,notes,actor_id,financial_entry_id)
      VALUES($1,$2,$3,$4,$5,'CASH',$6,$7,$8,$9)`, [randomUUID(), companyId, cashId, body.kind === 'REVENUE' ? 'ENTRY' : 'EXIT', body.kind === 'REVENUE' ? 'IN' : 'OUT', body.amountCents, body.description, context.user.id, id]);
    await audit(tx, context.user, companyId, 'financial_entry.created', 'financial_entry', id, null, { ...body, cashRegisterId: cashId });
    return { entryId: id, replayed: false };
  });
}
