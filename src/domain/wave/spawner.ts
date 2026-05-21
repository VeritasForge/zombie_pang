// Spawner — Wave 기반 ZombieType 분포 추첨 + spawn timing jitter.
// Bible §3, §8:
//   - 일반 wave 분포: intern 70% / middle 20% / lead 8% / ceo 2%
//   - 보스 wave: 100% CEO
//   - spawn timing jitter: rate ± 200ms (균등 분포)

import type { IRandom } from "@domain/ports/random";
import type { Wave } from "./wave";
import { ZOMBIE_TYPE, type ZombieType } from "./zombie-type";

export const SPAWN_JITTER_MS = 200;

// 누적 분포 (Bible §2/§3) — 일반 wave.
const NORMAL_WAVE_CDF: ReadonlyArray<{ threshold: number; type: ZombieType }> = [
  { threshold: 0.7, type: ZOMBIE_TYPE.INTERN },
  { threshold: 0.9, type: ZOMBIE_TYPE.MIDDLE },
  { threshold: 0.98, type: ZOMBIE_TYPE.LEAD },
  { threshold: 1.0, type: ZOMBIE_TYPE.CEO },
];

export class Spawner {
  /**
   * Spawn 1마리. 보스 wave는 CEO 확정, 일반 wave는 분포에서 추첨.
   */
  spawn(wave: Wave, random: IRandom): ZombieType {
    if (wave.isBossWave()) {
      return ZOMBIE_TYPE.CEO;
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    // CDF 마지막 entry는 fall-through 분기를 만들지 않도록 unconditional return으로 처리.
    const lastIdx = NORMAL_WAVE_CDF.length - 1;
    for (let i = 0; i < lastIdx; i += 1) {
      const entry = NORMAL_WAVE_CDF[i];
      /* c8 ignore next 3 -- noUncheckedIndexedAccess narrow, lastIdx 범위 내 항상 존재 */
      if (entry === undefined) {
        throw new RangeError(`NORMAL_WAVE_CDF[${i}] is undefined`);
      }
      if (r < entry.threshold) {
        return entry.type;
      }
    }
    return ZOMBIE_TYPE.CEO;
  }

  /**
   * Spawn 다음 간격 (ms) = wave.spawnRateMs ± SPAWN_JITTER_MS.
   * jitter는 random.next() 균등 분포로 결정.
   */
  nextSpawnDelayMs(wave: Wave, random: IRandom): number {
    const base = wave.spawnRateMs();
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    const jitter = (r * 2 - 1) * SPAWN_JITTER_MS;
    // base는 [300, 1000], jitter는 [-200, +200), 합산 최솟값 100ms로 항상 양수.
    return base + jitter;
  }
}
