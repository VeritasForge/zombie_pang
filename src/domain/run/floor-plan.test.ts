import { describe, expect, it } from "vitest";
import { CAP_MAX, FLOOR_MAX, bandOf, floorPlan } from "./floor-plan";

describe("floorPlan", () => {
  // [Happy] 정상 흐름
  it("[Happy] floor 1은 quota 8, cap 3, spawnRate 1000, escapeLimit 5", () => {
    const p = floorPlan(1);
    expect(p.quota).toBe(8);
    expect(p.cap).toBe(3);
    expect(p.spawnRateMs).toBe(1000);
    expect(p.escapeLimit).toBe(5);
    expect(p.band).toBe(1);
  });

  it("[Happy] floor 50은 quota 상한, cap 12, spawnRate 300, escapeLimit 3", () => {
    const p = floorPlan(50);
    expect(p.quota).toBe(82); // round(8 + 49*1.5) = round(81.5) = 82
    expect(p.cap).toBe(CAP_MAX);
    expect(p.spawnRateMs).toBe(300);
    expect(p.escapeLimit).toBe(3);
    expect(p.band).toBe(5);
  });

  it("[Happy] quota는 층에 따라 단조 증가", () => {
    for (let f = 2; f <= FLOOR_MAX; f += 1) {
      expect(floorPlan(f).quota).toBeGreaterThanOrEqual(floorPlan(f - 1).quota);
    }
  });

  // [Boundary] 경계값
  it("[Boundary] band 경계: 10→band1, 11→band2, 20→band2, 21→band3, 50→band5", () => {
    expect(bandOf(10)).toBe(1);
    expect(bandOf(11)).toBe(2);
    expect(bandOf(20)).toBe(2);
    expect(bandOf(21)).toBe(3);
    expect(bandOf(50)).toBe(5);
  });

  it("[Boundary] escapeLimit: band1~2=5, band3~4=4, band5=3", () => {
    expect(floorPlan(10).escapeLimit).toBe(5); // band1
    expect(floorPlan(20).escapeLimit).toBe(5); // band2
    expect(floorPlan(21).escapeLimit).toBe(4); // band3
    expect(floorPlan(40).escapeLimit).toBe(4); // band4
    expect(floorPlan(41).escapeLimit).toBe(3); // band5
  });

  it("[Boundary] cap은 CAP_MAX를 넘지 않음", () => {
    for (let f = 1; f <= FLOOR_MAX; f += 1) {
      expect(floorPlan(f).cap).toBeLessThanOrEqual(CAP_MAX);
      expect(floorPlan(f).cap).toBeGreaterThanOrEqual(1);
    }
  });

  it("[Boundary] spawnRateMs는 [300,1000] 범위", () => {
    for (let f = 1; f <= FLOOR_MAX; f += 1) {
      const r = floorPlan(f).spawnRateMs;
      expect(r).toBeGreaterThanOrEqual(300);
      expect(r).toBeLessThanOrEqual(1000);
    }
  });

  // [Error] 예외
  it("[Error] floor < 1 은 RangeError", () => {
    expect(() => floorPlan(0)).toThrow(RangeError);
  });
  it("[Error] floor > 50 은 RangeError", () => {
    expect(() => floorPlan(51)).toThrow(RangeError);
  });
  it("[Error] 비정수 floor는 RangeError", () => {
    expect(() => floorPlan(1.5)).toThrow(RangeError);
  });
});
