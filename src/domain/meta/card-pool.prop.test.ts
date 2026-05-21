import type { IRandom } from "@domain/ports/random";
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { ALL_CARD_IDS, type CardId } from "./card";
import { CardPool, unlockedCardIds } from "./card-pool";

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

const cardIdArb = fc.constantFrom(...ALL_CARD_IDS) as fc.Arbitrary<CardId>;

describe("CardPool property-based", () => {
  test.prop(
    [
      fc.uniqueArray(cardIdArb, { minLength: 3, maxLength: 15 }),
      fc.array(fc.double({ min: 0, max: 0.999_999, noNaN: true, noDefaultInfinity: true }), {
        minLength: 3,
        maxLength: 3,
      }),
    ],
    { seed: 42, numRuns: 200 },
  )("[Boundary] pickThree 결과는 pool 부분집합 + 중복 없음", (pool, rs) => {
    const picked = new CardPool().pickThree(new FakeRandom(rs), pool);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    for (const id of picked) {
      expect(pool).toContain(id);
    }
  });

  test.prop([fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 12000 })], {
    seed: 7,
    numRuns: 200,
  })(
    "[Boundary] unlockedCardIds 결과는 항상 ALL_CARD_IDS의 부분집합 + 중복 없음",
    (chapter, coins) => {
      const ids = unlockedCardIds({
        highestClearedChapter: chapter,
        totalCoinsEarned: coins,
      });
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(ALL_CARD_IDS).toContain(id);
      }
    },
  );

  test.prop([fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 12000 })], {
    seed: 11,
    numRuns: 200,
  })("[Boundary] unlockedCardIds는 단조 증가 (chapter↑, coin↑ → 카드 수 ↑)", (chapter, coins) => {
    const lower = unlockedCardIds({ highestClearedChapter: 0, totalCoinsEarned: 0 });
    const upper = unlockedCardIds({
      highestClearedChapter: chapter,
      totalCoinsEarned: coins,
    });
    expect(upper.length).toBeGreaterThanOrEqual(lower.length);
  });
});
