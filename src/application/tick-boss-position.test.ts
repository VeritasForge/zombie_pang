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
  // [Happy] dt 누적 후 위치 갱신
  it("[Happy] dt=16ms 누적 → 위치 갱신 (center에서 벗어남)", () => {
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

  // [Boundary] dt=0 → center
  it("[Boundary] now==start (dt=0) → center 반환", () => {
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

  // [Boundary] dt > 100ms → 100 clamp
  it("[Boundary] dt>100ms → 100으로 clamp (화면 밖 순간이동 방지)", () => {
    const clock = new FakeClock(2000);
    const result = tickBossPosition({
      clock,
      bossStartTimeMs: 1000,
      center: CENTER,
      R,
      omega: OMEGA,
    });
    // dt = 1000ms → clamp 100ms → t = 0.1s
    const expectedX = CENTER.x + R * Math.sin(2 * OMEGA * 0.1);
    const expectedY = CENTER.y + R * Math.sin(OMEGA * 0.1);
    expect(result.x).toBeCloseTo(expectedX, 6);
    expect(result.y).toBeCloseTo(expectedY, 6);
  });

  // [Error] dt<0 (clock 역행) → 0 clamp → center
  it("[Error] now<start (clock 역행) → dt 0 clamp → center 반환", () => {
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
