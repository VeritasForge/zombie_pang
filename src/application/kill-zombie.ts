// KillZombie — 좀비 처치 use case.
// Bible §3, §4, §8:
//   1. Combo decay 적용 (현재 시간 - lastHitAt)
//   2. 새 hit으로 combo 진행
//   3. score += zombieReward × combo.multiplier × (isCritical ? 2 : 1)
//   4. coin = baseReward × (1 + meta.coinGain) (소수 절단 → integer)
//   5. powerUpDropped = PowerUpDropPolicy.dropOnKill(...) — 메타 카드의 Coin Gain Tier 반영
//
// CoinTier 계산: Coin 카테고리 카드 1장당 ×1.3 누적 (max 3).
//   - 0장 = tier 0 = 5%
//   - 1장 (T1만, 또는 T2/T3 단일) = tier 1 = 6.5%
//   - 2장 = tier 2 = 8.45%
//   - 3장+ = tier 3 = 10.985% (clamp at 3)

import type { MetaProgression } from "@domain/meta/progression";
import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import { PowerUpDropPolicy, dropRateForCoinTier } from "@domain/powerup/drop-policy";
import type { PowerUpType } from "@domain/powerup/powerup";
import type { Combo } from "@domain/score/combo";
import type { Score } from "@domain/score/score";
import type { ZombieType } from "@domain/wave/zombie-type";
import { specOf } from "@domain/wave/zombie-type";

export const CRITICAL_MULTIPLIER = 2;
export const MAX_COIN_TIER = 3;

export type KillZombieDeps = {
  readonly random: IRandom;
  readonly clock: IClock;
};

export type KillZombieInput = {
  readonly zombieType: ZombieType;
  readonly isCritical: boolean;
  readonly currentScore: Score;
  readonly currentCombo: Combo;
  readonly meta: MetaProgression;
  readonly killedAtMs: number;
  /** 이전 hit 시각 (ms). 첫 hit이면 killedAtMs와 동일해도 무방. */
  readonly lastHitAtMs: number;
};

export type KillZombieOutput = {
  readonly newScore: Score;
  readonly newCombo: Combo;
  readonly earnedCoin: number;
  readonly powerUpDropped: PowerUpType | null;
};

/** Meta deck의 Coin 카테고리 카드 개수 (T1/T2/T3 카운트). max 3. */
function coinTierOf(meta: MetaProgression): number {
  let count = 0;
  for (const id of meta.deck()) {
    if (id === "COIN_T1" || id === "COIN_T2" || id === "COIN_T3") {
      count += 1;
    }
  }
  return Math.min(count, MAX_COIN_TIER);
}

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
  const afterDecay = input.currentCombo.decay(elapsed);
  const newCombo = afterDecay.hit();

  const spec = specOf(input.zombieType);
  const critMult = input.isCritical ? CRITICAL_MULTIPLIER : 1;
  const scoreDelta = spec.reward * newCombo.multiplier() * critMult;
  const newScore = input.currentScore.add(scoreDelta);

  const coinGain = input.meta.coinGain();
  // 음수 coinGain은 정의상 발생하지 않으나 방어적으로 0 floor.
  const coinMultiplier = 1 + Math.max(0, coinGain);
  const earnedCoin = Math.floor(spec.reward * coinMultiplier);

  const tier = coinTierOf(input.meta);
  const dropRate = dropRateForCoinTier(tier);
  const policy = new PowerUpDropPolicy();
  const powerUpDropped = policy.dropOnKill(deps.random, dropRate);

  return { newScore, newCombo, earnedCoin, powerUpDropped };
}

export { coinTierOf as _coinTierOf };
