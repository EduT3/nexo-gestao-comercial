import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { Category, Customer, Product, Supplier } from '../../../shared/contracts.js';
import { requireCompany, type AuthContext } from '../../core/access.js';
import { audit } from '../../core/audit.js';
import { HttpError, notFound } from '../../core/errors.js';
import type { Db } from '../../db.js';
import {
  categoryPatchSchema,
  categorySchema,
  customerPatchSchema,
  customerSchema,
  listQuerySchema,
  productPatchSchema,
  productSchema,
  supplierPatchSchema,
  supplierSchema,
} from './schemas.js';

type ListQuery = z.infer<typeof listQuerySchema>;
type CategoryInput = z.infer<typeof categorySchema>;
type CategoryPatch = z.infer<typeof categoryPatchSchema>;
type ProductInput = z.infer<typeof productSchema>;
type ProductPatch = z.infer<typeof productPatchSchema>;
type SupplierInput = z.infer<typeof supplierSchema>;
type SupplierPatch = z.infer<typeof supplierPatchSchema>;
type CustomerInput = z.infer<typeof customerSchema>;
type CustomerPatch = z.infer<typeof customerPatchSchema>;

type DateValue = Date | string;
type CategoryRow = Omit<Category, 'createdAt' | 'updatedAt'> & { createdAt: DateValue; updatedAt: DateValue };
type ProductRow = Omit<Product, 'costCents' | 'stockMin' | 'createdAt' | 'updatedAt'> & {
  costCents: number | string;
  priceCents: number | string;
  stockMin: number | string;
  createdAt: DateValue;
  updatedAt: DateValue;
};
type SupplierRow = Omit<Supplier, 'createdAt' | 'updatedAt'> & { createdAt: DateValue; updatedAt: DateValue };
type CustomerRow = Omit<Customer, 'createdAt' | 'updatedAt'> & { createdAt: DateValue; updatedAt: DateValue };

const categorySelect = `SELECT id,company_id AS "companyId",name,description,active,
  created_at AS "createdAt",updated_at AS "updatedAt" FROM categories`;
const productSelect = `SELECT id,company_id AS "companyId",name,internal_code AS "internalCode",
  barcode,category_id AS "categoryId",unit,cost_cents AS "costCents",price_cents AS "priceCents",
  stock_min AS "stockMin",supplier_id AS "supplierId",active,created_at AS "createdAt",updated_at AS "updatedAt" FROM products`;
const supplierSelect = `SELECT id,company_id AS "companyId",name,tax_id AS "taxId",phone,whatsapp,email,address,notes,active,
  created_at AS "createdAt",updated_at AS "updatedAt" FROM suppliers`;
const customerSelect = `SELECT id,company_id AS "companyId",name,tax_id AS "taxId",phone,whatsapp,address,notes,active,
  created_at AS "createdAt",updated_at AS "updatedAt" FROM customers`;

function iso(value: DateValue): string { return new Date(value).toISOString(); }
function nullable(value: string | null | undefined): string | null { return value ?? null; }
function cents(value: number | string): number { return Number(value); }

/** Keep the API quantity explicit at the database scale without using floats. */
function quantity(value: number | string): string {
  const [whole = '0', fraction = ''] = String(value).split('.');
  return `${whole}.${fraction.padEnd(3, '0').slice(0, 3)}`;
}

function toCategory(row: CategoryRow): Category {
  return { ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function toProduct(row: ProductRow, includeCost: boolean): Product {
  const result: Product = {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    internalCode: row.internalCode,
    barcode: row.barcode ?? null,
    categoryId: row.categoryId ?? null,
    unit: row.unit,
    priceCents: cents(row.priceCents),
    stockMin: quantity(row.stockMin),
    supplierId: row.supplierId ?? null,
    active: row.active,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
  if (includeCost) result.costCents = cents(row.costCents);
  return result;
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    ...row,
    taxId: row.taxId ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function toCustomer(row: CustomerRow): Customer {
  return {
    ...row,
    taxId: row.taxId ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function auditData(value: Category | Product | Supplier | Customer): Record<string, unknown> {
  return { ...value };
}

function searchPattern(value: string): string { return `%${value.replace(/[\\%_]/g, '\\$&')}%`; }

interface ListSql {
  where: string;
  values: unknown[];
  countValues: unknown[];
  limitPosition: number;
  offsetPosition: number;
}

function listSql(companyId: string, query: ListQuery, columns: readonly string[]): ListSql {
  const where = [
    'company_id=$1',
    `($2='%%' OR ${columns.map(column => `${column} ILIKE $2`).join(' OR ')})`,
  ];
  const filterValues: unknown[] = [companyId, searchPattern(query.q)];
  if (!query.all && query.active !== 'all') {
    where.push(`active=$${filterValues.length + 1}`);
    filterValues.push(query.active === 'true');
  }
  const limitPosition = filterValues.length + 1;
  const offsetPosition = filterValues.length + 2;
  return { where: where.join(' AND '), values: [...filterValues, query.limit, query.offset], countValues: filterValues, limitPosition, offsetPosition };
}

async function total(db: Db, table: string, where: string, values: unknown[]): Promise<number> {
  const result = await db.query<{ count: string | number }>(`SELECT count(*) AS count FROM ${table} WHERE ${where}`, values);
  return Number(result.rows[0]?.count ?? 0);
}

async function assertReference(db: Db, table: 'categories' | 'suppliers', companyId: string, id: string, label: string) {
  const result = await db.query<{ active: boolean }>(`SELECT active FROM ${table} WHERE company_id=$1 AND id=$2`, [companyId, id]);
  const row = result.rows[0];
  // A cross-company ID is deliberately indistinguishable from an absent ID.
  if (!row) notFound();
  if (!row.active) throw new HttpError(400, 'INACTIVE_REFERENCE', `${label} selecionado está inativo.`);
}

export function createCommerceService(db: Db) {
  return {
    async listCategories(context: AuthContext, companyId: string, query: ListQuery) {
      await requireCompany(db, context.user.id, companyId, 'products.read');
      const sql = listSql(companyId, query, ['name', 'description']);
      const rows = await db.query<CategoryRow>(`${categorySelect} WHERE ${sql.where} ORDER BY name,id LIMIT $${sql.limitPosition} OFFSET $${sql.offsetPosition}`, sql.values);
      return { categories: rows.rows.map(toCategory), total: await total(db, 'categories', sql.where, sql.countValues), limit: query.limit, offset: query.offset };
    },

    async listProducts(context: AuthContext, companyId: string, query: ListQuery) {
      const company = await requireCompany(db, context.user.id, companyId, 'products.read');
      const sql = listSql(companyId, query, ['name', 'internal_code', 'barcode']);
      const rows = await db.query<ProductRow>(`${productSelect} WHERE ${sql.where} ORDER BY name,id LIMIT $${sql.limitPosition} OFFSET $${sql.offsetPosition}`, sql.values);
      const includeCost = company.permissions.includes('cost.read');
      return { products: rows.rows.map(row => toProduct(row, includeCost)), total: await total(db, 'products', sql.where, sql.countValues), limit: query.limit, offset: query.offset };
    },

    async listSuppliers(context: AuthContext, companyId: string, query: ListQuery) {
      await requireCompany(db, context.user.id, companyId, 'company.read');
      const sql = listSql(companyId, query, ['name', 'tax_id', 'phone', 'whatsapp', 'email']);
      const rows = await db.query<SupplierRow>(`${supplierSelect} WHERE ${sql.where} ORDER BY name,id LIMIT $${sql.limitPosition} OFFSET $${sql.offsetPosition}`, sql.values);
      return { suppliers: rows.rows.map(toSupplier), total: await total(db, 'suppliers', sql.where, sql.countValues), limit: query.limit, offset: query.offset };
    },

    async listCustomers(context: AuthContext, companyId: string, query: ListQuery) {
      await requireCompany(db, context.user.id, companyId, 'company.read');
      const sql = listSql(companyId, query, ['name', 'tax_id', 'phone', 'whatsapp']);
      const rows = await db.query<CustomerRow>(`${customerSelect} WHERE ${sql.where} ORDER BY name,id LIMIT $${sql.limitPosition} OFFSET $${sql.offsetPosition}`, sql.values);
      return { customers: rows.rows.map(toCustomer), total: await total(db, 'customers', sql.where, sql.countValues), limit: query.limit, offset: query.offset };
    },

    async createCategory(context: AuthContext, companyId: string, body: CategoryInput) {
      const id = randomUUID();
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        await tx.query('INSERT INTO categories(id,company_id,name,description) VALUES($1,$2,$3,$4)', [id, companyId, body.name, body.description]);
        const result = await tx.query<CategoryRow>(`${categorySelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const created = result.rows[0];
        if (!created) throw new Error('Category insert failed');
        const value = toCategory(created);
        await audit(tx, context.user, companyId, 'category.created', 'category', id, null, auditData(value));
        return value;
      });
    },

    async updateCategory(context: AuthContext, companyId: string, id: string, body: CategoryPatch) {
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        const found = await tx.query<CategoryRow>(`${categorySelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const beforeRow = found.rows[0];
        if (!beforeRow) notFound();
        const before = toCategory(beforeRow);
        const next = { name: body.name ?? before.name, description: body.description ?? before.description, active: body.active ?? before.active };
        await tx.query('UPDATE categories SET name=$1,description=$2,active=$3,updated_at=now() WHERE company_id=$4 AND id=$5', [next.name, next.description, next.active, companyId, id]);
        const result = await tx.query<CategoryRow>(`${categorySelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const updatedRow = result.rows[0];
        if (!updatedRow) throw new Error('Category update failed');
        const updated = toCategory(updatedRow);
        await audit(tx, context.user, companyId, 'category.updated', 'category', id, auditData(before), auditData(updated));
        return updated;
      });
    },

    async createProduct(context: AuthContext, companyId: string, body: ProductInput) {
      const id = randomUUID();
      return db.transaction(async tx => {
        const company = await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        if (body.categoryId) await assertReference(tx, 'categories', companyId, body.categoryId, 'A categoria');
        if (body.supplierId) await assertReference(tx, 'suppliers', companyId, body.supplierId, 'O fornecedor');
        await tx.query(`INSERT INTO products(id,company_id,name,internal_code,barcode,category_id,unit,cost_cents,price_cents,stock_min,supplier_id,active)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [id, companyId, body.name, body.internalCode, nullable(body.barcode), nullable(body.categoryId), body.unit, body.costCents, body.priceCents, body.stockMin, nullable(body.supplierId), body.active]);
        const result = await tx.query<ProductRow>(`${productSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const createdRow = result.rows[0];
        if (!createdRow) throw new Error('Product insert failed');
        const created = toProduct(createdRow, true);
        await audit(tx, context.user, companyId, 'product.created', 'product', id, null, auditData(created));
        return toProduct(createdRow, company.permissions.includes('cost.read'));
      });
    },

    async updateProduct(context: AuthContext, companyId: string, id: string, body: ProductPatch) {
      return db.transaction(async tx => {
        const company = await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        const found = await tx.query<ProductRow>(`${productSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const beforeRow = found.rows[0];
        if (!beforeRow) notFound();
        const before = toProduct(beforeRow, true);
        const next = {
          name: body.name ?? before.name,
          internalCode: body.internalCode ?? before.internalCode,
          barcode: body.barcode === undefined ? before.barcode : body.barcode,
          categoryId: body.categoryId === undefined ? before.categoryId : body.categoryId,
          unit: body.unit ?? before.unit,
          costCents: body.costCents ?? before.costCents!,
          priceCents: body.priceCents ?? before.priceCents,
          stockMin: body.stockMin ?? before.stockMin,
          supplierId: body.supplierId === undefined ? before.supplierId : body.supplierId,
          active: body.active ?? before.active,
        };
        if (body.categoryId) await assertReference(tx, 'categories', companyId, body.categoryId, 'A categoria');
        if (body.supplierId) await assertReference(tx, 'suppliers', companyId, body.supplierId, 'O fornecedor');
        await tx.query(`UPDATE products SET name=$1,internal_code=$2,barcode=$3,category_id=$4,unit=$5,cost_cents=$6,
          price_cents=$7,stock_min=$8,supplier_id=$9,active=$10,updated_at=now() WHERE company_id=$11 AND id=$12`,
        [next.name, next.internalCode, nullable(next.barcode), nullable(next.categoryId), next.unit, next.costCents, next.priceCents, next.stockMin, nullable(next.supplierId), next.active, companyId, id]);
        const result = await tx.query<ProductRow>(`${productSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const updatedRow = result.rows[0];
        if (!updatedRow) throw new Error('Product update failed');
        const updated = toProduct(updatedRow, true);
        await audit(tx, context.user, companyId, 'product.updated', 'product', id, auditData(before), auditData(updated));
        return toProduct(updatedRow, company.permissions.includes('cost.read'));
      });
    },

    async createSupplier(context: AuthContext, companyId: string, body: SupplierInput) {
      const id = randomUUID();
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        await tx.query(`INSERT INTO suppliers(id,company_id,name,tax_id,phone,whatsapp,email,address,notes)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, companyId, body.name, nullable(body.taxId), nullable(body.phone), nullable(body.whatsapp), nullable(body.email), nullable(body.address), nullable(body.notes)]);
        const result = await tx.query<SupplierRow>(`${supplierSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const createdRow = result.rows[0];
        if (!createdRow) throw new Error('Supplier insert failed');
        const created = toSupplier(createdRow);
        await audit(tx, context.user, companyId, 'supplier.created', 'supplier', id, null, auditData(created));
        return created;
      });
    },

    async updateSupplier(context: AuthContext, companyId: string, id: string, body: SupplierPatch) {
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        const found = await tx.query<SupplierRow>(`${supplierSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const beforeRow = found.rows[0];
        if (!beforeRow) notFound();
        const before = toSupplier(beforeRow);
        const next = {
          name: body.name ?? before.name,
          taxId: body.taxId === undefined ? before.taxId : body.taxId,
          phone: body.phone === undefined ? before.phone : body.phone,
          whatsapp: body.whatsapp === undefined ? before.whatsapp : body.whatsapp,
          email: body.email === undefined ? before.email : body.email,
          address: body.address === undefined ? before.address : body.address,
          notes: body.notes === undefined ? before.notes : body.notes,
          active: body.active ?? before.active,
        };
        await tx.query(`UPDATE suppliers SET name=$1,tax_id=$2,phone=$3,whatsapp=$4,email=$5,address=$6,notes=$7,active=$8,updated_at=now()
          WHERE company_id=$9 AND id=$10`, [next.name, nullable(next.taxId), nullable(next.phone), nullable(next.whatsapp), nullable(next.email), nullable(next.address), nullable(next.notes), next.active, companyId, id]);
        const result = await tx.query<SupplierRow>(`${supplierSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const updatedRow = result.rows[0];
        if (!updatedRow) throw new Error('Supplier update failed');
        const updated = toSupplier(updatedRow);
        await audit(tx, context.user, companyId, 'supplier.updated', 'supplier', id, auditData(before), auditData(updated));
        return updated;
      });
    },

    async createCustomer(context: AuthContext, companyId: string, body: CustomerInput) {
      const id = randomUUID();
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        await tx.query(`INSERT INTO customers(id,company_id,name,tax_id,phone,whatsapp,address,notes)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [id, companyId, body.name, nullable(body.taxId), nullable(body.phone), nullable(body.whatsapp), nullable(body.address), nullable(body.notes)]);
        const result = await tx.query<CustomerRow>(`${customerSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const createdRow = result.rows[0];
        if (!createdRow) throw new Error('Customer insert failed');
        const created = toCustomer(createdRow);
        await audit(tx, context.user, companyId, 'customer.created', 'customer', id, null, auditData(created));
        return created;
      });
    },

    async updateCustomer(context: AuthContext, companyId: string, id: string, body: CustomerPatch) {
      return db.transaction(async tx => {
        await requireCompany(tx, context.user.id, companyId, 'products.manage', true);
        const found = await tx.query<CustomerRow>(`${customerSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const beforeRow = found.rows[0];
        if (!beforeRow) notFound();
        const before = toCustomer(beforeRow);
        const next = {
          name: body.name ?? before.name,
          taxId: body.taxId === undefined ? before.taxId : body.taxId,
          phone: body.phone === undefined ? before.phone : body.phone,
          whatsapp: body.whatsapp === undefined ? before.whatsapp : body.whatsapp,
          address: body.address === undefined ? before.address : body.address,
          notes: body.notes === undefined ? before.notes : body.notes,
          active: body.active ?? before.active,
        };
        await tx.query(`UPDATE customers SET name=$1,tax_id=$2,phone=$3,whatsapp=$4,address=$5,notes=$6,active=$7,updated_at=now()
          WHERE company_id=$8 AND id=$9`, [next.name, nullable(next.taxId), nullable(next.phone), nullable(next.whatsapp), nullable(next.address), nullable(next.notes), next.active, companyId, id]);
        const result = await tx.query<CustomerRow>(`${customerSelect} WHERE company_id=$1 AND id=$2`, [companyId, id]);
        const updatedRow = result.rows[0];
        if (!updatedRow) throw new Error('Customer update failed');
        const updated = toCustomer(updatedRow);
        await audit(tx, context.user, companyId, 'customer.updated', 'customer', id, auditData(before), auditData(updated));
        return updated;
      });
    },
  };
}
