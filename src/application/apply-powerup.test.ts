import { MetaProgression } from "@domain/meta/progression";
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
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.BOMB,
      zombiesOnScreen: zombies,
      meta: MetaProgression.empty(),
    });
    expect(out.kind).toBe("bomb");
    if (out.kind === "bomb") {
      expect(out.killedZombieIds).toEqual(["z1", "z2", "z3"]);
    }
  });

  it("[Happy] freeze → 기본 3000ms duration", () => {
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.FREEZE,
      zombiesOnScreen: [],
      meta: MetaProgression.empty(),
    });
    expect(out.kind).toBe("freeze");
    if (out.kind === "freeze") {
      expect(out.durationMs).toBe(3000);
    }
  });

  it("[Happy] magnet → 기본 3000ms duration + 100px range", () => {
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.MAGNET,
      zombiesOnScreen: [],
      meta: MetaProgression.empty(),
    });
    expect(out.kind).toBe("magnet");
    if (out.kind === "magnet") {
      expect(out.durationMs).toBe(3000);
      expect(out.rangePx).toBe(MAGNET_BASE_RANGE_PX);
    }
  });

  it("[Happy] freeze + DURATION_T1(500ms) meta → 3500ms", () => {
    const meta = MetaProgression.fromDeck(["DURATION_T1"]);
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.FREEZE,
      zombiesOnScreen: [],
      meta,
    });
    if (out.kind === "freeze") {
      expect(out.durationMs).toBe(3500);
    }
  });

  it("[Happy] magnet + SPECIAL_MAGNET meta → range 120px", () => {
    const meta = MetaProgression.fromDeck(["SPECIAL_MAGNET"]);
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.MAGNET,
      zombiesOnScreen: [],
      meta,
    });
    if (out.kind === "magnet") {
      expect(out.rangePx).toBe(120);
    }
  });

  it("[Happy] magnet + DURATION_T3(1500) + SPECIAL_MAGNET 합산", () => {
    const meta = MetaProgression.fromDeck(["DURATION_T3", "SPECIAL_MAGNET"]);
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.MAGNET,
      zombiesOnScreen: [],
      meta,
    });
    if (out.kind === "magnet") {
      expect(out.durationMs).toBe(3000 + 1500);
      expect(out.rangePx).toBe(MAGNET_BASE_RANGE_PX + 20);
    }
  });

  it("[Boundary] bomb + 빈 화면 → 빈 리스트 반환", () => {
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.BOMB,
      zombiesOnScreen: [],
      meta: MetaProgression.empty(),
    });
    if (out.kind === "bomb") {
      expect(out.killedZombieIds).toEqual([]);
    }
  });

  it("[Boundary] bomb + 좀비 1마리", () => {
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.BOMB,
      zombiesOnScreen: [zombies[0]] as ZombieInstance[],
      meta: MetaProgression.empty(),
    });
    if (out.kind === "bomb") {
      expect(out.killedZombieIds).toEqual(["z1"]);
    }
  });

  it("[Boundary] magnet + DURATION 카드 없고 SPECIAL_MAGNET만", () => {
    const meta = MetaProgression.fromDeck(["SPECIAL_MAGNET"]);
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.MAGNET,
      zombiesOnScreen: [],
      meta,
    });
    if (out.kind === "magnet") {
      expect(out.durationMs).toBe(3000);
      expect(out.rangePx).toBe(120);
    }
  });

  it("[Boundary] freeze + DURATION 누적 (T1+T2+T3 = 3000ms 추가)", () => {
    const meta = MetaProgression.fromDeck(["DURATION_T1", "DURATION_T2", "DURATION_T3"]);
    const out = applyPowerUp({
      powerUp: POWERUP_TYPE.FREEZE,
      zombiesOnScreen: [],
      meta,
    });
    if (out.kind === "freeze") {
      expect(out.durationMs).toBe(3000 + 500 + 1000 + 1500);
    }
  });

  it("[Error] 알 수 없는 power-up 타입 → RangeError", () => {
    expect(() =>
      applyPowerUp({
        powerUp: "invalid" as unknown as typeof POWERUP_TYPE.BOMB,
        zombiesOnScreen: [],
        meta: MetaProgression.empty(),
      }),
    ).toThrow(RangeError);
  });
});
