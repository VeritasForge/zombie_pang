// CardPool — Unlock 규칙 + pickThree 추첨.
// Bible §4:
//   - 초기 4장: DAMAGE_T1, CRIT_T1, DURATION_T1, COIN_T1
//   - 챕터 2 클리어 → Tier 2 unlock (4장)
//   - 챕터 4 클리어 → Tier 3 unlock (4장)
//   - 누적 coin 1000 → SPECIAL_MAGNET
//   - 누적 coin 3000 → SPECIAL_DECAY
//   - 누적 coin 10000 → SPECIAL_CRIT_MULTI (ADR-0007 Tentative Default)

import type { IRandom } from "@domain/ports/random";
import type { CardId } from "./card";

export const INITIAL_CARDS: readonly CardId[] = ["DAMAGE_T1", "CRIT_T1", "DURATION_T1", "COIN_T1"];

export const TIER_2_CARDS: readonly CardId[] = ["DAMAGE_T2", "CRIT_T2", "DURATION_T2", "COIN_T2"];

export const TIER_3_CARDS: readonly CardId[] = ["DAMAGE_T3", "CRIT_T3", "DURATION_T3", "COIN_T3"];

export const COIN_UNLOCK_THRESHOLDS = {
  SPECIAL_MAGNET: 1000,
  SPECIAL_DECAY: 3000,
  SPECIAL_CRIT_MULTI: 10000,
} as const;

export const CHAPTER_UNLOCK = {
  TIER_2: 2,
  TIER_3: 4,
} as const;

export type UnlockContext = {
  /** 최고 클리어 챕터 (0이면 아직 미클리어) */
  readonly highestClearedChapter: number;
  /** 누적 획득 coin */
  readonly totalCoinsEarned: number;
};

export function unlockedCardIds(ctx: UnlockContext): readonly CardId[] {
  if (!Number.isInteger(ctx.highestClearedChapter) || ctx.highestClearedChapter < 0) {
    throw new RangeError(
      `unlockedCardIds: highestClearedChapter must be non-negative integer, got ${ctx.highestClearedChapter}`,
    );
  }
  if (!Number.isInteger(ctx.totalCoinsEarned) || ctx.totalCoinsEarned < 0) {
    throw new RangeError(
      `unlockedCardIds: totalCoinsEarned must be non-negative integer, got ${ctx.totalCoinsEarned}`,
    );
  }
  const ids: CardId[] = [...INITIAL_CARDS];
  if (ctx.highestClearedChapter >= CHAPTER_UNLOCK.TIER_2) {
    ids.push(...TIER_2_CARDS);
  }
  if (ctx.highestClearedChapter >= CHAPTER_UNLOCK.TIER_3) {
    ids.push(...TIER_3_CARDS);
  }
  if (ctx.totalCoinsEarned >= COIN_UNLOCK_THRESHOLDS.SPECIAL_MAGNET) {
    ids.push("SPECIAL_MAGNET");
  }
  if (ctx.totalCoinsEarned >= COIN_UNLOCK_THRESHOLDS.SPECIAL_DECAY) {
    ids.push("SPECIAL_DECAY");
  }
  if (ctx.totalCoinsEarned >= COIN_UNLOCK_THRESHOLDS.SPECIAL_CRIT_MULTI) {
    ids.push("SPECIAL_CRIT_MULTI");
  }
  return ids;
}

export class CardPool {
  /**
   * 풀에서 3장을 추첨 (중복 없음, 균등 결정론).
   * pool 크기 < 3이면 RangeError.
   */
  pickThree(random: IRandom, pool: readonly CardId[]): readonly CardId[] {
    if (pool.length < 3) {
      throw new RangeError(`CardPool.pickThree: pool must have ≥ 3 cards, got ${pool.length}`);
    }
    const remaining = [...pool];
    const picked: CardId[] = [];
    for (let i = 0; i < 3; i += 1) {
      const idx = random.nextInt(remaining.length);
      if (!Number.isInteger(idx) || idx < 0 || idx >= remaining.length) {
        throw new RangeError(`IRandom.nextInt must return [0, ${remaining.length}), got ${idx}`);
      }
      const removed = remaining.splice(idx, 1)[0];
      /* c8 ignore next 3 -- idx 범위 검증 통과 후 splice는 항상 element 반환 (TS narrow 보장용 방어 코드) */
      if (removed === undefined) {
        throw new RangeError("CardPool.pickThree: unexpected undefined");
      }
      picked.push(removed);
    }
    return picked;
  }
}
