// MetaProgression — 영구 카드 deck (선택한 카드 누적 합산).
// damage / crit / duration / coinGain — deck 내 모든 카드의 합.
// Bible: 카드 효과는 한 런 안에서 누적, 런 끝나면 starting deck로 리셋.
// 본 VO는 한 런 안 deck 상태를 표현한다.

import { type CardId, isCardId, specOfCard } from "./card";

export class MetaProgression {
  private constructor(private readonly _deck: readonly CardId[]) {}

  static empty(): MetaProgression {
    return new MetaProgression([]);
  }

  static fromDeck(deck: readonly CardId[]): MetaProgression {
    for (const id of deck) {
      if (!isCardId(id)) {
        throw new RangeError(`MetaProgression.fromDeck: invalid card id "${String(id)}"`);
      }
    }
    return new MetaProgression([...deck]);
  }

  deck(): readonly CardId[] {
    return this._deck;
  }

  add(id: CardId): MetaProgression {
    if (!isCardId(id)) {
      throw new RangeError(`MetaProgression.add: invalid card id "${String(id)}"`);
    }
    return new MetaProgression([...this._deck, id]);
  }

  private sumOf(category: "damage" | "crit" | "duration" | "coin"): number {
    let total = 0;
    for (const id of this._deck) {
      const spec = specOfCard(id);
      if (spec.category === category) {
        total += spec.value;
      }
    }
    return total;
  }

  damage(): number {
    return this.sumOf("damage");
  }

  crit(): number {
    return this.sumOf("crit");
  }

  duration(): number {
    return this.sumOf("duration");
  }

  coinGain(): number {
    return this.sumOf("coin");
  }

  hasSpecial(id: CardId): boolean {
    return this._deck.includes(id);
  }
}
