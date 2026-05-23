// CEO 보스 위치 갱신 use case (D5).
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §4
//   IClock에서 monotonic ms를 읽고 누적 elapsed time을 computeBossPosition에 위임.
//   clamp는 적용하지 않음 — sin 함수는 큰 tMs에서도 ±R 안에 안전하며, clamp 시 100ms 이후
//   보스가 한 위치에 영구 고정되어 Lissajous 8자 이동이 작동하지 않음.
//   시계 역행(now < start)만 Math.max(0, ...)으로 가드.

import { type BossPosition, computeBossPosition } from "@domain/boss/boss-movement";
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
  // 누적 elapsed time (clamp 안 함 — sin은 큰 tMs에서도 ±R 안에 안전)
  // 시계 역행 (now < start) 만 0으로 가드.
  const elapsed = Math.max(0, clock.now() - bossStartTimeMs);
  return computeBossPosition(elapsed, center, R, omega);
}
