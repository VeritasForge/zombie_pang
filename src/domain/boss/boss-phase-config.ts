// CEO 보스 Phase 상수 테이블.
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §4
//   Phase 별 R (반지름 px), ω (각속도 rad/s).

import type { ChapterNumber } from "@shared/types/branded";

export type PhaseConfig = { readonly R: number; readonly omega: number };

export const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  1: { R: 80, omega: 0.5 },
  2: { R: 100, omega: 0.7 },
  3: { R: 120, omega: 1.0 },
  4: { R: 130, omega: 1.3 },
  5: { R: 150, omega: 1.6 },
} as const;

export function getPhaseConfig(chapter: ChapterNumber): PhaseConfig {
  const config = PHASE_CONFIGS[chapter];
  if (!config) {
    throw new RangeError(`Invalid chapter for PHASE_CONFIGS: ${String(chapter)}`);
  }
  return config;
}
