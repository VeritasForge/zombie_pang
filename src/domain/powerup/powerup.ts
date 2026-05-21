// Power-up 3종 (Bible §3, §4):
//   - bomb: 즉발 (duration 0), 화면 전체 좀비 즉시 처치
//   - freeze: 3000ms, 좀비 스폰 정지
//   - magnet: 3000ms, 가장 가까운 좀비 자동 처치

export const POWERUP_TYPE = {
  BOMB: "bomb",
  FREEZE: "freeze",
  MAGNET: "magnet",
} as const;

export type PowerUpType = (typeof POWERUP_TYPE)[keyof typeof POWERUP_TYPE];

export type PowerUpEffect = "clear_all" | "stop_spawning" | "auto_kill_nearest";

export type PowerUpSpec = {
  readonly type: PowerUpType;
  readonly durationMs: number;
  readonly effect: PowerUpEffect;
};

const SPECS: Record<PowerUpType, PowerUpSpec> = {
  [POWERUP_TYPE.BOMB]: {
    type: POWERUP_TYPE.BOMB,
    durationMs: 0,
    effect: "clear_all",
  },
  [POWERUP_TYPE.FREEZE]: {
    type: POWERUP_TYPE.FREEZE,
    durationMs: 3000,
    effect: "stop_spawning",
  },
  [POWERUP_TYPE.MAGNET]: {
    type: POWERUP_TYPE.MAGNET,
    durationMs: 3000,
    effect: "auto_kill_nearest",
  },
};

export const ALL_POWERUP_TYPES: readonly PowerUpType[] = [
  POWERUP_TYPE.BOMB,
  POWERUP_TYPE.FREEZE,
  POWERUP_TYPE.MAGNET,
];

export function specOfPowerUp(type: PowerUpType): PowerUpSpec {
  const spec = SPECS[type];
  if (!spec) {
    throw new RangeError(`Unknown PowerUpType: ${String(type)}`);
  }
  return spec;
}

export function isPowerUpType(value: unknown): value is PowerUpType {
  return (
    value === POWERUP_TYPE.BOMB || value === POWERUP_TYPE.FREEZE || value === POWERUP_TYPE.MAGNET
  );
}
