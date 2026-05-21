// Wave VO — 한 챕터 안의 1~10 wave (= 1~10층).
// Bible §8: spawn rate wave 1 = 1000ms, wave 10 = 300ms, 선형 보간.
//           spawn count wave 1 = 1마리, wave 10 = 5마리, 선형 보간.

export const WAVE_MIN = 1;
export const WAVE_MAX = 10;
export const SPAWN_RATE_INITIAL_MS = 1000;
export const SPAWN_RATE_FINAL_MS = 300;
export const SPAWN_COUNT_INITIAL = 1;
export const SPAWN_COUNT_FINAL = 5;
export const BOSS_WAVE = 10;

export class Wave {
  private constructor(private readonly _number: number) {}

  static of(n: number): Wave {
    if (!Number.isInteger(n)) {
      throw new RangeError(`Wave.of: number must be integer, got ${n}`);
    }
    if (n < WAVE_MIN) {
      throw new RangeError(`Wave.of: number must be >= ${WAVE_MIN}, got ${n}`);
    }
    return new Wave(n);
  }

  number(): number {
    return this._number;
  }

  /**
   * spawn rate (ms): wave 1 = 1000, wave 10 = 300, 선형 보간.
   * wave >= 10은 300 유지.
   */
  spawnRateMs(): number {
    const n = Math.min(this._number, WAVE_MAX);
    const slope = (SPAWN_RATE_FINAL_MS - SPAWN_RATE_INITIAL_MS) / (WAVE_MAX - WAVE_MIN);
    return SPAWN_RATE_INITIAL_MS + slope * (n - WAVE_MIN);
  }

  /**
   * spawn count: wave 1 = 1, wave 10 = 5, 선형 보간 (반올림).
   * wave >= 10은 5 유지.
   */
  spawnCount(): number {
    const n = Math.min(this._number, WAVE_MAX);
    const slope = (SPAWN_COUNT_FINAL - SPAWN_COUNT_INITIAL) / (WAVE_MAX - WAVE_MIN);
    return Math.round(SPAWN_COUNT_INITIAL + slope * (n - WAVE_MIN));
  }

  isBossWave(): boolean {
    return this._number >= BOSS_WAVE;
  }
}
