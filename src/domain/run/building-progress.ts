// 사옥 점등 진행도 (결정론). 클리어 챕터 수 → 점등 층 수.
// Bible §2 50층 / 5챕터. ADR-0014: 진행도 시각화는 가변 보상과 별개(결정론).

export const FLOORS_PER_CHAPTER = 10;
export const TOTAL_FLOORS = 50;

export function litFloorsFor(chaptersCleared: number): number {
  if (!Number.isFinite(chaptersCleared) || chaptersCleared <= 0) return 0;
  return Math.min(TOTAL_FLOORS, Math.floor(chaptersCleared) * FLOORS_PER_CHAPTER);
}
