import { randomUUID } from 'node:crypto';
import { productSchema, productPatchSchema } from '../server/modules/commerce/schemas.js';
import type { LocalDatabase } from './sqlite.js';
import { quantityToMilli } from '../shared/scaled.js';

export const LOCAL_CATALOG_SCHEMA = `CREATE TABLE IF NOT EXISTS local_companies(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS local_users(id TEXT PRIMARY KEY,name TEXT NOT NULL,active INTEGER NOT NULL CHECK(active IN(0,1))) STRICT;
      CREATE TABLE IF NOT EXISTS local_memberships(company_id TEXT NOT NULL REFERENCES local_companies(id),user_id TEXT NOT NULL REFERENCES local_users(id),role TEXT NOT NULL CHECK(role IN('ADMIN','OPERADOR')),active INTEGER NOT NULL CHECK(active IN(0,1)),PRIMARY KEY(company_id,user_id)) STRICT;
      CREATE TABLE IF NOT EXISTS local_products(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES local_companies(id),name TEXT NOT NULL,internal_code TEXT NOT NULL,barcode TEXT,unit TEXT NOT NULL,cost_cents INTEGER NOT NULL CHECK(cost_cents>=0),price_cents INTEGER NOT NULL CHECK(price_cents>=0),stock_min_milli INTEGER NOT NULL CHECK(stock_min_milli>=0),active INTEGER NOT NULL CHECK(active IN(0,1)),UNIQUE(company_id,id),UNIQUE(company_id,internal_code)) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS local_product_barcode_uq ON local_products(company_id,barcode) WHERE barcode IS NOT NULL;
      CREATE TABLE IF NOT EXISTS local_audit(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES local_companies(id),actor_id TEXT NOT NULL REFERENCES local_users(id),action TEXT NOT NULL,entity_id TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now'))) STRICT;
      CREATE TRIGGER IF NOT EXISTS local_audit_immutable_update BEFORE UPDATE ON local_audit BEGIN SELECT RAISE(ABORT,'Histórico imutável'); END;
      CREATE TRIGGER IF NOT EXISTS local_audit_immutable_delete BEFORE DELETE ON local_audit BEGIN SELECT RAISE(ABORT,'Histórico imutável'); END;`;

export async function initializeLocalCatalog(db:LocalDatabase){
  await db.transaction(async tx=>{
    await tx.exec(LOCAL_CATALOG_SCHEMA);
    await tx.query('INSERT OR IGNORE INTO local_companies VALUES(?,?)',['adega-jg','Adega JG']);
    await tx.query('INSERT OR IGNORE INTO local_companies VALUES(?,?)',['deposito-jg','Depósito JG']);
  });
}
export async function authorizeLocalCatalog(db:LocalDatabase,userId:string,companyId:string,manage:boolean){
  const actor=(await db.query(`SELECT m.role FROM local_memberships m JOIN local_users u ON u.id=m.user_id WHERE m.company_id=? AND m.user_id=? AND m.active=1 AND u.active=1`,[companyId,userId]))[0];
  if(!actor)throw new Error('Você não possui acesso ativo a esta empresa.');
  if(manage&&actor.role!=='ADMIN')throw new Error('Seu perfil permite consultar, mas esta operação exige acesso de administrador. Peça ao responsável.');
  return actor.role;
}
export async function createLocalProduct(db:LocalDatabase,userId:string,companyId:string,input:unknown){
  const body=productSchema.parse(input);
  if(body.supplierId)throw new Error('Vínculo de fornecedor ainda não está disponível na versão local.');
  const stockMin=quantityToMilli(body.stockMin);
  return db.transaction(async tx=>{
    await authorizeLocalCatalog(tx,userId,companyId,true);
    const id=randomUUID();
    try {
      await tx.query('INSERT INTO local_products VALUES(?,?,?,?,?,?,?,?,?,?)',[id,companyId,body.name,body.internalCode,body.barcode??null,body.unit,body.costCents,body.priceCents,stockMin,body.active?1:0]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: local_products.company_id')) {
        throw new Error('Código interno ou código de barras já cadastrado nesta empresa. Consulte o produto existente ou informe outro código.');
      }
      throw error;
    }
    if (body.categoryId) await assignCategory(tx, companyId, id, body.categoryId);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',[randomUUID(),companyId,userId,'product.created',id,JSON.stringify(body)]);
    return {id};
  });
}
export async function listLocalProducts(db:LocalDatabase,userId:string,companyId:string){
  return db.transaction(async tx => {
    const role = await authorizeLocalCatalog(tx,userId,companyId,false);
    const fields = 'id,company_id,name,internal_code,barcode,unit,price_cents,stock_min_milli,active';
    const rows = await tx.query(`SELECT ${fields}${role === 'ADMIN' ? ',cost_cents' : ''} FROM local_products WHERE company_id=? ORDER BY name,id`,[companyId]);
    if (Number((await tx.query('PRAGMA user_version'))[0]?.user_version) >= 3) {
      const links = await tx.query('SELECT product_id,category_id FROM local_product_categories WHERE company_id=?', [companyId]);
      const byProduct = new Map(links.map(link => [link.product_id, link.category_id]));
      return rows.map(row => ({ ...row, category_id: byProduct.get(row.id) ?? null }));
    }
    return rows;
  });
}

export async function updateLocalProduct(db: LocalDatabase, userId: string, companyId: string, id: string, input: unknown) {
  const parsed = productPatchSchema.parse(input);
  // Zod applies defaults to optional fields; a PATCH changes only submitted fields.
  const patch = Object.fromEntries(Object.entries(parsed).filter(([key]) =>
    Object.prototype.hasOwnProperty.call(input, key))) as typeof parsed;
  if (patch.supplierId) throw new Error('Vínculo de fornecedor ainda não está disponível na versão local.');
  return db.transaction(async tx => {
    await authorizeLocalCatalog(tx, userId, companyId, true);
    const before = (await tx.query('SELECT * FROM local_products WHERE company_id=? AND id=?', [companyId, id]))[0];
    if (!before) throw new Error('Produto não encontrado nesta empresa.');
    if (Number((await tx.query('PRAGMA user_version'))[0]?.user_version) >= 3) {
      before.category_id = (await tx.query('SELECT category_id FROM local_product_categories WHERE company_id=? AND product_id=?', [companyId, id]))[0]?.category_id ?? null;
    }
    const next = productSchema.parse({
      name: before.name, internalCode: before.internal_code, barcode: before.barcode,
      unit: before.unit, costCents: Number(before.cost_cents), priceCents: Number(before.price_cents),
      stockMin: `${BigInt(String(before.stock_min_milli)) / 1000n}.${(BigInt(String(before.stock_min_milli)) % 1000n).toString().padStart(3, '0')}`,
      categoryId: before.category_id ?? null, supplierId: null, active: before.active === 1n, ...patch,
    });
    try {
      await tx.query('UPDATE local_products SET name=?,internal_code=?,barcode=?,unit=?,cost_cents=?,price_cents=?,stock_min_milli=?,active=? WHERE company_id=? AND id=?',
        [next.name, next.internalCode, next.barcode ?? null, next.unit, next.costCents, next.priceCents, quantityToMilli(next.stockMin), next.active ? 1 : 0, companyId, id]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: local_products.company_id')) {
        throw new Error('Código interno ou código de barras já cadastrado nesta empresa. Informe outro código.');
      }
      throw error;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'categoryId')) await assignCategory(tx, companyId, id, next.categoryId ?? null);
    const history = JSON.stringify({ before, after: next }, (_, value) => typeof value === 'bigint' ? value.toString() : value);
    await tx.query('INSERT INTO local_audit(id,company_id,actor_id,action,entity_id,details) VALUES(?,?,?,?,?,?)',
      [randomUUID(), companyId, userId, next.active ? 'product.updated' : 'product.inactivated', id, history]);
    return { id };
  });
}

async function assignCategory(tx: LocalDatabase, companyId: string, productId: string, categoryId: string | null) {
  if (categoryId) {
    const category = (await tx.query('SELECT active FROM local_categories WHERE company_id=? AND id=?', [companyId, categoryId]))[0];
    if (!category || category.active !== 1n) throw new Error('Selecione uma categoria ativa desta empresa.');
  }
  await tx.query('INSERT INTO local_product_categories VALUES(?,?,?) ON CONFLICT(company_id,product_id) DO UPDATE SET category_id=excluded.category_id', [companyId, productId, categoryId]);
}
