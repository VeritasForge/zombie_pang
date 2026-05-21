import { describe, expect, it } from "vitest";
import type { CardId } from "./card";
import { MetaProgression } from "./progression";

describe("MetaProgression", () => {
  it("[Happy] empty deck은 모든 값 0", () => {
    const p = MetaProgression.empty();
    expect(p.deck()).toEqual([]);
    expect(p.damage()).toBe(0);
    expect(p.crit()).toBe(0);
    expect(p.duration()).toBe(0);
    expect(p.coinGain()).toBe(0);
  });

  it("[Happy] DAMAGE_T1 + DAMAGE_T2 deck → damage = 3", () => {
    const p = MetaProgression.empty().add("DAMAGE_T1").add("DAMAGE_T2");
    expect(p.damage()).toBe(3);
  });

  it("[Happy] CRIT_T1 + CRIT_T2 → crit = 0.15", () => {
    const p = MetaProgression.empty().add("CRIT_T1").add("CRIT_T2");
    expect(p.crit()).toBeCloseTo(0.15, 4);
  });

  it("[Happy] DURATION_T1 + DURATION_T3 → duration = 2000ms", () => {
    const p = MetaProgression.empty().add("DURATION_T1").add("DURATION_T3");
    expect(p.duration()).toBe(2000);
  });

  it("[Happy] COIN_T1 + COIN_T2 + COIN_T3 → 0.6", () => {
    const p = MetaProgression.empty().add("COIN_T1").add("COIN_T2").add("COIN_T3");
    expect(p.coinGain()).toBeCloseTo(0.6, 4);
  });

  it("[Happy] fromDeck으로 deck 복원, add는 새 instance 반환 (불변)", () => {
    const p0 = MetaProgression.fromDeck(["DAMAGE_T1"]);
    const p1 = p0.add("DAMAGE_T2");
    expect(p0.deck()).toEqual(["DAMAGE_T1"]);
    expect(p1.deck()).toEqual(["DAMAGE_T1", "DAMAGE_T2"]);
  });

  it("[Happy] hasSpecial 검사", () => {
    const p = MetaProgression.empty().add("SPECIAL_CRIT_MULTI");
    expect(p.hasSpecial("SPECIAL_CRIT_MULTI")).toBe(true);
    expect(p.hasSpecial("SPECIAL_MAGNET")).toBe(false);
  });

  it("[Boundary] 같은 카드 중복 추가 시 누적 합산", () => {
    const p = MetaProgression.empty().add("DAMAGE_T1").add("DAMAGE_T1");
    expect(p.damage()).toBe(2);
  });

  it("[Boundary] Special 카드는 damage/crit/duration/coin 합에 포함되지 않음", () => {
    const p = MetaProgression.empty()
      .add("SPECIAL_MAGNET")
      .add("SPECIAL_DECAY")
      .add("SPECIAL_CRIT_MULTI");
    expect(p.damage()).toBe(0);
    expect(p.crit()).toBe(0);
    expect(p.duration()).toBe(0);
    expect(p.coinGain()).toBe(0);
  });

  it("[Error] add 잘못된 CardId throw", () => {
    expect(() => MetaProgression.empty().add("INVALID" as CardId)).toThrow(RangeError);
  });

  it("[Error] fromDeck 잘못된 CardId 포함 시 throw", () => {
    expect(() => MetaProgression.fromDeck(["DAMAGE_T1", "INVALID" as CardId])).toThrow(RangeError);
  });
});
