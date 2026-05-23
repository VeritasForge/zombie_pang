import { ZOMBIE_TYPE } from "@domain/wave/zombie-type";
import { asChapterNumber } from "@shared/types/branded";
import { describe, expect, it } from "vitest";
import { composeMinions, totalMinions } from "./minion-composition";

describe("composeMinions", () => {
  // [Happy] Ch3 = 신입 3 + 과장 1
  it("[Happy] Ch3 → 신입×3 + 과장×1", () => {
    const result = composeMinions(asChapterNumber(3));
    expect(result).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 3 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
    ]);
  });
  it("[Happy] Ch5 → 신입×4 + 과장×3 + 팀장×1", () => {
    const result = composeMinions(asChapterNumber(5));
    expect(result).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 4 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 3 },
      { type: ZOMBIE_TYPE.LEAD, count: 1 },
    ]);
  });

  // [Boundary] Ch1 = 빈 배열 (P4 폐기 → 단위 테스트로 흡수)
  it("[Boundary] Ch1 → [] (미니언 없음)", () => {
    expect(composeMinions(asChapterNumber(1))).toEqual([]);
  });
  it("[Boundary] Ch2 → 신입만 2마리", () => {
    expect(composeMinions(asChapterNumber(2))).toEqual([{ type: ZOMBIE_TYPE.INTERN, count: 2 }]);
  });

  // [Error] 부재 사유: ChapterNumber branded type (asChapterNumber에서 1~5 검증)이
  //   호출자 측에서 잘못된 값을 차단하므로 정상 호출 경로에서는 default에 도달 불가.
  //   default throw는 안전망이며, asChapterNumber 우회 시도(타입 캐스팅)에서만 트리거된다.
});

describe("totalMinions", () => {
  it.each([
    [1, 0],
    [2, 2],
    [3, 4],
    [4, 6],
    [5, 8],
  ])("[Happy] Ch%i → 총 %i마리", (ch, expected) => {
    expect(totalMinions(asChapterNumber(ch))).toBe(expected);
  });
});
