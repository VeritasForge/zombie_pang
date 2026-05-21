// SystemClock — IClock 구현체.
// performance.now() 우선 사용 (monotonic). 미지원 시 Date.now() fallback.

import type { IClock } from "@domain/ports/clock";

export class SystemClock implements IClock {
  now(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }
}
