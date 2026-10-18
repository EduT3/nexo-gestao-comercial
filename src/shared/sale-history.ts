export type SaleHistoryFilter = { page?: number; search?: string; from?: string; until?: string; status?: 'ALL' | 'CONFIRMED' | 'CANCELLED' };
export type SaleHistoryRow = {
  id: string; created_at: string; customer_name: string | null; total_cents: bigint;
  method: 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT'; change_cents: bigint;
  status: 'CONFIRMED' | 'CANCELLED'; cancellation_reason: string | null;
};
export type SaleHistoryPage = { rows: SaleHistoryRow[]; total: number; page: number; pageSize: number };
export type SaleDetails = SaleHistoryRow & {
  subtotal_cents: bigint; discount_cents: bigint; received_cents: bigint; notes: string;
  items: { product_id: string; product_name: string; quantity_milli: bigint; unit_price_cents: bigint; total_cents: bigint }[];
};
