// Power-up drop policy.
// Bible §3, §4, §8:
//   - 기본 drop rate (합계) = 5%
//   - 3종 균등 추첨 (drop 발생 시)

import type { IRandom } from "@domain/ports/random";
import { ALL_POWERUP_TYPES, type PowerUpType } from "./powerup";

export const BASE_DROP_RATE = 0.05;

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
}
