import { describe, expect, it } from "vitest";
import { DailyStreak, STREAK_MAX_DAYS } from "./daily-streak";

const utcDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

describe("DailyStreak", () => {
  it("[Happy] initial은 days=0, last=null, coinBonus=1.0", () => {
    const s = DailyStreak.initial();
    expect(s.days()).toBe(0);
    expect(s.lastVisitedDate()).toBeNull();
    expect(s.coinBonus()).toBe(1.0);
  });

  it("[Happy] 첫 visit은 days=1, last=today, coinBonus=1.2", () => {
    const s = DailyStreak.initial().visit(utcDate("2026-01-01"));
    expect(s.days()).toBe(1);
    expect(s.lastVisitedDate()).toBe("2026-01-01");
    expect(s.coinBonus()).toBeCloseTo(1.2, 4);
  });

  it("[Happy] 다음날 연속 visit → days+1", () => {
    let s = DailyStreak.initial().visit(utcDate("2026-01-01"));
    s = s.visit(utcDate("2026-01-02"));
    expect(s.days()).toBe(2);
    expect(s.coinBonus()).toBeCloseTo(1.4, 4);
  });

  it("[Happy] 7일 연속 → days=7, coinBonus=2.4", () => {
    let s = DailyStreak.initial();
    for (let i = 0; i < 7; i += 1) {
      const day = (i + 1).toString().padStart(2, "0");
      s = s.visit(utcDate(`2026-01-${day}`));
    }
    expect(s.days()).toBe(7);
    expect(s.coinBonus()).toBeCloseTo(2.4, 4);
  });

  it("[Happy] 같은 날 재방문은 변화 없음 (idempotent)", () => {
    const s = DailyStreak.initial().visit(utcDate("2026-01-01"));
    const s2 = s.visit(utcDate("2026-01-01"));
    expect(s2.days()).toBe(1);
    expect(s2.lastVisitedDate()).toBe("2026-01-01");
  });

  it("[Happy] 끊김 (2일 이상 후 방문): days 유지, lastVisited 갱신 안 됨", () => {
    let s = DailyStreak.initial().visit(utcDate("2026-01-01"));
    s = s.visit(utcDate("2026-01-02"));
    expect(s.days()).toBe(2);
    // 5일 후 방문 — 끊김
    const s2 = s.visit(utcDate("2026-01-07"));
    expect(s2.days()).toBe(2); // 페널티 0
    expect(s2.lastVisitedDate()).toBe("2026-01-02"); // 갱신 안 됨
  });

  it("[Boundary] days=0일 때 coinBonus=1.0", () => {
    expect(DailyStreak.initial().coinBonus()).toBe(1.0);
  });

  it("[Boundary] days=7일 때 coinBonus=2.4 (max)", () => {
    const s = DailyStreak.fromState(STREAK_MAX_DAYS, "2026-01-07");
    expect(s.coinBonus()).toBeCloseTo(2.4, 4);
  });

  it("[Boundary] 8일째 자동 휴식 — days 7 → 다음날 visit → days 0 reset, last 갱신", () => {
    const s = DailyStreak.fromState(STREAK_MAX_DAYS, "2026-01-07");
    const s2 = s.visit(utcDate("2026-01-08"));
    expect(s2.days()).toBe(0);
    expect(s2.lastVisitedDate()).toBe("2026-01-08");
    expect(s2.coinBonus()).toBe(1.0);
  });

  it("[Boundary] fromState에서 days=0, last=null 허용", () => {
    expect(DailyStreak.fromState(0, null).days()).toBe(0);
  });

  it("[Boundary] fromState days=7 경계", () => {
    expect(DailyStreak.fromState(7, "2026-01-07").days()).toBe(7);
  });

  it("[Error] fromState days=-1 throw", () => {
    expect(() => DailyStreak.fromState(-1, null)).toThrow(RangeError);
  });

  it("[Error] fromState days=8 throw", () => {
    expect(() => DailyStreak.fromState(8, null)).toThrow(RangeError);
  });

  it("[Error] fromState days 소수 throw", () => {
    expect(() => DailyStreak.fromState(3.5, null)).toThrow(RangeError);
  });

  it("[Error] fromState 잘못된 ISO date 형식 throw", () => {
    expect(() => DailyStreak.fromState(1, "2026/01/01")).toThrow(RangeError);
    expect(() => DailyStreak.fromState(1, "26-1-1")).toThrow(RangeError);
  });

  it("[Error] 미래 날짜 visit (today < lastVisited) throw", () => {
    const s = DailyStreak.initial().visit(utcDate("2026-01-05"));
    expect(() => s.visit(utcDate("2026-01-04"))).toThrow(RangeError);
  });

  it("[Error] visit 잘못된 Date (Invalid) throw", () => {
    expect(() => DailyStreak.initial().visit(new Date("not-a-date"))).toThrow(RangeError);
  });
});
