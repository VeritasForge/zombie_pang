import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { COMBO_TIER, Combo, type ComboTier } from "./combo";

const TIER_ORDER: Record<ComboTier, number> = {
  [COMBO_TIER.X1]: 0,
  [COMBO_TIER.X1_5]: 1,
  [COMBO_TIER.X2]: 2,
  [COMBO_TIER.X3]: 3,
};

describe("Combo property-based", () => {
  test.prop([fc.nat({ max: 100 })], { seed: 42, numRuns: 200 })(
    "[Boundary] hit만 발생할 때 tier는 단조 비감소",
    (n) => {
      let prev: ComboTier = COMBO_TIER.X1;
      let c = Combo.initial();
      for (let i = 0; i < n; i += 1) {
        c = c.hit();
        const curr = c.tier();
        expect(TIER_ORDER[curr]).toBeGreaterThanOrEqual(TIER_ORDER[prev]);
        prev = curr;
      }
    },
  );

  test.prop([fc.nat({ max: 100 })], { seed: 7, numRuns: 200 })(
    "[Boundary] count는 hit 횟수와 정확히 같다",
    (n) => {
      let c = Combo.initial();
      for (let i = 0; i < n; i += 1) {
        c = c.hit();
      }
      expect(c.count()).toBe(n);
    },
  );

  test.prop([fc.nat({ max: 100 }), fc.nat({ max: 5000 })], { seed: 11, numRuns: 200 })(
    "[Boundary] decay > decayMs 이후 count=0, ≤ decayMs는 유지",
    (n, elapsed) => {
      let c = Combo.initial();
      for (let i = 0; i < n; i += 1) {
        c = c.hit();
      }
      const decayed = c.decay(elapsed);
      if (elapsed > c.decayMs()) {
        expect(decayed.count()).toBe(0);
      } else {
        expect(decayed.count()).toBe(n);
      }
    },
  );

  test.prop([fc.nat({ max: 200 })], { seed: 13, numRuns: 200 })(
    "[Boundary] multiplier는 항상 {1, 1.5, 2, 3} 중 하나",
    (n) => {
      let c = Combo.initial();
      for (let i = 0; i < n; i += 1) {
        c = c.hit();
      }
      expect([1, 1.5, 2, 3]).toContain(c.multiplier());
    },
  );
});
