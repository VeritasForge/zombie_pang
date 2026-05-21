import type { IRandom } from "@domain/ports/random";
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { SPAWN_JITTER_MS, Spawner } from "./spawner";
import { Wave } from "./wave";
import { isZombieType } from "./zombie-type";

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

describe("Spawner property-based", () => {
  test.prop(
    [
      fc.integer({ min: 1, max: 9 }),
      fc.double({
        min: 0,
        max: 0.999_999,
        noNaN: true,
        noDefaultInfinity: true,
      }),
    ],
    { seed: 42, numRuns: 200 },
  )("[Boundary] 일반 wave + r ∈ [0, 1)에서 spawn은 4종 중 하나", (waveNum, r) => {
    const result = new Spawner().spawn(Wave.of(waveNum), new FakeRandom([r]));
    expect(isZombieType(result)).toBe(true);
  });

  test.prop(
    [
      fc.array(fc.double({ min: 0, max: 0.999_999, noNaN: true, noDefaultInfinity: true }), {
        minLength: 1,
        maxLength: 50,
      }),
    ],
    { seed: 7, numRuns: 100 },
  )("[Boundary] 동일 seed (값 시퀀스) → 동일 spawn 시퀀스 (결정론)", (values) => {
    const sp = new Spawner();
    const r1 = new FakeRandom(values);
    const r2 = new FakeRandom(values);
    const wave = Wave.of(1);
    const seq1 = values.map(() => sp.spawn(wave, r1));
    const seq2 = values.map(() => sp.spawn(wave, r2));
    expect(seq1).toEqual(seq2);
  });

  test.prop(
    [
      fc.integer({ min: 1, max: 10 }),
      fc.double({ min: 0, max: 0.999_999, noNaN: true, noDefaultInfinity: true }),
    ],
    { seed: 11, numRuns: 200 },
  )("[Boundary] nextSpawnDelayMs는 base ± SPAWN_JITTER_MS 범위 내", (waveNum, r) => {
    const wave = Wave.of(waveNum);
    const base = wave.spawnRateMs();
    const delay = new Spawner().nextSpawnDelayMs(wave, new FakeRandom([r]));
    expect(delay).toBeGreaterThanOrEqual(base - SPAWN_JITTER_MS);
    expect(delay).toBeLessThanOrEqual(base + SPAWN_JITTER_MS);
  });
});
