import { randomBytes, randomUUID } from 'node:crypto';
import type { ProductUnit } from '../shared/contracts.js';
import type { Db } from './db.js';
import { hashPassword } from './security.js';

type CompanyKind = 'DEPOSITO' | 'ADEGA';
type CatalogDefinition = {
  categories: { name: string; description: string }[];
  suppliers: string[];
  customers: string[];
  products: { name: string; internalCode: string; barcode: string; unit: ProductUnit; costCents: number; priceCents: number; stockMin: string; category: string; supplier: string }[];
};

const catalog: Record<CompanyKind, CatalogDefinition> = {
  DEPOSITO: {
    categories: [
      { name: 'Materiais básicos', description: 'Itens essenciais para obras e reformas.' },
      { name: 'Elétrica', description: 'Fios, cabos e acessórios elétricos.' },
      { name: 'Hidráulica', description: 'Tubos e conexões para instalações.' },
    ],
    suppliers: ['Constrular Atacado', 'Casa do Construtor'],
    customers: ['Obras JG', 'Carlos da Silva'],
    products: [
      { name: 'Cimento CP II 50 kg', internalCode: 'CIM-CP2-50', barcode: '7891000000011', unit: 'BAG', costCents: 2890, priceCents: 3490, stockMin: '10.000', category: 'Materiais básicos', supplier: 'Constrular Atacado' },
      { name: 'Tijolo baiano 8 furos', internalCode: 'TIJ-8F', barcode: '7891000000028', unit: 'UNIT', costCents: 85, priceCents: 120, stockMin: '200.000', category: 'Materiais básicos', supplier: 'Casa do Construtor' },
      { name: 'Areia média ensacada', internalCode: 'ARE-MED', barcode: '7891000000035', unit: 'BAG', costCents: 1450, priceCents: 1990, stockMin: '20.000', category: 'Materiais básicos', supplier: 'Constrular Atacado' },
      { name: 'Argamassa AC-II 20 kg', internalCode: 'ARG-AC2', barcode: '7891000000042', unit: 'BAG', costCents: 1890, priceCents: 2490, stockMin: '12.000', category: 'Materiais básicos', supplier: 'Constrular Atacado' },
      { name: 'Fio flexível 2,5 mm', internalCode: 'FIO-25', barcode: '7891000000059', unit: 'METER', costCents: 195, priceCents: 299, stockMin: '100.000', category: 'Elétrica', supplier: 'Casa do Construtor' },
      { name: 'Tubo PVC esgoto 100 mm', internalCode: 'TUB-PVC100', barcode: '7891000000066', unit: 'METER', costCents: 1590, priceCents: 2190, stockMin: '15.000', category: 'Hidráulica', supplier: 'Casa do Construtor' },
    ],
  },
  ADEGA: {
    categories: [
      { name: 'Cervejas', description: 'Cervejas em lata, garrafa e packs.' },
      { name: 'Bebidas sem álcool', description: 'Águas, refrigerantes e bebidas prontas.' },
      { name: 'Destilados e gelo', description: 'Destilados, gelo e itens para servir.' },
    ],
    suppliers: ['Distribuidora Boa Compra', 'Bebidas Central'],
    customers: ['Churrasco do João', 'Mariana Oliveira'],
    products: [
      { name: 'Cerveja Pilsen lata 350 ml', internalCode: 'CER-PIL-350', barcode: '7892000000010', unit: 'UNIT', costCents: 270, priceCents: 399, stockMin: '48.000', category: 'Cervejas', supplier: 'Distribuidora Boa Compra' },
      { name: 'Cerveja puro malte lata 350 ml', internalCode: 'CER-PM-350', barcode: '7892000000027', unit: 'UNIT', costCents: 360, priceCents: 499, stockMin: '36.000', category: 'Cervejas', supplier: 'Distribuidora Boa Compra' },
      { name: 'Refrigerante cola 2 litros', internalCode: 'REF-COLA-2L', barcode: '7892000000034', unit: 'UNIT', costCents: 690, priceCents: 999, stockMin: '24.000', category: 'Bebidas sem álcool', supplier: 'Bebidas Central' },
      { name: 'Água mineral 500 ml', internalCode: 'AGUA-500', barcode: '7892000000041', unit: 'UNIT', costCents: 99, priceCents: 199, stockMin: '48.000', category: 'Bebidas sem álcool', supplier: 'Bebidas Central' },
      { name: 'Energético lata 473 ml', internalCode: 'ENE-473', barcode: '7892000000058', unit: 'UNIT', costCents: 520, priceCents: 799, stockMin: '24.000', category: 'Bebidas sem álcool', supplier: 'Distribuidora Boa Compra' },
      { name: 'Gelo em cubos 5 kg', internalCode: 'GELO-5KG', barcode: '7892000000065', unit: 'BAG', costCents: 850, priceCents: 1290, stockMin: '10.000', category: 'Destilados e gelo', supplier: 'Bebidas Central' },
    ],
  },
};

async function ensureCategory(db: Db, companyId: string, definition: { name: string; description: string }): Promise<string> {
  await db.query('INSERT INTO categories(id,company_id,name,description) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', [randomUUID(), companyId, definition.name, definition.description]);
  const found = await db.query<{ id: string }>('SELECT id FROM categories WHERE company_id=$1 AND lower(name)=lower($2)', [companyId, definition.name]);
  if (!found.rows[0]) throw new Error('Falha ao criar categoria de demonstração.');
  return found.rows[0].id;
}

async function ensureSupplier(db: Db, companyId: string, name: string): Promise<string> {
  await db.query('INSERT INTO suppliers(id,company_id,name) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE company_id=$2 AND name=$3)', [randomUUID(), companyId, name]);
  const found = await db.query<{ id: string }>('SELECT id FROM suppliers WHERE company_id=$1 AND name=$2', [companyId, name]);
  if (!found.rows[0]) throw new Error('Falha ao criar fornecedor de demonstração.');
  return found.rows[0].id;
}

async function ensureCustomer(db: Db, companyId: string, name: string): Promise<string> {
  await db.query('INSERT INTO customers(id,company_id,name) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM customers WHERE company_id=$2 AND name=$3)', [randomUUID(), companyId, name]);
  const found = await db.query<{ id: string }>('SELECT id FROM customers WHERE company_id=$1 AND name=$2', [companyId, name]);
  if (!found.rows[0]) throw new Error('Falha ao criar cliente de demonstração.');
  return found.rows[0].id;
}

async function ensureCatalog(db: Db, companyId: string, kind: CompanyKind) {
  const definition = catalog[kind];
  const categories = new Map<string, string>();
  for (const category of definition.categories) categories.set(category.name, await ensureCategory(db, companyId, category));
  const suppliers = new Map<string, string>();
  for (const supplier of definition.suppliers) suppliers.set(supplier, await ensureSupplier(db, companyId, supplier));
  for (const customer of definition.customers) await ensureCustomer(db, companyId, customer);
  for (const product of definition.products) {
    const categoryId = categories.get(product.category);
    const supplierId = suppliers.get(product.supplier);
    if (!categoryId || !supplierId) throw new Error('Referência de catálogo de demonstração ausente.');
    await db.query(`INSERT INTO products(id,company_id,name,internal_code,barcode,category_id,unit,cost_cents,price_cents,stock_min,supplier_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (company_id,internal_code) DO NOTHING`, [randomUUID(), companyId, product.name, product.internalCode, product.barcode, categoryId, product.unit, product.costCents, product.priceCents, product.stockMin, supplierId]);
  }
}

export async function seedDevelopment(db: Db, options: { password?: string } = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Seed demonstrativo é proibido em produção.');
  const email = 'admin@jg.local';
  const password = options.password ?? `${randomBytes(18).toString('base64url')}aA7!`;
  if (password.length < 12 || password.length > 128) throw new Error('Senha de desenvolvimento deve ter entre 12 e 128 caracteres.');
  const hashed = await hashPassword(password);
  return db.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(731460202)');
    const existing = await tx.query<{ id: string }>('SELECT id FROM users WHERE email=$1', [email]);
    let userId: string;
    let created = false;
    let companyIds: string[];
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      const memberships = await tx.query<{ companyId: string; kind: CompanyKind }>(`SELECT m.company_id AS "companyId",c.kind
        FROM company_memberships m JOIN companies c ON c.id=m.company_id WHERE m.user_id=$1 ORDER BY m.created_at,m.id`, [userId]);
      companyIds = memberships.rows.map(membership => membership.companyId);
      for (const membership of memberships.rows) await ensureCatalog(tx, membership.companyId, membership.kind);
      return { created, email, password: null, userId, companyIds };
    }

    created = true;
    userId = randomUUID();
    await tx.query('INSERT INTO users(id,name,email,password_hash,system_admin) VALUES($1,$2,$3,$4,true)', [userId, 'Administrador de demonstração', email, hashed]);
    companyIds = [];
    for (const [name, kind] of [['Depósito JG', 'DEPOSITO'], ['Adega JG', 'ADEGA']] as const) {
      const id = randomUUID();
      companyIds.push(id);
      await tx.query('INSERT INTO companies(id,name,legal_name,kind) VALUES($1,$2,$2,$3)', [id, name, kind]);
      await tx.query('INSERT INTO stores(id,company_id,name) VALUES($1,$2,$3)', [randomUUID(), id, 'Unidade principal']);
      await tx.query('INSERT INTO company_memberships(id,company_id,user_id,role_key) VALUES($1,$2,$3,$4)', [randomUUID(), id, userId, 'ADMIN']);
      await ensureCatalog(tx, id, kind);
      await tx.query('INSERT INTO audit_logs(id,company_id,actor_id,actor_name,action,entity_type,entity_id,after_data) VALUES($1,$2,$3,$4,$5,$6,$2,$7)', [randomUUID(), id, userId, 'Administrador de demonstração', 'development.seed', 'company', JSON.stringify({ name, kind, demonstration: true, catalog: true })]);
    }
    return { created, email, password, userId, companyIds };
  });
}
