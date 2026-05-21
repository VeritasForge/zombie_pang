import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { DailyStreak, STREAK_MAX_DAYS } from "./daily-streak";

describe("DailyStreak property-based", () => {
  test.prop([fc.integer({ min: 0, max: STREAK_MAX_DAYS })], { seed: 42, numRuns: 100 })(
    "[Boundary] days ∈ [0, 7] 모든 값에서 coinBonus ∈ [1.0, 2.4] (부동소수 epsilon 허용)",
    (days) => {
      const s = DailyStreak.fromState(days, days === 0 ? null : "2026-01-01");
      const bonus = s.coinBonus();
      const EPS = 1e-9;
      expect(bonus).toBeGreaterThanOrEqual(1.0 - EPS);
      expect(bonus).toBeLessThanOrEqual(2.4 + EPS);
    },
  );

  test.prop([fc.integer({ min: 1, max: 30 })], { seed: 7, numRuns: 100 })(
    "[Boundary] N일 연속 방문 시 days = min(N, 7) (자동 휴식 적용 전까지)",
    (n) => {
      let s = DailyStreak.initial();
      for (let i = 0; i < n; i += 1) {
        const day = (i + 1).toString().padStart(2, "0");
        s = s.visit(new Date(`2026-01-${day}T00:00:00.000Z`));
      }
      // 7일 연속까지는 days = n. 8일째에는 reset (0). 9일째부터 다시 누적.
      // 사용자 명세: "8일째 자동 휴식: days = 0 reset"
      // 따라서 패턴: 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, ...
      const cycleLen = STREAK_MAX_DAYS + 1; // 8
      const expected = n % cycleLen === 0 ? 0 : n % cycleLen;
      expect(s.days()).toBe(expected);
    },
  );

  test.prop([fc.integer({ min: 1, max: 7 }), fc.integer({ min: 2, max: 100 })], {
    seed: 11,
    numRuns: 100,
  })("[Boundary] 끊김 (gap ≥ 2)는 days 유지, lastVisited 갱신 안 됨", (initialDays, gapDays) => {
    const last = "2026-01-10";
    const s = DailyStreak.fromState(initialDays, last);
    const nextDate = new Date("2026-01-10T00:00:00.000Z");
    nextDate.setUTCDate(nextDate.getUTCDate() + gapDays);
    const s2 = s.visit(nextDate);
    // gap == 1 case 제외 (initialDays 가 7일 때는 reset). 본 테스트는 gap >= 2.
    expect(s2.days()).toBe(initialDays);
    expect(s2.lastVisitedDate()).toBe(last);
  });
});
