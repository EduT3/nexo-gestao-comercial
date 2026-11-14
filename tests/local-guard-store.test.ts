import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const { createGuardStore } = createRequire(import.meta.url)('../electron/guard-store.cjs');
const { createGuardBroker } = createRequire(import.meta.url)('../electron/guard-broker.cjs');

it('persiste ativação voluntária, ações e mudanças autorizadas', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-'));
  try {
    const guard = createGuardStore(folder);
    const config = { enabled: true, all: false, actions: ['backup'] };
    expect((await guard.status()).enabled).toBe(false);
    await guard.configure({ ...config, pin: '0123', confirmation: '0123' });
    const reopened = createGuardStore(folder);
    expect(await reopened.status()).toMatchObject(config);
    expect(await readFile(path.join(folder, 'guard.json'), 'utf8')).not.toContain('"0123"');
    await reopened.authorize('sale', undefined);
    await expect(reopened.authorize('backup', '9999')).rejects.toThrow('PIN incorreto');
    await expect(reopened.configure({ ...config, enabled: false, currentPin: '9999' })).rejects.toThrow();
    expect((await reopened.status()).enabled).toBe(true);
    await reopened.configure({ ...config, all: true, currentPin: '0123', pin: '5678', confirmation: '5678' });
    await reopened.authorize('backup', '5678');
    await reopened.configure({ ...config, enabled: false, currentPin: '5678' });
    expect((await reopened.status()).enabled).toBe(false);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

it('serializa tentativas concorrentes e preserva bloqueio ao reabrir', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-'));
  try {
    const guard = createGuardStore(folder);
    await guard.configure({ enabled: true, all: true, actions: [], pin: '0123', confirmation: '0123' });
    const attempts = await Promise.allSettled(Array.from({length: 6}, () => guard.authorize('backup', '9999')));
    expect(attempts.every(result => result.status === 'rejected')).toBe(true);
    const reopened = createGuardStore(folder);
    expect((await reopened.status()).blockedUntil).toBeGreaterThan(Date.now());
    await expect(reopened.authorize('backup', '0123')).rejects.toThrow('bloqueio');
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});


it('recovers only with the individual key and rotates it after use', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-'));
  try {
    const guard = createGuardStore(folder);
    const activated = await guard.configure({enabled:true,all:true,actions:[],pin:'0123',confirmation:'0123'});
    expect(activated.recoveryKey).toMatch(/^[0-9a-f]{48}$/);
    expect(await readFile(path.join(folder,'guard.json'),'utf8')).not.toContain(activated.recoveryKey);
    await expect(guard.recover({key:'0'.repeat(48),pin:'4321',confirmation:'4321'})).rejects.toThrow();
    const reset = await guard.recover({key:activated.recoveryKey,pin:'4321',confirmation:'4321'});
    expect(reset.recoveryKey).not.toBe(activated.recoveryKey);
    await expect(guard.recover({key:activated.recoveryKey,pin:'1111',confirmation:'1111'})).rejects.toThrow();
    await expect(guard.authorize('restore','4321')).resolves.toBeUndefined();
  } finally {
    await rm(folder,{recursive:true,force:true});
  }
});

it('keeps the original policy and PIN when a replacement cannot be confirmed', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-'));
  try {
    const guard = createGuardStore(folder);
    const policy = {enabled:true,all:false,actions:['backup']};
    await guard.configure({...policy,pin:'0123',confirmation:'0123'});
    const file = path.join(folder,'guard.json');
    const original = await readFile(file,'utf8');
    await expect(guard.configure({...policy,all:true,currentPin:'0123',pin:'4567',confirmation:'4568'})).rejects.toThrow('iguais');
    expect(await readFile(file,'utf8')).toBe(original);
    await guard.authorize('backup','0123');
  } finally {
    await rm(folder,{recursive:true,force:true});
  }
});

it('keeps the active policy if a write is interrupted before replacing the file', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-write-failure-'));
  try {
    const guard = createGuardStore(folder);
    const policy = { enabled: true, all: false, actions: ['backup'] };
    await guard.configure({ ...policy, pin: '0123', confirmation: '0123' });
    const file = path.join(folder, 'guard.json');
    const before = await readFile(file);
    await mkdir(file + '.tmp');
    await expect(guard.configure({
      ...policy, all: true, currentPin: '0123',
    })).rejects.toThrow();
    expect(await readFile(file)).toEqual(before);
    await rm(file + '.tmp', { recursive: true });
    const reopened = createGuardStore(folder);
    expect(await reopened.status()).toMatchObject(policy);
    await expect(reopened.authorize('backup', '0123')).resolves.toBeUndefined();
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});


it('requires PIN for an already protected request even after its policy changes', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-policy-race-'));
  try {
    const guard = createGuardStore(folder);
    await guard.configure({enabled:true,all:true,actions:[],pin:'0123',confirmation:'0123'});
    await guard.configure({enabled:true,all:false,actions:[],currentPin:'0123'});
    await expect(guard.authorize('backup','9999',{required:true})).rejects.toThrow('PIN incorreto');
    await expect(guard.authorize('backup','0123',{required:true})).resolves.toBeUndefined();
    await guard.configure({enabled:false,all:false,actions:[],currentPin:'0123'});
    await expect(guard.authorize('backup','0123',{required:true})).rejects.toThrow('proteção mudou');
  } finally {
    await rm(folder,{recursive:true,force:true});
  }
});


it('does not execute a pending operation with an incorrect PIN after its policy changes', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-pending-policy-'));
  try {
    const store = createGuardStore(folder);
    await store.configure({enabled:true,all:true,actions:[],pin:'0123',confirmation:'0123'});
    const broker = createGuardBroker(store);
    let executions = 0;
    const message = await broker.run('backup', () => ++executions).catch((error: Error) => error.message);
    const id = message.split(':')[1];
    await store.configure({enabled:true,all:false,actions:[],currentPin:'0123'});
    await expect(broker.approve(id,'9999')).rejects.toThrow('PIN incorreto');
    expect(executions).toBe(0);
    await expect(broker.approve(id,'0123')).resolves.toBe(1);
  } finally {
    await rm(folder,{recursive:true,force:true});
  }
});


it('protects only selected administrative actions until global protection is enabled', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'nexo-guard-selected-actions-'));
  try {
    const store = createGuardStore(folder);
    await store.configure({enabled:true,all:false,actions:['backup'],pin:'0123',confirmation:'0123'});
    const guard = createGuardBroker(store);
    let backups = 0;
    let updates = 0;
    await expect(guard.run('update-product',()=>++updates)).resolves.toBe(1);
    const pending = await guard.run('backup',()=>++backups).catch((error: Error)=>error.message);
    expect(pending).toMatch(/^NEXO_GUARD_REQUIRED:/);
    expect(backups).toBe(0);
    await expect(guard.approve(pending.split(':')[1],'9999')).rejects.toThrow('PIN incorreto');
    expect(backups).toBe(0);
    await expect(guard.approve(pending.split(':')[1],'0123')).resolves.toBe(1);
    await store.configure({enabled:true,all:true,actions:['backup'],currentPin:'0123'});
    const protectedUpdate = await guard.run('update-product',()=>++updates).catch((error: Error)=>error.message);
    expect(protectedUpdate).toMatch(/^NEXO_GUARD_REQUIRED:/);
    expect(updates).toBe(1);
    await expect(guard.approve(protectedUpdate.split(':')[1],'0123')).resolves.toBe(2);
  } finally {
    await rm(folder,{recursive:true,force:true});
  }
});
