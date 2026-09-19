import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '../shared/contracts';

let csrfToken = '';
declare const __VISUAL_PREVIEW__: boolean;
export const visualPreview = typeof __VISUAL_PREVIEW__ !== 'undefined' && __VISUAL_PREVIEW__;
export function setCsrfToken(value: string) { csrfToken = value; }
export class RequestError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

export async function api<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; signal?: AbortSignal; headers?: Record<string, string> } = {}): Promise<T> {
  if (visualPreview) {
    const { previewRequest } = await import('./preview/adapter');
    return previewRequest(path, options.method ?? 'GET') as T;
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin', method: options.method ?? 'GET', signal: options.signal,
      headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}), ...options.headers },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new RequestError('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.', 0, 'NETWORK_ERROR');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/session') window.dispatchEvent(new Event('jg:session-expired'));
    const detail = data as ApiError | null;
    throw new RequestError(detail?.error?.message ?? 'Não foi possível concluir esta operação. Tente novamente.', response.status, detail?.error?.code ?? 'REQUEST_ERROR');
  }
  if (data === null) throw new RequestError('O servidor retornou uma resposta inesperada. Tente novamente.', response.status, 'INVALID_RESPONSE');
  return data as T;
}

export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.'; }

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    void api<T>(path, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(reason => { if (!controller.signal.aborted) setError(errorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, reload };
}
