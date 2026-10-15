/** One mounted company scope. Query responses may only replace the latest snapshot. */
export function createQueryLifecycle() {
  let mounted = false, active = false, generation = 0, sequence = 0, writes = 0;
  return {
    mount() { mounted = true; generation++; },
    dispose() { mounted = false; generation++; sequence++; writes = 0; },
    setActive(value: boolean) { active = value; sequence++; },
    request() {
      if (!mounted || !active || writes) return undefined;
      const ticket = ++sequence, scope = generation;
      return () => mounted && active && !writes && scope === generation && ticket === sequence;
    },
    beginMutation() {
      if (!mounted || writes) return undefined;
      writes++; sequence++;
      const scope = generation;
      let finished = false;
      const isCurrent = () => mounted && scope === generation;
      return {
        isCurrent,
        finish() {
          if (!finished) {
            finished = true;
            if (isCurrent()) { writes--; sequence++; }
          }
          return isCurrent();
        },
      };
    },
  };
}
