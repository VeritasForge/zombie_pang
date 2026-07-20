import { MetaProgression } from "@domain/meta/progression";
import type { IRandom } from "@domain/ports/random";
import type { ISaveStore } from "@domain/ports/save-store";
import { describe, expect, it, vi } from "vitest";
import { META_DECK_STORAGE_KEY, pickUpgrade } from "./pick-upgrade";

function makeSaveStore(): ISaveStore & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    get<T>(key: string): T | null {
      const v = store.get(key);
      return v === undefined ? null : (v as T);
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

/** nextInt 시퀀스를 정해진 순서대로 반환하는 deterministic random. */
function makeRandom(nextIntSeq: readonly number[]): IRandom {
  let i = 0;
  return {
    next: vi.fn(() => 0),
    nextInt: vi.fn((_: number) => {
      const v = nextIntSeq[i] ?? 0;
      i += 1;
      return v;
    }),
    pick: <T>(items: readonly T[]): T => items[0] as T,
  };
}

describe("pickUpgrade", () => {
  it("[Happy] chapter=1, totalCoin=0 → INITIAL_CARDS 풀에서 3장", () => {
    const saveStore = makeSaveStore();
    // INITIAL_CARDS = [DAMAGE_T1, CRIT_T1, DURATION_T1, COIN_T1]
    // pickThree는 splice 기반: idx 0 → DAMAGE_T1, 그 다음 remaining=[CRIT_T1, DURATION_T1, COIN_T1], idx 0 → CRIT_T1, idx 0 → DURATION_T1
    const random = makeRandom([0, 0, 0]);

    const out = pickUpgrade(
      { saveStore, random },
      {
        chapter: 1,
        totalCoin: 0,
        currentMeta: MetaProgression.empty(),
      },
    );

    expect(out.offered.map((c) => c.id)).toEqual(["DAMAGE_T1", "CRIT_T1", "DURATION_T1"]);
  });

  it("[Happy] applyChoice(0) → meta deck에 해당 카드 추가 + saveStore 저장", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);

    const out = pickUpgrade(
      { saveStore, random },
      {
        chapter: 1,
        totalCoin: 0,
        currentMeta: MetaProgression.empty(),
      },
    );

    const newMeta = out.applyChoice(0);
    expect(newMeta.deck()).toEqual(["DAMAGE_T1"]);
    expect(saveStore.get(META_DECK_STORAGE_KEY)).toEqual(["DAMAGE_T1"]);
  });

  it("[Happy] applyChoice는 currentMeta를 변경하지 않고 새 객체 반환 (불변)", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    const original = MetaProgression.fromDeck(["DAMAGE_T1"]);
    const out = pickUpgrade(
      { saveStore, random },
      { chapter: 1, totalCoin: 0, currentMeta: original },
    );

    const newMeta = out.applyChoice(1); // CRIT_T1
    expect(original.deck()).toEqual(["DAMAGE_T1"]); // 원본 불변
    expect(newMeta.deck()).toEqual(["DAMAGE_T1", "CRIT_T1"]);
  });

  it("[Boundary] chapter=2 클리어 → Tier 2 카드 unlock", () => {
    const saveStore = makeSaveStore();
    // pool 길이는 INITIAL(4) + TIER_2(4) = 8장. 모두 0 idx 추출 → 처음 3장.
    const random = makeRandom([0, 0, 0]);
    const out = pickUpgrade(
      { saveStore, random },
      {
        chapter: 2,
        totalCoin: 0,
        currentMeta: MetaProgression.empty(),
      },
    );
    // 풀이 [INITIAL..., TIER_2...]이므로 첫 3장은 INITIAL의 앞 3장 그대로.
    expect(out.offered.map((c) => c.id)).toEqual(["DAMAGE_T1", "CRIT_T1", "DURATION_T1"]);
  });

  it("[Boundary] totalCoin=1000 → SPECIAL_MAGNET 포함 풀", () => {
    const saveStore = makeSaveStore();
    // INITIAL(4) + SPECIAL_MAGNET(1) = 5장. idx 4를 뽑으면 SPECIAL_MAGNET
    // 시퀀스: idx 4 → SPECIAL_MAGNET (remaining=[INITIAL...4장]); idx 0; idx 0
    const random = makeRandom([4, 0, 0]);
    const out = pickUpgrade(
      { saveStore, random },
      { chapter: 1, totalCoin: 1000, currentMeta: MetaProgression.empty() },
    );
    expect(out.offered.map((c) => c.id)).toEqual(["SPECIAL_MAGNET", "DAMAGE_T1", "CRIT_T1"]);
  });

  it("[Boundary] applyChoice(2) — 마지막 인덱스 선택", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    const out = pickUpgrade(
      { saveStore, random },
      { chapter: 1, totalCoin: 0, currentMeta: MetaProgression.empty() },
    );
    const newMeta = out.applyChoice(2);
    expect(newMeta.deck()).toEqual(["DURATION_T1"]);
  });

  it("[Boundary] totalCoin=0이면 SPECIAL 카드 풀 미포함 (3장 unlock 풀 = INITIAL 4장만)", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    const out = pickUpgrade(
      { saveStore, random },
      { chapter: 1, totalCoin: 0, currentMeta: MetaProgression.empty() },
    );
    // SPECIAL_MAGNET 포함하지 않는지 검증
    const ids = out.offered.map((c) => c.id);
    expect(ids).not.toContain("SPECIAL_MAGNET");
  });

  it("[Error] chapter < 1 이면 RangeError", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    expect(() =>
      pickUpgrade(
        { saveStore, random },
        { chapter: 0, totalCoin: 0, currentMeta: MetaProgression.empty() },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] chapter가 정수가 아니면 RangeError", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    expect(() =>
      pickUpgrade(
        { saveStore, random },
        { chapter: 1.5, totalCoin: 0, currentMeta: MetaProgression.empty() },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] totalCoin이 음수면 RangeError", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    expect(() =>
      pickUpgrade(
        { saveStore, random },
        { chapter: 1, totalCoin: -1, currentMeta: MetaProgression.empty() },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] applyChoice에 잘못된 인덱스 전달 시 RangeError", () => {
    const saveStore = makeSaveStore();
    const random = makeRandom([0, 0, 0]);
    const out = pickUpgrade(
      { saveStore, random },
      { chapter: 1, totalCoin: 0, currentMeta: MetaProgression.empty() },
    );
    expect(() => out.applyChoice(5 as unknown as 0)).toThrow(RangeError);
  });
});
