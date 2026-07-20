import { describe, expect, it } from "vitest";
import { INTERIOR_PALETTES, MASK_COLORS, MASK_NEEDS_STROKE } from "./config";

describe("INTERIOR_PALETTES", () => {
  // [Happy] 챕터 1~5 모두 정의됨
  it.each([1, 2, 3, 4, 5])("[Happy] 챕터 %i 팔레트 정의", (ch) => {
    expect(INTERIOR_PALETTES[ch]).toBeDefined();
  });

  // [Boundary] 5개 배경색이 서로 다르다 (챕터 구분 보장)
  it("[Boundary] 5개 bg가 모두 distinct", () => {
    const bgs = [1, 2, 3, 4, 5].map((c) => INTERIOR_PALETTES[c]?.bg);
    expect(new Set(bgs).size).toBe(5);
  });

  // [Error] 범위 밖 챕터는 undefined (호출부 fallback 책임)
  it("[Error] 챕터 0/6은 undefined", () => {
    expect(INTERIOR_PALETTES[0]).toBeUndefined();
    expect(INTERIOR_PALETTES[6]).toBeUndefined();
  });
});

describe("MASK_COLORS", () => {
  // [Happy] 4종 마스크 색 distinct
  it("[Happy] 4종 마스크 색 distinct", () => {
    const vals = Object.values(MASK_COLORS);
    expect(new Set(vals).size).toBe(4);
  });

  // [Boundary] 진회/검정은 stroke 필요, 흰/회는 불필요
  it("[Boundary] 진회·검정만 stroke 대상", () => {
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.lead)).toBe(true);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.ceo)).toBe(true);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.intern)).toBe(false);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.middle)).toBe(false);
  });
});
