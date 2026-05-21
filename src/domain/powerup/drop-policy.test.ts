import type { IRandom } from "@domain/ports/random";
import { describe, expect, it } from "vitest";
import {
  BASE_DROP_RATE,
  COIN_TIER_MULTIPLIER,
  PowerUpDropPolicy,
  dropRateForCoinTier,
} from "./drop-policy";

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

describe("dropRateForCoinTier", () => {
  it("[Happy] Tier 0 = 5%, Tier 3 = 6.5% (대략)", () => {
    expect(dropRateForCoinTier(0)).toBe(BASE_DROP_RATE);
    expect(dropRateForCoinTier(3)).toBeCloseTo(BASE_DROP_RATE * COIN_TIER_MULTIPLIER ** 3, 5);
    expect(dropRateForCoinTier(3)).toBeCloseTo(0.10985, 4); // 5 × 1.3^3 = 10.985%
  });

  it("[Boundary] Tier 0, 1, 2, 3 모두 허용", () => {
    expect(dropRateForCoinTier(0)).toBe(0.05);
    expect(dropRateForCoinTier(1)).toBeCloseTo(0.065, 4);
    expect(dropRateForCoinTier(2)).toBeCloseTo(0.0845, 4);
    expect(dropRateForCoinTier(3)).toBeCloseTo(0.10985, 4);
  });

  it("[Error] Tier 음수 throw", () => {
    expect(() => dropRateForCoinTier(-1)).toThrow(RangeError);
  });

  it("[Error] Tier > 3 throw", () => {
    expect(() => dropRateForCoinTier(4)).toThrow(RangeError);
  });

  it("[Error] Tier 소수 throw", () => {
    expect(() => dropRateForCoinTier(1.5)).toThrow(RangeError);
  });
});

describe("PowerUpDropPolicy.dropOnKill", () => {
  const policy = new PowerUpDropPolicy();

  it("[Happy] r < rate면 PowerUp drop, pick에서 첫 번째 선택", () => {
    // currentRate 0.05, r = 0.0 → drop. pick: next=0.0 → idx 0 = bomb
    const result = policy.dropOnKill(new FakeRandom([0.0, 0.0]), 0.05);
    expect(result).toBe("bomb");
  });

  it("[Happy] r >= rate면 null (drop 안 함)", () => {
    const result = policy.dropOnKill(new FakeRandom([0.5]), 0.05);
    expect(result).toBeNull();
  });

  it("[Happy] r=0.04, rate=0.05 → drop, pick idx 1 = freeze", () => {
    // pick uses random.next() → 0.5 → floor(0.5 * 3) = 1 → freeze
    const result = policy.dropOnKill(new FakeRandom([0.04, 0.5]), 0.05);
    expect(result).toBe("freeze");
  });

  it("[Boundary] rate=0 → 항상 null (r < 0 불가)", () => {
    expect(policy.dropOnKill(new FakeRandom([0.0]), 0)).toBeNull();
    expect(policy.dropOnKill(new FakeRandom([0.5]), 0)).toBeNull();
    expect(policy.dropOnKill(new FakeRandom([0.999]), 0)).toBeNull();
  });

  it("[Boundary] rate=1 → 항상 drop", () => {
    // r=0.0 → drop, pick idx 0 = bomb
    expect(policy.dropOnKill(new FakeRandom([0.0, 0.0]), 1)).toBe("bomb");
    // r=0.999 → drop, pick에서 idx floor(0.0 * 3) = 0 = bomb (다음 random)
    expect(policy.dropOnKill(new FakeRandom([0.999, 0.0]), 1)).toBe("bomb");
  });

  it("[Boundary] r 정확히 rate (0.05)는 null (>=)", () => {
    expect(policy.dropOnKill(new FakeRandom([0.05]), 0.05)).toBeNull();
  });

  it("[Boundary] Tier 3 max 6.5% 한도", () => {
    const tier3Max = dropRateForCoinTier(1); // Tier 1 = 6.5%
    expect(tier3Max).toBeCloseTo(0.065, 4);
  });

  it("[Error] currentRate 음수 throw", () => {
    expect(() => policy.dropOnKill(new FakeRandom([0.0]), -0.1)).toThrow(RangeError);
  });

  it("[Error] currentRate > 1 throw", () => {
    expect(() => policy.dropOnKill(new FakeRandom([0.0]), 1.5)).toThrow(RangeError);
  });

  it("[Error] currentRate NaN throw", () => {
    expect(() => policy.dropOnKill(new FakeRandom([0.0]), Number.NaN)).toThrow(RangeError);
  });

  it("[Error] random.next() >= 1 throw", () => {
    expect(() => policy.dropOnKill(new FakeRandom([1.0]), 0.5)).toThrow(RangeError);
  });

  it("[Error] random.next() 음수 throw", () => {
    expect(() => policy.dropOnKill(new FakeRandom([-0.1]), 0.5)).toThrow(RangeError);
  });
});

describe("PowerUpDropPolicy.dropOnBossKill", () => {
  const policy = new PowerUpDropPolicy();

  it("[Happy] 확정 drop, 3종 중 하나 반환 (idx 0 = bomb)", () => {
    expect(policy.dropOnBossKill(new FakeRandom([0.0]))).toBe("bomb");
  });

  it("[Happy] idx 1 = freeze (균등)", () => {
    expect(policy.dropOnBossKill(new FakeRandom([0.5]))).toBe("freeze");
  });

  it("[Happy] idx 2 = magnet (균등)", () => {
    expect(policy.dropOnBossKill(new FakeRandom([0.999]))).toBe("magnet");
  });

  it("[Boundary] 3종 균등 분포 — 0.34는 freeze", () => {
    // floor(0.34 * 3) = 1 → freeze
    expect(policy.dropOnBossKill(new FakeRandom([0.34]))).toBe("freeze");
  });
});
