import type { ISaveStore } from "@domain/ports/save-store";
import { describe, expect, it } from "vitest";
import {
  INSTALL_PROMPT_COOLDOWN_MS,
  INSTALL_PROMPT_KEY,
  INSTALL_PROMPT_PERMANENT_THRESHOLD,
  InstallPromptManager,
  type InstallPromptState,
} from "./install-prompt";

// install-prompt 테스트.
// 글로벌 CLAUDE.md TDD 3 카테고리: [Happy] / [Boundary] / [Error] 각 ≥ 1.

function makeFakeStore(initial: Record<string, unknown> = {}): ISaveStore {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    get<T>(key: string): T | null {
      return (store.get(key) as T | undefined) ?? null;
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

const NOW_EPOCH = 1_700_000_000_000; // 2023-11-14 22:13:20 UTC — 임의 wall-clock 기준점.

describe("InstallPromptManager", () => {
  it("[Happy] shows on first call when state is empty", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    expect(mgr.shouldShow(NOW_EPOCH)).toBe(true);
  });

  it("[Happy] re-shows after 7 day cooldown elapses", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    mgr.recordDismiss(NOW_EPOCH);
    expect(mgr.shouldShow(NOW_EPOCH + INSTALL_PROMPT_COOLDOWN_MS)).toBe(true);
  });

  it("[Happy] persists dismiss state to saveStore", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    mgr.recordDismiss(NOW_EPOCH);
    const saved = store.get<InstallPromptState>(INSTALL_PROMPT_KEY);
    expect(saved).toEqual({ dismissCount: 1, lastDismissedAt: NOW_EPOCH, installed: false });
  });

  it("[Boundary] hides exactly 1ms before 7 day cooldown elapses", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    mgr.recordDismiss(NOW_EPOCH);
    expect(mgr.shouldShow(NOW_EPOCH + INSTALL_PROMPT_COOLDOWN_MS - 1)).toBe(false);
  });

  it("[Boundary] hides permanently after dismissCount reaches threshold", () => {
    const store = makeFakeStore({
      [INSTALL_PROMPT_KEY]: {
        dismissCount: INSTALL_PROMPT_PERMANENT_THRESHOLD,
        lastDismissedAt: 0,
        installed: false,
      } satisfies InstallPromptState,
    });
    const mgr = new InstallPromptManager(store);
    // cooldown은 충분히 지났지만 누적 임계 도달 시 영구 비노출.
    expect(mgr.shouldShow(NOW_EPOCH + 365 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it("[Boundary] recordInstalled prevents future shows even after cooldown", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    mgr.recordInstalled();
    expect(mgr.shouldShow(NOW_EPOCH + INSTALL_PROMPT_COOLDOWN_MS * 10)).toBe(false);
  });

  it("[Error] throws on NaN now", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    expect(() => mgr.shouldShow(Number.NaN)).toThrow(RangeError);
    expect(() => mgr.recordDismiss(Number.NaN)).toThrow(RangeError);
  });

  it("[Error] throws on negative now", () => {
    const store = makeFakeStore();
    const mgr = new InstallPromptManager(store);
    expect(() => mgr.shouldShow(-1)).toThrow(RangeError);
  });
});
