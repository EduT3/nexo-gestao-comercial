import { z } from 'zod';
import { productUnits } from '../../../shared/contracts.js';
import { isValidTaxId, normalizeTaxId } from '../../../shared/tax-id.js';

const emptyToNull = (value: unknown) => typeof value === 'string' && value.trim() === '' ? null : value;

/**
 * CPF is accepted as an optionally formatted 11 digit identifier. The
 * existing tax-id helper validates CNPJ, including its check digits; CPF
 * validation is intentionally outside this phase's scope.
 */
const taxIdSchema = z.preprocess(
  emptyToNull,
  z.string().trim().max(30).transform(normalizeTaxId).nullable(),
).refine(
  value => value === null || /^\d{11}$/.test(value) || (value.length === 14 && isValidTaxId(value)),
  'CPF deve ter 11 dígitos ou CNPJ deve ser válido.',
);

const optionalTaxIdSchema = taxIdSchema.optional();
const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
const requiredName = z.string().trim().min(2).max(160);

/** Monetary values are JSON numbers representing integer cents. */
const centsSchema = z.number().int('Informe centavos inteiros.').min(0, 'O valor não pode ser negativo.').max(9_999_999_999, 'O valor excede o limite permitido.');

/** Decimal quantity kept as text so no binary floating point reaches a rule. */
const quantitySchema = z.preprocess(
  value => typeof value === 'number' && Number.isFinite(value) ? String(value) : value,
  z.string().trim().regex(/^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/, 'Use uma quantidade não negativa com até três casas decimais.'),
);

const codeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._/-]{0,59}$/, 'Código interno inválido. Use letras, números, ponto, hífen, barra ou sublinhado.');
const barcodeSchema = z.preprocess(emptyToNull, z.string().trim().regex(/^\d{1,64}$/, 'Código de barras deve conter apenas dígitos.').nullable().optional());
const uuidOrNull = z.string().uuid().nullable().optional();

export const listQuerySchema = z.object({
  q: z.string().trim().max(120).default(''),
  active: z.enum(['true', 'false', 'all']).default('true'),
  all: z.preprocess(value => value === true || value === 'true', z.boolean()).default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).strict();

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(''),
}).strict();
export const categoryPatchSchema = categorySchema.partial().extend({ active: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Informe ao menos um campo.');

export const productSchema = z.object({
  name: requiredName,
  internalCode: codeSchema,
  barcode: barcodeSchema,
  categoryId: uuidOrNull,
  unit: z.enum(productUnits),
  costCents: centsSchema,
  priceCents: centsSchema,
  stockMin: quantitySchema.default('0'),
  supplierId: uuidOrNull,
  active: z.boolean().default(true),
}).strict();
export const productPatchSchema = productSchema.partial().strict().refine(value => Object.keys(value).length > 0, 'Informe ao menos um campo.');

export const supplierSchema = z.object({
  name: requiredName,
  taxId: optionalTaxIdSchema,
  phone: optionalText(40),
  whatsapp: optionalText(40),
  email: z.preprocess(emptyToNull, z.string().trim().email('E-mail inválido.').max(254).nullable().optional()),
  address: optionalText(500),
  notes: optionalText(1000),
}).strict();
export const supplierPatchSchema = supplierSchema.partial().extend({ active: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Informe ao menos um campo.');

export const customerSchema = z.object({
  name: requiredName,
  taxId: optionalTaxIdSchema,
  phone: optionalText(40),
  whatsapp: optionalText(40),
  address: optionalText(500),
  notes: optionalText(1000),
}).strict();
export const customerPatchSchema = customerSchema.partial().extend({ active: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Informe ao menos um campo.');
