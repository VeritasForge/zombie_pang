// Zombie 4종 (Bible §2): 신입 / 과장 / 팀장 / CEO.
// MVP에서는 lifespan(처치 시간) 명세를 따른다.

export const ZOMBIE_TYPE = {
  INTERN: "intern",
  MIDDLE: "middle",
  LEAD: "lead",
  CEO: "ceo",
} as const;

export type ZombieType = (typeof ZOMBIE_TYPE)[keyof typeof ZOMBIE_TYPE];

export type ZombieSpec = {
  readonly type: ZombieType;
  readonly hp: number;
  /** 처치까지 권장 시간 (ms) */
  readonly lifespanMs: number;
  /** 처치 시 기본 점수 reward (combo/crit 미적용) */
  readonly reward: number;
};

const SPECS: Record<ZombieType, ZombieSpec> = {
  [ZOMBIE_TYPE.INTERN]: { type: ZOMBIE_TYPE.INTERN, hp: 1, lifespanMs: 800, reward: 10 },
  [ZOMBIE_TYPE.MIDDLE]: { type: ZOMBIE_TYPE.MIDDLE, hp: 2, lifespanMs: 1500, reward: 25 },
  [ZOMBIE_TYPE.LEAD]: { type: ZOMBIE_TYPE.LEAD, hp: 3, lifespanMs: 2500, reward: 50 },
  // CEO HP는 챕터별로 다르므로 base spec은 chapter 1 기준.
  [ZOMBIE_TYPE.CEO]: { type: ZOMBIE_TYPE.CEO, hp: 10, lifespanMs: 5000, reward: 200 },
};

export function specOf(type: ZombieType): ZombieSpec {
  const spec = SPECS[type];
  if (!spec) {
    throw new RangeError(`Unknown ZombieType: ${String(type)}`);
  }
  return spec;
}

export function isZombieType(value: unknown): value is ZombieType {
  return (
    value === ZOMBIE_TYPE.INTERN ||
    value === ZOMBIE_TYPE.MIDDLE ||
    value === ZOMBIE_TYPE.LEAD ||
    value === ZOMBIE_TYPE.CEO
  );
}
