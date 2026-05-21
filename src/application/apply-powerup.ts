// ApplyPowerUp — Power-up 활성화 use case.
// Bible §3, §4: bomb 즉발 / freeze 3s / magnet 3s.
//
// 동작:
//   - bomb: zombiesOnScreen 모두 처치 (id 리스트 반환)
//   - freeze: durationMs = base 3000 + meta.duration() (DURATION_T1/T2/T3 합산)
//   - magnet: durationMs = base 3000 + meta.duration()
//            rangePx = base 100 + (SPECIAL_MAGNET 보유 시 spec.value 가산)

import { specOfCard } from "@domain/meta/card";
import type { MetaProgression } from "@domain/meta/progression";
import { POWERUP_TYPE, type PowerUpType, specOfPowerUp } from "@domain/powerup/powerup";
import type { ZombieInstance } from "./zombie-instance";

export const MAGNET_BASE_RANGE_PX = 100;

export type ApplyPowerUpInput = {
  readonly powerUp: PowerUpType;
  readonly zombiesOnScreen: readonly ZombieInstance[];
  readonly meta: MetaProgression;
};

export type ApplyPowerUpOutput =
  | { readonly kind: "bomb"; readonly killedZombieIds: readonly string[] }
  | { readonly kind: "freeze"; readonly durationMs: number }
  | { readonly kind: "magnet"; readonly durationMs: number; readonly rangePx: number };

function magnetRangeBonus(meta: MetaProgression): number {
  if (!meta.hasSpecial("SPECIAL_MAGNET")) return 0;
  return specOfCard("SPECIAL_MAGNET").value;
}

export function applyPowerUp(input: ApplyPowerUpInput): ApplyPowerUpOutput {
  if (input.powerUp === POWERUP_TYPE.BOMB) {
    const killedZombieIds = input.zombiesOnScreen.map((z) => z.id);
    return { kind: "bomb", killedZombieIds };
  }
  if (input.powerUp === POWERUP_TYPE.FREEZE) {
    const baseDuration = specOfPowerUp(POWERUP_TYPE.FREEZE).durationMs;
    const durationMs = baseDuration + input.meta.duration();
    return { kind: "freeze", durationMs };
  }
  if (input.powerUp === POWERUP_TYPE.MAGNET) {
    const baseDuration = specOfPowerUp(POWERUP_TYPE.MAGNET).durationMs;
    const durationMs = baseDuration + input.meta.duration();
    const rangePx = MAGNET_BASE_RANGE_PX + magnetRangeBonus(input.meta);
    return { kind: "magnet", durationMs, rangePx };
  }
  /* c8 ignore next 2 -- PowerUpType union exhaustion; unreachable */
  throw new RangeError(`applyPowerUp: unknown power-up type "${String(input.powerUp)}"`);
}
