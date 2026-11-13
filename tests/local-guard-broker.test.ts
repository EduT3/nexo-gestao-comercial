import { createRequire } from 'node:module';
import { expect, it, vi } from 'vitest';

const { createGuardBroker } = createRequire(import.meta.url)('../electron/guard-broker.cjs');

it('blocks execution until PIN and consumes the original request once', async () => {
  const authorize = vi.fn(async (_action: string, pin: string) => {
    if (pin !== '0123') throw Error('PIN incorreto');
  });
  const guard = createGuardBroker({ status: async () => ({enabled:true,all:true}), authorize });
  const perform = vi.fn(() => 'original');
  const error = await guard.run('backup', perform).catch((failure: Error) => failure.message);
  const id = error.split(':')[1];
  expect(perform).not.toHaveBeenCalled();
  await expect(guard.approve(id, '9999')).rejects.toThrow('PIN incorreto');
  await expect(guard.approve(id, '0123')).resolves.toBe('original');
  await expect(guard.approve(id, '0123')).rejects.toThrow('expirada');
  expect(perform).toHaveBeenCalledTimes(1);
});

it('invalidates approval in flight when context changes', async () => {
  let finish!: () => void;
  const authorize = () => new Promise<void>(resolve => { finish = resolve; });
  const guard = createGuardBroker({ status: async () => ({enabled:true,all:true}), authorize });
  const perform = vi.fn();
  const error = await guard.run('restore', perform).catch((failure: Error) => failure.message);
  const approval = guard.approve(error.split(':')[1], '0123');
  guard.invalidate();
  finish();
  await expect(approval).rejects.toThrow('cancelada');
  expect(perform).not.toHaveBeenCalled();
});

it('discards a request if the company changes during permission lookup', async () => {
  let finish!: () => void;
  const checkPermission = () => new Promise<void>(resolve => { finish = resolve; });
  const guard = createGuardBroker({status:async()=>({enabled:true,all:true})});
  const perform = vi.fn();
  const request = guard.run('backup', perform, checkPermission);
  guard.invalidate();
  finish();
  await expect(request).rejects.toThrow('contexto');
  expect(perform).not.toHaveBeenCalled();
});

it('keeps independent requests and refuses one whose permission is revoked', async () => {
  const guard = createGuardBroker({
    status: async () => ({enabled:true,all:true}),
    authorize: async () => {},
  });
  const first = vi.fn(() => 'first');
  const second = vi.fn(() => 'second');
  const permission = vi.fn(async () => {});
  const firstId = (await guard.run('backup', first, permission).catch((e: Error) => e.message)).split(':')[1];
  const secondId = (await guard.run('restore', second).catch((e: Error) => e.message)).split(':')[1];
  permission.mockRejectedValueOnce(Error('Permissão revogada.'));
  await expect(guard.approve(firstId, '0123')).rejects.toThrow('revogada');
  await expect(guard.approve(secondId, '0123')).resolves.toBe('second');
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});
