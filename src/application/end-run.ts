// EndRun — 런 종료 use case.
// Bible §3: 5챕터 클리어(사직서 엔딩) / 도주 5 누적(조기 퇴근) / 사용자 early_exit.
//
// 동작:
//   1. saveStore에서 highScore / totalCoin / leaderboard 로드
//   2. highScore 갱신 (newScore > current → 갱신)
//   3. totalCoin += earnedCoin
//   4. leaderboard 갱신 (top 10, 점수 내림차순; 동점자는 최신 우선)
//   5. 모두 saveStore에 저장
//   6. durationMs = clock.now() - runStartedAt (saveStore에서 runStartedAt 로드)

import type { IClock } from "@domain/ports/clock";
import type { ISaveStore } from "@domain/ports/save-store";
import type { Score } from "@domain/score/score";
import { STORAGE_KEYS } from "./start-run";

export const STORAGE_KEYS_RUN = {
  HIGH_SCORE: "zombie-pang:v1:high-score",
  TOTAL_COIN: "zombie-pang:v1:total-coin",
  LEADERBOARD: "zombie-pang:v1:leaderboard",
} as const;

export const LEADERBOARD_LIMIT = 10;

export type EndRunReason = "clear" | "early_exit" | "fled_limit";

export type EndRunDeps = {
  readonly saveStore: ISaveStore;
  readonly clock: IClock;
};

export type EndRunInput = {
  readonly runId: string;
  readonly chaptersCleared: number;
  readonly finalScore: Score;
  readonly earnedCoin: number;
  readonly reason: EndRunReason;
};

export type LeaderboardEntry = {
  readonly runId: string;
  readonly score: number;
  readonly chaptersCleared: number;
  readonly reason: EndRunReason;
  readonly recordedAt: number;
};

export type EndRunOutput = {
  readonly durationMs: number;
  readonly highScoreUpdated: boolean;
  readonly totalCoin: number;
  readonly leaderboardRank: number | null;
};

type RunStartedAtRecord = {
  readonly runId: string;
  readonly startedAt: number;
};

function isRunStartedAtRecord(value: unknown): value is RunStartedAtRecord {
  if (value === null || typeof value !== "object") return false;
  const v = value as { runId?: unknown; startedAt?: unknown };
  return typeof v.runId === "string" && typeof v.startedAt === "number";
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (value === null || typeof value !== "object") return false;
  const v = value as {
    runId?: unknown;
    score?: unknown;
    chaptersCleared?: unknown;
    reason?: unknown;
    recordedAt?: unknown;
  };
  return (
    typeof v.runId === "string" &&
    typeof v.score === "number" &&
    typeof v.chaptersCleared === "number" &&
    typeof v.reason === "string" &&
    typeof v.recordedAt === "number"
  );
}

function loadLeaderboard(saveStore: ISaveStore): LeaderboardEntry[] {
  const raw = saveStore.get<unknown>(STORAGE_KEYS_RUN.LEADERBOARD);
  if (!Array.isArray(raw)) return [];
  const out: LeaderboardEntry[] = [];
  for (const entry of raw) {
    if (isLeaderboardEntry(entry)) {
      out.push(entry);
    }
  }
  return out;
}

export function endRun(deps: EndRunDeps, input: EndRunInput): EndRunOutput {
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    throw new RangeError(`endRun: runId must be non-empty string, got "${String(input.runId)}"`);
  }
  if (!Number.isInteger(input.chaptersCleared) || input.chaptersCleared < 0) {
    throw new RangeError(
      `endRun: chaptersCleared must be non-negative integer, got ${input.chaptersCleared}`,
    );
  }
  if (
    !Number.isFinite(input.earnedCoin) ||
    !Number.isInteger(input.earnedCoin) ||
    input.earnedCoin < 0
  ) {
    throw new RangeError(
      `endRun: earnedCoin must be non-negative integer, got ${input.earnedCoin}`,
    );
  }

  const now = deps.clock.now();
  if (!Number.isFinite(now)) {
    throw new RangeError(`endRun: clock.now() returned non-finite value: ${now}`);
  }

  // 런 시작 시각 로드 (없으면 0 fallback — 부정확하지만 throw하지 않는다)
  const startedRaw = deps.saveStore.get<unknown>(STORAGE_KEYS.RUN_STARTED_AT);
  let startedAt = 0;
  if (isRunStartedAtRecord(startedRaw)) {
    startedAt = startedRaw.startedAt;
  }
  const durationMs = Math.max(0, now - startedAt);

  // high score
  const prevHighScore = deps.saveStore.get<number>(STORAGE_KEYS_RUN.HIGH_SCORE) ?? 0;
  const newScoreValue = input.finalScore.value();
  const highScoreUpdated = newScoreValue > prevHighScore;
  if (highScoreUpdated) {
    deps.saveStore.set(STORAGE_KEYS_RUN.HIGH_SCORE, newScoreValue);
  }

  // total coin
  const prevTotalCoin = deps.saveStore.get<number>(STORAGE_KEYS_RUN.TOTAL_COIN) ?? 0;
  const totalCoin =
    Number.isFinite(prevTotalCoin) && prevTotalCoin >= 0
      ? prevTotalCoin + input.earnedCoin
      : input.earnedCoin;
  deps.saveStore.set(STORAGE_KEYS_RUN.TOTAL_COIN, totalCoin);

  // leaderboard — top 10, 동점자는 최신 우선 (큰 recordedAt이 앞)
  const board = loadLeaderboard(deps.saveStore);
  const newEntry: LeaderboardEntry = {
    runId: input.runId,
    score: newScoreValue,
    chaptersCleared: input.chaptersCleared,
    reason: input.reason,
    recordedAt: now,
  };
  const merged = [...board, newEntry].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.recordedAt - a.recordedAt;
  });
  const trimmed = merged.slice(0, LEADERBOARD_LIMIT);
  deps.saveStore.set(STORAGE_KEYS_RUN.LEADERBOARD, trimmed);

  const rankIndex = trimmed.findIndex(
    (e) => e.runId === newEntry.runId && e.recordedAt === newEntry.recordedAt,
  );
  const leaderboardRank = rankIndex === -1 ? null : rankIndex + 1;

  return {
    durationMs,
    highScoreUpdated,
    totalCoin,
    leaderboardRank,
  };
}
