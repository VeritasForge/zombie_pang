import { describe, expect, it } from "vitest";
import { BOSS_WAVE, SPAWN_RATE_FINAL_MS, SPAWN_RATE_INITIAL_MS, Wave } from "./wave";

describe("Wave", () => {
  it("[Happy] wave 1: spawn rate 1000ms, count 1, 보스 아님", () => {
    const w = Wave.of(1);
    expect(w.number()).toBe(1);
    expect(w.spawnRateMs()).toBe(SPAWN_RATE_INITIAL_MS);
    expect(w.spawnCount()).toBe(1);
    expect(w.isBossWave()).toBe(false);
  });

  it("[Happy] wave 10: spawn rate 300ms, count 5, 보스 wave", () => {
    const w = Wave.of(10);
    expect(w.spawnRateMs()).toBe(SPAWN_RATE_FINAL_MS);
    expect(w.spawnCount()).toBe(5);
    expect(w.isBossWave()).toBe(true);
  });

  it("[Happy] wave 5: 중간 보간 (rate 약 611ms, count 3)", () => {
    const w = Wave.of(5);
    // linear: 1000 + (300 - 1000) / 9 * 4 ≈ 1000 - 311.11 ≈ 688.89
    expect(w.spawnRateMs()).toBeCloseTo(688.89, 1);
    expect(w.spawnCount()).toBe(3);
  });

  it("[Boundary] wave 9: rate 본격 감소, count 4 또는 5", () => {
    const w = Wave.of(9);
    expect(w.spawnRateMs()).toBeGreaterThan(SPAWN_RATE_FINAL_MS);
    expect(w.spawnRateMs()).toBeLessThan(SPAWN_RATE_INITIAL_MS);
  });

  it("[Boundary] wave 10이 boss wave (정확히 경계)", () => {
    expect(Wave.of(10).isBossWave()).toBe(true);
    expect(Wave.of(9).isBossWave()).toBe(false);
    expect(Wave.of(BOSS_WAVE).isBossWave()).toBe(true);
  });

  it("[Boundary] wave 11: rate 300 유지 (clamp), count 5 유지", () => {
    const w = Wave.of(11);
    expect(w.spawnRateMs()).toBe(SPAWN_RATE_FINAL_MS);
    expect(w.spawnCount()).toBe(5);
    expect(w.isBossWave()).toBe(true);
  });

  it("[Boundary] wave 100 (extreme): rate 300 유지", () => {
    expect(Wave.of(100).spawnRateMs()).toBe(SPAWN_RATE_FINAL_MS);
  });

  it("[Error] wave 0은 RangeError throw", () => {
    expect(() => Wave.of(0)).toThrow(RangeError);
  });

  it("[Error] wave -1은 RangeError throw", () => {
    expect(() => Wave.of(-1)).toThrow(RangeError);
  });

  it("[Error] wave 1.5 (소수)는 RangeError throw", () => {
    expect(() => Wave.of(1.5)).toThrow(RangeError);
  });

  it("[Error] wave NaN은 RangeError throw", () => {
    expect(() => Wave.of(Number.NaN)).toThrow(RangeError);
  });
});
