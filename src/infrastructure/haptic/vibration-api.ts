// VibrationApi — IHaptic 구현체.
// navigator.vibrate 우선 호출. iOS Safari 미지원 시 no-op (silent).
//
// Bible §5: haptic은 콤보 5+, 보스 처치, wave clear 3개 이벤트만 호출.

import type { IHaptic } from "@domain/ports/haptic";

type VibrateFn = (pattern: number | number[]) => boolean;

export class VibrationApi implements IHaptic {
  private readonly _vibrate: VibrateFn | null;

  constructor() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      // navigator.vibrate 바인딩 필수 (this 컨텍스트 보존)
      this._vibrate = navigator.vibrate.bind(navigator);
    } else {
      this._vibrate = null;
    }
  }

  vibrate(pattern: number | readonly number[]): void {
    if (this._vibrate === null) return;
    try {
      if (typeof pattern === "number") {
        this._vibrate(pattern);
      } else {
        this._vibrate([...pattern]);
      }
    } catch {
      // navigator.vibrate 실패는 silent. 디바이스 정책 거부 등.
    }
  }
}
