import type { IRandom } from "@domain/ports/random";
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { Spawner } from "./spawner";
import { isZombieType } from "./zombie-type";

describe("Spawner property-based", () => {
  test.prop([fc.integer({ min: 1, max: 5 }), fc.double({ min: 0, max: 0.9999, noNaN: true })], {
    seed: 42,
    numRuns: 1000,
  })("spawnForBand는 항상 유효 ZombieType 반환", (band, r) => {
    const random: IRandom = {
      next: () => r,
      pick: (a) => a[0] as never,
      nextInt: (max) => Math.floor(r * max),
    };
    expect(isZombieType(new Spawner().spawnForBand(band, random))).toBe(true);
  });
});
