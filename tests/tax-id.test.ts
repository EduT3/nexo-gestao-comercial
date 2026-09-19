import { describe, expect, it } from 'vitest';
import { isValidTaxId, normalizeTaxId } from '../src/shared/tax-id.js';

describe('CNPJ numérico e alfanumérico', () => {
  it.each(['11.222.333/0001-81', '11222333000181', '12.ABC.345/01DE-35', '12abc34501de35', '00.000.000/E08G-12'])('valida os dígitos de %s', value => {
    expect(isValidTaxId(value)).toBe(true);
  });
  it.each(['', '00000000000000', '11111111111111', '11222333000182', '12ABC34501DE36', '12ABC34501DEAB', '12ABC34501DE35<script>', '12ABC34501DÉ35', '12ABC 4501DE35'])('rejeita formato/dígitos inválidos: %s', value => {
    expect(isValidTaxId(value)).toBe(false);
  });
  it('normaliza pontuação e caixa sem apagar letras ou caracteres inválidos', () => {
    expect(normalizeTaxId(' 12.abc.345/01de-35 ')).toBe('12ABC34501DE35');
    expect(normalizeTaxId('12ABC34501DE35!')).toContain('!');
  });
});
