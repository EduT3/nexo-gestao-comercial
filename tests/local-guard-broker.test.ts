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
