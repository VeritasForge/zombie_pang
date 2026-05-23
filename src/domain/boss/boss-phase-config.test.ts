import type { ChapterNumber } from "@shared/types/branded";
import { asChapterNumber } from "@shared/types/branded";
import { describe, expect, it } from "vitest";
import { PHASE_CONFIGS, getPhaseConfig } from "./boss-phase-config";

describe("boss-phase-config", () => {
  // [Happy] 5개 챕터 모두 정확값
  it.each([
    [1, 80, 0.5],
    [2, 100, 0.7],
    [3, 120, 1.0],
    [4, 130, 1.3],
    [5, 150, 1.6],
  ] as const)("[Happy] Ch%i → R=%i, ω=%f", (ch, R, omega) => {
    const config = PHASE_CONFIGS[asChapterNumber(ch) as ChapterNumber];
    expect(config?.R).toBe(R);
    expect(config?.omega).toBe(omega);
  });

  // [Boundary] Ch1, Ch5 양 끝
  it("[Boundary] Ch1 = 최소 R/ω", () => {
    expect(PHASE_CONFIGS[asChapterNumber(1)]).toEqual({ R: 80, omega: 0.5 });
  });
  it("[Boundary] Ch5 = 최대 R/ω", () => {
    expect(PHASE_CONFIGS[asChapterNumber(5)]).toEqual({ R: 150, omega: 1.6 });
  });

  // [Error] getPhaseConfig: invalid chapter → throw RangeError
  it("[Error] getPhaseConfig: invalid chapter → throw RangeError", () => {
    expect(() => getPhaseConfig(0 as unknown as ChapterNumber)).toThrow(RangeError);
    expect(() => getPhaseConfig(6 as unknown as ChapterNumber)).toThrow(RangeError);
  });
});
