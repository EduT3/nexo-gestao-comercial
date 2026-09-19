import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { openLocalDatabase } from '../src/local/sqlite';

it('SQLite real preserva inteiros/reabertura e desfaz gravação parcial',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'nexo-local-sqlite-'));
  const path=join(directory,'nexo.sqlite');
  let db=openLocalDatabase(path);
  try{
    await db.exec('CREATE TABLE entries(id TEXT PRIMARY KEY, amount_cents INTEGER NOT NULL CHECK(amount_cents>=0)) STRICT; CREATE TABLE audit(entry_id TEXT REFERENCES entries(id)) STRICT;');
    await db.transaction(async tx=>{
      await tx.query('INSERT INTO entries VALUES(?,?)',['persisted',9007199254740993n]);
      await tx.query('INSERT INTO audit VALUES(?)',['persisted']);
    });
    await expect(db.transaction(async tx=>{
      await tx.query('INSERT INTO entries VALUES(?,?)',['partial',250]);
      await tx.query('INSERT INTO audit VALUES(?)',['missing']);
    })).rejects.toThrow();
    expect(await db.query('SELECT id FROM entries WHERE id=?',['partial'])).toEqual([]);
    await db.close();db=openLocalDatabase(path);
    expect(await db.query('SELECT amount_cents FROM entries WHERE id=?',['persisted'])).toEqual([{amount_cents:9007199254740993n}]);
    expect(await db.query('PRAGMA integrity_check')).toEqual([{integrity_check:'ok'}]);
    expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
    await expect(db.transaction(tx=>tx.transaction(async()=>undefined))).rejects.toThrow('aninhadas');
  }finally{await db.close();await rm(directory,{recursive:true,force:true});}
});
