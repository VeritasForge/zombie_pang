// 층별 난이도 커브 SSOT. 층 1~50 → 처치 목표/동시 상한/스폰 간격/도주 한도/난이도 밴드.
// spec: docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md §4
// domain 순수성: 외부 의존성 0.

export const FLOOR_MIN = 1;
export const FLOOR_MAX = 50;
export const CAP_MAX = 12;
export const SPAWN_RATE_MAX_MS = 1000; // floor 1
export const SPAWN_RATE_MIN_MS = 300; // floor 50

export type FloorPlan = {
  readonly floor: number;
  readonly quota: number;
  readonly cap: number;
  readonly spawnRateMs: number;
  readonly escapeLimit: number;
  readonly band: number;
};

/** 층 1~10→1, 11~20→2, ..., 41~50→5. */
export function bandOf(floor: number): number {
  return Math.min(5, Math.floor((floor - 1) / 10) + 1);
}

function assertFloor(floor: number): void {
  if (!Number.isInteger(floor) || floor < FLOOR_MIN || floor > FLOOR_MAX) {
    throw new RangeError(
      `floorPlan: floor must be integer in [${FLOOR_MIN}, ${FLOOR_MAX}], got ${floor}`,
    );
  }
}

export function floorPlan(floor: number): FloorPlan {
  assertFloor(floor);
  const band = bandOf(floor);
  const quota = Math.round(8 + (floor - 1) * 1.5);
  const cap = Math.min(CAP_MAX, Math.max(1, Math.round(3 + ((floor - 1) * 9) / 49)));
  const spawnRateMs = Math.round(
    SPAWN_RATE_MAX_MS +
      ((floor - 1) * (SPAWN_RATE_MIN_MS - SPAWN_RATE_MAX_MS)) / (FLOOR_MAX - FLOOR_MIN),
  );
  const escapeLimit = band <= 2 ? 5 : band <= 4 ? 4 : 3;
  return { floor, quota, cap, spawnRateMs, escapeLimit, band };
}
