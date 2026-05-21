// Spawn 위치 결정 — 좀비끼리 hit box 겹침을 회피하여 사용자 click 비결정성을 줄인다.
// Phaser input.topOnly=true 환경에서 좀비 hit box가 서로 겹치면 위에 있는 좀비만 hit 처리되어
// 가려진 좀비는 hover cursor / click 모두 무시된다. 사용자에겐 "되었다 안 되었다"로 보임.
// 본 함수는 새 좀비를 spawn할 때 기존 좀비들과 minDistance 이상 떨어진 좌표를 선호한다.
// 단 maxAttempts 안에 적합한 좌표를 못 찾으면 마지막 시도 좌표를 그대로 반환하여 spawn deadlock을
// 방지한다 (좁은 SPAWN_AREA에 좀비 수가 많은 후반 wave 보장).

import type { IRandom } from "@domain/ports/random";

export type SpawnPoint = { readonly x: number; readonly y: number };

export type SpawnArea = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

const DEFAULT_MAX_ATTEMPTS = 5;

export function findSpawnPoint(
  existing: readonly SpawnPoint[],
  area: SpawnArea,
  minDistance: number,
  random: IRandom,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): SpawnPoint {
  const minDistSq = minDistance * minDistance;
  let candidate = samplePoint(area, random);
  for (let i = 1; i < maxAttempts; i += 1) {
    if (!overlapsAny(candidate, existing, minDistSq)) return candidate;
    candidate = samplePoint(area, random);
  }
  return candidate;
}

function samplePoint(area: SpawnArea, random: IRandom): SpawnPoint {
  const x = area.minX + random.next() * (area.maxX - area.minX);
  const y = area.minY + random.next() * (area.maxY - area.minY);
  return { x, y };
}

function overlapsAny(p: SpawnPoint, existing: readonly SpawnPoint[], minDistSq: number): boolean {
  if (minDistSq <= 0) return false;
  for (const e of existing) {
    const dx = e.x - p.x;
    const dy = e.y - p.y;
    if (dx * dx + dy * dy < minDistSq) return true;
  }
  return false;
}
