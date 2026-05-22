import { afterEach, describe, expect, it } from "vitest";
import { SystemClock } from "./system-clock";

// SystemClock 테스트.
// 글로벌 CLAUDE.md TDD 3 카테고리 규칙: [Happy] / [Boundary] / [Error] 각 ≥ 1.

type GlobalLike = typeof globalThis & { Date: DateConstructor };

describe("SystemClock", () => {
  // restoreStack: 각 테스트가 변경한 globalThis 슬롯을 끝나면 원복한다.
  const restoreStack: Array<() => void> = [];

  afterEach(() => {
    while (restoreStack.length) {
      const restore = restoreStack.pop();
      restore?.();
    }
  });

  function override<T extends keyof typeof globalThis>(
    key: T,
    value: (typeof globalThis)[T] | undefined,
  ): void {
    const original = (globalThis as Record<string, unknown>)[key as string];
    Object.defineProperty(globalThis, key, { value, configurable: true });
    restoreStack.push(() => {
      Object.defineProperty(globalThis, key, { value: original, configurable: true });
    });
  }

  it("[Happy] returns finite monotonic value", () => {
    const clock = new SystemClock();
    const t = clock.now();
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(0);
  });

  it("[Happy] consecutive calls are non-decreasing", () => {
    const clock = new SystemClock();
    const a = clock.now();
    const b = clock.now();
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("[Happy] monotonic() shares semantics with now()", () => {
    const clock = new SystemClock();
    const a = clock.now();
    const b = clock.monotonic();
    const c = clock.now();
    // 두 메소드 호출 사이의 순서는 단조 증가해야 한다.
    expect(b).toBeGreaterThanOrEqual(a);
    expect(c).toBeGreaterThanOrEqual(b);
  });

  it("[Boundary] falls back to Date.now when performance.now is missing", () => {
    const originalPerf = globalThis.performance;
    const replacement = { ...originalPerf, now: undefined };
    override("performance", replacement as unknown as Performance);
    const clock = new SystemClock();
    const t = clock.now();
    expect(Number.isFinite(t)).toBe(true);
  });

  it("[Boundary] monotonic() also falls back when performance.now is missing", () => {
    const originalPerf = globalThis.performance;
    const replacement = { ...originalPerf, now: undefined };
    override("performance", replacement as unknown as Performance);
    const clock = new SystemClock();
    const t = clock.monotonic();
    expect(Number.isFinite(t)).toBe(true);
  });

  it("[Error] throws when both performance.now and Date are unavailable", () => {
    // 극단 환경 시뮬레이션: 두 시간 소스 모두 사라진 경우.
    // 실제 브라우저/Node에서는 발생하지 않지만, fallback chain의 끝을 명세로 박제한다.
    override("performance", undefined as unknown as Performance);
    const originalDate = (globalThis as GlobalLike).Date;
    Object.defineProperty(globalThis, "Date", {
      value: undefined,
      configurable: true,
    });
    restoreStack.push(() => {
      Object.defineProperty(globalThis, "Date", { value: originalDate, configurable: true });
    });

    const clock = new SystemClock();
    expect(() => clock.now()).toThrow();
  });
});
