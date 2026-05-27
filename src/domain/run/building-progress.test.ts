import { describe, expect, it } from "vitest";
import { litFloorsFor } from "./building-progress";

describe("litFloorsFor", () => {
  // [Happy] 3챕터 클리어 → 30층 점등
  it("[Happy] 3 → 30", () => {
    expect(litFloorsFor(3)).toBe(30);
  });
  // [Boundary] 0 → 0, 5 → 50
  it("[Boundary] 0 → 0", () => expect(litFloorsFor(0)).toBe(0));
  it("[Boundary] 5 → 50", () => expect(litFloorsFor(5)).toBe(50));
  // [Boundary] 6(초과) → 50 클램프
  it("[Boundary] 6 → 50 (클램프)", () => expect(litFloorsFor(6)).toBe(50));
  // [Error] 음수 → 0
  it("[Error] 음수 → 0", () => expect(litFloorsFor(-2)).toBe(0));
  // [Error] NaN → 0
  it("[Error] NaN → 0", () => expect(litFloorsFor(Number.NaN)).toBe(0));
});
