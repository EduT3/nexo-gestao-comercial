/** Version 5: received purchase snapshots and their payable, linked within company. */
export const LEGACY_LOCAL_PURCHASE_SCHEMA = `
CREATE TABLE local_purchases(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,supplier_id TEXT NOT NULL,actor_id TEXT NOT NULL REFERENCES local_users(id),request_key TEXT NOT NULL,request_payload TEXT NOT NULL,total_cents INTEGER NOT NULL CHECK(total_cents>=0),notes TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),UNIQUE(company_id,id),UNIQUE(company_id,request_key),FOREIGN KEY(company_id,supplier_id) REFERENCES local_suppliers(company_id,id)) STRICT;
CREATE TABLE local_purchase_items(company_id TEXT NOT NULL,purchase_id TEXT NOT NULL,product_id TEXT NOT NULL,product_name TEXT NOT NULL,quantity_milli INTEGER NOT NULL CHECK(quantity_milli>0),unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents>=0),total_cents INTEGER NOT NULL CHECK(total_cents>=0),PRIMARY KEY(company_id,purchase_id,product_id),FOREIGN KEY(company_id,purchase_id) REFERENCES local_purchases(company_id,id),FOREIGN KEY(company_id,product_id) REFERENCES local_products(company_id,id)) STRICT;
CREATE TABLE local_purchase_payables(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,purchase_id TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),due_date TEXT NOT NULL,notes TEXT NOT NULL,UNIQUE(company_id,purchase_id),UNIQUE(company_id,id),FOREIGN KEY(company_id,purchase_id) REFERENCES local_purchases(company_id,id)) STRICT;
CREATE TRIGGER local_purchase_immutable_update BEFORE UPDATE ON local_purchases BEGIN SELECT RAISE(ABORT,'Compra imutável'); END;
CREATE TRIGGER local_purchase_immutable_delete BEFORE DELETE ON local_purchases BEGIN SELECT RAISE(ABORT,'Compra imutável'); END;
CREATE TRIGGER local_purchase_item_immutable_update BEFORE UPDATE ON local_purchase_items BEGIN SELECT RAISE(ABORT,'Item imutável'); END;
CREATE TRIGGER local_purchase_item_immutable_delete BEFORE DELETE ON local_purchase_items BEGIN SELECT RAISE(ABORT,'Item imutável'); END;
CREATE TRIGGER local_purchase_payable_immutable_update BEFORE UPDATE ON local_purchase_payables BEGIN SELECT RAISE(ABORT,'Título imutável'); END;
CREATE TRIGGER local_purchase_payable_immutable_delete BEFORE DELETE ON local_purchase_payables BEGIN SELECT RAISE(ABORT,'Título imutável'); END;
`;

/** Version12: an unidentified supplier is NULL; company itself always remains linked. */
export const LOCAL_PURCHASE_SCHEMA = LEGACY_LOCAL_PURCHASE_SCHEMA.replace(
 'company_id TEXT NOT NULL,supplier_id TEXT NOT NULL,',
 'company_id TEXT NOT NULL REFERENCES local_companies(id),supplier_id TEXT,');
const parentTable=LOCAL_PURCHASE_SCHEMA.slice(LOCAL_PURCHASE_SCHEMA.indexOf('CREATE TABLE local_purchases('),LOCAL_PURCHASE_SCHEMA.indexOf('CREATE TABLE local_purchase_items('));
const parentTriggers=LOCAL_PURCHASE_SCHEMA.slice(LOCAL_PURCHASE_SCHEMA.indexOf('CREATE TRIGGER local_purchase_immutable_update'),LOCAL_PURCHASE_SCHEMA.indexOf('CREATE TRIGGER local_purchase_item_immutable_update'));
/** Same queued transaction, foreign_keys stays ON. Deferred links are resolved by reinserting parents before commit. */
export const OPTIONAL_SUPPLIER_MIGRATION=`
PRAGMA defer_foreign_keys=ON;
CREATE TEMP TABLE nexo_purchase_v12 AS SELECT rowid AS migration_rowid,* FROM local_purchases ORDER BY rowid;
DROP TABLE local_purchases;
${parentTable}
INSERT INTO local_purchases(rowid,id,company_id,supplier_id,actor_id,request_key,request_payload,total_cents,notes,created_at)
 SELECT migration_rowid,id,company_id,supplier_id,actor_id,request_key,request_payload,total_cents,notes,created_at FROM nexo_purchase_v12 ORDER BY migration_rowid;
${parentTriggers}
DROP TABLE nexo_purchase_v12;
`;
