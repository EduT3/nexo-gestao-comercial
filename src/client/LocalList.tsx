import { useMemo, useState } from 'react';
import { listPage, searchText } from './local-list';
export function useLocalList<T>(rows: readonly T[], text: (row: T) => string, query: string) {
  const [page, setPage] = useState(0);
  const index = useMemo(() => rows.map(row => ({ row, text: searchText(text(row)) })), [rows, text]);
  const normalized = searchText(query);
  const filtered = useMemo(() => index.filter(item => item.text.includes(normalized)).map(item => item.row), [index, normalized]);
  return { ...listPage(filtered, page), setPage };
}
export function LocalListPager({ list, label }: { list: { page: number; pages: number; total: number; setPage(page: number): void }; label: string }) {
  return <div className="local-list-pager" role="group" aria-label={label}>
    <span role="status">{list.total} resultado(s) · Página {list.page + 1} de {list.pages}</span>
    <button type="button" className="button secondary" disabled={list.page === 0} onClick={() => list.setPage(list.page - 1)}>Página anterior</button>
    <button type="button" className="button secondary" disabled={list.page + 1 >= list.pages} onClick={() => list.setPage(list.page + 1)}>Próxima página</button>
  </div>;
}
