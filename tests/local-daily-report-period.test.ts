import { afterAll, beforeAll, expect, it } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLocalDatabase, type LocalDatabase } from '../src/local/sqlite';
import { prepareLocalDatabase } from '../src/local/migrations';
import { initializeLocalOwner } from '../src/local/onboarding';
import { createLocalProduct } from '../src/local/catalog';
import { createLocalPerson } from '../src/local/people';
import { receiveLocalPurchase } from '../src/local/purchases';
import { openLocalCash } from '../src/local/cash';
import { confirmLocalSale } from '../src/local/sales';
import { cancelLocalSale } from '../src/local/cancellations';
import { payLocalPayable, reverseLocalPayablePayment } from '../src/local/settlements';
import { createLocalReceivable, receiveLocalReceivable, reverseLocalReceivableReceipt } from '../src/local/receivables';
import { getLocalDailyReport } from '../src/local/reports';

type Period = { from: string; to: string };
type Report = Awaited<ReturnType<typeof getLocalDailyReport>>;
const company = 'adega-jg';
const instants = [
  '2026-10-25T23:59:59.999Z', '2026-10-26T00:00:00.000Z',
  '2026-10-26T02:59:59.999Z', '2026-10-26T03:00:00.000Z',
  '2026-10-26T03:00:00.001Z', '2026-10-27T03:00:00.000Z',
];
const fullPeriod: Period = { from: instants[0]!, to: '2026-10-27T03:00:00.001Z' };
const eventTables = new Set(['local_sales', 'local_sale_cancellations', 'local_payable_payments',
  'local_payable_reversals', 'local_receivable_receipts', 'local_receivable_reversals']);
let stampedInserts = 0;
/** Only this new fixture controls timestamps at INSERT; production clocks/triggers are unchanged. */
function atInstant(db: LocalDatabase, createdAt: string): LocalDatabase {
  return {
    ...db,
    query(sql, params = []) {
      const insert = /^INSERT INTO (\w+)\(([^)]+)\) VALUES\(([^)]+)\)$/.exec(sql);
      if (insert && eventTables.has(insert[1]!)) {
        stampedInserts++;
        return db.query(`INSERT INTO ${insert[1]}(${insert[2]},created_at) VALUES(${insert[3]},?)`, [...params, createdAt]);
      }
      return db.query(sql, params);
    },
    transaction: operation => db.transaction(tx => operation(atInstant(tx, createdAt))),
  };
}
function withOffset(period: Period, minutes: number): Period {
  const sign = minutes < 0 ? '-' : '+';
  const suffix = sign + String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0') + ':' + String(Math.abs(minutes) % 60).padStart(2, '0');
  const convert = (value: string) => {
    const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1];
    const shifted = new Date(Date.parse(value) + minutes * 60_000).toISOString().slice(0, -1);
    return shifted.replace(/\.\d{3}$/, fraction ? '.' + fraction : '') + suffix;
  };
  const result = { from: convert(period.from), to: convert(period.to) };
  expect(Date.parse(result.from)).toBe(Date.parse(period.from));
  expect(Date.parse(result.to)).toBe(Date.parse(period.to));
  for (const key of ['from', 'to'] as const) {
    expect(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(result[key])?.[1])
      .toBe(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(period[key])?.[1]);
  }
  return result;
}
const json = (value: unknown) => JSON.stringify(value, (_, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
const artifactRoot = process.env.NEXO_REPORT_TEST_ARTIFACTS;
const tempRoot = artifactRoot ? path.resolve(artifactRoot) : tmpdir();
let db: LocalDatabase | undefined, folder = '', owner = '', operator = '', productId = '';
let before: Awaited<ReturnType<typeof snapshot>> | undefined;
async function snapshot() {
  const tables = await db!.query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const digest = createHash('sha256'), counts: Record<string, number> = {};
  for (const table of tables) {
    const name = String(table.name);
    const rows = await db!.query(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`);
    counts[name] = rows.length;
    digest.update(json({ name, schema: table.sql, rows }));
  }
  return { sha256: digest.digest('hex').toUpperCase(), counts };
}
function expectBundles(report: Report, count: number) {
  const n = BigInt(count);
  expect(report).toMatchObject({ saleCount: count, grossSalesCents: 127n * n,
    cancelledSalesCents: 127n * n, netSalesCents: 0n, receivedCents: 31n * n,
    paidCents: 25n * n, financialBalanceCents: 6n * n });
  expect(report.byPayment).toEqual([
    { method: 'CASH', amountCents: 0n }, { method: 'PIX', amountCents: 127n * n },
    { method: 'DEBIT', amountCents: 0n }, { method: 'CREDIT', amountCents: 0n },
  ]);
  expect(report.products).toEqual(count ? [{ productId, name: 'Produto fracionado da fixture', quantityMilli: 1255n * n }] : []);
}

beforeAll(async () => {
  await mkdir(tempRoot, { recursive: true });
  folder = await mkdtemp(path.join(tempRoot, 'nexo-report-period-'));
  const file = path.join(folder, 'fixture.sqlite');
  db = openLocalDatabase(file);
  await prepareLocalDatabase(db, file);
  owner = (await initializeLocalOwner(db, 'Responsável fictício da fixture')).id;
  operator = randomUUID();
  // Fixture identity only: no password, credential, login or operational account is used.
  await db.query('INSERT INTO local_users VALUES(?,?,1)', [operator, 'Operador fictício']);
  await db.query('INSERT INTO local_memberships VALUES(?,?,?,1)', [company, operator, 'OPERADOR']);
  const supplier = await createLocalPerson(db, owner, company, 'supplier', { name: 'Fornecedor fictício' });
  const product = await createLocalProduct(db, owner, company, {
    name: 'Produto fracionado da fixture', internalCode: 'REPORT-TZ-1', unit: 'KG', costCents: 5, priceCents: 101,
  });
  productId = product.id;
  await openLocalCash(db, owner, company, randomUUID(), { openingCents: 0 });
  for (const instant of instants) {
    const clocked = atInstant(db, instant);
    for (const [quantity, unitCostCents, reverse] of [['5', 5, false], ['1', 7, true]] as const) {
      const purchase = await receiveLocalPurchase(clocked, owner, company, randomUUID(), {
        supplierId: supplier.id, items: [{ productId, quantity, unitCostCents }], payable: { dueDate: '2026-11-15' },
      });
      const payable = (await db.query('SELECT id FROM local_purchase_payables WHERE company_id=? AND purchase_id=?', [company, purchase.id]))[0]!;
      const payment = await payLocalPayable(clocked, owner, company, String(payable.id), randomUUID(), { method: 'PIX' });
      if (reverse) await reverseLocalPayablePayment(clocked, owner, company, payment.id, randomUUID(), { reason: 'Estorno fictício' });
    }
    const sale = await confirmLocalSale(clocked, owner, company, randomUUID(), {
      items: [{ productId, quantity: '1.255' }], paymentMethod: 'PIX',
    });
    expect(sale.totalCents).toBe(127n);
    await cancelLocalSale(clocked, owner, company, sale.id, randomUUID(), { reason: 'Cancelamento fictício' });
    for (const [amountCents, reverse] of [[31, false], [7, true]] as const) {
      const account = await createLocalReceivable(clocked, owner, company, randomUUID(), {
        description: 'Conta fictícia', category: 'Fixture', amountCents, dueDate: '2026-11-15',
      });
      const receipt = await receiveLocalReceivable(clocked, owner, company, account.id, randomUUID(), { method: 'PIX' });
      if (reverse) await reverseLocalReceivableReceipt(clocked, owner, company, receipt.id, randomUUID(), { reason: 'Estorno fictício' });
    }
  }
  expect(stampedInserts).toBe(48);
  for (const table of eventTables) {
    const rows = await db.query(`SELECT DISTINCT created_at FROM ${table} ORDER BY created_at`);
    expect(rows.map(row => row.created_at)).toEqual(instants);
  }
  before = await snapshot();
});

afterAll(async () => {
  if (!db) return;
  let after: typeof before, closed = false;
  try {
    if (before) {
      after = await snapshot();
      expect(after).toEqual(before);
      expect((await db.query('PRAGMA integrity_check'))[0]?.integrity_check).toBe('ok');
      expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
    }
  } finally {
    await db.close(); closed = true; db = undefined;
    if (artifactRoot) await writeFile(path.join(folder, 'fixture-receipt.json'), JSON.stringify({
      databaseClosed: closed, before, after, stampedInserts, instants,
    }, null, 2));
    else {
      if (path.dirname(folder) !== path.resolve(tempRoot) || !path.basename(folder).startsWith('nexo-report-period-')) throw new Error('Pasta temporária fora do recorte.');
      await rm(folder, { recursive: true, force: true });
    }
  }
});

it('preserva o resultado UTC, os centavos e milésimos de todos os tipos de evento', async () => {
  const report = await getLocalDailyReport(db!, owner, company, fullPeriod);
  expect(report.period).toEqual(fullPeriod);
  expectBundles(report, 6);
});

it('retorna os mesmos campos e somas em Z/-03/+05:30, preservando period original', async () => {
  const utc = await getLocalDailyReport(db!, owner, company, fullPeriod);
  const { period: originalPeriod, ...expected } = utc;
  expect(originalPeriod).toEqual(fullPeriod);
  for (const input of [withOffset(fullPeriod, -180), withOffset(fullPeriod, 330)]) {
    const { period, ...actual } = await getLocalDailyReport(db!, owner, company, input);
    expect(period).toEqual(input);
    expect(actual).toEqual(expected);
  }
});

it('inclui from e exclui to nas fronteiras exatas, também em Z sem milissegundos', async () => {
  for (const instant of instants) {
    const epoch = Date.parse(instant);
    const include = { from: instant, to: new Date(epoch + 1).toISOString() };
    const exclude = { from: new Date(epoch - 1).toISOString(), to: instant };
    // The immediately previous fixture instant is included when adjacent; to itself is always excluded.
    const priorCount = instants.filter(value => Date.parse(value) >= epoch - 1 && Date.parse(value) < epoch).length;
    for (const input of [include, withOffset(include, -180), withOffset(include, 330),
      { from: include.from.replace('.000Z', 'Z'), to: include.to.replace('.000Z', 'Z') }]) {
      const report = await getLocalDailyReport(db!, owner, company, input);
      expect(report.period).toEqual(input);
      expectBundles(report, 1);
    }
    for (const input of [exclude, withOffset(exclude, -180), withOffset(exclude, 330)]) {
      expectBundles(await getLocalDailyReport(db!, owner, company, input), priorCount);
    }
  }
});

it('respeita os dias UTC e America/Sao_Paulo quando a conversão cruza a data', async () => {
  const cases = [
    { from: '2026-10-25T00:00:00Z', to: '2026-10-26T00:00:00Z', count: 1 },
    { from: '2026-10-26T00:00:00Z', to: '2026-10-27T00:00:00Z', count: 4 },
    { from: '2026-10-25T00:00:00-03:00', to: '2026-10-26T00:00:00-03:00', count: 3 },
    { from: '2026-10-26T00:00:00-03:00', to: '2026-10-27T00:00:00-03:00', count: 2 },
  ];
  const localDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  expect(localDay.format(new Date(instants[2]!))).toBe('2026-10-25');
  expect(localDay.format(new Date(instants[3]!))).toBe('2026-10-26');
  for (const { count, ...input } of cases) {
    const report = await getLocalDailyReport(db!, owner, company, input);
    expect(report.period).toEqual(input);
    expectBundles(report, count);
  }
});

it('recusa formatos inválidos e intervalos iguais ou invertidos por instante', async () => {
  for (const input of [null, {}, { from: 'inválido', to: fullPeriod.to },
    { from: '2026-02-30T00:00:00Z', to: fullPeriod.to },
    { from: '2026-10-26T00:00:00', to: fullPeriod.to },
    { from: fullPeriod.to, to: fullPeriod.from },
    { from: '2026-10-26T03:00:00Z', to: '2026-10-26T00:00:00-03:00' },
    { from: '2026-10-25T23:30:00-03:00', to: '2026-10-26T00:00:00+02:00' },
    { ...fullPeriod, unexpected: true }]) {
    await expect(getLocalDailyReport(db!, owner, company, input)).rejects.toThrow();
  }
});

it('preserva empresa e autorização ADMIN em intervalos com fuso', async () => {
  const period = withOffset(fullPeriod, -180);
  expectBundles(await getLocalDailyReport(db!, owner, 'deposito-jg', period), 0);
  await expect(getLocalDailyReport(db!, operator, company, period)).rejects.toThrow('administrador');
  await expect(getLocalDailyReport(db!, operator, 'deposito-jg', period)).rejects.toThrow('acesso ativo');
  await expect(getLocalDailyReport(db!, randomUUID(), company, period)).rejects.toThrow('acesso ativo');
});


it('não antecipa from fracionário ao normalizar para a grade de milissegundos', async () => {
  const cases = [
    { from: '2026-10-26T03:00:00.0001Z', to: '2026-10-26T03:00:00.002Z', count: 1 },
    { from: '2026-10-26T02:59:59.9991Z', to: '2026-10-26T03:00:00.002Z', count: 2 },
    { from: '2026-10-25T23:59:59.9991Z', to: '2026-10-26T00:00:00.001Z', count: 1 },
    { from: '2026-10-26T03:00:00.0000000000000000001Z', to: '2026-10-26T03:00:00.002Z', count: 1 },
    { from: '2026-10-26T03:00:00.000000Z', to: '2026-10-26T03:00:00.001000Z', count: 1 },
  ];
  for (const { count, ...period } of cases) {
    for (const input of [period, withOffset(period, -180), withOffset(period, 330)]) {
      const report = await getLocalDailyReport(db!, owner, company, input);
      expect(report.period).toEqual(input);
      expectBundles(report, count);
    }
  }
});

it('não antecipa to exclusivo fracionário nem arredonda frações extras iguais a zero', async () => {
  const cases = [
    { from: '2026-10-26T02:59:59.999Z', to: '2026-10-26T03:00:00.0001Z', count: 2 },
    { from: '2026-10-25T23:59:59.999Z', to: '2026-10-26T00:00:00.0001Z', count: 2 },
    { from: '2026-10-26T03:00:00.000Z', to: '2026-10-26T03:00:00.0010001Z', count: 2 },
    { from: '2026-10-26T03:00:00.000Z', to: '2026-10-26T03:00:00.001000Z', count: 1 },
  ];
  for (const { count, ...period } of cases) {
    for (const input of [period, withOffset(period, -180), withOffset(period, 330)]) {
      const report = await getLocalDailyReport(db!, owner, company, input);
      expect(report.period).toEqual(input);
      expectBundles(report, count);
    }
  }
});


it('o oráculo de offsets preserva explicitamente dígitos além de milissegundos', () => {
  const period = { from: '2026-10-26T03:00:00.0001Z', to: '2026-10-26T03:00:00.0010001Z' };
  expect(withOffset(period, -180)).toEqual({
    from: '2026-10-26T00:00:00.0001-03:00', to: '2026-10-26T00:00:00.0010001-03:00',
  });
  expect(withOffset(period, 330)).toEqual({
    from: '2026-10-26T08:30:00.0001+05:30', to: '2026-10-26T08:30:00.0010001+05:30',
  });
});
