// CEO 보스 Phase별 미니언 구성 (D3).
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §4
//   챕터별 미니언 종류 × 수량. CEO 제외(MinionType).

import { ZOMBIE_TYPE, type ZombieType } from "@domain/wave/zombie-type";
import type { ChapterNumber } from "@shared/types/branded";

export type MinionType = Exclude<ZombieType, typeof ZOMBIE_TYPE.CEO>;
export type MinionSpec = { readonly type: MinionType; readonly count: number };

export function composeMinions(chapter: ChapterNumber): readonly MinionSpec[] {
  switch (chapter as number) {
    case 1:
      return [];
    case 2:
      return [{ type: ZOMBIE_TYPE.INTERN, count: 2 }];
    case 3:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 3 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
      ];
    case 4:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 4 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 2 },
      ];
    case 5:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 4 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 3 },
        { type: ZOMBIE_TYPE.LEAD, count: 1 },
      ];
    default:
      throw new RangeError(`Invalid chapter for composeMinions: ${String(chapter)}`);
  }
}

export function totalMinions(chapter: ChapterNumber): number {
  return composeMinions(chapter).reduce((sum, spec) => sum + spec.count, 0);
}
