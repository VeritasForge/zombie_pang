// StartRun — 새 런 시작 use case.
// Bible §3: run state 초기화.
//
// 책임:
//   1. runId 유효성 검증
//   2. clock.now()로 시작 시각 기록 + SaveStore에 저장
//   3. runId, startedAt, floor=1 반환
//
// meta/streak 로드는 wave-clicker 단순화(Task 5)로 제거됨 — run 시작은 이제
// 시간 기록만 담당한다.

import type { IClock } from "@domain/ports/clock";
import type { ISaveStore } from "@domain/ports/save-store";

export const STORAGE_KEYS = {
  RUN_STARTED_AT: "zombie-pang:v1:run-started-at",
} as const;

export type StartRunDeps = {
  readonly saveStore: ISaveStore;
  readonly clock: IClock;
};

export type StartRunInput = {
  readonly runId: string;
};

export type StartRunOutput = {
  readonly runId: string;
  readonly startedAt: number;
  readonly floor: 1;
};

export function startRun(deps: StartRunDeps, input: StartRunInput): StartRunOutput {
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    throw new RangeError(`startRun: runId must be non-empty string, got "${String(input.runId)}"`);
  }
  const startedAt = deps.clock.now();
  if (!Number.isFinite(startedAt)) {
    throw new RangeError(`startRun: clock.now() returned non-finite value: ${startedAt}`);
  }
  deps.saveStore.set(STORAGE_KEYS.RUN_STARTED_AT, { runId: input.runId, startedAt });
  return { runId: input.runId, startedAt, floor: 1 };
}
