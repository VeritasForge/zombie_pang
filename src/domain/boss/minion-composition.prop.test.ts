import { fc, test } from "@fast-check/vitest";
import { asChapterNumber } from "@shared/types/branded";
import { describe, expect } from "vitest";
import { composeMinions, totalMinions } from "./minion-composition";

describe("minion-composition properties (seed=42, numRuns=1000)", () => {
  // P3: 단조 증가 (chapter ↑ → totalMinions ↑)
  test.prop([fc.integer({ min: 1, max: 4 })], { seed: 42, numRuns: 1000 })(
    "P3: ∀c∈[1..4]. totalMinions(c+1) ≥ totalMinions(c)",
    (c) => {
      const a = totalMinions(asChapterNumber(c));
      const b = totalMinions(asChapterNumber(c + 1));
      expect(b).toBeGreaterThanOrEqual(a);
    },
  );

  // 합산 == totalMinions
  test.prop([fc.integer({ min: 1, max: 5 })], { seed: 42, numRuns: 1000 })(
    "[Invariant] sum(spec.count) === totalMinions(chapter)",
    (c) => {
      const chapter = asChapterNumber(c);
      const specs = composeMinions(chapter);
      const sum = specs.reduce((s, x) => s + x.count, 0);
      expect(sum).toBe(totalMinions(chapter));
    },
  );
});
