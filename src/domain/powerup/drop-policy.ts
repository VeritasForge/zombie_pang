// Power-up drop policy.
// Bible §3, §4, §8:
//   - 기본 drop rate (합계) = 5%
//   - Coin Tier 곱셈 누적: ×1.3^N, Tier 3 = 6.5%
//   - 3종 균등 추첨 (drop 발생 시)
//   - 보스 처치 시 30% 확정 drop 정책은 별도이나 사용자 명세는 "확정 drop, 3종 균등" — 본 메서드는 항상 PowerUpType 반환.

import type { IRandom } from "@domain/ports/random";
import { ALL_POWERUP_TYPES, type PowerUpType } from "./powerup";

export const BASE_DROP_RATE = 0.05;
export const COIN_TIER_MULTIPLIER = 1.3;
export const MAX_COIN_TIER = 3;

/**
 * Coin Tier N에서의 최대 drop rate = base * 1.3^N.
 * Tier 0 = 5%, Tier 3 = 6.5%
 */
export function dropRateForCoinTier(tier: number): number {
  if (!Number.isInteger(tier)) {
    throw new RangeError(`dropRateForCoinTier: tier must be integer, got ${tier}`);
  }
  if (tier < 0 || tier > MAX_COIN_TIER) {
    throw new RangeError(`dropRateForCoinTier: tier must be in [0, ${MAX_COIN_TIER}], got ${tier}`);
  }
  return BASE_DROP_RATE * COIN_TIER_MULTIPLIER ** tier;
}

export class PowerUpDropPolicy {
  /**
   * 일반 좀비 처치 시 drop 결정.
   * @param random IRandom
   * @param currentRate 현재 drop rate (0 ~ 1)
   * @returns PowerUpType (drop 발생) 또는 null (drop 안 함)
   */
  dropOnKill(random: IRandom, currentRate: number): PowerUpType | null {
    if (!Number.isFinite(currentRate) || currentRate < 0 || currentRate > 1) {
      throw new RangeError(`dropOnKill: currentRate must be in [0, 1], got ${currentRate}`);
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    if (r >= currentRate) {
      return null;
    }
    return random.pick(ALL_POWERUP_TYPES);
  }

  /**
   * 보스 처치 시 확정 drop (3종 균등 추첨).
   */
  dropOnBossKill(random: IRandom): PowerUpType {
    return random.pick(ALL_POWERUP_TYPES);
  }
}
