import { z } from 'zod';

const quantity = z.string().trim()
  .regex(/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/, 'Use uma quantidade positiva com até três casas decimais.')
  .refine(value => !/^0(?:\.0{1,3})?$/.test(value), 'A quantidade deve ser maior que zero.');
const cents = z.number().int().min(0).max(9_999_999_999);

export const purchaseListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).strict();

export const receivePurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity, unitCostCents: cents }).strict()).min(1).max(100),
  notes: z.string().trim().max(1000).default(''),
  payable: z.object({ dueDate: z.iso.date(), notes: z.string().trim().max(500).default('') }).strict().nullable().default(null),
}).strict().superRefine(uniquePurchaseProducts);

export function uniquePurchaseProducts(value:{items:readonly {productId:string}[]},context:z.RefinementCtx){
  const seen = new Set<string>();
  value.items.forEach((item, index) => {
    if (seen.has(item.productId)) context.addIssue({ code: 'custom', path: ['items', index, 'productId'], message: 'O produto está repetido na compra.' });
    seen.add(item.productId);
  });
}

export const purchaseIdempotencyKeySchema = z.string().uuid('Idempotency-Key deve ser um UUID válido.');
