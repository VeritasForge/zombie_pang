import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { computeBossPosition } from "./boss-movement";

const CENTER = { x: 200, y: 400 };

describe("boss-movement properties (seed=42, numRuns=1000)", () => {
  // P1a: x축 진폭 ∈ [cx-R, cx+R]
  test.prop(
    [
      fc.integer({ min: 0, max: 60_000 }),
      fc.double({ min: 10, max: 200, noNaN: true }),
      fc.double({ min: 0.1, max: 3, noNaN: true }),
    ],
    { seed: 42, numRuns: 1000 },
  )("P1a: x축 진폭 ∈ [cx-R, cx+R]", (tMs, R, omega) => {
    const pos = computeBossPosition(tMs, CENTER, R, omega);
    expect(pos.x).toBeGreaterThanOrEqual(CENTER.x - R - 1e-9);
    expect(pos.x).toBeLessThanOrEqual(CENTER.x + R + 1e-9);
  });

  // P1b: y축 진폭 ∈ [cy-R, cy+R]
  test.prop(
    [
      fc.integer({ min: 0, max: 60_000 }),
      fc.double({ min: 10, max: 200, noNaN: true }),
      fc.double({ min: 0.1, max: 3, noNaN: true }),
    ],
    { seed: 42, numRuns: 1000 },
  )("P1b: y축 진폭 ∈ [cy-R, cy+R]", (tMs, R, omega) => {
    const pos = computeBossPosition(tMs, CENTER, R, omega);
    expect(pos.y).toBeGreaterThanOrEqual(CENTER.y - R - 1e-9);
    expect(pos.y).toBeLessThanOrEqual(CENTER.y + R + 1e-9);
  });

  // P5: 결정론
  test.prop(
    [
      fc.integer({ min: 0, max: 60_000 }),
      fc.double({ min: 10, max: 200, noNaN: true }),
      fc.double({ min: 0.1, max: 3, noNaN: true }),
    ],
    { seed: 42, numRuns: 1000 },
  )("P5: 동일 (tMs, R, ω) → 동일 위치 (결정론)", (tMs, R, omega) => {
    const a = computeBossPosition(tMs, CENTER, R, omega);
    const b = computeBossPosition(tMs, CENTER, R, omega);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });
});
