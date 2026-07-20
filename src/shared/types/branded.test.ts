import { describe, expect, it } from "vitest";
import {
  asChapterNumber,
  asComboCount,
  asFloorNumber,
  asScoreValue,
  asWaveNumber,
} from "./branded";

describe("asScoreValue", () => {
  it("[Happy] 0 이상 유한수는 ScoreValue로 캐스팅된다", () => {
    expect(asScoreValue(0)).toBe(0);
    expect(asScoreValue(123.5)).toBe(123.5);
  });

  it("[Boundary] 0 (하한) 허용", () => {
    expect(asScoreValue(0)).toBe(0);
  });

  it("[Error] 음수는 throw", () => {
    expect(() => asScoreValue(-1)).toThrow(RangeError);
  });

  it("[Error] NaN/Infinity는 throw", () => {
    expect(() => asScoreValue(Number.NaN)).toThrow(RangeError);
    expect(() => asScoreValue(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("asChapterNumber", () => {
  it("[Happy] 1~5 허용", () => {
    expect(asChapterNumber(1)).toBe(1);
    expect(asChapterNumber(5)).toBe(5);
  });

  it("[Boundary] 1, 5 경계", () => {
    expect(asChapterNumber(1)).toBe(1);
    expect(asChapterNumber(5)).toBe(5);
  });

  it("[Error] 0/6/소수 throw", () => {
    expect(() => asChapterNumber(0)).toThrow(RangeError);
    expect(() => asChapterNumber(6)).toThrow(RangeError);
    expect(() => asChapterNumber(2.5)).toThrow(RangeError);
  });
});

describe("asWaveNumber", () => {
  it("[Happy] 1~10 허용", () => {
    expect(asWaveNumber(1)).toBe(1);
    expect(asWaveNumber(10)).toBe(10);
  });

  it("[Boundary] 1, 10 경계", () => {
    expect(asWaveNumber(1)).toBe(1);
    expect(asWaveNumber(10)).toBe(10);
  });

  it("[Error] 0/11/소수 throw", () => {
    expect(() => asWaveNumber(0)).toThrow(RangeError);
    expect(() => asWaveNumber(11)).toThrow(RangeError);
    expect(() => asWaveNumber(1.5)).toThrow(RangeError);
  });
});

describe("asComboCount", () => {
  it("[Happy] 0 이상 정수 허용", () => {
    expect(asComboCount(0)).toBe(0);
    expect(asComboCount(15)).toBe(15);
  });

  it("[Boundary] 0 허용", () => {
    expect(asComboCount(0)).toBe(0);
  });

  it("[Error] 음수/소수 throw", () => {
    expect(() => asComboCount(-1)).toThrow(RangeError);
    expect(() => asComboCount(1.5)).toThrow(RangeError);
  });
});

describe("asFloorNumber", () => {
  it("[Happy] 1~50 허용", () => {
    expect(asFloorNumber(1)).toBe(1);
    expect(asFloorNumber(50)).toBe(50);
  });

  it("[Boundary] 1, 50 경계", () => {
    expect(asFloorNumber(1)).toBe(1);
    expect(asFloorNumber(50)).toBe(50);
  });

  it("[Error] 0/51/소수 throw", () => {
    expect(() => asFloorNumber(0)).toThrow(RangeError);
    expect(() => asFloorNumber(51)).toThrow(RangeError);
    expect(() => asFloorNumber(25.5)).toThrow(RangeError);
  });
});
