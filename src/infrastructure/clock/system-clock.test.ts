import { describe, expect, it } from "vitest";
import { SystemClock } from "./system-clock";

describe("SystemClock", () => {
  it("[Happy] returns finite monotonic value", () => {
    const clock = new SystemClock();
    const t = clock.now();
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(0);
  });

  it("[Happy] consecutive calls are non-decreasing", () => {
    const clock = new SystemClock();
    const a = clock.now();
    const b = clock.now();
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("[Boundary] falls back to Date.now when performance.now is missing", () => {
    const originalPerf = globalThis.performance;
    const replacement = { ...originalPerf } as Performance & { now?: () => number };
    // remove now method
    Object.defineProperty(globalThis, "performance", {
      value: { ...replacement, now: undefined },
      configurable: true,
    });
    try {
      const clock = new SystemClock();
      const t = clock.now();
      expect(Number.isFinite(t)).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "performance", {
        value: originalPerf,
        configurable: true,
      });
    }
  });
});
