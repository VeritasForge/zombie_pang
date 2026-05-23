// CEO 보스 웨이브 스폰 use case (D4).
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §4
//   chapter → {phase, minions[]} 일괄 스폰 payload. Port 무관(순수 합성).

import { type PhaseConfig, getPhaseConfig } from "@domain/boss/boss-phase-config";
import { type MinionSpec, composeMinions } from "@domain/boss/minion-composition";
import type { ChapterNumber } from "@shared/types/branded";

export type BossWavePayload = {
  readonly phase: PhaseConfig;
  readonly minions: readonly MinionSpec[];
};

export function spawnBossWave(chapter: ChapterNumber): BossWavePayload {
  return {
    phase: getPhaseConfig(chapter),
    minions: composeMinions(chapter),
  };
}
