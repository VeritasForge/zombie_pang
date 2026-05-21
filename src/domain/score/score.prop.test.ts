import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { Score } from "./score";

describe("Score property-based", () => {
  test.prop([fc.array(fc.nat({ max: 100_000 }), { minLength: 0, maxLength: 100 })], {
    seed: 42,
    numRuns: 200,
  })("[Boundary] 임의의 자연수 시퀀스를 add해도 score ≥ 0이 유지된다", (deltas) => {
    const result = deltas.reduce((s, d) => s.add(d), Score.zero());
    expect(result.value()).toBeGreaterThanOrEqual(0);
  });

  test.prop([fc.array(fc.nat({ max: 1_000 }), { minLength: 0, maxLength: 50 })], {
    seed: 42,
    numRuns: 200,
  })("[Boundary] add의 결합 결과는 단순 합과 동일하다", (deltas) => {
    const result = deltas.reduce((s, d) => s.add(d), Score.zero());
    const expected = deltas.reduce((a, b) => a + b, 0);
    expect(result.value()).toBe(expected);
  });

  test.prop([fc.nat({ max: 999_999 })], { seed: 42, numRuns: 200 })(
    "[Boundary] 999_999 이하 정수는 toString이 정확히 6자리",
    (n) => {
      expect(Score.from(n).toString().length).toBe(6);
    },
  );
});
