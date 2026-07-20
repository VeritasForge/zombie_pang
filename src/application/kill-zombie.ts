// KillZombie — 좀비 처치 use case.
// Bible §3, §8:
//   1. Combo decay 적용 (현재 시간 - lastHitAt)
//   2. 새 hit으로 combo 진행
//   3. score += zombieReward × combo.multiplier × (isCritical ? 2 : 1)
//   4. powerUpDropped = PowerUpDropPolicy.dropOnKill(random, BASE_DROP_RATE) — 평평한 drop rate
//
// meta/coin 의존은 wave-clicker 단순화(Task 5)로 제거됨.

import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import { BASE_DROP_RATE, PowerUpDropPolicy } from "@domain/powerup/drop-policy";
import type { PowerUpType } from "@domain/powerup/powerup";
import type { Combo } from "@domain/score/combo";
import type { Score } from "@domain/score/score";
import type { ZombieType } from "@domain/wave/zombie-type";
import { specOf } from "@domain/wave/zombie-type";

export const CRITICAL_MULTIPLIER = 2;

export type KillZombieDeps = {
  readonly random: IRandom;
  readonly clock: IClock;
};

export type KillZombieInput = {
  readonly zombieType: ZombieType;
  readonly isCritical: boolean;
  readonly currentScore: Score;
  readonly currentCombo: Combo;
  readonly killedAtMs: number;
  /** 이전 hit 시각 (ms). 첫 hit이면 killedAtMs와 동일해도 무방. */
  readonly lastHitAtMs: number;
};

export type KillZombieOutput = {
  readonly newScore: Score;
  readonly newCombo: Combo;
  readonly powerUpDropped: PowerUpType | null;
};

export function killZombie(deps: KillZombieDeps, input: KillZombieInput): KillZombieOutput {
  if (!Number.isFinite(input.killedAtMs)) {
    throw new RangeError(`killZombie: killedAtMs must be finite, got ${input.killedAtMs}`);
  }
  if (!Number.isFinite(input.lastHitAtMs)) {
    throw new RangeError(`killZombie: lastHitAtMs must be finite, got ${input.lastHitAtMs}`);
  }
  if (input.killedAtMs < input.lastHitAtMs) {
    throw new RangeError(
      `killZombie: killedAtMs (${input.killedAtMs}) must be >= lastHitAtMs (${input.lastHitAtMs})`,
    );
  }
  // clock은 시간 검증/디버깅 fallback용. 정상 흐름은 input.killedAtMs를 신뢰.
  void deps.clock;

  const elapsed = input.killedAtMs - input.lastHitAtMs;
  const newCombo = input.currentCombo.decay(elapsed).hit();

  const spec = specOf(input.zombieType);
  const critMult = input.isCritical ? CRITICAL_MULTIPLIER : 1;
  const newScore = input.currentScore.add(spec.reward * newCombo.multiplier() * critMult);

  const powerUpDropped = new PowerUpDropPolicy().dropOnKill(deps.random, BASE_DROP_RATE);

  return { newScore, newCombo, powerUpDropped };
}
