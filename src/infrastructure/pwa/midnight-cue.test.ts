import { describe, expect, it } from "vitest";
import { MidnightCueManager } from "./midnight-cue";

// midnight-cue 테스트.
// 글로벌 CLAUDE.md TDD 3 카테고리: [Happy] / [Boundary] / [Error] 각 ≥ 1.

function dateAtHour(hour: number, minute = 0, second = 0, ms = 0): Date {
  // 임의의 날짜에 hour를 박는다. 로컬 시간대 차이는 setHours로 흡수.
  const d = new Date(2026, 4, 22); // 2026-05-22 00:00:00 로컬
  d.setHours(hour, minute, second, ms);
  return d;
}

describe("MidnightCueManager", () => {
  it("[Happy] shows during midnight window (03:00) on first session call", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(3))).toBe(true);
  });

  it("[Happy] hides after recordShown in the same session", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(2))).toBe(true);
    mgr.recordShown();
    expect(mgr.shouldShow(dateAtHour(3))).toBe(false);
  });

  it("[Happy] resetSession re-enables", () => {
    const mgr = new MidnightCueManager();
    mgr.recordShown();
    mgr.resetSession();
    expect(mgr.shouldShow(dateAtHour(4))).toBe(true);
  });

  it("[Boundary] exactly 00:00 → true (lower bound inclusive)", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(0))).toBe(true);
  });

  it("[Boundary] exactly 06:00 → false (upper bound exclusive)", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(6))).toBe(false);
  });

  it("[Boundary] 05:59:59.999 → true", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(5, 59, 59, 999))).toBe(true);
  });

  it("[Boundary] 23:59 → false (outside window)", () => {
    const mgr = new MidnightCueManager();
    expect(mgr.shouldShow(dateAtHour(23, 59))).toBe(false);
  });

  it("[Error] throws on Invalid Date", () => {
    const mgr = new MidnightCueManager();
    expect(() => mgr.shouldShow(new Date(Number.NaN))).toThrow(TypeError);
  });

  it("[Error] throws when input is not a Date", () => {
    const mgr = new MidnightCueManager();
    expect(() => mgr.shouldShow("2026-05-22T03:00:00" as unknown as Date)).toThrow(TypeError);
  });
});
