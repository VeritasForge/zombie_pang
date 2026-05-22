import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import type { ISaveStore } from "@domain/ports/save-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, startRun } from "./start-run";

function makeSaveStore(initial: Record<string, unknown> = {}): ISaveStore & {
  store: Map<string, unknown>;
} {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    store,
    get<T>(key: string): T | null {
      const v = store.get(key);
      return v === undefined ? null : (v as T);
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

function makeClock(nowMs: number): IClock {
  return { now: () => nowMs, monotonic: () => nowMs };
}

function makeRandom(): IRandom {
  return {
    next: vi.fn(() => 0.5),
    nextInt: vi.fn(() => 0),
    pick: <T>(items: readonly T[]): T => items[0] as T,
  };
}

describe("startRun", () => {
  let saveStore: ReturnType<typeof makeSaveStore>;
  let clock: IClock;
  let random: IRandom;

  beforeEach(() => {
    saveStore = makeSaveStore();
    clock = makeClock(Date.UTC(2026, 4, 17, 9, 0, 0));
    random = makeRandom();
  });

  it("[Happy] 첫 방문 시 새 run state + streak days=1 반환", () => {
    const out = startRun({ saveStore, clock, random }, { runId: "run-001" });

    expect(out.runId).toBe("run-001");
    expect(out.chapter).toBe(1);
    expect(out.floor).toBe(1);
    expect(out.startedAt).toBe(Date.UTC(2026, 4, 17, 9, 0, 0));
    expect(out.meta.deck()).toEqual([]);
    expect(out.streak.days()).toBe(1);
    expect(out.streak.lastVisitedDate()).toBe("2026-05-17");
  });

  it("[Happy] 기존 메타 deck 로드 + streak 연속일 증가", () => {
    saveStore.set(STORAGE_KEYS.META_DECK, ["DAMAGE_T1", "COIN_T1"]);
    saveStore.set(STORAGE_KEYS.STREAK, { days: 2, lastVisitedDate: "2026-05-16" });

    const out = startRun({ saveStore, clock, random }, { runId: "run-002" });

    expect(out.meta.deck()).toEqual(["DAMAGE_T1", "COIN_T1"]);
    expect(out.streak.days()).toBe(3);
    expect(out.streak.lastVisitedDate()).toBe("2026-05-17");

    // saveStore에 streak 저장 확인
    const savedStreak = saveStore.get<{ days: number; lastVisitedDate: string | null }>(
      STORAGE_KEYS.STREAK,
    );
    expect(savedStreak).toEqual({ days: 3, lastVisitedDate: "2026-05-17" });

    // runStartedAt도 저장됨
    const savedStart = saveStore.get<{ runId: string; startedAt: number }>(
      STORAGE_KEYS.RUN_STARTED_AT,
    );
    expect(savedStart).toEqual({ runId: "run-002", startedAt: Date.UTC(2026, 4, 17, 9, 0, 0) });
  });

  it("[Boundary] 같은 날 재방문 시 streak days 변화 없음", () => {
    saveStore.set(STORAGE_KEYS.STREAK, { days: 4, lastVisitedDate: "2026-05-17" });

    const out = startRun({ saveStore, clock, random }, { runId: "run-003" });

    expect(out.streak.days()).toBe(4);
    expect(out.streak.lastVisitedDate()).toBe("2026-05-17");
  });

  it("[Boundary] 저장된 deck이 빈 배열이면 empty MetaProgression", () => {
    saveStore.set(STORAGE_KEYS.META_DECK, []);
    const out = startRun({ saveStore, clock, random }, { runId: "run-004" });
    expect(out.meta.deck()).toEqual([]);
  });

  it("[Boundary] deck에 invalid card id 섞여 있으면 valid한 것만 로드", () => {
    saveStore.set(STORAGE_KEYS.META_DECK, ["DAMAGE_T1", "FAKE_CARD", "CRIT_T1"]);
    const out = startRun({ saveStore, clock, random }, { runId: "run-005" });
    expect(out.meta.deck()).toEqual(["DAMAGE_T1", "CRIT_T1"]);
  });

  it("[Boundary] 저장된 deck이 배열이 아니면 empty fallback", () => {
    saveStore.set(STORAGE_KEYS.META_DECK, "corrupted");
    const out = startRun({ saveStore, clock, random }, { runId: "run-006" });
    expect(out.meta.deck()).toEqual([]);
  });

  it("[Boundary] 저장된 streak 객체가 비정상이면 initial fallback", () => {
    saveStore.set(STORAGE_KEYS.STREAK, { days: "not-a-number" });
    const out = startRun({ saveStore, clock, random }, { runId: "run-007" });
    expect(out.streak.days()).toBe(1);
  });

  it("[Boundary] 저장된 streak가 fromState 검증 실패하면 initial fallback", () => {
    saveStore.set(STORAGE_KEYS.STREAK, { days: 999, lastVisitedDate: "2026-05-16" });
    const out = startRun({ saveStore, clock, random }, { runId: "run-008" });
    expect(out.streak.days()).toBe(1);
  });

  it("[Boundary] streak가 null로 저장된 경우 initial", () => {
    saveStore.set(STORAGE_KEYS.STREAK, null);
    const out = startRun({ saveStore, clock, random }, { runId: "run-009" });
    expect(out.streak.days()).toBe(1);
  });

  it("[Error] runId가 빈 문자열이면 RangeError", () => {
    expect(() => startRun({ saveStore, clock, random }, { runId: "" })).toThrow(RangeError);
  });

  it("[Error] runId가 number 같은 비문자열이면 RangeError", () => {
    expect(() =>
      startRun({ saveStore, clock, random }, { runId: 123 as unknown as string }),
    ).toThrow(RangeError);
  });

  it("[Error] clock.now()가 NaN이면 RangeError", () => {
    const badClock: IClock = { now: () => Number.NaN, monotonic: () => Number.NaN };
    expect(() => startRun({ saveStore, clock: badClock, random }, { runId: "x" })).toThrow(
      RangeError,
    );
  });
});
