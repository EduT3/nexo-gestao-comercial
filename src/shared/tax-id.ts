/** CNPJ structure/check digits only; this does not verify registration with Receita Federal.
 * Algorithm: https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=76192
 */
export function normalizeTaxId(value: string): string {
  return value.trim().toUpperCase().replace(/[.\/-]/g, '');
}

export function isValidTaxId(value: string): boolean {
  const normalized = normalizeTaxId(value);
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(normalized) || /^(\d)\1{13}$/.test(normalized)) return false;
  const digit = (base: string, weights: readonly number[]) => {
    const remainder = [...base].reduce((sum, character, index) => sum + (character.charCodeAt(0) - 48) * weights[index]!, 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(normalized.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = digit(`${normalized.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return normalized.endsWith(`${first}${second}`);
}
