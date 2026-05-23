import { fc, test } from "@fast-check/vitest";
import { asChapterNumber } from "@shared/types/branded";
import { describe, expect } from "vitest";
import { computeRageLevel } from "./boss-rage-level";

describe("boss-rage-level properties (seed=42, numRuns=1000)", () => {
  // P2: rage ∈ {0,1,2}
  test.prop([fc.integer({ min: 1, max: 5 }), fc.double({ min: 0, max: 100, noNaN: true })], {
    seed: 42,
    numRuns: 1000,
  })("P2: ∀(chapter, hp). rage ∈ {0,1,2}", (ch, hp) => {
    const rage = computeRageLevel(hp, 100, asChapterNumber(ch));
    expect([0, 1, 2]).toContain(rage);
  });

  // P6: 단조성 — hp1 ≤ hp2 → rage(hp1) ≥ rage(hp2)
  test.prop(
    [
      fc.integer({ min: 1, max: 5 }),
      fc.double({ min: 0, max: 100, noNaN: true }),
      fc.double({ min: 0, max: 100, noNaN: true }),
    ],
    { seed: 42, numRuns: 1000 },
  )("P6: hp1 ≤ hp2 → rage(hp1) ≥ rage(hp2) (격노 단조성)", (ch, a, b) => {
    const [hp1, hp2] = a <= b ? [a, b] : [b, a];
    const chapter = asChapterNumber(ch);
    expect(computeRageLevel(hp1, 100, chapter)).toBeGreaterThanOrEqual(
      computeRageLevel(hp2, 100, chapter),
    );
  });
});
