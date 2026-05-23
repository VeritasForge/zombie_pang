// CEO 보스 격노(rage) 단계 계산 + Phase 곱셈 적용.
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §5

import type { ChapterNumber } from "@shared/types/branded";
import type { PhaseConfig } from "./boss-phase-config";

export type RageLevel = 0 | 1 | 2;
export type { PhaseConfig };

export function computeRageLevel(hp: number, maxHp: number, chapter: ChapterNumber): RageLevel {
  // F3 (NaN guard): `maxHp <= 0` 단독은 NaN을 silent 통과 (NaN <= 0 = false) → ratio = NaN
  // → 모든 비교 false → rage 0 잘못 반환. Number.isFinite로 NaN/±Infinity 모두 차단.
  if (!Number.isFinite(maxHp) || maxHp <= 0) {
    throw new RangeError(`maxHp must be a positive finite number (got ${maxHp})`);
  }
  if (!Number.isFinite(hp)) {
    throw new RangeError(`hp must be a finite number (got ${hp})`);
  }
  const ch = chapter as number;
  if (ch <= 3) return 0;
  const ratio = hp / maxHp;
  if (ch === 4) return ratio <= 0.5 ? 1 : 0;
  // ch === 5
  if (ratio <= 0.33) return 2;
  if (ratio <= 0.67) return 1;
  return 0;
}

// 부동소수점 오차 제거 — R/ω 모두 4자리 정밀도에서 반올림
// (100 * 1.15 = 114.99999999999999 같은 IEEE 754 오차를 mutation kill 정확값으로 정규화)
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

export function applyRageMultipliers(base: PhaseConfig, rage: RageLevel): PhaseConfig {
  if (rage === 0) return base;
  if (rage === 1) return { R: base.R, omega: round4(base.omega * 1.3) };
  return { R: round4(base.R * 1.15), omega: round4(base.omega * 1.6) }; // rage === 2
}
