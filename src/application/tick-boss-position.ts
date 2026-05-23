// CEO 보스 위치 갱신 use case (D5).
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §4
//   IClock에서 monotonic ms를 읽고 clampDeltaMs로 시계 역행/정지 방어 → computeBossPosition 위임.

import { type BossPosition, clampDeltaMs, computeBossPosition } from "@domain/boss/boss-movement";
import type { IClock } from "@domain/ports/clock";

export type TickBossPositionInput = {
  readonly clock: IClock;
  readonly bossStartTimeMs: number;
  readonly center: { readonly x: number; readonly y: number };
  readonly R: number;
  readonly omega: number;
};

export function tickBossPosition(input: TickBossPositionInput): BossPosition {
  const { clock, bossStartTimeMs, center, R, omega } = input;
  const dt = clampDeltaMs(clock.now() - bossStartTimeMs);
  return computeBossPosition(dt, center, R, omega);
}
