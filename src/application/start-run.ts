// StartRun — 새 런 시작 use case.
// Bible §3, §4: Daily streak 처리 + 영구 메타 로드 + run state 초기화.
//
// 책임:
//   1. SaveStore에서 MetaProgression / DailyStreak 로드 (없으면 새로 생성)
//   2. streak.visit(today) 호출 후 streak를 SaveStore에 저장
//   3. runId, startedAt(clock.now), chapter=1, floor=1, meta, streak 반환

import type { CardId } from "@domain/meta/card";
import { isCardId } from "@domain/meta/card";
import { DailyStreak } from "@domain/meta/daily-streak";
import { MetaProgression } from "@domain/meta/progression";
import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import type { ISaveStore } from "@domain/ports/save-store";

export const STORAGE_KEYS = {
  META_DECK: "zombie-pang:v1:meta-deck",
  STREAK: "zombie-pang:v1:streak",
  RUN_STARTED_AT: "zombie-pang:v1:run-started-at",
} as const;

export type StartRunDeps = {
  readonly saveStore: ISaveStore;
  readonly clock: IClock;
  readonly random: IRandom;
};

export type StartRunInput = {
  readonly runId: string;
};

export type StartRunOutput = {
  readonly runId: string;
  readonly startedAt: number;
  readonly chapter: 1;
  readonly floor: 1;
  readonly meta: MetaProgression;
  readonly streak: DailyStreak;
};

type StreakState = {
  readonly days: number;
  readonly lastVisitedDate: string | null;
};

function isStreakState(value: unknown): value is StreakState {
  if (value === null || typeof value !== "object") return false;
  const v = value as { days?: unknown; lastVisitedDate?: unknown };
  if (typeof v.days !== "number") return false;
  if (v.lastVisitedDate !== null && typeof v.lastVisitedDate !== "string") return false;
  return true;
}

function loadMeta(saveStore: ISaveStore): MetaProgression {
  const raw = saveStore.get<readonly string[]>(STORAGE_KEYS.META_DECK);
  if (raw === null) {
    return MetaProgression.empty();
  }
  if (!Array.isArray(raw)) {
    return MetaProgression.empty();
  }
  const deck: CardId[] = [];
  for (const id of raw) {
    if (isCardId(id)) {
      deck.push(id);
    }
  }
  return MetaProgression.fromDeck(deck);
}

function loadStreak(saveStore: ISaveStore): DailyStreak {
  const raw = saveStore.get<unknown>(STORAGE_KEYS.STREAK);
  if (raw === null) {
    return DailyStreak.initial();
  }
  if (!isStreakState(raw)) {
    return DailyStreak.initial();
  }
  try {
    return DailyStreak.fromState(raw.days, raw.lastVisitedDate);
  } catch {
    return DailyStreak.initial();
  }
}

export function startRun(deps: StartRunDeps, input: StartRunInput): StartRunOutput {
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    throw new RangeError(`startRun: runId must be non-empty string, got "${String(input.runId)}"`);
  }
  // random은 후속 use case (kill-zombie, pick-upgrade)에서 결정론 시드를 보장하기 위해
  // deps 단계에서 주입 받는다. 본 use case에서는 직접 호출하지 않지만 contract 검증을 위해 참조.
  // (사용처: composition root에서 동일 IRandom 인스턴스 재사용 보장)
  void deps.random;

  const startedAt = deps.clock.now();
  if (!Number.isFinite(startedAt)) {
    throw new RangeError(`startRun: clock.now() returned non-finite value: ${startedAt}`);
  }

  const meta = loadMeta(deps.saveStore);
  const loadedStreak = loadStreak(deps.saveStore);
  const today = new Date(startedAt);
  const streak = loadedStreak.visit(today);

  deps.saveStore.set(STORAGE_KEYS.STREAK, {
    days: streak.days(),
    lastVisitedDate: streak.lastVisitedDate(),
  });
  deps.saveStore.set(STORAGE_KEYS.RUN_STARTED_AT, {
    runId: input.runId,
    startedAt,
  });

  return {
    runId: input.runId,
    startedAt,
    chapter: 1,
    floor: 1,
    meta,
    streak,
  };
}
