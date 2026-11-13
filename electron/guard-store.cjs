const { createHash, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { readFile, rename, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const PIN_LENGTH = 4;
const KDF = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function validatePin(pin) {
  if (typeof pin !== 'string' || pin.length !== PIN_LENGTH || !/^[0-9]+$/.test(pin)) {
    throw new Error('Informe um PIN de quatro dígitos.');
  }
}

function recoveryCredential() {
  const key = randomBytes(24).toString('hex');
  return { key, recoveryHash: createHash('sha256').update(key).digest('hex') };
}

function createGuardStore(folder) {
  const file = path.join(folder, 'guard.json');
  let queue = Promise.resolve();

  function serialize(operation) {
    const result = queue.then(operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  async function read() {
    let contents;
    try { contents = await readFile(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    const record = JSON.parse(contents);
    if (record.version !== 1 || !/^[0-9a-f]{32}$/.test(record.salt)
        || !/^[0-9a-f]{64}$/.test(record.hash) || !Array.isArray(record.actions)
        || !record.actions.every(action => typeof action === 'string')
        || typeof record.enabled !== 'boolean' || typeof record.all !== 'boolean'
        || !Number.isSafeInteger(record.failures) || record.failures < 0
        || !Number.isSafeInteger(record.blockedUntil) || record.blockedUntil < 0) {
      throw new Error('Não foi possível ler a configuração do NEXO Guard.');
    }
    return record;
  }

  async function save(record) {
    const staged = file + '.tmp';
    await writeFile(staged, JSON.stringify(record), { mode: 0o600, flush: true });
    await rename(staged, file);
  }

  async function verify(record, pin) {
    validatePin(pin);
    if (record.blockedUntil > Date.now()) {
      throw new Error('Aguarde o fim do bloqueio para tentar novamente.');
    }
    const supplied = await derive(pin, Buffer.from(record.salt, 'hex'), 32, KDF);
    if (!timingSafeEqual(supplied, Buffer.from(record.hash, 'hex'))) {
      const failures = Math.min(30, record.failures + 1);
      const delay = failures >= 5 ? Math.min(900000, 30000 * 2 ** (failures - 5)) : 0;
      await save({ ...record, failures, blockedUntil: delay ? Date.now() + delay : 0 });
      throw new Error(delay ? 'PIN incorreto. O NEXO Guard está temporariamente bloqueado.' : 'PIN incorreto.');
    }
    if (record.failures) await save({ ...record, failures: 0, blockedUntil: 0 });
  }

  return {
    status: () => serialize(async () => {
      const record = await read();
      return { enabled: record?.enabled ?? false, all: record?.all ?? true,
        actions: record?.actions ?? [], pinLength: PIN_LENGTH, blockedUntil: record?.blockedUntil ?? 0 };
    }),
    configure: ({ enabled, all, actions, pin, confirmation, currentPin }) => serialize(async () => {
      const record = await read();
      if (typeof enabled !== 'boolean' || typeof all !== 'boolean' || !Array.isArray(actions)
          || actions.length > 100 || !actions.every(action => typeof action === 'string' && action.length <= 100)) {
        throw new Error('Configuração do NEXO Guard inválida.');
      }
      if (record?.enabled) await verify(record, currentPin);
      let credential = record;
      if (!record?.enabled || pin !== undefined) {
        if (!enabled && !record?.enabled) return;
        validatePin(pin);
        if (pin !== confirmation) throw new Error('Os PINs precisam ser iguais.');
        const salt = randomBytes(16);
        credential = { salt: salt.toString('hex'), hash: (await derive(pin, salt, 32, KDF)).toString('hex') };
      }
      const recovery = enabled && !record?.enabled ? recoveryCredential() : null;
      await save({ version: 1, salt: credential.salt, hash: credential.hash, enabled, all,
        recoveryHash: recovery?.recoveryHash ?? record?.recoveryHash,
        actions: [...new Set(actions)], failures: 0, blockedUntil: 0 });
      return recovery ? { recoveryKey: recovery.key } : undefined;
    }),
    recover: ({ key, pin, confirmation }) => serialize(async () => {
      const record = await read();
      if (!record?.enabled || !/^[0-9a-f]{64}$/.test(record.recoveryHash ?? '')
          || typeof key !== 'string' || !/^[0-9a-f]{48}$/.test(key)
          || !timingSafeEqual(createHash('sha256').update(key).digest(), Buffer.from(record.recoveryHash, 'hex'))) {
        throw Error('Chave de recuperação inválida.');
      }
      validatePin(pin);
      if (pin !== confirmation) throw Error('Os PINs precisam ser iguais.');
      const salt = randomBytes(16);
      const recovery = recoveryCredential();
      await save({ ...record, salt: salt.toString('hex'), hash: (await derive(pin, salt, 32, KDF)).toString('hex'),
        recoveryHash: recovery.recoveryHash, failures: 0, blockedUntil: 0 });
      return { recoveryKey: recovery.key };
    }),
    authorize: (action, pin) => serialize(async () => {
      const record = await read();
      if (!record?.enabled || (!record.all && !record.actions.includes(action))) return;
      await verify(record, pin);
    }),
  };
}

module.exports = { createGuardStore };
