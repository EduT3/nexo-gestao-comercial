import { createHash, randomUUID } from 'node:crypto';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import { reverseEntryInTransaction } from '../finance/reversals.js';

export async function cancelSale(db:Db,context:AuthContext,companyId:string,saleId:string,key:string,body:{reason:string}) {
  const hash=createHash('sha256').update(JSON.stringify({saleId,...body})).digest('hex');
  return db.transaction(async tx=>{
    await requireCompany(tx,context.user.id,companyId,'sales.cancel',true);
    const replay=(await tx.query<{id:string;hash:string}>('SELECT id,command_hash AS hash FROM sale_cancellations WHERE company_id=$1 AND idempotency_key=$2',[companyId,key])).rows[0];
    if(replay){
      if(replay.hash!==hash)throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Esta chave já foi usada para outro cancelamento.');
      return {cancellationId:replay.id,replayed:true};
    }
    const sale=(await tx.query<{status:string}>('SELECT status FROM sales WHERE company_id=$1 AND id=$2 FOR UPDATE',[companyId,saleId])).rows[0];
    if(!sale)notFound();
    if(sale.status!=='CONFIRMED')throw new HttpError(409,'SALE_ALREADY_CANCELLED','Esta venda já foi cancelada.');
    const entry=(await tx.query<{id:string}>("SELECT id FROM financial_entries WHERE company_id=$1 AND source_type='SALE' AND source_id=$2",[companyId,saleId])).rows[0];
    if(!entry)throw new HttpError(409,'SALE_FINANCE_MISSING','O lançamento financeiro da venda não foi encontrado.');
    const reversal=await reverseEntryInTransaction(tx,context,companyId,entry.id,key,body,'SALE');
    const cancellationId=randomUUID();
    await tx.query('INSERT INTO sale_cancellations(id,company_id,sale_id,reason,actor_id,idempotency_key,command_hash,financial_reversal_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[cancellationId,companyId,saleId,body.reason,context.user.id,key,hash,reversal.reversalId]);
    const items=await tx.query<{product:string;quantity:string}>('SELECT product_id AS product,quantity::text AS quantity FROM sale_items WHERE company_id=$1 AND sale_id=$2 ORDER BY product_id',[companyId,saleId]);
    if(!items.rows.length)throw new HttpError(409,'SALE_ITEMS_MISSING','Os itens da venda não foram encontrados.');
    for(const item of items.rows){
      await tx.query('SELECT id FROM products WHERE company_id=$1 AND id=$2 FOR UPDATE',[companyId,item.product]);
      const updated=await tx.query<{before:string;after:string}>(`UPDATE inventory_balances SET quantity=quantity+$1::numeric,updated_at=now() WHERE company_id=$2 AND product_id=$3 RETURNING (quantity-$1::numeric)::text AS before,quantity::text AS after`,[item.quantity,companyId,item.product]);
      if(!updated.rows[0])throw new HttpError(409,'STOCK_BALANCE_MISSING','O saldo do produto não foi encontrado.');
      await tx.query(`INSERT INTO inventory_movements(id,company_id,product_id,type,direction,quantity,balance_before,balance_after,notes,actor_id,idempotency_key,command_hash,source_type,source_id,sale_cancellation_id)
        VALUES($1,$2,$3,'ADJUSTMENT','IN',$4,$5,$6,$7,$8,$9,$10,'SALE_CANCELLATION',$11,$11)`,[randomUUID(),companyId,item.product,item.quantity,updated.rows[0].before,updated.rows[0].after,body.reason,context.user.id,randomUUID(),hash,cancellationId]);
    }
    await tx.query("UPDATE sales SET status='CANCELLED' WHERE company_id=$1 AND id=$2",[companyId,saleId]);
    await audit(tx,context.user,companyId,'sale.cancelled','sale',saleId,{status:'CONFIRMED'},{status:'CANCELLED',cancellationId,financialReversalId:reversal.reversalId,reason:body.reason});
    return {cancellationId,replayed:false};
  });
}
