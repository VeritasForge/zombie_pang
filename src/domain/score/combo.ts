// Combo VO — 연속 처치 카운트 + tier 계산 + decay.
// Bible §3 / §8 — combo decay 1500ms, tier ×1 → ×1.5 (5k) → ×2 (10k) → ×3 (15k).

export const COMBO_TIER = {
  X1: "x1",
  X1_5: "x1_5",
  X2: "x2",
  X3: "x3",
} as const;

export type ComboTier = (typeof COMBO_TIER)[keyof typeof COMBO_TIER];

export const DEFAULT_DECAY_MS = 1500;

const TIER_MULTIPLIER: Record<ComboTier, number> = {
  [COMBO_TIER.X1]: 1.0,
  [COMBO_TIER.X1_5]: 1.5,
  [COMBO_TIER.X2]: 2.0,
  [COMBO_TIER.X3]: 3.0,
};

export class Combo {
  private constructor(
    private readonly _count: number,
    private readonly _decayMs: number,
  ) {}

  static initial(decayMs: number = DEFAULT_DECAY_MS): Combo {
    if (!Number.isFinite(decayMs) || decayMs < 0) {
      throw new RangeError(`Combo.initial: decayMs must be non-negative finite, got ${decayMs}`);
    }
    return new Combo(0, decayMs);
  }

  count(): number {
    return this._count;
  }

  decayMs(): number {
    return this._decayMs;
  }

  hit(): Combo {
    return new Combo(this._count + 1, this._decayMs);
  }

  miss(): Combo {
    return new Combo(0, this._decayMs);
  }

  decay(elapsedMs: number): Combo {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new RangeError(`Combo.decay: elapsedMs must be non-negative finite, got ${elapsedMs}`);
    }
    if (elapsedMs > this._decayMs) {
      return new Combo(0, this._decayMs);
    }
    return this;
  }

  tier(): ComboTier {
    if (this._count >= 15) return COMBO_TIER.X3;
    if (this._count >= 10) return COMBO_TIER.X2;
    if (this._count >= 5) return COMBO_TIER.X1_5;
    return COMBO_TIER.X1;
  }

  multiplier(): number {
    return TIER_MULTIPLIER[this.tier()];
  }
}
