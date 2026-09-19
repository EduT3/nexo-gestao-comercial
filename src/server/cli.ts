import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { migrate } from './migrate.js';
import { seedDevelopment } from './seed.js';

async function main() {
  const command = process.argv[2];
  if (!['migrate', 'seed'].includes(command ?? '')) throw new Error('Use: npm run db:migrate ou npm run db:seed.');
  const config = loadConfig();
  if (command === 'seed' && config.production) throw new Error('Seed demonstrativo é proibido em produção.');
  const db = await createDatabase(config);
  try {
    await migrate(db);
    if (command === 'migrate') { process.stdout.write('Migrations aplicadas e verificadas.\n'); return; }
    const seeded = await seedDevelopment(db);
    if (!seeded.created) { process.stdout.write('Demonstração já existe. Nenhuma senha foi alterada.\n'); return; }
    const directory = resolve('.local');
    await mkdir(directory, { recursive: true });
    const credentialFile = resolve(directory, 'seed-credentials.txt');
    await writeFile(credentialFile, `SOMENTE DESENVOLVIMENTO LOCAL\nE-mail: ${seeded.email}\nSenha: ${seeded.password}\nAltere a senha no primeiro acesso. Não compartilhe nem publique este arquivo.\n`, { mode: 0o600, flag: 'wx' });
    process.stdout.write(`Demonstração criada: Depósito JG e Adega JG. Credenciais salvas em ${credentialFile}\n`);
  } finally { await db.close(); }
}
main().catch(() => { process.stderr.write('Falha no comando de banco. Confira o ambiente, a conexão, as migrations e o arquivo local de credenciais. Seed é permitido apenas em desenvolvimento.\n'); process.exitCode = 1; });
