import { useState, type ReactNode } from 'react';
/** Visit once, retain drafts, and avoid loading unopened modules. */
export function LocalWorkspace({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  return <div id={id} className="local-anchor" hidden={!active}>{(active || visited) ? children : null}</div>;
}
