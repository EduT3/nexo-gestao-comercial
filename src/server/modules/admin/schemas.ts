import { z } from 'zod';
import { roles } from '../../../shared/contracts.js';
import { isValidTaxId, normalizeTaxId } from '../../../shared/tax-id.js';
import { emailSchema, passwordSchema } from '../../core/validation.js';

const taxIdSchema = z.string().trim().max(30).transform(value => normalizeTaxId(value) || null).refine(value => value === null || isValidTaxId(value), 'CNPJ inválido. Confira os caracteres e dígitos verificadores.').nullable();
const timezoneSchema = z.string().max(80).refine(value => { try { new Intl.DateTimeFormat('pt-BR', { timeZone: value }); return true; } catch { return false; } }, 'Fuso horário inválido.');
export const companySchema = z.object({
  name: z.string().trim().min(2).max(120), legalName: z.string().trim().min(2).max(200),
  taxId: taxIdSchema.optional(), kind: z.enum(['DEPOSITO', 'ADEGA']), address: z.string().trim().max(500).optional(),
}).strict();
export const companyPatchSchema = companySchema.extend({ timezone: timezoneSchema }).partial().refine(value => Object.keys(value).length > 0, 'Informe ao menos um campo.');
export const createMemberSchema = z.object({ name: z.string().trim().min(2).max(120), email: emailSchema, password: passwordSchema, role: z.enum(roles) }).strict();
export const updateMemberSchema = z.object({ role: z.enum(roles), active: z.boolean() }).strict();
export const auditQuerySchema = z.object({ q: z.string().trim().max(120).default(''), limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(1_000_000).default(0) }).strict();
