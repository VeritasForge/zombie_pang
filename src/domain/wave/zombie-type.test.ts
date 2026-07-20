import { describe, expect, it } from "vitest";
import { ZOMBIE_TYPE, isZombieType, specOf } from "./zombie-type";

describe("zombie-type specOf", () => {
  it("[Happy] intern은 hp1 reward10", () => {
    expect(specOf(ZOMBIE_TYPE.INTERN)).toMatchObject({ hp: 1, reward: 10 });
  });

  it("[Happy] CEO는 탱커 hp5 reward100 (보스 아님)", () => {
    expect(specOf(ZOMBIE_TYPE.CEO)).toMatchObject({ hp: 5, reward: 100 });
  });

  it("[Boundary] 직급 hp 계단 + lifespanMs: intern1/2000 ≤ middle1/2000 ≤ lead2/2500 ≤ ceo5/3500", () => {
    expect(specOf(ZOMBIE_TYPE.INTERN).hp).toBe(1);
    expect(specOf(ZOMBIE_TYPE.INTERN).lifespanMs).toBe(2000);
    expect(specOf(ZOMBIE_TYPE.MIDDLE).hp).toBe(1);
    expect(specOf(ZOMBIE_TYPE.MIDDLE).lifespanMs).toBe(2000);
    expect(specOf(ZOMBIE_TYPE.LEAD).hp).toBe(2);
    expect(specOf(ZOMBIE_TYPE.LEAD).lifespanMs).toBe(2500);
    expect(specOf(ZOMBIE_TYPE.CEO).hp).toBe(5);
    expect(specOf(ZOMBIE_TYPE.CEO).lifespanMs).toBe(3500);
  });

  it("[Error] 알 수 없는 타입은 RangeError", () => {
    // @ts-expect-error 잘못된 입력
    expect(() => specOf("manager")).toThrow(RangeError);
  });

  it("[Boundary] isZombieType: 4종 true + false cases (empty, null, number, unknown)", () => {
    expect(isZombieType("intern")).toBe(true);
    expect(isZombieType("middle")).toBe(true);
    expect(isZombieType("lead")).toBe(true);
    expect(isZombieType("ceo")).toBe(true);
    expect(isZombieType("")).toBe(false);
    expect(isZombieType(null)).toBe(false);
    expect(isZombieType(42)).toBe(false);
    expect(isZombieType("manager")).toBe(false);
  });
});
