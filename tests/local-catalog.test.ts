import { expect,it } from 'vitest';
import { openLocalDatabase } from '../src/local/sqlite';
import { createLocalProduct,initializeLocalCatalog,listLocalProducts,updateLocalProduct } from '../src/local/catalog';

it('cadastro SQLite valida empresa/perfil, unicidade e auditoria transacional',async()=>{
  const db=openLocalDatabase(':memory:');
  try{
    await initializeLocalCatalog(db);await initializeLocalCatalog(db);
    await db.query('INSERT INTO local_users VALUES(?,?,1)',['admin','Administrador']);
    await db.query('INSERT INTO local_users VALUES(?,?,1)',['operator','Operador']);
    await db.query('INSERT INTO local_memberships VALUES(?,?,?,1)',['adega-jg','admin','ADMIN']);
    await db.query('INSERT INTO local_memberships VALUES(?,?,?,1)',['adega-jg','operator','OPERADOR']);
    const body={name:'Produto local',internalCode:'LOCAL-1',barcode:null,categoryId:null,supplierId:null,unit:'UNIT',costCents:123,priceCents:456,stockMin:'1.250',active:true};
    await expect(createLocalProduct(db,'admin','deposito-jg',body)).rejects.toThrow('acesso ativo');
    await expect(createLocalProduct(db,'operator','adega-jg',body)).rejects.toThrow('consultar');
    const created = await createLocalProduct(db,'admin','adega-jg',body);
    expect(await listLocalProducts(db,'operator','adega-jg')).toHaveLength(1);
    expect((await listLocalProducts(db,'operator','adega-jg'))[0]).not.toHaveProperty('cost_cents');
    expect((await listLocalProducts(db,'admin','adega-jg'))[0]).toHaveProperty('cost_cents',123n);
    await expect(createLocalProduct(db,'admin','adega-jg',body)).rejects.toThrow();
    expect(await db.query('SELECT id FROM local_audit')).toHaveLength(1);
    await expect(updateLocalProduct(db,'operator','adega-jg',created.id,{active:false})).rejects.toThrow('consultar');
    await expect(updateLocalProduct(db,'admin','deposito-jg',created.id,{active:false})).rejects.toThrow('acesso ativo');
    await updateLocalProduct(db,'admin','adega-jg',created.id,{priceCents:789,active:false});
    expect((await listLocalProducts(db,'admin','adega-jg'))[0]).toMatchObject({active:0n,price_cents:789n,cost_cents:123n,stock_min_milli:1250n});
    expect(await db.query('SELECT id FROM local_audit')).toHaveLength(2);
    await db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON local_audit BEGIN SELECT RAISE(ABORT,'Falha tardia'); END;");
    await expect(createLocalProduct(db,'admin','adega-jg',{...body,internalCode:'LOCAL-2'})).rejects.toThrow('Falha tardia');
    await expect(updateLocalProduct(db,'admin','adega-jg',created.id,{priceCents:999})).rejects.toThrow('Falha tardia');
    expect((await listLocalProducts(db,'admin','adega-jg'))[0]).toHaveProperty('price_cents',789n);
    expect(await listLocalProducts(db,'admin','adega-jg')).toHaveLength(1);
  }finally{await db.close();}
});
