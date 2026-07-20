// PickUpgrade — 챕터 종료 시 3장 fan-out → 1장 선택 use case.
// Bible §4: unlockedFor(chapter, totalCoin) 풀에서 pickThree → 사용자가 1장 선택.
//
// 반환값에는 사용자 선택을 적용하는 thunk(applyChoice)를 포함하여
// view layer가 동기/비동기 시점을 자유롭게 결정할 수 있게 한다.

import type { CardId, CardSpec } from "@domain/meta/card";
import { specOfCard } from "@domain/meta/card";
import { CardPool, unlockedCardIds } from "@domain/meta/card-pool";
import type { MetaProgression } from "@domain/meta/progression";
import type { IRandom } from "@domain/ports/random";
import type { ISaveStore } from "@domain/ports/save-store";

// NOTE: 이 use case 전체가 Task 6(보스/메타/서사 모듈 삭제)에서 물리적으로 삭제될 예정이라
// Task 5의 start-run.ts STORAGE_KEYS 단순화(META_DECK 제거) 영향을 받지 않도록 키를 로컬로 보관한다.
export const META_DECK_STORAGE_KEY = "zombie-pang:v1:meta-deck";

export type PickUpgradeDeps = {
  readonly saveStore: ISaveStore;
  readonly random: IRandom;
};

export type PickUpgradeInput = {
  readonly chapter: number;
  readonly totalCoin: number;
  readonly currentMeta: MetaProgression;
};

export type MetaCard = CardSpec;

export type PickUpgradeOutput = {
  readonly offered: readonly [MetaCard, MetaCard, MetaCard];
  readonly applyChoice: (chosenIndex: 0 | 1 | 2) => MetaProgression;
};

export function pickUpgrade(deps: PickUpgradeDeps, input: PickUpgradeInput): PickUpgradeOutput {
  if (!Number.isInteger(input.chapter) || input.chapter < 1) {
    throw new RangeError(`pickUpgrade: chapter must be integer >= 1, got ${input.chapter}`);
  }
  if (!Number.isInteger(input.totalCoin) || input.totalCoin < 0) {
    throw new RangeError(
      `pickUpgrade: totalCoin must be non-negative integer, got ${input.totalCoin}`,
    );
  }

  const pool = unlockedCardIds({
    // highestClearedChapter — `chapter` 인자는 "이번 챕터 종료 후"이므로
    // 다음 챕터 unlock 판정용 highestCleared 값으로 그대로 사용한다.
    highestClearedChapter: input.chapter,
    totalCoinsEarned: input.totalCoin,
  });

  const cardPool = new CardPool();
  const picked = cardPool.pickThree(deps.random, pool);
  const [a, b, c] = picked;
  if (a === undefined || b === undefined || c === undefined) {
    /* c8 ignore next 2 -- pickThree 계약상 3장 보장 (방어 코드) */
    throw new RangeError("pickUpgrade: pickThree did not return 3 cards");
  }
  const offered: readonly [MetaCard, MetaCard, MetaCard] = [
    specOfCard(a),
    specOfCard(b),
    specOfCard(c),
  ];

  const applyChoice = (chosenIndex: 0 | 1 | 2): MetaProgression => {
    if (chosenIndex !== 0 && chosenIndex !== 1 && chosenIndex !== 2) {
      throw new RangeError(`applyChoice: chosenIndex must be 0|1|2, got ${chosenIndex}`);
    }
    const chosenSpec = offered[chosenIndex];
    const newMeta = input.currentMeta.add(chosenSpec.id);
    const serializedDeck: readonly CardId[] = newMeta.deck();
    deps.saveStore.set(META_DECK_STORAGE_KEY, serializedDeck);
    return newMeta;
  };

  return { offered, applyChoice };
}
