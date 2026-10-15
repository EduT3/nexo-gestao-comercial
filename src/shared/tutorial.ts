import { z } from 'zod';

export const tutorialPreferenceSchema = z.object({
  version: z.literal(1),
  state: z.enum(['welcome', 'active', 'paused', 'disabled', 'completed']),
  step: z.enum(['company', 'products', 'support', 'purchases', 'stock', 'cash', 'sales', 'finance', 'excel', 'backup']),
}).strict();
export type TutorialPreference = z.infer<typeof tutorialPreferenceSchema>;
export const newTutorialPreference = (): TutorialPreference => ({ version: 1, state: 'welcome', step: 'company' });
