import { describe, expect, it } from "vitest";
import { SeededRandom } from "./seeded-random";

describe("SeededRandom", () => {
  it("[Happy] deterministic with same seed", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it("[Happy] next returns [0, 1)", () => {
    const r = new SeededRandom(1);
    for (let i = 0; i < 100; i += 1) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("[Happy] nextInt returns [0, maxExclusive)", () => {
    const r = new SeededRandom(7);
    for (let i = 0; i < 100; i += 1) {
      const v = r.nextInt(10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it("[Happy] pick returns one of the items", () => {
    const r = new SeededRandom(3);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 20; i += 1) {
      const picked = r.pick(items);
      expect(items).toContain(picked);
    }
  });

  it("[Boundary] fallback when seed not given", () => {
    const r = new SeededRandom();
    const v = r.next();
    expect(Number.isFinite(v)).toBe(true);
  });

  it("[Boundary] fallback when seed is non-finite", () => {
    const r = new SeededRandom(Number.NaN);
    const v = r.next();
    expect(Number.isFinite(v)).toBe(true);
  });

  it("[Error] nextInt throws for zero", () => {
    const r = new SeededRandom(1);
    expect(() => r.nextInt(0)).toThrow(RangeError);
  });

  it("[Error] nextInt throws for negative", () => {
    const r = new SeededRandom(1);
    expect(() => r.nextInt(-1)).toThrow(RangeError);
  });

  it("[Error] nextInt throws for non-integer", () => {
    const r = new SeededRandom(1);
    expect(() => r.nextInt(2.5)).toThrow(RangeError);
  });

  it("[Error] pick throws for empty array", () => {
    const r = new SeededRandom(1);
    expect(() => r.pick([])).toThrow(RangeError);
  });
});
