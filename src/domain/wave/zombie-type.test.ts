import { describe, expect, it } from "vitest";
import { ZOMBIE_TYPE, type ZombieType, isZombieType, specOf } from "./zombie-type";

describe("ZombieType.specOf", () => {
  it("[Happy] intern spec: hp=1, lifespan=800ms, reward=10", () => {
    const spec = specOf(ZOMBIE_TYPE.INTERN);
    expect(spec).toEqual({ type: "intern", hp: 1, lifespanMs: 800, reward: 10 });
  });

  it("[Happy] middle spec: hp=2, lifespan=1500ms, reward=25", () => {
    expect(specOf(ZOMBIE_TYPE.MIDDLE).hp).toBe(2);
    expect(specOf(ZOMBIE_TYPE.MIDDLE).lifespanMs).toBe(1500);
    expect(specOf(ZOMBIE_TYPE.MIDDLE).reward).toBe(25);
  });

  it("[Happy] lead spec: hp=3, lifespan=2500ms, reward=50", () => {
    expect(specOf(ZOMBIE_TYPE.LEAD)).toEqual({
      type: "lead",
      hp: 3,
      lifespanMs: 2500,
      reward: 50,
    });
  });

  it("[Happy] ceo spec (chapter 1 base): hp=10, reward=200", () => {
    const spec = specOf(ZOMBIE_TYPE.CEO);
    expect(spec.hp).toBe(10);
    expect(spec.reward).toBe(200);
  });

  it("[Boundary] 4종 모두 spec 존재", () => {
    expect(specOf("intern").type).toBe("intern");
    expect(specOf("middle").type).toBe("middle");
    expect(specOf("lead").type).toBe("lead");
    expect(specOf("ceo").type).toBe("ceo");
  });

  it("[Error] 잘못된 타입은 RangeError throw", () => {
    expect(() => specOf("intern_bad" as ZombieType)).toThrow(RangeError);
  });
});

describe("isZombieType", () => {
  it("[Happy] 4종 모두 true", () => {
    expect(isZombieType("intern")).toBe(true);
    expect(isZombieType("middle")).toBe(true);
    expect(isZombieType("lead")).toBe(true);
    expect(isZombieType("ceo")).toBe(true);
  });

  it("[Boundary] 빈 문자열 false", () => {
    expect(isZombieType("")).toBe(false);
  });

  it("[Error] 잘못된 타입은 false", () => {
    expect(isZombieType("zombie")).toBe(false);
    expect(isZombieType(null)).toBe(false);
    expect(isZombieType(undefined)).toBe(false);
    expect(isZombieType(42)).toBe(false);
  });
});
