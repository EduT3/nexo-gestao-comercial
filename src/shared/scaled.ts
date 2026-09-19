/** Decimal quantities are represented as integer thousandths in SQLite. */
export function quantityToMilli(value: string): bigint {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value)) throw new Error('Informe uma quantidade positiva com até três casas decimais.');
  const [whole = '0', fraction = ''] = value.split('.');
  const result = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
  if (result > 9223372036854775807n) throw new Error('Quantidade acima do limite permitido.');
  return result;
}

/** Preserve existing commercial rounding: nearest cent, halves upward, per item. */
export function itemTotalCents(quantityMilli: bigint, unitCents: bigint): bigint {
  if (quantityMilli < 0n || unitCents < 0n) throw new Error('Quantidade e valor não podem ser negativos.');
  const result = (quantityMilli * unitCents + 500n) / 1000n;
  if (result > 9223372036854775807n) throw new Error('Total acima do limite permitido.');
  return result;
}
