import { asChapterNumber } from "@shared/types/branded";
import { describe, expect, it } from "vitest";
import type { PhaseConfig } from "./boss-phase-config";
import { applyRageMultipliers, computeRageLevel } from "./boss-rage-level";

const BASE: PhaseConfig = { R: 100, omega: 1 };

describe("computeRageLevel", () => {
  // [Happy] Ch5 HP 50% → rage 1
  it("[Happy] Ch5 HP=50% → rage 1", () => {
    expect(computeRageLevel(50, 100, asChapterNumber(5))).toBe(1);
  });

  // [Boundary] Ch1~3 무조건 0
  it.each([1, 2, 3])("[Boundary] Ch%i 무조건 rage 0", (ch) => {
    for (const hp of [100, 67, 50, 33, 0]) {
      expect(computeRageLevel(hp, 100, asChapterNumber(ch))).toBe(0);
    }
  });

  // [Boundary] Ch4 HP 정확 50% / 51% / 49%
  it("[Boundary] Ch4 HP=50% → rage 1 (≤ literal)", () => {
    expect(computeRageLevel(50, 100, asChapterNumber(4))).toBe(1);
  });
  it("[Boundary] Ch4 HP=51% → rage 0", () => {
    expect(computeRageLevel(51, 100, asChapterNumber(4))).toBe(0);
  });
  it("[Boundary] Ch4 HP=49% → rage 1", () => {
    expect(computeRageLevel(49, 100, asChapterNumber(4))).toBe(1);
  });

  // [Boundary] Ch5 HP 정확 67% / 33% / 68% / 34%
  it("[Boundary] Ch5 HP=67% → rage 1", () => {
    expect(computeRageLevel(67, 100, asChapterNumber(5))).toBe(1);
  });
  it("[Boundary] Ch5 HP=68% → rage 0", () => {
    expect(computeRageLevel(68, 100, asChapterNumber(5))).toBe(0);
  });
  it("[Boundary] Ch5 HP=33% → rage 2", () => {
    expect(computeRageLevel(33, 100, asChapterNumber(5))).toBe(2);
  });
  it("[Boundary] Ch5 HP=34% → rage 1", () => {
    expect(computeRageLevel(34, 100, asChapterNumber(5))).toBe(1);
  });

  // [Boundary] HP<0 → 자연 처리 rage=2
  it("[Boundary] Ch5 HP<0 → rage 2 (자연 처리)", () => {
    expect(computeRageLevel(-10, 100, asChapterNumber(5))).toBe(2);
  });
  // [Boundary] HP>maxHp → rage 0
  it("[Boundary] Ch5 HP>maxHp → rage 0", () => {
    expect(computeRageLevel(150, 100, asChapterNumber(5))).toBe(0);
  });

  // [Error] maxHp ≤ 0
  it("[Error] maxHp=0 → throw RangeError", () => {
    expect(() => computeRageLevel(10, 0, asChapterNumber(5))).toThrow(RangeError);
  });
  it("[Error] maxHp=-1 → throw RangeError", () => {
    expect(() => computeRageLevel(10, -1, asChapterNumber(5))).toThrow(RangeError);
  });
});

describe("applyRageMultipliers", () => {
  // [Happy] rage 0 → identity (base 그대로)
  it("[Happy] rage 0 → base 그대로", () => {
    expect(applyRageMultipliers(BASE, 0)).toEqual({ R: 100, omega: 1 });
  });
  // [Happy] rage 1 → ω × 1.3 (mutation kill 정확값)
  it("[Happy] rage 1 → ω × 1.3, R 유지", () => {
    expect(applyRageMultipliers(BASE, 1)).toEqual({ R: 100, omega: 1.3 });
  });
  // [Happy] rage 2 → ω × 1.6, R × 1.15 (mutation kill 정확값)
  it("[Happy] rage 2 → ω × 1.6, R × 1.15", () => {
    expect(applyRageMultipliers(BASE, 2)).toEqual({ R: 115, omega: 1.6 });
  });
});
