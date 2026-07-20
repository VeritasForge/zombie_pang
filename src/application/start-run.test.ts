import type { IClock } from "@domain/ports/clock";
import type { ISaveStore } from "@domain/ports/save-store";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS, startRun } from "./start-run";

function makeSaveStore(): ISaveStore & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
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

describe("startRun", () => {
  it("[Happy] runId/startedAt/floor=1 반환 + RUN_STARTED_AT 저장", () => {
    const saveStore = makeSaveStore();
    const out = startRun({ saveStore, clock: makeClock(1000) }, { runId: "run-1" });

    expect(out).toEqual({ runId: "run-1", startedAt: 1000, floor: 1 });
    expect(saveStore.get(STORAGE_KEYS.RUN_STARTED_AT)).toEqual({
      runId: "run-1",
      startedAt: 1000,
    });
  });

  it("[Happy] 서로 다른 runId/시각으로 호출해도 독립적으로 반영", () => {
    const saveStore = makeSaveStore();
    const out = startRun({ saveStore, clock: makeClock(50_000) }, { runId: "run-2" });

    expect(out.runId).toBe("run-2");
    expect(out.startedAt).toBe(50_000);
    expect(out.floor).toBe(1);
  });

  it("[Boundary] runId가 빈 문자열이면 RangeError", () => {
    expect(() =>
      startRun({ saveStore: makeSaveStore(), clock: makeClock(0) }, { runId: "" }),
    ).toThrow(RangeError);
  });

  it("[Boundary] clock.now()가 정확히 0이어도 정상 처리(finite 경계)", () => {
    const saveStore = makeSaveStore();
    const out = startRun({ saveStore, clock: makeClock(0) }, { runId: "run-zero" });
    expect(out.startedAt).toBe(0);
  });

  it("[Error] runId가 문자열이 아니면(number) RangeError", () => {
    expect(() =>
      startRun(
        { saveStore: makeSaveStore(), clock: makeClock(0) },
        { runId: 123 as unknown as string },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] clock.now()가 NaN이면 RangeError", () => {
    const badClock: IClock = { now: () => Number.NaN, monotonic: () => Number.NaN };
    expect(() => startRun({ saveStore: makeSaveStore(), clock: badClock }, { runId: "r" })).toThrow(
      RangeError,
    );
  });

  it("[Error] clock.now()가 Infinity면 RangeError", () => {
    const badClock: IClock = {
      now: () => Number.POSITIVE_INFINITY,
      monotonic: () => Number.POSITIVE_INFINITY,
    };
    expect(() => startRun({ saveStore: makeSaveStore(), clock: badClock }, { runId: "r" })).toThrow(
      RangeError,
    );
  });
});
