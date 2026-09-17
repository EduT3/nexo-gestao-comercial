import { z } from 'zod';

const quantity = z.string().trim()
  .regex(/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/, 'Informe uma quantidade positiva com até três casas decimais.')
  .refine(value => !/^0(?:\.0{1,3})?$/.test(value), 'A quantidade deve ser maior que zero.');

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['all', 'normal', 'low', 'zero']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).strict();

export const movementQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).strict();

export const manualMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['ENTRY_MANUAL', 'LOSS', 'ADJUSTMENT']),
  direction: z.enum(['IN', 'OUT']),
  quantity,
  notes: z.string().trim().max(500).default(''),
}).strict().superRefine((value, context) => {
  if (value.type === 'ENTRY_MANUAL' && value.direction !== 'IN') context.addIssue({ code: 'custom', path: ['direction'], message: 'Entrada manual deve aumentar o estoque.' });
  if (value.type === 'LOSS' && value.direction !== 'OUT') context.addIssue({ code: 'custom', path: ['direction'], message: 'Perda deve reduzir o estoque.' });
});

export const idempotencyKeySchema = z.string().uuid('Idempotency-Key deve ser um UUID válido.');
