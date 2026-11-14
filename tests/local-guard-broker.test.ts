import { createRequire } from 'node:module';
import { expect, it, vi } from 'vitest';

const { createGuardBroker } = createRequire(import.meta.url)('../electron/guard-broker.cjs');

it('blocks execution until PIN and consumes the original request once', async () => {
  const authorize = vi.fn(async (_action: string, pin: string) => {
    if (pin !== '0123') throw Error('PIN incorreto');
  });
  const guard = createGuardBroker({ status: async () => ({enabled:true,all:true}), authorize });
  const phases: string[] = [];
  const authorized = () => phases.push('PIN aceito');
  const perform = vi.fn(() => { phases.push('executada'); return 'original'; });
  const error = await guard.run('backup', perform).catch((failure: Error) => failure.message);
  const id = error.split(':')[1];
  expect(perform).not.toHaveBeenCalled();
  await expect(guard.approve(id, '9999', authorized)).rejects.toThrow('PIN incorreto');
  expect(phases).toEqual([]);
  await expect(guard.approve(id, '0123', authorized)).resolves.toBe('original');
  expect(phases).toEqual(['PIN aceito', 'executada']);
  expect(authorize).toHaveBeenLastCalledWith('backup', '0123', { required: true });
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

it('binds each approval to its original operation even with concurrent requests', async () => {
  let release!: () => void;
  const verification = new Promise<void>(resolve => { release = resolve; });
  const guard = createGuardBroker({
    status: async () => ({enabled:true,all:true}),
    authorize: async () => verification,
  });
  const original = vi.fn(() => ({company:'A',amount:100}));
  const other = vi.fn(() => ({company:'B',amount:200}));
  const firstError = await guard.run('update-product', original).catch((e: Error) => e.message);
  const secondError = await guard.run('update-product', other).catch((e: Error) => e.message);
  const firstId = firstError.split(':')[1];
  const secondId = secondError.split(':')[1];
  const approval = guard.approve(firstId,'0123');
  await expect(guard.approve(firstId,'0123')).rejects.toThrow('Aguarde');
  release();
  await expect(approval).resolves.toEqual({company:'A',amount:100});
  expect(other).not.toHaveBeenCalled();
  await expect(guard.approve(firstId,'0123')).rejects.toThrow('expirada');
  await expect(guard.approve(secondId,'0123')).resolves.toEqual({company:'B',amount:200});
  expect(original).toHaveBeenCalledTimes(1);
});

it('rejects expired requests and cancelled approvals', async () => {
  vi.useFakeTimers();
  try {
    const guard = createGuardBroker({status:async()=>({enabled:true,all:true}),authorize:async()=>{}});
    const action = vi.fn();
    const first = await guard.run('cancel-sale',action).catch((e:Error)=>e.message);
    const id = first.split(':')[1];
    vi.advanceTimersByTime(60001);
    await expect(guard.approve(id,'0123')).rejects.toThrow('expirada');
    const second = await guard.run('cancel-sale',action).catch((e:Error)=>e.message);
    const secondId = second.split(':')[1];
    guard.cancel(secondId);
    await expect(guard.approve(secondId,'0123')).rejects.toThrow('expirada');
    expect(action).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});


it('exposes the policy PIN length to the prompt without changing the active policy', async () => {
  const guard = createGuardBroker({status:async()=>({enabled:true,all:true,pinLength:6}),authorize:async()=>{}});
  const error = await guard.run('backup',()=>{}).catch((failure: Error)=>failure.message);
  expect(guard.describe(error.split(':')[1])).toEqual({label:'Gerar backup',pinLength:6});
});
