import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface Db {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DatabaseOptions { databaseUrl?: string; dataDir?: string; production?: boolean }

export async function createDatabase(options: DatabaseOptions = {}): Promise<Db> {
  if (options.production && !options.databaseUrl) throw new Error('DATABASE_URL é obrigatória em produção.');
  if (options.databaseUrl) {
    const pool = new pg.Pool({ connectionString: options.databaseUrl, max: 10, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 });
    const clientDb = (client: pg.PoolClient): Db => ({
      async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) { return { rows: (await client.query<T>(sql, params)).rows }; },
      async exec(sql) { await client.query(sql); },
      async transaction() { throw new Error('Transações aninhadas não são permitidas.'); },
      async close() { /* Owned by transaction. */ },
    });
    return {
      async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) { return { rows: (await pool.query<T>(sql, params)).rows }; },
      async exec(sql) { await pool.query(sql); },
      async transaction<T>(fn: (db: Db) => Promise<T>) {
        const client = await pool.connect();
        try { await client.query('BEGIN'); const result = await fn(clientDb(client)); await client.query('COMMIT'); return result; }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
      },
      async close() { await pool.end(); },
    };
  }
  const dataDir = options.dataDir ?? join(process.env.LOCALAPPDATA ?? join(homedir(), '.local', 'share'), 'JG-ERP', 'development');
  if (dataDir !== 'memory://') await mkdir(dataDir, { recursive: true });
  const engine = new PGlite(dataDir);
  await engine.waitReady;
  return {
    async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) { return { rows: (await engine.query<T>(sql, params)).rows }; },
    async exec(sql) { await engine.exec(sql); },
    async transaction<T>(fn: (db: Db) => Promise<T>) {
      return engine.transaction(async (tx) => fn({
        async query<R extends Record<string, unknown>>(sql: string, params: unknown[] = []) { return { rows: (await tx.query<R>(sql, params)).rows }; },
        async exec(sql) { await tx.exec(sql); },
        async transaction() { throw new Error('Transações aninhadas não são permitidas.'); },
        async close() { /* Owned by transaction. */ },
      }));
    },
    async close() { await engine.close(); },
  };
}
