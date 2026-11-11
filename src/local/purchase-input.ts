import {z} from 'zod';
import {receivePurchaseSchema,uniquePurchaseProducts} from '../server/modules/purchases/schemas.js';
/** Desktop-only input. Legacy remote contract remains supplier-required. */
export const localPurchaseInput=z.object({...receivePurchaseSchema.shape,supplierId:z.string().uuid().nullable().default(null)}).strict().superRefine(uniquePurchaseProducts);
