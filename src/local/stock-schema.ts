/** Version 4: stock is derived from immutable movements, never overwritten. */
export const LOCAL_STOCK_SCHEMA = `
CREATE TABLE local_stock_movements(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,product_id TEXT NOT NULL,actor_id TEXT NOT NULL REFERENCES local_users(id),quantity_milli INTEGER NOT NULL CHECK(quantity_milli<>0),unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents>=0),reason TEXT NOT NULL CHECK(reason IN('OPENING','PURCHASE','SALE','REVERSAL','ADJUSTMENT')),operation_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),FOREIGN KEY(company_id,product_id) REFERENCES local_products(company_id,id),UNIQUE(company_id,operation_id,product_id)) STRICT;
CREATE INDEX local_stock_product_idx ON local_stock_movements(company_id,product_id);
CREATE TRIGGER local_stock_immutable_update BEFORE UPDATE ON local_stock_movements BEGIN SELECT RAISE(ABORT,'Histórico de estoque imutável'); END;
CREATE TRIGGER local_stock_immutable_delete BEFORE DELETE ON local_stock_movements BEGIN SELECT RAISE(ABORT,'Histórico de estoque imutável'); END;
`;
