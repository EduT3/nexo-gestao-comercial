export type HistoryFilter = { page?: number; search?: string; from?: string; until?: string };
export type CashHistoryFilter = HistoryFilter & { status?: 'ALL' | 'OPEN' | 'CLOSED' };
export type HistoryPage<T> = { rows: T[]; total: number; page: number; pageSize: number };
export type PurchaseHistoryRow = { id: string; created_at: string; supplier_name: string; total_cents: bigint; due_date: string | null };
export type CashHistoryRow = { id: string; created_at: string; actor_name: string; closed: bigint; balance_cents: bigint; closure: { expected_cents: bigint; counted_cents: bigint; notes?: string } | null };
export type PurchaseDetails = Omit<PurchaseHistoryRow,'due_date'> & {
 company_id:string; supplier_id:string|null; notes:string;
 items:{product_id:string;product_name:string;quantity_milli:bigint;unit_cost_cents:bigint;total_cents:bigint}[];
 payable:{id:string;amount_cents:bigint;due_date:string;notes:string}|null;
};
