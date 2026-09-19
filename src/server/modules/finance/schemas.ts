import { z } from 'zod';

export const financeListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export const settlePayableSchema = z.object({
  paymentMethod: z.enum(['CASH', 'PIX', 'DEBIT', 'CREDIT']),
  notes: z.string().trim().max(500).default(''),
}).strict();

export const financeIdempotencyKeySchema = z.string().uuid('Idempotency-Key deve ser um UUID válido.');

export const reverseEntrySchema = z.object({ reason: z.string().trim().min(1).max(500) }).strict();

export const createManualEntrySchema = z.object({
  kind: z.enum(['REVENUE', 'EXPENSE']),
  description: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(100),
  amountCents: z.number().int().min(1).max(9_999_999_999),
  paymentMethod: z.enum(['CASH', 'PIX', 'DEBIT', 'CREDIT']),
  notes: z.string().trim().max(500).default(''),
}).strict();

export const createReceivableSchema = z.object({
  customerId: z.string().uuid().nullable().default(null),
  description: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(100),
  amountCents: z.number().int().min(1).max(9_999_999_999),
  dueDate: z.iso.date(),
  notes: z.string().trim().max(500).default(''),
}).strict();
