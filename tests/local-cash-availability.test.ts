import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {openLocalDatabase} from '../src/local/sqlite';import {prepareLocalDatabase} from '../src/local/migrations';import {initializeLocalOwner} from '../src/local/onboarding';import {setInitialLocalPassword,createLocalOperator} from '../src/local/access';
import {getLocalCashAvailability,listLocalCash,openLocalCash,moveLocalCash,closeLocalCash} from '../src/local/cash';
it('situação do caixa é autorizada, exata, não grava registros e distingue o operador mesmo com mais de cem fechamentos',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'nexo-cash-guidance-')),file=path.join(folder,'nexo.sqlite'),db=openLocalDatabase(file);
 try{
  await prepareLocalDatabase(db,file);const owner=await initializeLocalOwner(db,'Responsável');await setInitialLocalPassword(db,owner.id,'senha-teste-123');const operator=await createLocalOperator(db,owner.id,{name:'Operador',password:'senha-operador',companies:['adega-jg']});
  expect(await getLocalCashAvailability(db,owner.id,'adega-jg')).toEqual({open:false});
  const opened=await openLocalCash(db,owner.id,'adega-jg',randomUUID(),{openingCents:100});await moveLocalCash(db,owner.id,'adega-jg',randomUUID(),{sessionId:opened.id,kind:'SUPPLY',amountCents:25,notes:'Suprimento de teste'});
  const audit=await db.query('SELECT * FROM local_audit ORDER BY id');
  expect(await getLocalCashAvailability(db,owner.id,'adega-jg')).toMatchObject({open:true,canSell:true,operatorName:'Responsável',balanceCents:125n});
  expect(await getLocalCashAvailability(db,operator.id,'adega-jg')).toMatchObject({open:true,canSell:false,operatorName:'Responsável',balanceCents:125n});
  expect((await listLocalCash(db,operator.id,'adega-jg'))[0]).toMatchObject({can_operate:false,actor_name:'Responsável'});
  expect(await getLocalCashAvailability(db,owner.id,'deposito-jg')).toEqual({open:false});await expect(getLocalCashAvailability(db,operator.id,'deposito-jg')).rejects.toThrow('acesso ativo');
  expect(await db.query('SELECT * FROM local_audit ORDER BY id')).toEqual(audit);
  await closeLocalCash(db,owner.id,'adega-jg',opened.id,{countedCents:125});
  for(let i=0;i<101;i++){const session=await openLocalCash(db,owner.id,'adega-jg',randomUUID(),{openingCents:0});await closeLocalCash(db,owner.id,'adega-jg',session.id,{countedCents:0});}
  const next=await openLocalCash(db,operator.id,'adega-jg',randomUUID(),{openingCents:0});expect((await listLocalCash(db,operator.id,'adega-jg'))[0]).toMatchObject({id:next.id,can_operate:true});expect(await getLocalCashAvailability(db,operator.id,'adega-jg')).toMatchObject({open:true,canSell:true});
 }finally{await db.close();if(!path.resolve(folder).startsWith(path.resolve(tmpdir())+path.sep))throw Error('Pasta inválida');await rm(folder,{recursive:true,force:true});}
});
