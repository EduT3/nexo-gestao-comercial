import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import type { createReceivableSchema, settlePayableSchema } from './schemas.js';

export async function receiveReceivable(db: Db, context: AuthContext, companyId: string, id: string, key: string, body: z.infer<typeof settlePayableSchema>) {
  const hash = createHash('sha256').update(JSON.stringify({ id,...body })).digest('hex');
  return db.transaction(async tx => {
    await requireCompany(tx,context.user.id,companyId,'finance.manage',true);
    const replay = await tx.query<{ id: string; hash: string }>('SELECT id,receipt_command_hash AS hash FROM accounts_receivable WHERE company_id=$1 AND receipt_idempotency_key=$2',[companyId,key]);
    if (replay.rows[0]) {
      if (replay.rows[0].id!==id || replay.rows[0].hash!==hash) throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Esta chave já foi usada para outro recebimento.');
      return { receivableId: id,replayed: true };
    }
    const found = await tx.query<{ status: string; description: string; category: string; amount: string }>('SELECT status,description,category,amount_cents::text AS amount FROM accounts_receivable WHERE company_id=$1 AND id=$2 FOR UPDATE',[companyId,id]);
    if (!found.rows[0]) notFound();
    const title = found.rows[0];
    if (title.status!=='OPEN') throw new HttpError(409,'RECEIVABLE_NOT_OPEN','Esta conta não está aberta para recebimento.');
    let cashId: string|null = null;
    if (body.paymentMethod==='CASH') {
      const cash = await tx.query<{ id: string; operator: string }>(`SELECT id,operator_id AS operator FROM cash_registers WHERE company_id=$1 AND status='OPEN' FOR UPDATE`,[companyId]);
      if (!cash.rows[0]) throw new HttpError(409,'CASH_NOT_OPEN','Abra o caixa antes de receber em dinheiro.');
      if (cash.rows[0].operator!==context.user.id) throw new HttpError(409,'CASH_OTHER_OPERATOR','O caixa aberto pertence a outro operador.');
      cashId = cash.rows[0].id;
    }
    const entryId = randomUUID();
    await tx.query(`INSERT INTO financial_entries(id,company_id,kind,status,description,category,amount_cents,payment_method,source_type,source_id,receivable_id,realized_at,notes,actor_id)
      VALUES($1,$2,'REVENUE','REALIZED',$3,$4,$5,$6,'RECEIVABLE',$7,$7,now(),$8,$9)`,[entryId,companyId,title.description,title.category,title.amount,body.paymentMethod,id,body.notes,context.user.id]);
    if (cashId) await tx.query(`INSERT INTO cash_movements(id,company_id,cash_register_id,type,direction,payment_method,amount_cents,notes,actor_id,financial_entry_id)
      VALUES($1,$2,$3,'ENTRY','IN','CASH',$4,$5,$6,$7)`,[randomUUID(),companyId,cashId,title.amount,`Recebimento: ${title.description}`,context.user.id,entryId]);
    await tx.query(`UPDATE accounts_receivable SET status='RECEIVED',received_at=now(),received_by=$1,payment_method=$2,receipt_notes=$3,receipt_idempotency_key=$4,receipt_command_hash=$5 WHERE company_id=$6 AND id=$7`,[context.user.id,body.paymentMethod,body.notes,key,hash,companyId,id]);
    await audit(tx,context.user,companyId,'receivable.received','account_receivable',id,{ status:'OPEN' },{ status:'RECEIVED',amountCents:Number(title.amount),paymentMethod:body.paymentMethod,financialEntryId:entryId,cashRegisterId:cashId });
    return { receivableId:id,replayed:false };
  });
}

export async function createReceivable(db: Db, context: AuthContext, companyId: string, key: string, body: z.infer<typeof createReceivableSchema>) {
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return db.transaction(async tx => {
    await requireCompany(tx, context.user.id, companyId, 'finance.manage', true);
    const replay = await tx.query<{ id: string; hash: string }>('SELECT id,command_hash AS hash FROM accounts_receivable WHERE company_id=$1 AND idempotency_key=$2', [companyId,key]);
    if (replay.rows[0]) {
      if (replay.rows[0].hash !== hash) throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Esta chave já foi usada para outra conta a receber.');
      return { receivableId: replay.rows[0].id, replayed: true };
    }
    if (body.customerId) {
      const customer = await tx.query<{ active: boolean }>('SELECT active FROM customers WHERE company_id=$1 AND id=$2 FOR UPDATE', [companyId,body.customerId]);
      if (!customer.rows[0]) notFound();
      if (!customer.rows[0].active) throw new HttpError(400,'INACTIVE_CUSTOMER','O cliente está inativo.');
    }
    const id = randomUUID();
    await tx.query(`INSERT INTO accounts_receivable(id,company_id,customer_id,description,category,amount_cents,due_date,notes,actor_id,idempotency_key,command_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [id,companyId,body.customerId,body.description,body.category,body.amountCents,body.dueDate,body.notes,context.user.id,key,hash]);
    await audit(tx,context.user,companyId,'receivable.created','account_receivable',id,null,{ customerId: body.customerId,description: body.description,amountCents: body.amountCents,dueDate: body.dueDate,status: 'OPEN' });
    return { receivableId: id, replayed: false };
  });
}
