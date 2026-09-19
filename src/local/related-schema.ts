/** Additive version 2: preserve products and their history while preparing related catalogs. */
export const LOCAL_RELATED_SCHEMA = `
CREATE TABLE local_categories(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES local_companies(id),name TEXT NOT NULL,description TEXT,active INTEGER NOT NULL CHECK(active IN(0,1)),UNIQUE(company_id,id),UNIQUE(company_id,name)) STRICT;
CREATE TABLE local_suppliers(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES local_companies(id),name TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),active INTEGER NOT NULL CHECK(active IN(0,1)),UNIQUE(company_id,id)) STRICT;
CREATE TABLE local_customers(id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES local_companies(id),name TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),active INTEGER NOT NULL CHECK(active IN(0,1)),UNIQUE(company_id,id)) STRICT;
`;
export const LOCAL_PRODUCT_CATEGORY_SCHEMA = `
CREATE TABLE local_product_categories(company_id TEXT NOT NULL,product_id TEXT NOT NULL,category_id TEXT,PRIMARY KEY(company_id,product_id),FOREIGN KEY(company_id,product_id) REFERENCES local_products(company_id,id),FOREIGN KEY(company_id,category_id) REFERENCES local_categories(company_id,id)) STRICT;
`;
