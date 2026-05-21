// Boss (CEO) HP curve.
// Bible §3 누적 보스 HP 배율: 1.0 / 1.5 / 2.25 / 3.10 / 3.84 × base 10
//   chapter 1 = 10, 2 = 15, 3 = 22(.5 → 22), 4 = 31, 5 = 38(.4 → 38)
// 사용자 명세: 10 / 15 / 22 / 31 / 38

import type { ChapterNumber } from "@shared/types/branded";

export const BOSS_BASE_HP = 10;
export const BOSS_REWARD_PER_CHAPTER = 200;

const HP_BY_CHAPTER: Record<number, number> = {
  1: 10,
  2: 15,
  3: 22,
  4: 31,
  5: 38,
};

export const WEAK_SPOT_MULTIPLIER = 2;
export const WEAK_SPOT_LABEL = "head" as const;
export type WeakSpot = typeof WEAK_SPOT_LABEL;

export function bossHpForChapter(chapter: ChapterNumber | number): number {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5) {
    throw new RangeError(`bossHpForChapter: chapter must be integer in [1, 5], got ${chapter}`);
  }
  const hp = HP_BY_CHAPTER[chapter];
  /* c8 ignore next 3 -- chapter 범위 검증 통과 후 HP_BY_CHAPTER에 항상 존재 (TS narrow 방어) */
  if (hp === undefined) {
    throw new RangeError(`bossHpForChapter: no HP for chapter ${chapter}`);
  }
  return hp;
}

export function bossRewardForChapter(chapter: ChapterNumber | number): number {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5) {
    throw new RangeError(`bossRewardForChapter: chapter must be integer in [1, 5], got ${chapter}`);
  }
  return BOSS_REWARD_PER_CHAPTER * chapter;
}

/**
 * weak spot ("head") 타격 시 damage 배수.
 */
export function damageOnHit(baseDamage: number, hitWeakSpot: boolean): number {
  if (!Number.isFinite(baseDamage) || baseDamage < 0) {
    throw new RangeError(`damageOnHit: baseDamage must be non-negative finite, got ${baseDamage}`);
  }
  return hitWeakSpot ? baseDamage * WEAK_SPOT_MULTIPLIER : baseDamage;
}
