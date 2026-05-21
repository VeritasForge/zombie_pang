import { describe, expect, it } from "vitest";
import { ALL_CARD_IDS, CARD_CATEGORY, CARD_SPECS, type CardId, isCardId, specOfCard } from "./card";

describe("CardSpec", () => {
  it("[Happy] 15장 정확히 존재 (Base 12 + Special 3)", () => {
    expect(ALL_CARD_IDS).toHaveLength(15);
  });

  it("[Happy] Damage T1~T3 정확히 +1/+2/+3", () => {
    expect(CARD_SPECS.DAMAGE_T1.value).toBe(1);
    expect(CARD_SPECS.DAMAGE_T2.value).toBe(2);
    expect(CARD_SPECS.DAMAGE_T3.value).toBe(3);
  });

  it("[Happy] Crit T1~T3 정확히 +5%/+10%/+15%", () => {
    expect(CARD_SPECS.CRIT_T1.value).toBe(0.05);
    expect(CARD_SPECS.CRIT_T2.value).toBe(0.1);
    expect(CARD_SPECS.CRIT_T3.value).toBe(0.15);
  });

  it("[Happy] Duration T1~T3 정확히 +500/+1000/+1500ms", () => {
    expect(CARD_SPECS.DURATION_T1.value).toBe(500);
    expect(CARD_SPECS.DURATION_T2.value).toBe(1000);
    expect(CARD_SPECS.DURATION_T3.value).toBe(1500);
  });

  it("[Happy] Coin T1~T3 정확히 +10%/+20%/+30%", () => {
    expect(CARD_SPECS.COIN_T1.value).toBe(0.1);
    expect(CARD_SPECS.COIN_T2.value).toBe(0.2);
    expect(CARD_SPECS.COIN_T3.value).toBe(0.3);
  });

  it("[Happy] Special 3장 — Magnet, Decay, CritMulti", () => {
    expect(CARD_SPECS.SPECIAL_MAGNET.value).toBe(20);
    expect(CARD_SPECS.SPECIAL_DECAY.value).toBe(500);
    expect(CARD_SPECS.SPECIAL_CRIT_MULTI.value).toBe(2.5);
  });

  it("[Boundary] Damage 카드 3장은 모두 category=damage", () => {
    const damageCards = ALL_CARD_IDS.filter(
      (id) => CARD_SPECS[id].category === CARD_CATEGORY.DAMAGE,
    );
    expect(damageCards).toHaveLength(3);
  });

  it("[Boundary] Special 카드 3장은 모두 category=special, tier=SPECIAL", () => {
    const specialCards = ALL_CARD_IDS.filter(
      (id) => CARD_SPECS[id].category === CARD_CATEGORY.SPECIAL,
    );
    expect(specialCards).toHaveLength(3);
    for (const id of specialCards) {
      expect(CARD_SPECS[id].tier).toBe("SPECIAL");
    }
  });

  it("[Error] specOfCard 잘못된 ID throw", () => {
    expect(() => specOfCard("INVALID" as CardId)).toThrow(RangeError);
  });
});

describe("isCardId", () => {
  it("[Happy] 15장 모두 true", () => {
    for (const id of ALL_CARD_IDS) {
      expect(isCardId(id)).toBe(true);
    }
  });

  it("[Boundary] 빈 문자열 false", () => {
    expect(isCardId("")).toBe(false);
  });

  it("[Error] 잘못된 값 false", () => {
    expect(isCardId("DAMAGE_T9")).toBe(false);
    expect(isCardId(null)).toBe(false);
    expect(isCardId(undefined)).toBe(false);
    expect(isCardId(42)).toBe(false);
  });
});
