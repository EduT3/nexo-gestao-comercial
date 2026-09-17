import { z } from 'zod';

const quantity = z.string().trim().regex(/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/).refine(value => !/^0(?:\.0{1,3})?$/.test(value), 'A quantidade deve ser maior que zero.');
const cents = z.number().int().min(0).max(9_999_999_999);
export const operationKeySchema = z.string().uuid('Idempotency-Key deve ser um UUID válido.');
export const openCashSchema = z.object({ openingCents: cents, notes: z.string().trim().max(500).default('') }).strict();
export const closeCashSchema = z.object({ countedCents: cents, notes: z.string().trim().max(500).default('') }).strict();
export const cashMovementSchema = z.object({ type: z.enum(['ENTRY','EXIT']), amountCents: cents.refine(value => value > 0, 'O valor deve ser maior que zero.'), notes: z.string().trim().min(2).max(500) }).strict();
export const saleSchema = z.object({
  customerId: z.string().uuid().nullable().default(null),
  items: z.array(z.object({ productId: z.string().uuid(), quantity }).strict()).min(1).max(100),
  discountCents: cents.default(0),
  paymentMethod: z.enum(['CASH', 'PIX', 'DEBIT', 'CREDIT']),
  notes: z.string().trim().max(500).default(''),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>();
  value.items.forEach((item, index) => { if (seen.has(item.productId)) context.addIssue({ code: 'custom', path: ['items', index], message: 'O produto está repetido na venda.' }); seen.add(item.productId); });
});
export const saleListSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(1_000_000).default(0) }).strict();
