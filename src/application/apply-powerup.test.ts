import { POWERUP_TYPE } from "@domain/powerup/powerup";
import { ZOMBIE_TYPE } from "@domain/wave/zombie-type";
import { describe, expect, it } from "vitest";
import { MAGNET_BASE_RANGE_PX, applyPowerUp } from "./apply-powerup";
import type { ZombieInstance } from "./zombie-instance";

const zombies: readonly ZombieInstance[] = [
  { id: "z1", type: ZOMBIE_TYPE.INTERN, hp: 1 },
  { id: "z2", type: ZOMBIE_TYPE.MIDDLE, hp: 2 },
  { id: "z3", type: ZOMBIE_TYPE.LEAD, hp: 3 },
];

describe("applyPowerUp", () => {
  it("[Happy] bomb → 화면 좀비 모두 처치, id 리스트 반환", () => {
    const out = applyPowerUp({ powerUp: POWERUP_TYPE.BOMB, zombiesOnScreen: zombies });
    expect(out).toEqual({ kind: "bomb", killedZombieIds: ["z1", "z2", "z3"] });
  });

  it("[Happy] freeze → 3000ms 고정 duration", () => {
    const out = applyPowerUp({ powerUp: POWERUP_TYPE.FREEZE, zombiesOnScreen: [] });
    expect(out).toEqual({ kind: "freeze", durationMs: 3000 });
  });

  it("[Happy] magnet → 3000ms duration + 기본 range 100px", () => {
    const out = applyPowerUp({ powerUp: POWERUP_TYPE.MAGNET, zombiesOnScreen: [] });
    expect(out).toEqual({ kind: "magnet", durationMs: 3000, rangePx: MAGNET_BASE_RANGE_PX });
  });

  it("[Boundary] bomb + 빈 화면 → 빈 리스트 반환", () => {
    const out = applyPowerUp({ powerUp: POWERUP_TYPE.BOMB, zombiesOnScreen: [] });
    expect(out).toEqual({ kind: "bomb", killedZombieIds: [] });
  });

  it("[Boundary] bomb + 좀비 1마리", () => {
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.BOMB,
      zombiesOnScreen: [zombies[0]] as ZombieInstance[],
    });
    expect(out).toEqual({ kind: "bomb", killedZombieIds: ["z1"] });
  });

  it("[Error] 알 수 없는 power-up 타입 → RangeError", () => {
    expect(() =>
      applyPowerUp({
        // @ts-expect-error 잘못된 입력
        powerUp: "nuke",
        zombiesOnScreen: [],
      }),
    ).toThrow(RangeError);
  });
});
