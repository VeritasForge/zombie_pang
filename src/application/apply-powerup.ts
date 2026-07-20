// ApplyPowerUp — 파워업 활성화 use case (메타 의존 없음).
//   - bomb: zombiesOnScreen 모두 처치(id 리스트 반환)
//   - freeze: 3000ms 스폰/노화 정지
//   - magnet: 3000ms, range 100px 자동 처치

import { POWERUP_TYPE, type PowerUpType, specOfPowerUp } from "@domain/powerup/powerup";
import type { ZombieInstance } from "./zombie-instance";

export const MAGNET_BASE_RANGE_PX = 100;

export type ApplyPowerUpInput = {
  readonly powerUp: PowerUpType;
  readonly zombiesOnScreen: readonly ZombieInstance[];
};

export type ApplyPowerUpOutput =
  | { readonly kind: "bomb"; readonly killedZombieIds: readonly string[] }
  | { readonly kind: "freeze"; readonly durationMs: number }
  | { readonly kind: "magnet"; readonly durationMs: number; readonly rangePx: number };

export function applyPowerUp(input: ApplyPowerUpInput): ApplyPowerUpOutput {
  if (input.powerUp === POWERUP_TYPE.BOMB) {
    return { kind: "bomb", killedZombieIds: input.zombiesOnScreen.map((z) => z.id) };
  }
  if (input.powerUp === POWERUP_TYPE.FREEZE) {
    return { kind: "freeze", durationMs: specOfPowerUp(POWERUP_TYPE.FREEZE).durationMs };
  }
  if (input.powerUp === POWERUP_TYPE.MAGNET) {
    return {
      kind: "magnet",
      durationMs: specOfPowerUp(POWERUP_TYPE.MAGNET).durationMs,
      rangePx: MAGNET_BASE_RANGE_PX,
    };
  }
  /* c8 ignore next 2 -- PowerUpType union exhaustion; unreachable via valid input */
  throw new RangeError(`applyPowerUp: unknown power-up type "${String(input.powerUp)}"`);
}
