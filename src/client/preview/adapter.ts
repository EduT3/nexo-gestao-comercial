import snapshot from './snapshot.json';
import { RequestError } from '../api';

let entered = true;
export function previewRequest(path: string, method: string): unknown {
  const url = new URL(path, 'https://preview.invalid');
  if (url.pathname === '/auth/logout') { entered = false; return { ok: true }; }
  if (url.pathname === '/auth/login') { entered = true; return structuredClone(snapshot['/auth/session']); }
  if (url.pathname === '/auth/session' && !entered) throw new RequestError('Prévia encerrada.', 401, 'UNAUTHENTICATED');
  if (method !== 'GET') throw new RequestError('Esta prévia é apenas visual. Operações e alterações não são gravadas.', 403, 'VISUAL_PREVIEW_READ_ONLY');
  const value = (snapshot as Record<string, unknown>)[url.pathname];
  if (value === undefined) throw new RequestError('Esta consulta ainda não está disponível na prévia visual.', 404, 'PREVIEW_NOT_FOUND');
  return structuredClone(value);
}
