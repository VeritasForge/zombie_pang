// SystemClock — IClock 구현체.
// performance.now() 우선 사용 (monotonic). 미지원 환경(구형 jsdom 등)은 Date.now() fallback.
//
// fallback 시 Date.now()는 wall-clock이므로 엄밀한 의미의 monotonic이 깨질 수 있다
// (시스템 시계 변경 시). 하지만 좀비팡 MVP의 60초 마이크로세션 범위 안에서는 무시 가능.

import type { IClock } from "@domain/ports/clock";

export class SystemClock implements IClock {
  now(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  monotonic(): number {
    return this.now();
  }
}
