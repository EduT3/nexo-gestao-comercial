import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { notFound } from './errors.js';

export const passwordSchema = z.string().min(12, 'A senha deve ter no mínimo 12 caracteres.').max(128);
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export function validId(value: unknown): string {
  const id = z.string().uuid().safeParse(value);
  if (!id.success) notFound();
  return id.data;
}
export function params(request: FastifyRequest): Record<string, unknown> { return request.params as Record<string, unknown>; }
