import { describe, expect, it } from "vitest";
import { CLIMAX_HP_RATIO, isBossClimax } from "./boss-climax";

describe("isBossClimax", () => {
  // [Happy] HP 24% → climax true
  it("[Happy] 24/100 → true", () => expect(isBossClimax(24, 100)).toBe(true));
  // [Boundary] 정확히 25% → true (≤ literal)
  it("[Boundary] 25/100 → true", () => expect(isBossClimax(25, 100)).toBe(true));
  it("[Boundary] 26/100 → false", () => expect(isBossClimax(26, 100)).toBe(false));
  // [Boundary] 0% → true, 100% → false
  it("[Boundary] 0/100 → true", () => expect(isBossClimax(0, 100)).toBe(true));
  it("[Boundary] 100/100 → false", () => expect(isBossClimax(100, 100)).toBe(false));
  // [Error] maxHp=0 → false (graceful, throw 금지)
  it("[Error] maxHp=0 → false", () => expect(isBossClimax(5, 0)).toBe(false));
  it("[Error] 음수 hp → true (0 이하)", () => expect(isBossClimax(-1, 100)).toBe(true));
  it("[Error] NaN maxHp → false", () => expect(isBossClimax(5, Number.NaN)).toBe(false));
  it("[Error] NaN hp → false", () => expect(isBossClimax(Number.NaN, 100)).toBe(false));
  // mutation: maxHp 가드가 `<= 0`(=0 포함)이라 음수 hp에서도 false (`< 0` 변이 kill)
  it("[Error] 음수 hp + maxHp=0 → false (maxHp 가드 우선)", () =>
    expect(isBossClimax(-1, 0)).toBe(false));
  // mutation: hp 유한성 가드 없으면 -Infinity/maxHp = -Infinity ≤ 0.25 = true가 되는 것 방지
  it("[Error] -Infinity hp → false (유한성 가드)", () =>
    expect(isBossClimax(Number.NEGATIVE_INFINITY, 100)).toBe(false));
  it("[Error] +Infinity hp → false", () =>
    expect(isBossClimax(Number.POSITIVE_INFINITY, 100)).toBe(false));
  // 상수 노출
  it("[Boundary] CLIMAX_HP_RATIO === 0.25", () => expect(CLIMAX_HP_RATIO).toBe(0.25));
});
