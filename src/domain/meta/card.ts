// Meta Card 15장 정의 (Bible §4).
// Base 12 = 4 카테고리 × 3 Tier + Special 3.

export const CARD_CATEGORY = {
  DAMAGE: "damage",
  CRIT: "crit",
  DURATION: "duration",
  COIN: "coin",
  SPECIAL: "special",
} as const;

export type CardCategory = (typeof CARD_CATEGORY)[keyof typeof CARD_CATEGORY];

export const CARD_TIER = {
  T1: "T1",
  T2: "T2",
  T3: "T3",
  SPECIAL: "SPECIAL",
} as const;

export type CardTier = (typeof CARD_TIER)[keyof typeof CARD_TIER];

export const CARD_ID = {
  DAMAGE_T1: "DAMAGE_T1",
  DAMAGE_T2: "DAMAGE_T2",
  DAMAGE_T3: "DAMAGE_T3",
  CRIT_T1: "CRIT_T1",
  CRIT_T2: "CRIT_T2",
  CRIT_T3: "CRIT_T3",
  DURATION_T1: "DURATION_T1",
  DURATION_T2: "DURATION_T2",
  DURATION_T3: "DURATION_T3",
  COIN_T1: "COIN_T1",
  COIN_T2: "COIN_T2",
  COIN_T3: "COIN_T3",
  SPECIAL_MAGNET: "SPECIAL_MAGNET",
  SPECIAL_DECAY: "SPECIAL_DECAY",
  SPECIAL_CRIT_MULTI: "SPECIAL_CRIT_MULTI",
} as const;

export type CardId = (typeof CARD_ID)[keyof typeof CARD_ID];

export type CardSpec = {
  readonly id: CardId;
  readonly category: CardCategory;
  readonly tier: CardTier;
  readonly value: number;
  readonly description: string;
};

export const CARD_SPECS: Readonly<Record<CardId, CardSpec>> = {
  DAMAGE_T1: {
    id: "DAMAGE_T1",
    category: CARD_CATEGORY.DAMAGE,
    tier: CARD_TIER.T1,
    value: 1,
    description: "+1 damage",
  },
  DAMAGE_T2: {
    id: "DAMAGE_T2",
    category: CARD_CATEGORY.DAMAGE,
    tier: CARD_TIER.T2,
    value: 2,
    description: "+2 damage",
  },
  DAMAGE_T3: {
    id: "DAMAGE_T3",
    category: CARD_CATEGORY.DAMAGE,
    tier: CARD_TIER.T3,
    value: 3,
    description: "+3 damage",
  },
  CRIT_T1: {
    id: "CRIT_T1",
    category: CARD_CATEGORY.CRIT,
    tier: CARD_TIER.T1,
    value: 0.05,
    description: "+5% crit",
  },
  CRIT_T2: {
    id: "CRIT_T2",
    category: CARD_CATEGORY.CRIT,
    tier: CARD_TIER.T2,
    value: 0.1,
    description: "+10% crit",
  },
  CRIT_T3: {
    id: "CRIT_T3",
    category: CARD_CATEGORY.CRIT,
    tier: CARD_TIER.T3,
    value: 0.15,
    description: "+15% crit",
  },
  DURATION_T1: {
    id: "DURATION_T1",
    category: CARD_CATEGORY.DURATION,
    tier: CARD_TIER.T1,
    value: 500,
    description: "+0.5s duration",
  },
  DURATION_T2: {
    id: "DURATION_T2",
    category: CARD_CATEGORY.DURATION,
    tier: CARD_TIER.T2,
    value: 1000,
    description: "+1s duration",
  },
  DURATION_T3: {
    id: "DURATION_T3",
    category: CARD_CATEGORY.DURATION,
    tier: CARD_TIER.T3,
    value: 1500,
    description: "+1.5s duration",
  },
  COIN_T1: {
    id: "COIN_T1",
    category: CARD_CATEGORY.COIN,
    tier: CARD_TIER.T1,
    value: 0.1,
    description: "+10% coin gain",
  },
  COIN_T2: {
    id: "COIN_T2",
    category: CARD_CATEGORY.COIN,
    tier: CARD_TIER.T2,
    value: 0.2,
    description: "+20% coin gain",
  },
  COIN_T3: {
    id: "COIN_T3",
    category: CARD_CATEGORY.COIN,
    tier: CARD_TIER.T3,
    value: 0.3,
    description: "+30% coin gain",
  },
  SPECIAL_MAGNET: {
    id: "SPECIAL_MAGNET",
    category: CARD_CATEGORY.SPECIAL,
    tier: CARD_TIER.SPECIAL,
    value: 20,
    description: "Magnet range +20px",
  },
  SPECIAL_DECAY: {
    id: "SPECIAL_DECAY",
    category: CARD_CATEGORY.SPECIAL,
    tier: CARD_TIER.SPECIAL,
    value: 500,
    description: "Combo decay +0.5s",
  },
  SPECIAL_CRIT_MULTI: {
    id: "SPECIAL_CRIT_MULTI",
    category: CARD_CATEGORY.SPECIAL,
    tier: CARD_TIER.SPECIAL,
    value: 2.5,
    description: "Critical multiplier ×2.5",
  },
};

export const ALL_CARD_IDS: readonly CardId[] = Object.keys(CARD_SPECS) as CardId[];

export function isCardId(value: unknown): value is CardId {
  return typeof value === "string" && value in CARD_SPECS;
}

export function specOfCard(id: CardId): CardSpec {
  const spec = CARD_SPECS[id];
  if (!spec) {
    /* c8 ignore next */
    throw new RangeError(`Unknown CardId: ${String(id)}`);
  }
  return spec;
}
