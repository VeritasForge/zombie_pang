import { describe, expect, it } from "vitest";
import { clampDeltaMs, computeBossPosition } from "./boss-movement";

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
});

describe("clampDeltaMs", () => {
  it("[Happy] clampDeltaMs(16) → 16", () => {
    expect(clampDeltaMs(16)).toBe(16);
  });
  it("[Boundary] clampDeltaMs(0) → 0", () => {
    expect(clampDeltaMs(0)).toBe(0);
  });
  it("[Boundary] clampDeltaMs(100) → 100", () => {
    expect(clampDeltaMs(100)).toBe(100);
  });
  it("[Boundary] clampDeltaMs(150) → 100", () => {
    expect(clampDeltaMs(150)).toBe(100);
  });
  it("[Boundary] clampDeltaMs(-1) → 0", () => {
    expect(clampDeltaMs(-1)).toBe(0);
  });
});
