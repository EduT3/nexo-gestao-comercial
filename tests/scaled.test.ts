import { expect, it } from 'vitest';
import { quantityToMilli, itemTotalCents } from '../src/shared/scaled';

it('quantidades e totais preservam escala e arredondamento comercial sem ponto flutuante', () => {
  expect(quantityToMilli('1.25')).toBe(1250n);
  expect(itemTotalCents(quantityToMilli('1.250'), 123n)).toBe(154n);
  expect(itemTotalCents(1n, 499n)).toBe(0n);
  expect(itemTotalCents(1n, 500n)).toBe(1n);
  expect(itemTotalCents(1000n, 9007199254740993n)).toBe(9007199254740993n);
  expect(() => quantityToMilli('0.0001')).toThrow();
  expect(() => quantityToMilli('-1')).toThrow();
  expect(() => quantityToMilli('9223372036854776')).toThrow('limite');
  expect(() => itemTotalCents(-1n, 1n)).toThrow();
  expect(() => itemTotalCents(2000n, 9223372036854775807n)).toThrow('limite');
});
