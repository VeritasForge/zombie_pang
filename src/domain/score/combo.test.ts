import { describe, expect, it } from "vitest";
import { COMBO_TIER, Combo, DEFAULT_DECAY_MS } from "./combo";

const hitN = (combo: Combo, n: number): Combo => {
  let c = combo;
  for (let i = 0; i < n; i += 1) {
    c = c.hit();
  }
  return c;
};

describe("Combo", () => {
  it("[Happy] initial 상태는 count=0, tier=x1, multiplier=1.0", () => {
    const c = Combo.initial();
    expect(c.count()).toBe(0);
    expect(c.tier()).toBe(COMBO_TIER.X1);
    expect(c.multiplier()).toBe(1.0);
  });

  it("[Happy] hit() 1회로 count+1, 새 인스턴스 반환 (불변)", () => {
    const c0 = Combo.initial();
    const c1 = c0.hit();
    expect(c0.count()).toBe(0);
    expect(c1.count()).toBe(1);
  });

  it("[Happy] 5kill 누적 시 tier=x1_5, multiplier=1.5", () => {
    const c = hitN(Combo.initial(), 5);
    expect(c.tier()).toBe(COMBO_TIER.X1_5);
    expect(c.multiplier()).toBe(1.5);
  });

  it("[Happy] 10kill 누적 시 tier=x2, multiplier=2.0", () => {
    const c = hitN(Combo.initial(), 10);
    expect(c.tier()).toBe(COMBO_TIER.X2);
    expect(c.multiplier()).toBe(2.0);
  });

  it("[Happy] 15kill 누적 시 tier=x3, multiplier=3.0", () => {
    const c = hitN(Combo.initial(), 15);
    expect(c.tier()).toBe(COMBO_TIER.X3);
    expect(c.multiplier()).toBe(3.0);
  });

  it("[Boundary] count 4는 x1, count 5는 x1_5 (정확히 경계)", () => {
    expect(hitN(Combo.initial(), 4).tier()).toBe(COMBO_TIER.X1);
    expect(hitN(Combo.initial(), 5).tier()).toBe(COMBO_TIER.X1_5);
  });

  it("[Boundary] count 9는 x1_5, 10은 x2", () => {
    expect(hitN(Combo.initial(), 9).tier()).toBe(COMBO_TIER.X1_5);
    expect(hitN(Combo.initial(), 10).tier()).toBe(COMBO_TIER.X2);
  });

  it("[Boundary] count 14는 x2, 15는 x3", () => {
    expect(hitN(Combo.initial(), 14).tier()).toBe(COMBO_TIER.X2);
    expect(hitN(Combo.initial(), 15).tier()).toBe(COMBO_TIER.X3);
  });

  it("[Boundary] decay decayMs 정확히 같은 값은 유지 (>만 reset)", () => {
    const c = hitN(Combo.initial(), 5);
    const decayed = c.decay(DEFAULT_DECAY_MS);
    expect(decayed.count()).toBe(5);
    expect(decayed.tier()).toBe(COMBO_TIER.X1_5);
  });

  it("[Boundary] decay decayMs+1ms는 reset (1501ms)", () => {
    const c = hitN(Combo.initial(), 5);
    const decayed = c.decay(1501);
    expect(decayed.count()).toBe(0);
    expect(decayed.tier()).toBe(COMBO_TIER.X1);
  });

  it("[Boundary] decay elapsed=0은 유지", () => {
    const c = hitN(Combo.initial(), 5);
    expect(c.decay(0).count()).toBe(5);
  });

  it("[Boundary] decayMs=2000 (늘어지는 회의 카드) 사용 시 1999ms 유지", () => {
    const c = hitN(Combo.initial(2000), 5);
    expect(c.decay(1999).tier()).toBe(COMBO_TIER.X1_5);
    expect(c.decay(2001).tier()).toBe(COMBO_TIER.X1);
  });

  it("[Boundary] decayMs=0 (즉시 decay) 경계 - 0초과 시 reset", () => {
    const c = hitN(Combo.initial(0), 5);
    expect(c.decay(0).count()).toBe(5);
    expect(c.decay(1).count()).toBe(0);
  });

  it("[Happy] miss()는 count를 0으로 reset, decayMs는 유지", () => {
    const c = hitN(Combo.initial(2000), 10);
    const missed = c.miss();
    expect(missed.count()).toBe(0);
    expect(missed.tier()).toBe(COMBO_TIER.X1);
    expect(missed.decayMs()).toBe(2000);
  });

  it("[Error] initial(음수 decayMs)는 RangeError", () => {
    expect(() => Combo.initial(-1)).toThrow(RangeError);
  });

  it("[Error] initial(NaN)은 RangeError", () => {
    expect(() => Combo.initial(Number.NaN)).toThrow(RangeError);
  });

  it("[Error] decay(음수)는 RangeError", () => {
    expect(() => Combo.initial().decay(-1)).toThrow(RangeError);
  });

  it("[Error] decay(NaN)은 RangeError", () => {
    expect(() => Combo.initial().decay(Number.NaN)).toThrow(RangeError);
  });
});
