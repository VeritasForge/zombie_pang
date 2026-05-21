import { describe, expect, it } from "vitest";
import {
  ALL_POWERUP_TYPES,
  POWERUP_TYPE,
  type PowerUpType,
  isPowerUpType,
  specOfPowerUp,
} from "./powerup";

describe("PowerUp.specOfPowerUp", () => {
  it("[Happy] bomb: duration 0, effect clear_all (즉발)", () => {
    expect(specOfPowerUp(POWERUP_TYPE.BOMB)).toEqual({
      type: "bomb",
      durationMs: 0,
      effect: "clear_all",
    });
  });

  it("[Happy] freeze: duration 3000ms, effect stop_spawning", () => {
    expect(specOfPowerUp(POWERUP_TYPE.FREEZE)).toEqual({
      type: "freeze",
      durationMs: 3000,
      effect: "stop_spawning",
    });
  });

  it("[Happy] magnet: duration 3000ms, effect auto_kill_nearest", () => {
    expect(specOfPowerUp(POWERUP_TYPE.MAGNET)).toEqual({
      type: "magnet",
      durationMs: 3000,
      effect: "auto_kill_nearest",
    });
  });

  it("[Boundary] ALL_POWERUP_TYPES는 정확히 3종", () => {
    expect(ALL_POWERUP_TYPES).toHaveLength(3);
    expect(ALL_POWERUP_TYPES).toContain("bomb");
    expect(ALL_POWERUP_TYPES).toContain("freeze");
    expect(ALL_POWERUP_TYPES).toContain("magnet");
  });

  it("[Boundary] bomb의 duration은 정확히 0 (즉발 경계)", () => {
    expect(specOfPowerUp("bomb").durationMs).toBe(0);
  });

  it("[Error] 잘못된 PowerUpType은 RangeError", () => {
    expect(() => specOfPowerUp("nuke" as PowerUpType)).toThrow(RangeError);
  });
});

describe("isPowerUpType", () => {
  it("[Happy] 3종 모두 true", () => {
    expect(isPowerUpType("bomb")).toBe(true);
    expect(isPowerUpType("freeze")).toBe(true);
    expect(isPowerUpType("magnet")).toBe(true);
  });

  it("[Boundary] 빈 문자열 false", () => {
    expect(isPowerUpType("")).toBe(false);
  });

  it("[Error] 잘못된 값 false", () => {
    expect(isPowerUpType("nuke")).toBe(false);
    expect(isPowerUpType(null)).toBe(false);
    expect(isPowerUpType(undefined)).toBe(false);
    expect(isPowerUpType(42)).toBe(false);
  });
});
