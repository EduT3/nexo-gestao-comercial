import 'dotenv/config';
import { z } from 'zod';

export interface Config { production: boolean; host: string; port: number; origin: string; databaseUrl?: string; dataDir?: string }
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production';
  if (env.NODE_ENV && !['development', 'test', 'production'].includes(env.NODE_ENV)) throw new Error('NODE_ENV deve ser development, test ou production.');
  const host = env.HOST ?? '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1', '0.0.0.0', '::'].includes(host)) throw new Error('HOST inválido. Use endereço local ou bind explícito 0.0.0.0/::.');
  const port = z.coerce.number().int().min(1).max(65535).parse(env.PORT ?? '3001');
  const origin = env.APP_ORIGIN ?? (production ? '' : 'http://127.0.0.1:5173');
  let url: URL;
  try { url = new URL(origin); } catch { throw new Error('APP_ORIGIN é obrigatória e deve conter uma origem válida.'); }
  if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('APP_ORIGIN deve conter apenas protocolo, host e porta, sem caminho ou credenciais.');
  if (production && url.protocol !== 'https:') throw new Error('APP_ORIGIN deve usar HTTPS em produção.');
  if (!production && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('APP_ORIGIN de desenvolvimento deve apontar para localhost.');
  if (production && !env.DATABASE_URL) throw new Error('DATABASE_URL é obrigatória em produção.');
  if (env.DATABASE_URL) {
    let database: URL;
    try { database = new URL(env.DATABASE_URL); } catch { throw new Error('DATABASE_URL inválida.'); }
    if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('DATABASE_URL deve usar PostgreSQL.');
  }
  if (production && env.DATA_DIR) throw new Error('DATA_DIR não pode ser utilizado em produção; configure PostgreSQL.');
  return { production, host, port, origin, databaseUrl: env.DATABASE_URL || undefined, dataDir: env.DATA_DIR || undefined };
}
