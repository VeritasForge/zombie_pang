// Spawner — Band(층 구간) 기반 ZombieType 분포 추첨 + spawn timing jitter.
// Bible §3, §8:
//   - band 1~5 분포: 저층 신입 위주 → 고층 상급 비중 증가 (BAND_CDF)
//   - spawn timing jitter: rate ± 200ms (균등 분포)

import type { IRandom } from "@domain/ports/random";
import { ZOMBIE_TYPE, type ZombieType } from "./zombie-type";

export const SPAWN_JITTER_MS = 200;

// band 1~5별 좀비 분포(누적 CDF). 저층 신입 위주 → 고층 상급 비중 증가.
export const BAND_CDF: ReadonlyArray<ReadonlyArray<{ threshold: number; type: ZombieType }>> = [
  // band1
  [
    { threshold: 0.85, type: ZOMBIE_TYPE.INTERN },
    { threshold: 0.98, type: ZOMBIE_TYPE.MIDDLE },
    { threshold: 1.0, type: ZOMBIE_TYPE.LEAD },
  ],
  // band2
  [
    { threshold: 0.7, type: ZOMBIE_TYPE.INTERN },
    { threshold: 0.92, type: ZOMBIE_TYPE.MIDDLE },
    { threshold: 0.99, type: ZOMBIE_TYPE.LEAD },
    { threshold: 1.0, type: ZOMBIE_TYPE.CEO },
  ],
  // band3
  [
    { threshold: 0.55, type: ZOMBIE_TYPE.INTERN },
    { threshold: 0.83, type: ZOMBIE_TYPE.MIDDLE },
    { threshold: 0.96, type: ZOMBIE_TYPE.LEAD },
    { threshold: 1.0, type: ZOMBIE_TYPE.CEO },
  ],
  // band4
  [
    { threshold: 0.45, type: ZOMBIE_TYPE.INTERN },
    { threshold: 0.75, type: ZOMBIE_TYPE.MIDDLE },
    { threshold: 0.93, type: ZOMBIE_TYPE.LEAD },
    { threshold: 1.0, type: ZOMBIE_TYPE.CEO },
  ],
  // band5
  [
    { threshold: 0.38, type: ZOMBIE_TYPE.INTERN },
    { threshold: 0.68, type: ZOMBIE_TYPE.MIDDLE },
    { threshold: 0.9, type: ZOMBIE_TYPE.LEAD },
    { threshold: 1.0, type: ZOMBIE_TYPE.CEO },
  ],
];

const MIN_SPAWN_DELAY_MS = 100;

export class Spawner {
  /**
   * Band별 좀비 추첨 (1~5, 상급 비중 증가).
   * band < 1 은 band1로, band > 5 는 band5로 클램프.
   * CDF 누적 분포에서 random.next() ∈ [0, 1)를 사용해 ZombieType 추첨.
   */
  spawnForBand(band: number, random: IRandom): ZombieType {
    const idx = Math.min(BAND_CDF.length - 1, Math.max(0, Math.floor(band) - 1));
    const cdf = BAND_CDF[idx];
    /* c8 ignore next 3 -- idx는 항상 유효 범위 */
    if (cdf === undefined) {
      throw new RangeError(`BAND_CDF[${idx}] undefined`);
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    const last = cdf.length - 1;
    for (let i = 0; i < last; i += 1) {
      const entry = cdf[i];
      /* c8 ignore next 3 -- last 범위 내 항상 존재 */
      if (entry === undefined) {
        throw new RangeError(`BAND_CDF[${idx}][${i}] undefined`);
      }
      if (r < entry.threshold) {
        return entry.type;
      }
    }
    const lastEntry = cdf[last];
    /* c8 ignore next 3 */
    if (lastEntry === undefined) {
      throw new RangeError(`BAND_CDF[${idx}] empty`);
    }
    return lastEntry.type;
  }

  /**
   * Rate 기반 spawn 간격 (ms) = spawnRateMs ± SPAWN_JITTER_MS (최소 100ms).
   * jitter는 random.next() 균등 분포 [0, 1)로 [-200, +200) 범위 결정.
   */
  delayForRate(spawnRateMs: number, random: IRandom): number {
    if (!Number.isFinite(spawnRateMs) || spawnRateMs <= 0) {
      throw new RangeError(`delayForRate: spawnRateMs must be positive finite, got ${spawnRateMs}`);
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    const jitter = (r * 2 - 1) * SPAWN_JITTER_MS;
    return Math.max(MIN_SPAWN_DELAY_MS, spawnRateMs + jitter);
  }
}
