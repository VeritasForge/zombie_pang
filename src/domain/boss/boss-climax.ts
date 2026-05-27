// 보스 climax(슬로우모션) 진입 판정 — 결정론 순수 함수.
// Bible §3 Climax. rage와 독립(모든 챕터 일관 적용). 슬로우모션 omega 대체 트리거.

export const CLIMAX_HP_RATIO = 0.25;

/** 보스 HP 비율이 임계 이하면 climax. maxHp/hp 비정상이면 false(graceful, 렌더 경로). */
export function isBossClimax(hp: number, maxHp: number): boolean {
  if (!Number.isFinite(maxHp) || maxHp <= 0) return false;
  if (!Number.isFinite(hp)) return false;
  return hp / maxHp <= CLIMAX_HP_RATIO;
}
