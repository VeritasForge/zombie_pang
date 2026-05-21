// Branded types — 도메인 식별자/스칼라의 swap 실수 차단.
// 컨벤션: docs/conventions/typescript.md §5

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type ScoreValue = Brand<number, "ScoreValue">;
export type CoinAmount = Brand<number, "CoinAmount">;
export type FloorNumber = Brand<number, "FloorNumber">;
export type ChapterNumber = Brand<number, "ChapterNumber">;
export type WaveNumber = Brand<number, "WaveNumber">;
export type StreakDays = Brand<number, "StreakDays">;
export type ComboCount = Brand<number, "ComboCount">;

export const asScoreValue = (n: number): ScoreValue => {
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError(`Invalid ScoreValue: ${n}`);
  }
  return n as ScoreValue;
};

export const asCoinAmount = (n: number): CoinAmount => {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new RangeError(`Invalid CoinAmount: ${n}`);
  }
  return n as CoinAmount;
};

export const asChapterNumber = (n: number): ChapterNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new RangeError(`Invalid ChapterNumber: ${n}`);
  }
  return n as ChapterNumber;
};

export const asWaveNumber = (n: number): WaveNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    throw new RangeError(`Invalid WaveNumber: ${n}`);
  }
  return n as WaveNumber;
};

export const asStreakDays = (n: number): StreakDays => {
  if (!Number.isInteger(n) || n < 0 || n > 7) {
    throw new RangeError(`Invalid StreakDays: ${n}`);
  }
  return n as StreakDays;
};

export const asComboCount = (n: number): ComboCount => {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`Invalid ComboCount: ${n}`);
  }
  return n as ComboCount;
};

export const asFloorNumber = (n: number): FloorNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new RangeError(`Invalid FloorNumber: ${n}`);
  }
  return n as FloorNumber;
};
