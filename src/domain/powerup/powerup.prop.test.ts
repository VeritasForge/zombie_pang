import type { IRandom } from "@domain/ports/random";
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { PowerUpDropPolicy } from "./drop-policy";
import { ALL_POWERUP_TYPES, isPowerUpType } from "./powerup";

class FakeRandom implements IRandom {
  private idx = 0;
  constructor(private readonly values: readonly number[]) {}
  next(): number {
    const v = this.values[this.idx % this.values.length];
    this.idx += 1;
    return v ?? 0;
  }
  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError("empty");
    }
    return items[this.nextInt(items.length)] as T;
  }
}

describe("PowerUpDropPolicy property-based", () => {
  test.prop(
    [
      fc.double({ min: 0, max: 0.999_999, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: 0, max: 0.999_999, noNaN: true, noDefaultInfinity: true }),
    ],
    { seed: 42, numRuns: 200 },
  )("[Boundary] dropOnKill 결과는 {bomb, freeze, magnet, null} 중 하나", (r1, rate, r2) => {
    const policy = new PowerUpDropPolicy();
    const result = policy.dropOnKill(new FakeRandom([r1, r2]), rate);
    if (result === null) {
      expect(result).toBeNull();
    } else {
      expect(isPowerUpType(result)).toBe(true);
      expect(ALL_POWERUP_TYPES).toContain(result);
    }
  });
});
