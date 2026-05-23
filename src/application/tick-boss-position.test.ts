import type { IClock } from "@domain/ports/clock";
import { describe, expect, it } from "vitest";
import { tickBossPosition } from "./tick-boss-position";

class FakeClock implements IClock {
  constructor(private value: number) {}
  now() {
    return this.value;
  }
  monotonic() {
    return this.value;
  }
  set(v: number) {
    this.value = v;
  }
}

const CENTER = { x: 200, y: 400 };
const R = 100;
const OMEGA = 1;

describe("tickBossPosition", () => {
  // [Happy] 누적 elapsed로 위치 갱신
  it("[Happy] elapsed=16ms → 위치가 center에서 벗어남", () => {
    const clock = new FakeClock(1000);
    const start = 1000;
    const pos1 = tickBossPosition({
      clock,
      bossStartTimeMs: start,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    clock.set(1016);
    const pos2 = tickBossPosition({
      clock,
      bossStartTimeMs: start,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    expect(pos1).toEqual(CENTER); // t=0 → center
    expect(pos2.x).not.toBe(pos1.x); // 변화 확인
  });

  // [Happy] 큰 elapsed에서도 ±R 안 (Lissajous 8자 계속 회전)
  it("[Happy] elapsed=5000ms (5s) → 보스 위치 ±R 안", () => {
    const clock = new FakeClock(5000);
    const result = tickBossPosition({
      clock,
      bossStartTimeMs: 0,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    expect(result.x).toBeGreaterThanOrEqual(CENTER.x - R - 1e-9);
    expect(result.x).toBeLessThanOrEqual(CENTER.x + R + 1e-9);
    expect(result.y).toBeGreaterThanOrEqual(CENTER.y - R - 1e-9);
    expect(result.y).toBeLessThanOrEqual(CENTER.y + R + 1e-9);
  });

  // [Boundary] elapsed=0 → center
  it("[Boundary] now==start (elapsed=0) → center 반환", () => {
    const clock = new FakeClock(500);
    const result = tickBossPosition({
      clock,
      bossStartTimeMs: 500,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    expect(result).toEqual(CENTER);
  });

  // [Error] now<start (clock 역행) → 0 clamp → center
  it("[Error] now<start (clock 역행) → elapsed 0 → center 반환", () => {
    const clock = new FakeClock(500);
    const result = tickBossPosition({
      clock,
      bossStartTimeMs: 1000,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    expect(result).toEqual(CENTER);
  });
});
