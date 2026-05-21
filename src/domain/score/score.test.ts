import { describe, expect, it } from "vitest";
import { Score } from "./score";

describe("Score", () => {
  it("[Happy] zero()는 value=0", () => {
    expect(Score.zero().value()).toBe(0);
  });

  it("[Happy] add(amount)는 누적된 새 Score 반환 (불변)", () => {
    const s0 = Score.zero();
    const s1 = s0.add(100);
    const s2 = s1.add(50);
    expect(s0.value()).toBe(0);
    expect(s1.value()).toBe(100);
    expect(s2.value()).toBe(150);
  });

  it("[Happy] from(n)으로 초기값 설정", () => {
    expect(Score.from(42).value()).toBe(42);
  });

  it("[Happy] toString은 6자리 0-padding", () => {
    expect(Score.zero().toString()).toBe("000000");
    expect(Score.from(123).toString()).toBe("000123");
    expect(Score.from(999_999).toString()).toBe("999999");
  });

  it("[Boundary] 0 더하기 0은 0", () => {
    expect(Score.zero().add(0).value()).toBe(0);
  });

  it("[Boundary] 6자리 초과 시 자리수 그대로 (절단 안 함)", () => {
    expect(Score.from(1_234_567).toString()).toBe("1234567");
  });

  it("[Boundary] toString floor 적용 (소수 절단)", () => {
    expect(Score.from(99.9).toString()).toBe("000099");
  });

  it("[Error] add(음수)는 RangeError throw", () => {
    expect(() => Score.zero().add(-1)).toThrow(RangeError);
  });

  it("[Error] add(NaN)는 RangeError throw", () => {
    expect(() => Score.zero().add(Number.NaN)).toThrow(RangeError);
  });

  it("[Error] add(Infinity)는 RangeError throw", () => {
    expect(() => Score.zero().add(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("[Error] from(음수)는 RangeError throw (branded 검증)", () => {
    expect(() => Score.from(-1)).toThrow(RangeError);
  });
});
