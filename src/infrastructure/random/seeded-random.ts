// SeededRandom — IRandom 구현체.
// mulberry32 알고리즘 기반 결정론 난수. seed가 주어지지 않으면 Date.now() 기반 fallback.
//
// docs/conventions/phaser.md §10: Phaser.Math.RND 비사용, IRandom Port 강제.

import type { IRandom } from "@domain/ports/random";

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRandom implements IRandom {
  private readonly _next: () => number;

  constructor(seed?: number) {
    const initial = typeof seed === "number" && Number.isFinite(seed) ? seed : Date.now();
    this._next = mulberry32(initial);
  }

  next(): number {
    return this._next();
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(
        `SeededRandom.nextInt: maxExclusive must be positive integer, got ${maxExclusive}`,
      );
    }
    return Math.floor(this._next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError("SeededRandom.pick: empty array");
    }
    const idx = this.nextInt(items.length);
    const item = items[idx];
    /* c8 ignore next 3 -- idx 범위 검증 통과 후 항상 존재 */
    if (item === undefined) {
      throw new RangeError(`SeededRandom.pick: undefined at index ${idx}`);
    }
    return item;
  }
}
