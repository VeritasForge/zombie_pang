import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import {
  SPAWN_COUNT_FINAL,
  SPAWN_COUNT_INITIAL,
  SPAWN_RATE_FINAL_MS,
  SPAWN_RATE_INITIAL_MS,
  Wave,
} from "./wave";

describe("Wave property-based", () => {
  test.prop([fc.integer({ min: 1, max: 10 })], { seed: 42, numRuns: 200 })(
    "[Boundary] wave 1~10에서 spawnRate ∈ [300, 1000]ms",
    (n) => {
      const rate = Wave.of(n).spawnRateMs();
      expect(rate).toBeGreaterThanOrEqual(SPAWN_RATE_FINAL_MS);
      expect(rate).toBeLessThanOrEqual(SPAWN_RATE_INITIAL_MS);
    },
  );

  test.prop([fc.integer({ min: 1, max: 10 })], { seed: 7, numRuns: 200 })(
    "[Boundary] wave 1~10에서 spawnCount ∈ [1, 5]",
    (n) => {
      const count = Wave.of(n).spawnCount();
      expect(count).toBeGreaterThanOrEqual(SPAWN_COUNT_INITIAL);
      expect(count).toBeLessThanOrEqual(SPAWN_COUNT_FINAL);
    },
  );

  test.prop([fc.integer({ min: 1, max: 9 })], { seed: 11, numRuns: 200 })(
    "[Boundary] wave 1~9는 boss wave 아님",
    (n) => {
      expect(Wave.of(n).isBossWave()).toBe(false);
    },
  );

  test.prop([fc.integer({ min: 10, max: 50 })], { seed: 13, numRuns: 200 })(
    "[Boundary] wave 10 이상은 boss wave",
    (n) => {
      expect(Wave.of(n).isBossWave()).toBe(true);
    },
  );

  test.prop([fc.integer({ min: 1, max: 9 })], { seed: 17, numRuns: 200 })(
    "[Boundary] spawnRate는 wave가 클수록 작아진다 (단조 감소)",
    (n) => {
      const a = Wave.of(n).spawnRateMs();
      const b = Wave.of(n + 1).spawnRateMs();
      expect(b).toBeLessThanOrEqual(a);
    },
  );
});
