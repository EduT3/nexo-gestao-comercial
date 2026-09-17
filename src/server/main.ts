import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { migrate } from './migrate.js';

async function main() {
  const config = loadConfig();
  const db = await createDatabase(config);
  try {
    if (!config.production) await migrate(db);
    else await db.query('SELECT 1 FROM schema_migrations LIMIT 1');
    const app = await buildApp({ db, origin: config.origin, production: config.production, demo: !config.production, logger: true });
    let closing = false;
    const shutdown = async () => {
      if (closing) return; closing = true;
      try { await app.close(); await db.close(); } catch { process.exitCode = 1; }
    };
    process.once('SIGINT', () => { void shutdown(); });
    process.once('SIGTERM', () => { void shutdown(); });
    await app.listen({ host: config.host, port: config.port });
  } catch (error) { await db.close(); throw error; }
}
main().catch((error: unknown) => {
  // Connection URLs and database errors may contain credentials: never print them.
  const isConfiguration = error instanceof Error && /^(NODE_ENV|HOST|APP_ORIGIN|DATA_DIR|DATABASE_URL)/.test(error.message);
  process.stderr.write(`${isConfiguration ? (error as Error).message : 'Não foi possível iniciar o ERP. Confira a configuração, conexão e migrations do banco.'}\n`);
  process.exitCode = 1;
});
