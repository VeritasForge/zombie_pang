// install-prompt — PWA 설치 유도 모달 노출 정책 매니저.
//
// Bible §6 / master plan §3.7 (ADR-0011 Tentative Default):
//   - 챕터 1 클리어 후 1회 노출
//   - dismiss 시 7일 cooldown
//   - dismiss 3회 누적 → 영구 비노출
//   - installed === true → 영구 비노출
//
// iOS Safari는 `beforeinstallprompt` 이벤트 미지원 — graceful no-op로 처리한다 (호출 측 책임).
// 본 매니저는 *언제* 모달을 띄울지 결정만 한다. 실제 BeforeInstallPromptEvent.prompt() 호출은 호출자가 한다.

import type { ISaveStore } from "@domain/ports/save-store";

export const INSTALL_PROMPT_KEY = "zombie-pang:install-prompt:v1";

export const INSTALL_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7일
export const INSTALL_PROMPT_PERMANENT_THRESHOLD = 3; // dismiss 3회 누적 시 영구 비노출

export interface InstallPromptState {
  /** dismiss 누적 횟수. PERMANENT_THRESHOLD 이상이면 영구 비노출. */
  dismissCount: number;
  /** 마지막 dismiss 시각 (wall-clock epoch ms — Date.now() 기준). */
  lastDismissedAt: number;
  /** 사용자가 설치 완료한 경우 true → 영구 비노출. */
  installed: boolean;
}

function defaultState(): InstallPromptState {
  return { dismissCount: 0, lastDismissedAt: 0, installed: false };
}

export class InstallPromptManager {
  constructor(private readonly saveStore: ISaveStore) {}

  loadState(): InstallPromptState {
    return this.saveStore.get<InstallPromptState>(INSTALL_PROMPT_KEY) ?? defaultState();
  }

  /**
   * 모달을 노출해도 되는지 판정. now는 wall-clock epoch ms (Date.now() 기준).
   * monotonic ms를 넘기면 cooldown 비교가 무의미해진다.
   */
  shouldShow(nowEpochMs: number): boolean {
    if (!Number.isFinite(nowEpochMs) || nowEpochMs < 0) {
      throw new RangeError(`InstallPromptManager.shouldShow: invalid now: ${nowEpochMs}`);
    }
    const state = this.loadState();
    if (state.installed) return false;
    if (state.dismissCount >= INSTALL_PROMPT_PERMANENT_THRESHOLD) return false;
    const elapsed = nowEpochMs - state.lastDismissedAt;
    return elapsed >= INSTALL_PROMPT_COOLDOWN_MS;
  }

  recordDismiss(nowEpochMs: number): void {
    if (!Number.isFinite(nowEpochMs) || nowEpochMs < 0) {
      throw new RangeError(`InstallPromptManager.recordDismiss: invalid now: ${nowEpochMs}`);
    }
    const state = this.loadState();
    const next: InstallPromptState = {
      dismissCount: state.dismissCount + 1,
      lastDismissedAt: nowEpochMs,
      installed: state.installed,
    };
    this.saveStore.set(INSTALL_PROMPT_KEY, next);
  }

  recordInstalled(): void {
    const state = this.loadState();
    this.saveStore.set(INSTALL_PROMPT_KEY, { ...state, installed: true });
  }
}
