import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { buildApp } from '../../src/server/app.js';
import { createDatabase, type Db } from '../../src/server/db.js';
import { migrate } from '../../src/server/migrate.js';
import { seedDevelopment } from '../../src/server/seed.js';

const password = process.env.NEXO_E2E_PASSWORD;
const controlToken = process.env.NEXO_E2E_CONTROL_TOKEN;
if (process.env.NODE_ENV !== 'test' || !password || !controlToken) {
  throw new Error('Execute este servidor exclusivamente pelo comando npm run test:e2e.');
}

// No config loader or DATABASE_URL: an existing business database is never selected.
const temporaryRoot = await realpath(tmpdir());
const dataDir = await mkdtemp(join(temporaryRoot, 'nexo-e2e-'));
let db: Db | undefined;
let api: Awaited<ReturnType<typeof buildApp>> | undefined;
let web: ViteDevServer | undefined;
let closingData: Promise<void> | undefined;
let closing: Promise<void> | undefined;

function closeData() {
  closingData ??= (async () => {
    await web?.close();
    await db?.close();
    const resolved = await realpath(dataDir);
    if (dirname(resolved) !== resolve(temporaryRoot) || !basename(resolved).startsWith('nexo-e2e-')) {
      throw new Error('Diretório temporário fora do escopo de limpeza.');
    }
    await rm(resolved, { recursive: true, force: false, maxRetries: 3, retryDelay: 100 });
  })();
  return closingData;
}

function shutdown() {
  closing ??= (async () => { await api?.close(); await closeData(); })();
  return closing;
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void shutdown().catch(() => { process.exitCode = 1; }); });
}

try {
  db = await createDatabase({ dataDir });
  await migrate(db);
  await seedDevelopment(db, { password });
  api = await buildApp({ db, origin: 'http://127.0.0.1:5174', demo: true, logger: false, rateLimitMax: 10000, loginRateLimitMax: 100 });
  // This route exists only in this test launcher, never in the product API.
  // Explicit teardown closes resources on Windows, where process signals are not reliable.
  api.post('/__e2e__/shutdown', async (request, reply) => {
    if (request.headers['x-e2e-control'] !== controlToken) return reply.code(403).send({ error: 'Forbidden' });
    await closeData();
    reply.raw.once('finish', () => { void api?.close(); });
    return { closed: true };
  });
  await api.listen({ host: '127.0.0.1', port: 3101 });
  web = await createServer({
    configFile: false,
    envDir: false,
    plugins: [react()],
    server: {
      host: '127.0.0.1', port: 5174, strictPort: true,
      proxy: { '/api': 'http://127.0.0.1:3101' },
    },
  });
  await web.listen();
  process.stdout.write('E2E: API 3101 + web 5174; banco temporário exclusivo pronto.\n');
} catch {
  await shutdown();
  process.stderr.write('E2E: falha ao iniciar o ambiente temporário. Confira as portas 3101 e 5174 e o runtime.\n');
  process.exitCode = 1;
}
