import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { permissions, roles, roleLabels, rolePermissions } from '../shared/contracts.js';
import type { Db } from './db.js';

export async function migrate(db: Db): Promise<void> {
  const directory = fileURLToPath(new URL('../../migrations/', import.meta.url));
  const names = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  await db.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(731460201)');
    await tx.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const existing = await tx.query<{ name: string; checksum: string }>('SELECT name, checksum FROM schema_migrations');
    for (const row of existing.rows) {
      if (!names.includes(row.name)) throw new Error(`Migration aplicada não encontrada: ${row.name}`);
    }
    for (const name of names) {
      const sql = await readFile(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const installed = existing.rows.find((row) => row.name === name);
      if (installed) {
        if (installed.checksum !== checksum) throw new Error(`Migration alterada após aplicação: ${name}`);
        continue;
      }
      await tx.exec(sql);
      await tx.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
    }
    // Seed the current role matrix only after all migrations. Migration 002 replaces
    // the legacy role check constraint and must run before ADMIN/OPERADOR are inserted.
    for (const permission of permissions) await tx.query('INSERT INTO permissions (key) VALUES ($1) ON CONFLICT DO NOTHING', [permission]);
    for (const role of roles) {
      await tx.query('INSERT INTO roles (key,label) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET label=excluded.label', [role, roleLabels[role]]);
      await tx.query('DELETE FROM role_permissions WHERE role_key=$1', [role]);
      for (const permission of rolePermissions[role]) await tx.query('INSERT INTO role_permissions (role_key,permission_key) VALUES ($1,$2)', [role, permission]);
    }
  });
}
