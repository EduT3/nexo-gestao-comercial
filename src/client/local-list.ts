export const LOCAL_PAGE_SIZE = 50;
export function searchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}
export function listPage<T>(rows: readonly T[], page: number, size = LOCAL_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.max(0, Math.min(page, pages - 1));
  return { rows: rows.slice(current * size, (current + 1) * size), page: current, pages, total: rows.length };
}
