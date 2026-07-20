import type { IClock } from "@domain/ports/clock";
import type { ISaveStore } from "@domain/ports/save-store";
import { Score } from "@domain/score/score";
import { beforeEach, describe, expect, it } from "vitest";
import { LEADERBOARD_LIMIT, type LeaderboardEntry, STORAGE_KEYS_RUN, endRun } from "./end-run";
import { STORAGE_KEYS } from "./start-run";

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

const FAKE_NOW = 10_000;
const clock: IClock = { now: () => FAKE_NOW, monotonic: () => FAKE_NOW };

describe("endRun", () => {
  let saveStore: ReturnType<typeof makeSaveStore>;

  beforeEach(() => {
    saveStore = makeSaveStore();
    saveStore.set(STORAGE_KEYS.RUN_STARTED_AT, { runId: "run-001", startedAt: 5_000 });
  });

  it("[Happy] 새 high score → 갱신, durationMs 계산, leaderboard rank=1", () => {
    const out = endRun(
      { saveStore, clock },
      {
        runId: "run-001",
        floorsReached: 50,
        finalScore: Score.from(12345),
        reason: "clear",
      },
    );

    expect(out.durationMs).toBe(5_000);
    expect(out.highScoreUpdated).toBe(true);
    expect(out.leaderboardRank).toBe(1);

    expect(saveStore.get(STORAGE_KEYS_RUN.HIGH_SCORE)).toBe(12345);
  });

  it("[Happy] 기존 high score보다 낮음 → 갱신 안 함", () => {
    saveStore.set(STORAGE_KEYS_RUN.HIGH_SCORE, 99999);

    const out = endRun(
      { saveStore, clock },
      {
        runId: "run-002",
        floorsReached: 3,
        finalScore: Score.from(100),
        reason: "early_exit",
      },
    );

    expect(out.highScoreUpdated).toBe(false);
    expect(saveStore.get(STORAGE_KEYS_RUN.HIGH_SCORE)).toBe(99999);
  });

  it("[Boundary] floorsReached 0 허용 (첫 층에서 조기 퇴근)", () => {
    const out = endRun(
      { saveStore, clock },
      {
        runId: "zero",
        floorsReached: 0,
        finalScore: Score.zero(),
        reason: "early_exit",
      },
    );
    expect(out.leaderboardRank).toBe(1);

    const board = saveStore.get<readonly LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    expect(board?.[0]?.floorsReached).toBe(0);
  });

  it("[Boundary] 11번째 entry → top 10 trim (최하위 score 탈락)", () => {
    const baseEntries: LeaderboardEntry[] = Array.from({ length: 10 }, (_, i) => ({
      runId: `r-${i}`,
      score: 1000 + i, // r-0=1000, r-9=1009
      floorsReached: 5,
      reason: "clear" as const,
      recordedAt: 1_000 + i,
    }));
    saveStore.set(STORAGE_KEYS_RUN.LEADERBOARD, baseEntries);

    const out = endRun(
      { saveStore, clock },
      {
        runId: "new-run",
        floorsReached: 3,
        finalScore: Score.from(500), // 최하위
        reason: "early_exit",
      },
    );

    // 500점은 모든 기존보다 낮음 → top10 진입 실패
    expect(out.leaderboardRank).toBeNull();
    const board = saveStore.get<readonly LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    expect(board).not.toBeNull();
    expect(board?.length).toBe(LEADERBOARD_LIMIT);
    expect(board?.some((e) => e.runId === "new-run")).toBe(false);
  });

  it("[Boundary] 동점자는 최신 우선 (큰 recordedAt이 앞)", () => {
    saveStore.set(STORAGE_KEYS_RUN.LEADERBOARD, [
      {
        runId: "old",
        score: 1000,
        floorsReached: 5,
        reason: "clear",
        recordedAt: 1_000,
      } satisfies LeaderboardEntry,
    ]);

    const out = endRun(
      { saveStore, clock },
      {
        runId: "new",
        floorsReached: 5,
        finalScore: Score.from(1000),
        reason: "clear",
      },
    );

    // new는 recordedAt=10_000으로 더 큼 → rank 1
    expect(out.leaderboardRank).toBe(1);
    const board = saveStore.get<readonly LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    expect(board?.[0]?.runId).toBe("new");
    expect(board?.[1]?.runId).toBe("old");
  });

  it("[Boundary] RUN_STARTED_AT 정보 없으면 durationMs = clock.now() - 0", () => {
    saveStore.remove(STORAGE_KEYS.RUN_STARTED_AT);
    const out = endRun(
      { saveStore, clock },
      {
        runId: "orphan",
        floorsReached: 1,
        finalScore: Score.from(10),
        reason: "early_exit",
      },
    );
    expect(out.durationMs).toBe(FAKE_NOW);
  });

  it("[Boundary] now < startedAt → durationMs는 0으로 clamp", () => {
    saveStore.set(STORAGE_KEYS.RUN_STARTED_AT, { runId: "x", startedAt: 99_999_999 });
    const out = endRun(
      { saveStore, clock },
      {
        runId: "x",
        floorsReached: 1,
        finalScore: Score.from(1),
        reason: "early_exit",
      },
    );
    expect(out.durationMs).toBe(0);
  });

  it("[Boundary] 손상된 leaderboard JSON은 무시하고 빈 배열에서 시작", () => {
    saveStore.set(STORAGE_KEYS_RUN.LEADERBOARD, "corrupted");
    const out = endRun(
      { saveStore, clock },
      {
        runId: "fresh",
        floorsReached: 1,
        finalScore: Score.from(50),
        reason: "early_exit",
      },
    );
    expect(out.leaderboardRank).toBe(1);
  });

  it("[Boundary] 손상된 entry는 필터링 후 정상 entry만 유지", () => {
    saveStore.set(STORAGE_KEYS_RUN.LEADERBOARD, [
      { runId: "ok", score: 100, floorsReached: 1, reason: "clear", recordedAt: 1 },
      { invalid: true },
    ]);
    const out = endRun(
      { saveStore, clock },
      {
        runId: "new",
        floorsReached: 1,
        finalScore: Score.from(200),
        reason: "early_exit",
      },
    );
    expect(out.leaderboardRank).toBe(1);
    const board = saveStore.get<readonly LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    expect(board?.length).toBe(2);
  });

  it("[Error] runId가 빈 문자열이면 RangeError", () => {
    expect(() =>
      endRun(
        { saveStore, clock },
        {
          runId: "",
          floorsReached: 1,
          finalScore: Score.zero(),
          reason: "early_exit",
        },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] floorsReached 음수면 RangeError", () => {
    expect(() =>
      endRun(
        { saveStore, clock },
        {
          runId: "x",
          floorsReached: -1,
          finalScore: Score.zero(),
          reason: "early_exit",
        },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] floorsReached가 비정수면 RangeError", () => {
    expect(() =>
      endRun(
        { saveStore, clock },
        {
          runId: "x",
          floorsReached: 1.5,
          finalScore: Score.zero(),
          reason: "early_exit",
        },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] clock.now()가 NaN이면 RangeError", () => {
    const badClock: IClock = { now: () => Number.NaN, monotonic: () => Number.NaN };
    expect(() =>
      endRun(
        { saveStore, clock: badClock },
        {
          runId: "x",
          floorsReached: 1,
          finalScore: Score.zero(),
          reason: "early_exit",
        },
      ),
    ).toThrow(RangeError);
  });
});
