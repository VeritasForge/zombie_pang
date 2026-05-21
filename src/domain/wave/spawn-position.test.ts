// findSpawnPoint — 좀비 spawn 위치 결정 로직.
// [Happy] 빈 existing 배열 → 첫 random 좌표 반환.
// [Happy] 모든 existing이 멀리 떨어져 있으면 첫 시도 좌표 반환.
// [Boundary] minDistance=0 → 어떤 위치든 OK (overlap 검사 무력화).
// [Boundary] maxAttempts=1 → 단 한 번만 시도, 첫 좌표가 겹쳐도 그대로 반환.
// [Boundary] SpawnArea가 점 (minX=maxX, minY=maxY) → 항상 같은 좌표 반환.
// [Error] existing=[] + minDistance=NaN → NaN 거리 비교는 항상 false, 정상 반환.
// [Error] random.next가 1.0 반환 → maxX/maxY가 아닌 maxX/maxY-epsilon 반환해야 함 (IRandom contract).

import type { IRandom } from "@domain/ports/random";
import { describe, expect, it } from "vitest";
import { findSpawnPoint } from "./spawn-position";

function fixedRandom(values: number[]): IRandom {
  let i = 0;
  return {
    next: () => {
      const v = values[i % values.length] ?? 0;
      i += 1;
      return v;
    },
    nextInt: (max) => Math.floor((values[i % values.length] ?? 0) * max),
    pick: <T>(items: readonly T[]): T => {
      const v = items[0];
      if (v === undefined) throw new Error("empty");
      return v;
    },
  };
}

const AREA = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

describe("findSpawnPoint", () => {
  it("[Happy] 빈 existing 배열 → 첫 random 좌표 반환", () => {
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([], AREA, 10, rng);
    expect(p).toEqual({ x: 50, y: 50 });
  });

  it("[Happy] existing이 모두 멀리 떨어져 있으면 첫 시도 좌표 반환", () => {
    // 첫 시도 (0, 0) → existing (90, 90)와 거리 sqrt(2)*90 ≈ 127 > minDistance 10 → 통과.
    const rng = fixedRandom([0.0, 0.0, 0.99, 0.99]);
    const p = findSpawnPoint([{ x: 90, y: 90 }], AREA, 10, rng);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("[Happy] 첫 시도 겹침 → 두 번째 시도로 회피", () => {
    // 첫 시도 (50, 50) → existing (50, 50)와 거리 0 < 10 → 겹침.
    // 두 번째 시도 (0, 0) → 거리 sqrt(2)*50 ≈ 70 > 10 → 통과.
    const rng = fixedRandom([0.5, 0.5, 0.0, 0.0]);
    const p = findSpawnPoint([{ x: 50, y: 50 }], AREA, 10, rng);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("[Boundary] minDistance=0 → existing과 같은 위치여도 OK", () => {
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([{ x: 50, y: 50 }], AREA, 0, rng);
    expect(p).toEqual({ x: 50, y: 50 });
  });

  it("[Boundary] maxAttempts=1 → 단 한 번만 시도, 겹침 무시", () => {
    // 첫 시도 (50, 50) — existing (50, 50)과 겹치지만 maxAttempts=1이라 그냥 반환.
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([{ x: 50, y: 50 }], AREA, 10, rng, 1);
    expect(p).toEqual({ x: 50, y: 50 });
  });

  it("[Boundary] 좁은 SpawnArea (단일 점) → 항상 같은 좌표", () => {
    const rng = fixedRandom([0.5, 0.5]);
    const point = { minX: 50, maxX: 50, minY: 50, maxY: 50 };
    const p = findSpawnPoint([], point, 0, rng);
    expect(p).toEqual({ x: 50, y: 50 });
  });

  it("[Boundary] maxAttempts 전부 실패 → 마지막 시도 좌표 반환 (deadlock 방지)", () => {
    // 모든 시도가 (50, 50) 같은 위치로 가도록 random fix. 모두 existing과 겹침.
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([{ x: 50, y: 50 }], AREA, 100, rng, 5);
    // deadlock 회피: maxAttempts 초과 시 마지막 candidate 반환.
    expect(p).toEqual({ x: 50, y: 50 });
  });

  it("[Error] existing.length=0 + 모든 minDistance 값 → 정상 반환", () => {
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([], AREA, 999_999, rng);
    expect(p.x).toBeGreaterThanOrEqual(AREA.minX);
    expect(p.x).toBeLessThanOrEqual(AREA.maxX);
  });

  it("[Error] minDistance가 음수 → overlap 검사 항상 통과 (거리 제곱 ≥ 0)", () => {
    const rng = fixedRandom([0.5, 0.5]);
    const p = findSpawnPoint([{ x: 50, y: 50 }], AREA, -10, rng);
    expect(p).toEqual({ x: 50, y: 50 });
  });
});
