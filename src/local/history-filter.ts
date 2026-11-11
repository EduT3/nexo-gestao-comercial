import { z } from 'zod';
export const HISTORY_PAGE_SIZE = 50;
export const historyFilterFields = {
  page: z.number().int().min(0).max(Math.floor(Number.MAX_SAFE_INTEGER / HISTORY_PAGE_SIZE) - 1).default(0),
  search: z.string().trim().max(120).default(''),
  from: z.iso.datetime({offset:true}).optional(), until: z.iso.datetime({offset:true}).optional(),
};
export const validHistoryPeriod = (value: {from?: string; until?: string}) => !value.from || !value.until || Date.parse(value.from) < Date.parse(value.until);
export const historyFilterSchema = z.object(historyFilterFields).strict().refine(validHistoryPeriod, 'Confira o período informado.');
