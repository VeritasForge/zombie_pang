import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { CAP_MAX, FLOOR_MAX, FLOOR_MIN, floorPlan } from "./floor-plan";

const floorArb = fc.integer({ min: FLOOR_MIN, max: FLOOR_MAX });

test.prop([floorArb], { seed: 42, numRuns: 1000 })("quota 단조 증가", (f) => {
  if (f === FLOOR_MIN) return;
  expect(floorPlan(f).quota).toBeGreaterThanOrEqual(floorPlan(f - 1).quota);
});

test.prop([floorArb], { seed: 42, numRuns: 1000 })("spawnRateMs ∈ [300,1000]", (f) => {
  const r = floorPlan(f).spawnRateMs;
  expect(r).toBeGreaterThanOrEqual(300);
  expect(r).toBeLessThanOrEqual(1000);
});

test.prop([floorArb], { seed: 42, numRuns: 1000 })("cap ≤ CAP_MAX 그리고 ≥1", (f) => {
  const c = floorPlan(f).cap;
  expect(c).toBeLessThanOrEqual(CAP_MAX);
  expect(c).toBeGreaterThanOrEqual(1);
});
