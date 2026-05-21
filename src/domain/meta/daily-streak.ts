// DailyStreak — 출근 도장 (Bible §4, ADR-0003 Option B).
// - days: 0~7
// - coinBonus(): 1 + 0.2 × days (max 2.4 at days=7)
// - 8일째 자동 휴식: days 0 reset (다음 visit에서 1로 시작)
// - 페널티 0: 끊겨도 days 유지 (lastVisitedDate 갱신 안 됨)
// - ISO date string (YYYY-MM-DD) 사용. 시간대 분리.

export const STREAK_MAX_DAYS = 7;
export const STREAK_COIN_PER_DAY = 0.2;
export const STREAK_BASE_MULTIPLIER = 1;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("DailyStreak: invalid Date");
  }
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(`${aIso}T00:00:00.000Z`);
  const b = Date.parse(`${bIso}T00:00:00.000Z`);
  /* c8 ignore next 3 -- fromState ISO regex 통과 후 호출되어 항상 finite, 방어 코드 */
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError("DailyStreak: invalid ISO date");
  }
  return Math.round((b - a) / ONE_DAY_MS);
}

export class DailyStreak {
  private constructor(
    private readonly _days: number,
    private readonly _lastVisitedDate: string | null,
  ) {}

  static initial(): DailyStreak {
    return new DailyStreak(0, null);
  }

  static fromState(days: number, lastVisitedDate: string | null): DailyStreak {
    if (!Number.isInteger(days) || days < 0 || days > STREAK_MAX_DAYS) {
      throw new RangeError(
        `DailyStreak.fromState: days must be integer in [0, ${STREAK_MAX_DAYS}], got ${days}`,
      );
    }
    if (lastVisitedDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(lastVisitedDate)) {
      throw new RangeError(
        `DailyStreak.fromState: lastVisitedDate must be YYYY-MM-DD or null, got ${lastVisitedDate}`,
      );
    }
    return new DailyStreak(days, lastVisitedDate);
  }

  days(): number {
    return this._days;
  }

  lastVisitedDate(): string | null {
    return this._lastVisitedDate;
  }

  /**
   * 오늘 방문 처리.
   * - 첫 방문 (last=null): days 1로 시작
   * - last 직전날 = today - 1: days + 1, max 7
   * - last == today: 같은 날 재방문, 변화 없음
   * - last < today - 1: 끊김. lastVisited는 갱신 안 됨, days 유지.
   * - days 7 상태에서 다음날 방문: 8일째 자동 휴식 = days 0 reset (lastVisited는 today로 갱신)
   * - last > today: 미래 날짜 → RangeError
   */
  visit(today: Date): DailyStreak {
    const todayIso = toIsoDate(today);
    if (this._lastVisitedDate === null) {
      return new DailyStreak(1, todayIso);
    }
    const diff = daysBetween(this._lastVisitedDate, todayIso);
    if (diff < 0) {
      throw new RangeError(
        `DailyStreak.visit: today (${todayIso}) is before lastVisited (${this._lastVisitedDate})`,
      );
    }
    if (diff === 0) {
      return this;
    }
    if (diff === 1) {
      // 다음날 방문
      if (this._days >= STREAK_MAX_DAYS) {
        // 8일째 자동 휴식 — days 0 reset
        return new DailyStreak(0, todayIso);
      }
      return new DailyStreak(this._days + 1, todayIso);
    }
    // 끊김 (diff >= 2). 페널티 0: days 유지, lastVisited는 갱신 안 됨 (사용자 명세).
    return this;
  }

  coinBonus(): number {
    return STREAK_BASE_MULTIPLIER + STREAK_COIN_PER_DAY * this._days;
  }
}
