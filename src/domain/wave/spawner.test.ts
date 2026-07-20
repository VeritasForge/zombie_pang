import type { IRandom } from "@domain/ports/random";
import { describe, expect, it } from "vitest";
import { SPAWN_JITTER_MS, Spawner } from "./spawner";
import { Wave } from "./wave";
import { ZOMBIE_TYPE } from "./zombie-type";

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
      throw new RangeError("pick: empty");
    }
    const i = this.nextInt(items.length);
    return items[i] as T;
  }
}

describe("Spawner.spawn", () => {
  it("[Happy] r=0.0은 intern (0.7 미만)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.0]))).toBe(ZOMBIE_TYPE.INTERN);
  });

  it("[Happy] r=0.5는 intern (0.7 미만)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.5]))).toBe(ZOMBIE_TYPE.INTERN);
  });

  it("[Happy] r=0.8은 middle (0.7~0.9)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.8]))).toBe(ZOMBIE_TYPE.MIDDLE);
  });

  it("[Happy] r=0.95는 lead (0.9~0.98)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.95]))).toBe(ZOMBIE_TYPE.LEAD);
  });

  it("[Happy] r=0.99는 ceo (0.98~1.0)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.99]))).toBe(ZOMBIE_TYPE.CEO);
  });

  it("[Happy] 보스 wave는 항상 ceo (random 무관)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(10), new FakeRandom([0.0]))).toBe(ZOMBIE_TYPE.CEO);
    expect(sp.spawn(Wave.of(10), new FakeRandom([0.5]))).toBe(ZOMBIE_TYPE.CEO);
  });

  it("[Boundary] r=0.7 정확히는 middle (0.7 미만 intern, ≥ 0.7 middle)", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.7]))).toBe(ZOMBIE_TYPE.MIDDLE);
  });

  it("[Boundary] r=0.9 정확히는 lead", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.9]))).toBe(ZOMBIE_TYPE.LEAD);
  });

  it("[Boundary] r=0.98 정확히는 ceo", () => {
    const sp = new Spawner();
    expect(sp.spawn(Wave.of(1), new FakeRandom([0.98]))).toBe(ZOMBIE_TYPE.CEO);
  });

  it("[Error] random.next() >= 1은 RangeError", () => {
    const sp = new Spawner();
    expect(() => sp.spawn(Wave.of(1), new FakeRandom([1.0]))).toThrow(RangeError);
  });

  it("[Error] random.next() 음수는 RangeError", () => {
    const sp = new Spawner();
    expect(() => sp.spawn(Wave.of(1), new FakeRandom([-0.1]))).toThrow(RangeError);
  });

  it("[Error] random.next() NaN은 RangeError", () => {
    const sp = new Spawner();
    expect(() => sp.spawn(Wave.of(1), new FakeRandom([Number.NaN]))).toThrow(RangeError);
  });
});

describe("Spawner.nextSpawnDelayMs", () => {
  it("[Happy] r=0.5 (center)는 base와 동일 (jitter=0)", () => {
    const sp = new Spawner();
    const wave = Wave.of(1); // base 1000ms
    expect(sp.nextSpawnDelayMs(wave, new FakeRandom([0.5]))).toBe(1000);
  });

  it("[Happy] r=0 (min jitter)는 base - 200ms", () => {
    const sp = new Spawner();
    const wave = Wave.of(1);
    expect(sp.nextSpawnDelayMs(wave, new FakeRandom([0.0]))).toBe(1000 - SPAWN_JITTER_MS);
  });

  it("[Happy] r=0.999... (max jitter)는 base + 거의 200ms", () => {
    const sp = new Spawner();
    const wave = Wave.of(1);
    const result = sp.nextSpawnDelayMs(wave, new FakeRandom([0.9999]));
    expect(result).toBeGreaterThan(1000);
    expect(result).toBeLessThanOrEqual(1000 + SPAWN_JITTER_MS);
  });

  it("[Boundary] wave 10 (base 300ms)에서 jitter -200ms = 100ms (항상 양수 보장)", () => {
    const sp = new Spawner();
    const wave = Wave.of(10);
    const result = sp.nextSpawnDelayMs(wave, new FakeRandom([0.0]));
    expect(result).toBe(100);
  });

  it("[Boundary] base + jitter는 항상 ≥ 100ms (wave 10 - 200ms jitter = 100)", () => {
    const sp = new Spawner();
    // wave 1: 1000 - 200 = 800
    expect(sp.nextSpawnDelayMs(Wave.of(1), new FakeRandom([0.0]))).toBe(800);
    // wave 5: ~688 - 200 ≈ 488
    expect(sp.nextSpawnDelayMs(Wave.of(5), new FakeRandom([0.0]))).toBeGreaterThan(0);
  });

  it("[Error] random.next() >= 1은 RangeError", () => {
    const sp = new Spawner();
    expect(() => sp.nextSpawnDelayMs(Wave.of(1), new FakeRandom([1.0]))).toThrow(RangeError);
  });

  it("[Error] random.next() 음수는 RangeError", () => {
    const sp = new Spawner();
    expect(() => sp.nextSpawnDelayMs(Wave.of(1), new FakeRandom([-0.5]))).toThrow(RangeError);
  });
});

describe("Spawner determinism", () => {
  it("[Happy] 동일 seed (FakeRandom values 동일)는 동일 시퀀스 생성", () => {
    const sp = new Spawner();
    const seq1: string[] = [];
    const seq2: string[] = [];
    const values = [0.1, 0.75, 0.92, 0.99, 0.4];
    const r1 = new FakeRandom(values);
    const r2 = new FakeRandom(values);
    for (let i = 0; i < 5; i += 1) {
      seq1.push(sp.spawn(Wave.of(1), r1));
      seq2.push(sp.spawn(Wave.of(1), r2));
    }
    expect(seq1).toEqual(seq2);
  });
});

function fixedRandom(value: number): IRandom {
  return {
    next: () => value,
    pick: (arr) => arr[0] as never,
    nextInt: (max) => Math.floor(value * max),
  };
}

describe("Spawner.spawnForBand", () => {
  it("[Happy] band1 낮은 난수는 intern", () => {
    expect(new Spawner().spawnForBand(1, fixedRandom(0.1))).toBe(ZOMBIE_TYPE.INTERN);
  });
  it("[Happy] band5 높은 난수는 CEO", () => {
    expect(new Spawner().spawnForBand(5, fixedRandom(0.99))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band1 r=0.999 → lead (CEO 없음)", () => {
    expect(new Spawner().spawnForBand(1, fixedRandom(0.999))).toBe(ZOMBIE_TYPE.LEAD);
  });
  it("[Boundary] band2 CDF thresholds: r=0.5→intern, r=0.85→middle, r=0.95→lead, r=0.995→ceo", () => {
    const sp = new Spawner();
    expect(sp.spawnForBand(2, fixedRandom(0.5))).toBe(ZOMBIE_TYPE.INTERN);
    expect(sp.spawnForBand(2, fixedRandom(0.85))).toBe(ZOMBIE_TYPE.MIDDLE);
    expect(sp.spawnForBand(2, fixedRandom(0.95))).toBe(ZOMBIE_TYPE.LEAD);
    expect(sp.spawnForBand(2, fixedRandom(0.995))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band3 CDF thresholds: r=0.4→intern, r=0.7→middle, r=0.9→lead, r=0.98→ceo", () => {
    const sp = new Spawner();
    expect(sp.spawnForBand(3, fixedRandom(0.4))).toBe(ZOMBIE_TYPE.INTERN);
    expect(sp.spawnForBand(3, fixedRandom(0.7))).toBe(ZOMBIE_TYPE.MIDDLE);
    expect(sp.spawnForBand(3, fixedRandom(0.9))).toBe(ZOMBIE_TYPE.LEAD);
    expect(sp.spawnForBand(3, fixedRandom(0.98))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band4 CDF thresholds: r=0.3→intern, r=0.6→middle, r=0.85→lead, r=0.97→ceo", () => {
    const sp = new Spawner();
    expect(sp.spawnForBand(4, fixedRandom(0.3))).toBe(ZOMBIE_TYPE.INTERN);
    expect(sp.spawnForBand(4, fixedRandom(0.6))).toBe(ZOMBIE_TYPE.MIDDLE);
    expect(sp.spawnForBand(4, fixedRandom(0.85))).toBe(ZOMBIE_TYPE.LEAD);
    expect(sp.spawnForBand(4, fixedRandom(0.97))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band<1 은 band1로, band>5 는 band5로 클램프", () => {
    expect(new Spawner().spawnForBand(0, fixedRandom(0.1))).toBe(ZOMBIE_TYPE.INTERN);
    expect(new Spawner().spawnForBand(9, fixedRandom(0.99))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Error] 난수가 [0,1) 밖이면 RangeError", () => {
    expect(() => new Spawner().spawnForBand(1, fixedRandom(1))).toThrow(RangeError);
  });
});

describe("Spawner.delayForRate", () => {
  it("[Happy] 난수 0.5는 정확히 base(jitter 0)", () => {
    expect(new Spawner().delayForRate(500, fixedRandom(0.5))).toBe(500);
  });
  it("[Boundary] 난수 0은 base - 200", () => {
    expect(new Spawner().delayForRate(500, fixedRandom(0))).toBe(300);
  });
  it("[Boundary] 낮은 base에서도 최소 100ms 보장", () => {
    expect(new Spawner().delayForRate(120, fixedRandom(0))).toBeGreaterThanOrEqual(100);
  });
  it("[Error] base가 0이면 RangeError (경계 <= 0)", () => {
    expect(() => new Spawner().delayForRate(0, fixedRandom(0.5))).toThrow(RangeError);
  });
  it("[Error] base가 음수면 RangeError", () => {
    expect(() => new Spawner().delayForRate(-1, fixedRandom(0.5))).toThrow(RangeError);
  });
  it("[Error] random.next() >= 1은 RangeError", () => {
    expect(() => new Spawner().delayForRate(500, fixedRandom(1.0))).toThrow(RangeError);
  });
  it("[Error] random.next() 음수는 RangeError", () => {
    expect(() => new Spawner().delayForRate(500, fixedRandom(-0.1))).toThrow(RangeError);
  });
});
