import type { IRandom } from "@domain/ports/random";
import { describe, expect, it } from "vitest";
import type { CardId } from "./card";
import {
  CHAPTER_UNLOCK,
  COIN_UNLOCK_THRESHOLDS,
  CardPool,
  INITIAL_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
  unlockedCardIds,
} from "./card-pool";

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

describe("unlockedCardIds", () => {
  it("[Happy] 초기 상태(0 chapter, 0 coin)는 INITIAL_CARDS 4장만", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: 0 });
    expect(ids).toEqual(INITIAL_CARDS);
    expect(ids).toHaveLength(4);
  });

  it("[Happy] 챕터 2 클리어 시 Tier 2 4장 추가 (총 8장)", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 2, totalCoinsEarned: 0 });
    expect(ids).toHaveLength(8);
    for (const id of TIER_2_CARDS) {
      expect(ids).toContain(id);
    }
  });

  it("[Happy] 챕터 4 클리어 시 Tier 2+3 추가 (총 12장)", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 4, totalCoinsEarned: 0 });
    expect(ids).toHaveLength(12);
    for (const id of TIER_3_CARDS) {
      expect(ids).toContain(id);
    }
  });

  it("[Happy] 1000 coin 도달 → SPECIAL_MAGNET unlock", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: 1000 });
    expect(ids).toContain("SPECIAL_MAGNET");
    expect(ids).not.toContain("SPECIAL_DECAY");
    expect(ids).not.toContain("SPECIAL_CRIT_MULTI");
  });

  it("[Happy] 3000 coin → MAGNET + DECAY (2장)", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: 3000 });
    expect(ids).toContain("SPECIAL_MAGNET");
    expect(ids).toContain("SPECIAL_DECAY");
    expect(ids).not.toContain("SPECIAL_CRIT_MULTI");
  });

  it("[Happy] 10000 coin → 3종 모두 unlock", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: 10000 });
    expect(ids).toContain("SPECIAL_MAGNET");
    expect(ids).toContain("SPECIAL_DECAY");
    expect(ids).toContain("SPECIAL_CRIT_MULTI");
  });

  it("[Happy] 챕터 4 + 10000 coin → 15장 전체", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 4, totalCoinsEarned: 10000 });
    expect(ids).toHaveLength(15);
  });

  it("[Boundary] coin 정확히 1000 → MAGNET unlock 임계", () => {
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_MAGNET,
      }),
    ).toContain("SPECIAL_MAGNET");
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_MAGNET - 1,
      }),
    ).not.toContain("SPECIAL_MAGNET");
  });

  it("[Boundary] coin 정확히 3000 → DECAY unlock 임계", () => {
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_DECAY,
      }),
    ).toContain("SPECIAL_DECAY");
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_DECAY - 1,
      }),
    ).not.toContain("SPECIAL_DECAY");
  });

  it("[Boundary] coin 정확히 10000 → CRIT_MULTI unlock 임계", () => {
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_CRIT_MULTI,
      }),
    ).toContain("SPECIAL_CRIT_MULTI");
    expect(
      unlockedCardIds({
        highestClearedChapter: 0,
        totalCoinsEarned: COIN_UNLOCK_THRESHOLDS.SPECIAL_CRIT_MULTI - 1,
      }),
    ).not.toContain("SPECIAL_CRIT_MULTI");
  });

  it("[Boundary] 챕터 1 클리어는 Tier 2 unlock 안 됨", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 1, totalCoinsEarned: 0 });
    expect(ids).toHaveLength(4);
  });

  it("[Boundary] 챕터 3 클리어는 Tier 2 unlock, Tier 3 안 됨", () => {
    const ids = unlockedCardIds({ highestClearedChapter: 3, totalCoinsEarned: 0 });
    expect(ids).toHaveLength(8);
  });

  it("[Error] highestClearedChapter 음수 throw", () => {
    expect(() => unlockedCardIds({ highestClearedChapter: -1, totalCoinsEarned: 0 })).toThrow(
      RangeError,
    );
  });

  it("[Error] totalCoinsEarned 음수 throw", () => {
    expect(() => unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: -1 })).toThrow(
      RangeError,
    );
  });

  it("[Error] highestClearedChapter 소수 throw", () => {
    expect(() => unlockedCardIds({ highestClearedChapter: 1.5, totalCoinsEarned: 0 })).toThrow(
      RangeError,
    );
  });

  it("[Boundary] CHAPTER_UNLOCK 상수: Tier2=2, Tier3=4", () => {
    expect(CHAPTER_UNLOCK.TIER_2).toBe(2);
    expect(CHAPTER_UNLOCK.TIER_3).toBe(4);
  });
});

describe("CardPool.pickThree", () => {
  const pool = new CardPool();
  const fullUnlocked = unlockedCardIds({
    highestClearedChapter: 4,
    totalCoinsEarned: 10000,
  });

  it("[Happy] 3장 추첨, 중복 없음", () => {
    // nextInt sequence: 0, 0, 0 with shrinking pool.
    const picked = pool.pickThree(new FakeRandom([0.0, 0.0, 0.0]), fullUnlocked);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it("[Happy] 다른 random 값 → 다른 카드 추첨", () => {
    const a = pool.pickThree(new FakeRandom([0.0, 0.0, 0.0]), fullUnlocked);
    const b = pool.pickThree(new FakeRandom([0.5, 0.5, 0.5]), fullUnlocked);
    expect(a).not.toEqual(b);
  });

  it("[Happy] 추첨된 카드는 모두 unlockedPool 부분집합", () => {
    const picked = pool.pickThree(new FakeRandom([0.1, 0.4, 0.8]), fullUnlocked);
    for (const id of picked) {
      expect(fullUnlocked).toContain(id);
    }
  });

  it("[Boundary] pool 크기 정확히 3 — 모두 추첨", () => {
    const tiny: readonly CardId[] = ["DAMAGE_T1", "CRIT_T1", "DURATION_T1"];
    const picked = pool.pickThree(new FakeRandom([0.0, 0.0, 0.0]), tiny);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it("[Boundary] 초기 4장 풀에서 추첨 (3장 가능)", () => {
    const picked = pool.pickThree(new FakeRandom([0.0, 0.0, 0.0]), INITIAL_CARDS);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it("[Error] pool 크기 < 3 throw", () => {
    expect(() =>
      pool.pickThree(new FakeRandom([0.0]), ["DAMAGE_T1", "CRIT_T1"] as readonly CardId[]),
    ).toThrow(RangeError);
  });

  it("[Error] 빈 pool throw", () => {
    expect(() => pool.pickThree(new FakeRandom([0.0]), [] as readonly CardId[])).toThrow(
      RangeError,
    );
  });

  it("[Error] random.nextInt가 범위 밖 (음수) throw", () => {
    class BadRandom implements IRandom {
      next(): number {
        return 0;
      }
      nextInt(_: number): number {
        return -1;
      }
      pick<T>(_: readonly T[]): T {
        throw new Error("unused");
      }
    }
    expect(() => pool.pickThree(new BadRandom(), fullUnlocked)).toThrow(RangeError);
  });

  it("[Error] random.nextInt가 범위 밖 (>=length) throw", () => {
    class BadRandom implements IRandom {
      next(): number {
        return 0;
      }
      nextInt(maxExclusive: number): number {
        return maxExclusive;
      }
      pick<T>(_: readonly T[]): T {
        throw new Error("unused");
      }
    }
    expect(() => pool.pickThree(new BadRandom(), fullUnlocked)).toThrow(RangeError);
  });
});
