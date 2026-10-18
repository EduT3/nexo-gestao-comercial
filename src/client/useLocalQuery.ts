import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createQueryLifecycle } from './query-lifecycle';

/** Keep drafts mounted, but query only the visible work area. */
export function useLocalQuery<T>(company: string, active: boolean, revision: number,
  load: () => Promise<T>, apply: (data: T) => void, onError: (error: unknown) => void) {
  const lifecycle = useMemo(createQueryLifecycle, [company]);
  const callbacks = useRef({ load, apply, onError });
  useLayoutEffect(() => { callbacks.current = { load, apply, onError }; });
  useLayoutEffect(() => { lifecycle.mount(); return () => lifecycle.dispose(); }, [lifecycle]);
  useLayoutEffect(() => { lifecycle.setActive(active); }, [lifecycle, active]);
  const refresh = useCallback(async () => {
    if (!company) return;
    const current = lifecycle.request();
    if (!current) return;
    try { const data = await callbacks.current.load(); if (current()) callbacks.current.apply(data); }
    catch (error) { if (current()) callbacks.current.onError(error); }
  }, [company, lifecycle]);
  useEffect(() => { void refresh(); }, [refresh, active, revision]);
  return { refresh, beginMutation: lifecycle.beginMutation };
}
