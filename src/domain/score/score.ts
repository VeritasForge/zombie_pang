// Score VO — 누적 점수.
// invariant: value ≥ 0. add(음수) throw.
// 표시 형식: 6자리 0-padding ("000123").

import { type ScoreValue, asScoreValue } from "@shared/types/branded";

export class Score {
  private constructor(private readonly _value: ScoreValue) {}

  static zero(): Score {
    return new Score(asScoreValue(0));
  }

  static from(n: number): Score {
    return new Score(asScoreValue(n));
  }

  add(amount: number): Score {
    if (!Number.isFinite(amount)) {
      throw new RangeError(`Score.add: amount must be finite, got ${amount}`);
    }
    if (amount < 0) {
      throw new RangeError(`Score.add: amount must be non-negative, got ${amount}`);
    }
    return new Score(asScoreValue(this._value + amount));
  }

  value(): ScoreValue {
    return this._value;
  }

  toString(): string {
    return Math.floor(this._value).toString().padStart(6, "0");
  }
}
