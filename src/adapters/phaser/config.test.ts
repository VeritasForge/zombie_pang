import { describe, expect, it } from "vitest";
import { INTERIOR_PALETTES } from "./config";

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

  // [Boundary] 5개 motif id가 모두 다르다
  it("[Boundary] 5개 motif가 모두 distinct", () => {
    const motifs = [1, 2, 3, 4, 5].map((c) => INTERIOR_PALETTES[c]?.motif);
    expect(new Set(motifs).size).toBe(5);
  });

  // [Error] 범위 밖 챕터는 undefined (호출부 fallback 책임)
  it("[Error] 챕터 0/6은 undefined", () => {
    expect(INTERIOR_PALETTES[0]).toBeUndefined();
    expect(INTERIOR_PALETTES[6]).toBeUndefined();
  });
});
