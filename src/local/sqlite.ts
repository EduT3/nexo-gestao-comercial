import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export interface LocalDatabase {
  query(sql:string,params?:SQLInputValue[]):Promise<Record<string,unknown>[]>;
  exec(sql:string):Promise<void>;
  transaction<T>(operation:(tx:LocalDatabase)=>Promise<T>):Promise<T>;
  close():Promise<void>;
  backup(destination:string):Promise<void>;
}

/** Trusted main-process interface. Never expose SQL to the renderer. */
export function openLocalDatabase(path:string):LocalDatabase {
  const engine=new DatabaseSync(path);
  try { engine.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;'); }
  catch (error) { engine.close(); throw error; }
  let queue=Promise.resolve();
  let closed=false;
  function enqueue<T>(operation:()=>Promise<T>):Promise<T>{
    const result=queue.then(()=>{if(closed)throw new Error('Banco local fechado.');return operation();});
    queue=result.then(()=>undefined,()=>undefined);
    return result;
  }
  const tx:LocalDatabase={
    async query(sql,params=[]){const statement=engine.prepare(sql);statement.setReadBigInts(true);return statement.all(...params);},
    async exec(sql){engine.exec(sql);},
    async transaction(){throw new Error('Transações aninhadas não são permitidas.');},
    async close(){throw new Error('A transação não pode fechar o banco.');},
    async backup(){throw new Error('Backup não pode ser executado dentro da transação.');},
  };
  return {
    query:(sql,params)=>enqueue(()=>tx.query(sql,params)),
    exec:sql=>enqueue(()=>tx.exec(sql)),
    transaction:operation=>enqueue(async()=>{
      engine.exec('BEGIN IMMEDIATE');
      try{const value=await operation(tx);engine.exec('COMMIT');return value;}
      catch(error){engine.exec('ROLLBACK');throw error;}
    }),
    close:()=>enqueue(async()=>{engine.close();closed=true;}),
    backup:destination=>enqueue(async()=>{engine.prepare('VACUUM INTO ?').run(destination);}),
  };
}
