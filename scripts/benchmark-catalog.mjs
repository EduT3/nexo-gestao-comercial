import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [baseline, candidate, report] = process.argv.slice(2);
assert(baseline && candidate && report, 'Informe os dois diretórios dist/local-runtime e o arquivo de saída.');
const modules = await Promise.all([baseline, candidate].map(async directory => {
  const load = relative => import(pathToFileURL(path.resolve(directory, 'local', relative + '.js')));
  const [sqlite, migrations, onboarding, catalog, stock, sales] =
    await Promise.all(['sqlite','migrations','onboarding','catalog','stock','sale-history'].map(load));
  return {...sqlite, ...migrations, ...onboarding, ...catalog, ...stock, ...sales};
}));
const folder = await mkdtemp(path.join(os.tmpdir(), 'nexo-catalog-bench-'));
const store = 'adega-jg';
const output = {machine: {cpu:os.cpus()[0].model, ramBytes:os.totalmem(), node:process.version, sqlite:process.versions.sqlite}, samples:12, datasets:[]};
const digest = result => createHash('sha256').update(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value)).digest('hex');
const stats = values => {
  const ordered = values.toSorted((left,right)=>left-right);
  return {medianMs:+ordered[Math.ceil(values.length/2)-1].toFixed(3), p95Ms:+ordered[Math.ceil(values.length*.95)-1].toFixed(3)};
};
try {
  for (const count of [1000,10000,50000]) {
    const file = path.join(folder, 'seed.sqlite');
    const db = modules[0].openLocalDatabase(file);
    let owner;
    try {
      await modules[0].prepareLocalDatabase(db, file);
      owner = await modules[0].initializeLocalOwner(db, 'Responsável de teste');
      await db.transaction(async tx => {
        await tx.query("INSERT INTO local_cash_sessions(id,company_id,actor_id,opening_cents,request_key) VALUES ('cash',?,?,0,'request')", [store,owner.id]);
        const seq = 'WITH RECURSIVE seq(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM seq WHERE i<'+count+') ';
        await tx.query(seq+"INSERT INTO local_products SELECT 'p-'||i,?,printf('Produto %06d',i),'SKU-'||i,NULL,'UNIT',150,250,0,1 FROM seq", [store]);
        await tx.query(seq+"INSERT INTO local_sales(id,company_id,session_id,actor_id,request_key,request_payload,subtotal_cents,discount_cents,total_cents,notes,created_at) SELECT 's-'||i,?,'cash',?,'r-'||i,'{}',250,0,250,'',strftime('%Y-%m-%dT%H:%M:%fZ','2026-01-01','+'||i||' seconds') FROM seq", [store,owner.id]);
        await tx.query("INSERT INTO local_sale_payments SELECT company_id,id,'PIX',250,250,0 FROM local_sales");
        await tx.query("INSERT INTO local_sale_items SELECT company_id,id,'p-'||substr(id,3),'Produto',1000,250,150,250 FROM local_sales");
        await tx.query("INSERT INTO local_sale_revenues SELECT company_id,id,total_cents FROM local_sales");
        await tx.query("INSERT INTO local_stock_movements(id,company_id,product_id,actor_id,quantity_milli,unit_cost_cents,reason,operation_id) SELECT 'in-'||id,company_id,id,?,3000,150,'OPENING','opening' FROM local_products", [owner.id]);
        await tx.query("INSERT INTO local_stock_movements(id,company_id,product_id,actor_id,quantity_milli,unit_cost_cents,reason,operation_id,created_at) SELECT 'out-'||id,company_id,'p-'||substr(id,3),actor_id,-1000,150,'SALE',id,created_at FROM local_sales");
      });
      assert.equal((await db.query('PRAGMA integrity_check'))[0].integrity_check,'ok');
      assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
    } finally { await db.close(); }
    const dbs = [];
    try {
      for (let index=0; index<modules.length; index++) {
        const copy = path.join(folder, index+'.sqlite');
        await copyFile(file, copy);
        dbs.push(modules[index].openLocalDatabase(copy));
      }
      const queries = {
        catalog: (module, connection) => module.listLocalProducts(connection,owner.id,store),
        stock: (module, connection) => module.listLocalStock(connection,owner.id,store),
        salesHistory: (module, connection) => module.listLocalSaleHistory(connection,owner.id,store,{page:5}),
        stockHistory: (module, connection) => module.listLocalStockHistory(connection,owner.id,store,{offset:250}),
      };
      const measurements = {};
      for (const [name, query] of Object.entries(queries)) {
        const times = [[],[]];
        const digests = [];
        for (let round=0; round<14; round++) {
          for (const index of round%2 ? [1,0] : [0,1]) {
            const begin = performance.now();
            const value = await query(modules[index],dbs[index]);
            const elapsed = performance.now()-begin;
            if (round===0) digests[index]=digest(value);
            if (round>=2) times[index].push(elapsed);
          }
        }
        assert.equal(digests[0],digests[1],name+' divergiu');
        measurements[name]={before:stats(times[0]),after:stats(times[1]),resultSha256:digests[0]};
      }
      output.datasets.push({products:count,sales:count,stockMovements:2*count,measurements});
      console.log(JSON.stringify(output.datasets.at(-1)));
    } finally {
      await Promise.all(dbs.map(database=>database.close()));
      for (const name of ['seed','0','1']) await rm(path.join(folder,name+'.sqlite'),{force:true});
    }
  }
  await writeFile(report,JSON.stringify(output,null,2)+'\n');
} finally { await rm(folder,{recursive:true,force:true}); }
