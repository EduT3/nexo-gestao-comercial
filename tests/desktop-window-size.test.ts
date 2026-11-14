import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

const { fitWindowToWorkArea } = createRequire(import.meta.url)('../electron/window-size.cjs');

it('keeps the default window dimensions when they fit the work area', () => {
  const main = { width: 1200, height: 800, minWidth: 900, minHeight: 650 };
  expect(fitWindowToWorkArea(main, { width: 1920, height: 1040 })).toEqual(main);
});

it('keeps both the initial and minimum window dimensions within a compact work area', () => {
  const compact = { width: 885, height: 480 };
  const windows = [
    [{ width: 1200, height: 800, minWidth: 900, minHeight: 650 }, 885],
    [{ width: 900, height: 740, minWidth: 700, minHeight: 600 }, 700],
  ] as const;
  for (const [defaults, minWidth] of windows) {
    expect(fitWindowToWorkArea(defaults, compact)).toEqual({ ...compact, minWidth, minHeight: 480 });
  }
});
