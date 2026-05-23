import { describe, expect, it } from "vitest";
import { computeBossPosition } from "./boss-movement";

const CENTER = { x: 200, y: 400 };
const R = 100;
const OMEGA = 1; // rad/s

describe("computeBossPosition", () => {
  // [Happy] t=1000ms 위치 계산
  it("[Happy] t=1000ms (1s, ω=1) → x = cx + R·sin(2), y = cy + R·sin(1)", () => {
    const pos = computeBossPosition(1000, CENTER, R, OMEGA);
    expect(pos.x).toBeCloseTo(CENTER.x + R * Math.sin(2), 6);
    expect(pos.y).toBeCloseTo(CENTER.y + R * Math.sin(1), 6);
  });

  // [Boundary] t=0 → center
  it("[Boundary] t=0 → center 반환", () => {
    expect(computeBossPosition(0, CENTER, R, OMEGA)).toEqual(CENTER);
  });
  // [Boundary] t=π*1000/OMEGA → sin(π)=0, sin(2π)=0 → center
  it("[Boundary] tMs = π·1000/ω → sin(2π)=sin(π)=0 → center", () => {
    const tMs = Math.PI * 1000;
    const pos = computeBossPosition(tMs, CENTER, R, OMEGA);
    expect(pos.x).toBeCloseTo(CENTER.x, 6);
    expect(pos.y).toBeCloseTo(CENTER.y, 6);
  });

  // [Error] tMs < 0
  it("[Error] tMs=-1 → throw RangeError", () => {
    expect(() => computeBossPosition(-1, CENTER, R, OMEGA)).toThrow(RangeError);
  });
  // [Error] tMs=NaN — F3 NaN guard (silent {NaN,NaN} 전파 차단)
  it("[Error] tMs=NaN → throw RangeError", () => {
    expect(() => computeBossPosition(Number.NaN, CENTER, R, OMEGA)).toThrow(RangeError);
  });
  // [Error] tMs=Infinity
  it("[Error] tMs=Infinity → throw RangeError", () => {
    expect(() => computeBossPosition(Number.POSITIVE_INFINITY, CENTER, R, OMEGA)).toThrow(
      RangeError,
    );
  });
});
