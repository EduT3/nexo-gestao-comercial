import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildApp } from '../src/server/app.js';
import { createDatabase } from '../src/server/db.js';
import { migrate } from '../src/server/migrate.js';
import { seedDevelopment } from '../src/server/seed.js';

// Always disposable: never load .env, DATABASE_URL or a local business database.
const db = await createDatabase({ dataDir: 'memory://' });
const origin = 'http://127.0.0.1:5173';
const password = randomBytes(32).toString('base64url') + 'aA7!';
let app: Awaited<ReturnType<typeof buildApp>> | undefined;
try {
  await migrate(db); await seedDevelopment(db, { password });
  app = await buildApp({ db, origin, demo: true, logger: false });
  const login = await app.inject({ method:'POST', url:'/api/auth/login', headers:{origin}, payload:{email:'admin@jg.local',password} });
  if (login.statusCode !== 200) throw new Error('Não foi possível gerar a prévia.');
  const session = login.json();
  const headers = { origin, cookie: String(login.headers['set-cookie']).split(';')[0]!, 'x-csrf-token':session.csrfToken };
  const snapshot: Record<string, unknown> = {};
  // Public display context, never an actual credential or usable session token.
  snapshot['/auth/session'] = { ...session, csrfToken:'visual-preview', user:{...session.user,name:'Visitante da prévia',email:'preview@example.invalid'} };
  for (const company of session.companies) {
    const products = (await db.query<{id:string}>('SELECT id FROM products WHERE company_id=$1 ORDER BY name',[company.id])).rows;
    for (const [index, product] of products.entries()) {
      const response = await app.inject({method:'POST',url:`/api/companies/${company.id}/inventory/movements`,headers:{...headers,'idempotency-key':randomUUID()},payload:{productId:product.id,type:'ENTRY_MANUAL',direction:'IN',quantity:`${index === 0 ? 3 : 20}.000`,notes:'Estoque fictício para avaliação visual'}});
      if (response.statusCode !== 201) throw new Error('Falha ao preparar estoque da prévia.');
    }
    const resources = ['overview','products','categories','customers','suppliers','inventory','inventory/movements','purchases','sales','cash/current','cash/movements','finance','users','audit'];
    for (const resource of resources) {
      const path = `/companies/${company.id}/${resource}`;
      const response = await app.inject({url:`/api${path}`,headers});
      if (response.statusCode !== 200) throw new Error(`Consulta da prévia indisponível: ${resource}`);
      snapshot[path] = response.json();
    }
  }
  snapshot['/companies'] = { companies:session.companies };
  const directory = new URL('../src/client/preview/',import.meta.url);
  await mkdir(directory,{recursive:true});
  await writeFile(new URL('snapshot.json',directory),JSON.stringify(snapshot,null,2)+'\n');
} finally { await app?.close(); await db.close(); }
