export const roles = ['ADMIN', 'OPERADOR'] as const;
export type Role = typeof roles[number];
export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador', OPERADOR: 'Operador',
};
export const permissions = ['company.read', 'company.update', 'users.read', 'users.manage', 'audit.read', 'consolidated.read', 'products.read', 'products.manage', 'cost.read', 'inventory.read', 'inventory.manage', 'sales.create', 'sales.cancel', 'sales.discount', 'cash.manage', 'purchases.manage', 'finance.read', 'finance.manage', 'profit.read', 'reports.read'] as const;
export type Permission = typeof permissions[number];
export const rolePermissions: Record<Role, readonly Permission[]> = {
  ADMIN: permissions,
  OPERADOR: ['company.read', 'products.read', 'inventory.read', 'sales.create', 'cash.manage'],
};
export interface Company {
  id: string; name: string; legalName: string; taxId: string | null;
  kind: 'DEPOSITO' | 'ADEGA'; address: string; timezone: string; active: boolean;
  role: Role; permissions: Permission[];
}
export interface Session {
  user: { id: string; name: string; email: string; systemAdmin: boolean };
  csrfToken: string; companies: Company[]; demo: boolean;
}
export interface Member {
  id: string; userId: string; name: string; email: string; role: Role; active: boolean; createdAt: string;
}
export interface Store { id: string; companyId: string; name: string; address: string; active: boolean }
export interface AuditEvent {
  id: string; companyId: string | null; actorName: string | null;
  action: string; entityType: string; entityId: string | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null; createdAt: string;
}
export interface CompanyOverview { company: Company; stores: Store[]; activeUsers: number; recentAudit: AuditEvent[] }
export interface Consolidated { scope: 'authorized_companies'; companies: { id: string; name: string; kind: Company['kind']; stores: number; activeUsers: number }[] }
export interface ApiError { error: { code: string; message: string; requestId?: string } }

export const productUnits = ['UNIT', 'PACKAGE', 'BOX', 'BAG', 'KG', 'METER', 'LITER'] as const;
export type ProductUnit = typeof productUnits[number];

export interface Category {
  id: string;
  companyId: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  internalCode: string;
  barcode: string | null;
  categoryId: string | null;
  unit: ProductUnit;
  /** Custo is deliberately optional in responses for profiles without cost.read. */
  costCents?: number;
  priceCents: number;
  stockMin: string;
  supplierId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = 'NORMAL' | 'LOW' | 'ZERO';
export type InventoryMovementType = 'PURCHASE' | 'ENTRY_MANUAL' | 'SALE' | 'LOSS' | 'ADJUSTMENT';
export type InventoryDirection = 'IN' | 'OUT';
export interface InventoryItem {
  productId: string; companyId: string; productName: string; internalCode: string;
  unit: ProductUnit; quantity: string; stockMin: string; status: InventoryStatus;
}
export interface InventoryMovement {
  id: string; companyId: string; productId: string; productName: string; internalCode: string;
  unit: ProductUnit; type: InventoryMovementType; direction: InventoryDirection;
  quantity: string; balanceBefore: string; balanceAfter: string; notes: string;
  actorId: string; actorName: string; idempotencyKey: string; createdAt: string;
}

export interface PurchaseItem {
  id: string; companyId: string; purchaseId: string; productId: string; productName: string;
  internalCode: string; unit: ProductUnit; quantity: string; unitCostCents: number; totalCents: number;
}
export interface AccountPayable {
  id: string; companyId: string; purchaseId: string; supplierName?: string; description: string; amountCents: number;
  dueDate: string; status: 'OPEN' | 'PAID' | 'CANCELLED'; paidAt: string | null; notes: string; createdAt: string;
  category: string; paymentMethod: PaymentMethod | null; paidBy: string | null; paidByName: string | null; paymentNotes: string;
}
export interface Purchase {
  id: string; companyId: string; supplierId: string; supplierName: string; status: 'RECEIVED' | 'CANCELLED';
  totalCents: number; notes: string; receivedAt: string; actorId: string; actorName: string;
  idempotencyKey: string; createdAt: string; items: PurchaseItem[]; payable: AccountPayable | null;
}

export type PaymentMethod = 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT';
export interface FinancialEntry {
  reversalId?: string | null; reversalReason?: string | null;
  id: string; companyId: string; kind: 'REVENUE' | 'EXPENSE'; status: 'REALIZED' | 'OPEN' | 'CANCELLED';
  description: string; category: string; amountCents: number; paymentMethod: PaymentMethod | null;
  sourceType: 'SALE' | 'MANUAL' | 'PAYABLE' | 'RECEIVABLE'; sourceId: string; notes: string;
  actorId: string | null; actorName: string | null; realizedAt: string | null; createdAt: string;
}
export interface FinanceOverview {
  payables: AccountPayable[]; receivables: AccountReceivable[]; entries: FinancialEntry[];
  totals: { payableOpenCents: number; receivableOpenCents: number; revenueRealizedCents: number; expenseRealizedCents: number };
}
export interface AccountReceivable {
  id: string; companyId: string; customerId: string|null; customerName: string|null;
  description: string; category: string; amountCents: number; dueDate: string;
  status: 'OPEN'|'RECEIVED'|'CANCELLED'; notes: string; receivedAt: string|null;
  paymentMethod: PaymentMethod|null; createdAt: string;
}
export interface CashRegister {
  id: string; companyId: string; operatorId: string; operatorName: string; status: 'OPEN' | 'CLOSED';
  openingCents: number; expectedCashCents: number; salesCents: number; cashSalesCents: number; entriesCents: number; exitsCents: number;
  openedAt: string; closedAt: string | null; closingCents: number | null; notes: string;
}
export interface CashMovement { id: string; companyId: string; cashRegisterId: string; type: 'OPENING'|'SALE'|'ENTRY'|'EXIT'; direction: 'IN'|'OUT'; paymentMethod: PaymentMethod|null; amountCents: number; notes: string; actorName: string; createdAt: string }
export interface SaleItem {
  id: string; companyId: string; saleId: string; productId: string; productName: string; internalCode: string;
  unit: ProductUnit; quantity: string; unitPriceCents: number; unitCostCents?: number; totalCents: number;
}
export interface Sale {
  id: string; companyId: string; cashRegisterId: string; customerId: string | null; customerName: string | null;
  operatorId: string; operatorName: string; status: 'CONFIRMED' | 'CANCELLED'; subtotalCents: number;
  discountCents: number; totalCents: number; paymentMethod: PaymentMethod; notes: string;
  confirmedAt: string; items: SaleItem[];
  cancellation?: { reason: string; actorName: string; cancelledAt: string } | null;
}
