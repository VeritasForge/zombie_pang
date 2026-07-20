import type { IRandom } from "@domain/ports/random";
import { describe, expect, it } from "vitest";
import { Spawner } from "./spawner";
import { ZOMBIE_TYPE } from "./zombie-type";

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
