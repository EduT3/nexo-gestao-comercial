import { useLocalQuery } from './useLocalQuery';
import { LocalListPager, useLocalList } from './LocalList';
import { useMemo, useState } from 'react';
export type StockHistory = { hasMore: boolean; rows: { id: string; name: string; internal_code: string; quantity_milli: bigint; reason: string; operation_id: string; created_at: string; actor_name: string }[] };
function quantity(value: bigint) { const absolute = value < 0n ? -value : value; return `${value < 0n ? '-' : ''}${absolute / 1000n},${(absolute % 1000n).toString().padStart(3,'0')}`; }
const reasons: Record<string,string> = { OPENING: 'Saldo inicial', PURCHASE: 'Compra', SALE: 'Venda', REVERSAL: 'Devolução por cancelamento', ADJUSTMENT: 'Ajuste' };
const units: Record<string,string> = { UNIT: 'Unidade', BOX: 'Caixa', KG: 'Quilo', LITER: 'Litro', PACKAGE: 'Pacote', BAG: 'Saco', METER: 'Metro' };
const stockSearchText = (row: { name: string }) => row.name;
export function LocalStock({ company, active: visible = true, refreshToken, historyOnly=false }: { company: string; active?: boolean; refreshToken: number; historyOnly?:boolean }) {
 const [stock, setStock] = useState<{ id: string; name: string; unit: string; balance_milli: bigint }[]>([]);
 const [search, setSearch] = useState(''); const [onlyEmpty, setOnlyEmpty] = useState(false);
 const available = useMemo(() => onlyEmpty ? stock.filter(row => row.balance_milli <= 0n) : stock, [stock, onlyEmpty]);
 const balancesList = useLocalList(available, stockSearchText, search);
 const [history, setHistory] = useState<StockHistory>(); const [product, setProduct] = useState(''); const [offset, setOffset] = useState(0); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
 useLocalQuery(company, visible, refreshToken, () => window.nexoLocal!.stock(company), setStock, error => setMessage(String(error)));
 useLocalQuery(JSON.stringify([company, product, offset]), Boolean(company) && visible, refreshToken,
  async () => {
   setLoading(true); setMessage(''); setHistory(undefined);
   return window.nexoLocal!.stockHistory(company, { productId: product || null, offset });
  },
  movements => { setHistory(movements); setLoading(false); },
  error => { setMessage(String(error)); setLoading(false); });

 return <details className="panel"><summary>{historyOnly?'Entradas e saídas do estoque':'Estoque e movimentações'}</summary>{!historyOnly&&<><h2>Saldo atual</h2><div className="form-grid"><label>Buscar no estoque<input value={search} onChange={event => { setSearch(event.target.value); balancesList.setPage(0); }} placeholder="Nome do produto" /></label><label><input type="checkbox" checked={onlyEmpty} onChange={event => { setOnlyEmpty(event.target.checked); balancesList.setPage(0); }} /> Somente sem estoque</label></div><table aria-label="Saldo de estoque"><thead><tr><th>Produto</th><th>Quantidade</th><th>Unidade</th></tr></thead><tbody>{balancesList.rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{quantity(row.balance_milli)}</td><td>{units[row.unit] ?? row.unit}</td></tr>)}</tbody></table><LocalListPager list={balancesList} label="Páginas de estoque" />{balancesList.total === 0 && <p>Nenhum produto encontrado nesta consulta.</p>}</>}<h2>Histórico de movimentações</h2><label>Produto do histórico<select aria-label="Produto do histórico" value={product} onChange={event => { setProduct(event.target.value); setOffset(0); }}><option value="">Todos os produtos</option>{stock.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><p>Mais recentes primeiro. Entradas positivas e saídas negativas. O saldo atual considera todo o histórico.</p><table aria-label="Histórico de estoque"><thead><tr><th>Data</th><th>Produto</th><th>Movimento</th><th>Quantidade</th><th>Responsável</th></tr></thead><tbody>{history?.rows.map(row => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString('pt-BR')}</td><td>{row.name} ({row.internal_code})</td><td>{reasons[row.reason] ?? row.reason}<details><summary>Referência</summary>{row.operation_id}</details></td><td>{quantity(row.quantity_milli)}</td><td>{row.actor_name}</td></tr>)}</tbody></table>{!loading && history?.rows.length === 0 && <p>Nenhuma movimentação para esta consulta.</p>}<button disabled={loading || offset === 0} onClick={() => setOffset(current => Math.max(0,current - 50))}>Mais recentes</button><button disabled={loading || !history?.hasMore} onClick={() => setOffset(current => current + 50)}>Mais antigas</button><p role="status">{loading ? 'Consultando estoque…' : message}</p></details>;
}
