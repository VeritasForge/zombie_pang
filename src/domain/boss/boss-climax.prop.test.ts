import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { CLIMAX_HP_RATIO, isBossClimax } from "./boss-climax";

describe("boss-climax properties (seed=42, numRuns=1000)", () => {
  // invariant: 0≤hp≤maxHp 에서 isBossClimax ⇔ hp/maxHp ≤ 0.25
  test.prop(
    [fc.double({ min: 1, max: 1000, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true })],
    { seed: 42, numRuns: 1000 },
  )("isBossClimax ⇔ ratio ≤ 0.25", (maxHp, frac) => {
    const hp = maxHp * frac;
    expect(isBossClimax(hp, maxHp)).toBe(hp / maxHp <= CLIMAX_HP_RATIO);
  });
});
