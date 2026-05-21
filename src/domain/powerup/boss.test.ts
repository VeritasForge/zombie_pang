import { asChapterNumber } from "@shared/types/branded";
import { describe, expect, it } from "vitest";
import {
  BOSS_BASE_HP,
  WEAK_SPOT_MULTIPLIER,
  bossHpForChapter,
  bossRewardForChapter,
  damageOnHit,
} from "./boss";

describe("bossHpForChapter", () => {
  it("[Happy] chapter 1~5 HP 정확 (10/15/22/31/38)", () => {
    expect(bossHpForChapter(1)).toBe(10);
    expect(bossHpForChapter(2)).toBe(15);
    expect(bossHpForChapter(3)).toBe(22);
    expect(bossHpForChapter(4)).toBe(31);
    expect(bossHpForChapter(5)).toBe(38);
  });

  it("[Happy] chapter 1 HP = BOSS_BASE_HP", () => {
    expect(bossHpForChapter(1)).toBe(BOSS_BASE_HP);
  });

  it("[Happy] branded ChapterNumber 입력도 허용", () => {
    expect(bossHpForChapter(asChapterNumber(3))).toBe(22);
  });

  it("[Boundary] chapter 1과 5 경계", () => {
    expect(bossHpForChapter(1)).toBe(10);
    expect(bossHpForChapter(5)).toBe(38);
  });

  it("[Boundary] HP는 단조 증가 (chapter ↑ → HP ↑)", () => {
    for (let c = 1; c < 5; c += 1) {
      expect(bossHpForChapter(c + 1)).toBeGreaterThan(bossHpForChapter(c));
    }
  });

  it("[Error] chapter 0 throw", () => {
    expect(() => bossHpForChapter(0)).toThrow(RangeError);
  });

  it("[Error] chapter 6 throw", () => {
    expect(() => bossHpForChapter(6)).toThrow(RangeError);
  });

  it("[Error] chapter 소수 throw", () => {
    expect(() => bossHpForChapter(2.5)).toThrow(RangeError);
  });
});

describe("bossRewardForChapter", () => {
  it("[Happy] chapter 1 = 200, chapter 5 = 1000", () => {
    expect(bossRewardForChapter(1)).toBe(200);
    expect(bossRewardForChapter(5)).toBe(1000);
  });

  it("[Boundary] chapter별 선형 200 단위 증가", () => {
    expect(bossRewardForChapter(2)).toBe(400);
    expect(bossRewardForChapter(3)).toBe(600);
    expect(bossRewardForChapter(4)).toBe(800);
  });

  it("[Error] chapter 0 throw", () => {
    expect(() => bossRewardForChapter(0)).toThrow(RangeError);
  });

  it("[Error] chapter 6 throw", () => {
    expect(() => bossRewardForChapter(6)).toThrow(RangeError);
  });
});

describe("damageOnHit", () => {
  it("[Happy] weak spot hit은 2× damage", () => {
    expect(damageOnHit(10, true)).toBe(20);
    expect(damageOnHit(10, true)).toBe(10 * WEAK_SPOT_MULTIPLIER);
  });

  it("[Happy] normal hit은 그대로", () => {
    expect(damageOnHit(10, false)).toBe(10);
  });

  it("[Boundary] baseDamage 0은 어떤 hit이든 0", () => {
    expect(damageOnHit(0, true)).toBe(0);
    expect(damageOnHit(0, false)).toBe(0);
  });

  it("[Error] negative baseDamage throw", () => {
    expect(() => damageOnHit(-1, true)).toThrow(RangeError);
  });

  it("[Error] NaN baseDamage throw", () => {
    expect(() => damageOnHit(Number.NaN, false)).toThrow(RangeError);
  });
});
