import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const { createGuardStore } = createRequire(import.meta.url)('../electron/guard-store.cjs');

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
