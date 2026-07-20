import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import { BASE_DROP_RATE } from "@domain/powerup/drop-policy";
import { POWERUP_TYPE } from "@domain/powerup/powerup";
import { Combo } from "@domain/score/combo";
import { Score } from "@domain/score/score";
import { ZOMBIE_TYPE, specOf } from "@domain/wave/zombie-type";
import { describe, expect, it, vi } from "vitest";
import { killZombie } from "./kill-zombie";

const clock: IClock = { now: () => 0, monotonic: () => 0 };

function makeRandom(values: readonly number[], pickIndex = 0): IRandom {
  let cursor = 0;
  return {
    next: vi.fn(() => {
      const v = values[cursor];
      cursor = Math.min(cursor + 1, values.length - 1);
      return v ?? 1;
    }),
    nextInt: vi.fn(() => 0),
    pick: <T>(items: readonly T[]): T => items[pickIndex] as T,
  };
}

describe("killZombie", () => {
  it("[Happy] intern 처치 → score += 10 × 1.0 × 1, combo 1, drop 없음", () => {
    const random = makeRandom([0.99]); // 0.99 >= BASE_DROP_RATE(0.05) → drop 없음
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        killedAtMs: 1000,
        lastHitAtMs: 1000,
      },
    );

    expect(out.newScore.value()).toBe(10);
    expect(out.newCombo.count()).toBe(1);
    expect(out.powerUpDropped).toBeNull();
  });

  it("[Happy] critical hit + combo ×1.5 적용 (isCritical false 대비 2배)", () => {
    const random = makeRandom([0.99]);
    let combo = Combo.initial();
    for (let i = 0; i < 5; i += 1) combo = combo.hit();
    expect(combo.tier()).toBe("x1_5");

    const normal = killZombie(
      { random: makeRandom([0.99]), clock },
      {
        zombieType: ZOMBIE_TYPE.MIDDLE,
        isCritical: false,
        currentScore: Score.from(100),
        currentCombo: combo,
        killedAtMs: 1100,
        lastHitAtMs: 1000,
      },
    );
    const crit = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.MIDDLE,
        isCritical: true,
        currentScore: Score.from(100),
        currentCombo: combo,
        killedAtMs: 1100,
        lastHitAtMs: 1000,
      },
    );

    // 6 hit 누적 → 여전히 x1.5
    expect(crit.newCombo.count()).toBe(6);
    // reward 25 × 1.5 × 2 = 75 → score 100 + 75 = 175
    expect(crit.newScore.value()).toBe(175);
    // isCritical=false는 reward 25 × 1.5 × 1 = 37.5 → score 100 + 37.5 = 137.5
    expect(normal.newScore.value()).toBe(137.5);
    expect(crit.newScore.value()).toBeGreaterThan(normal.newScore.value());
  });

  it("[Happy] random.next < BASE_DROP_RATE → bomb drop", () => {
    const random = makeRandom([0.001], 0); // 0.001 < 0.05, pick 첫번째(bomb)
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    expect(out.powerUpDropped).toBe(POWERUP_TYPE.BOMB);
  });

  it("[Boundary] random.next === BASE_DROP_RATE 정확히 → drop 없음(>= 경계)", () => {
    const random = makeRandom([BASE_DROP_RATE], 0);
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    expect(out.powerUpDropped).toBeNull();
  });

  it("[Boundary] combo decay 직후 (elapsed > 1500ms) → count=1 reset", () => {
    const random = makeRandom([0.99]);
    let combo = Combo.initial();
    for (let i = 0; i < 4; i += 1) combo = combo.hit();
    expect(combo.count()).toBe(4);

    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: combo,
        killedAtMs: 3000,
        lastHitAtMs: 1000, // elapsed = 2000ms > 1500ms decay
      },
    );

    expect(out.newCombo.count()).toBe(1);
  });

  it("[Boundary] combo decay 정확히 경계 (elapsed = 1500ms) → 유지", () => {
    const random = makeRandom([0.99]);
    let combo = Combo.initial();
    for (let i = 0; i < 4; i += 1) combo = combo.hit();

    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: combo,
        killedAtMs: 2500,
        lastHitAtMs: 1000, // elapsed = 1500ms 정확히
      },
    );

    expect(out.newCombo.count()).toBe(5); // 유지 후 hit → 5
  });

  it("[Boundary] zero score + zero combo + intern → 결과는 모두 최소값", () => {
    const random = makeRandom([0.99]);
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    expect(out.newScore.value()).toBe(specOf(ZOMBIE_TYPE.INTERN).reward);
    expect(out.newCombo.count()).toBe(1);
  });

  it("[Boundary] killedAt === lastHitAt (elapsed=0) → decay 없음, hit만", () => {
    const random = makeRandom([0.99]);
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial().hit().hit(),
        killedAtMs: 500,
        lastHitAtMs: 500,
      },
    );
    expect(out.newCombo.count()).toBe(3);
  });

  it("[Boundary] CEO (탱커 좀비) reward 100 적용", () => {
    const random = makeRandom([0.99]);
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.CEO,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    expect(out.newScore.value()).toBe(100);
  });

  it("[Error] killedAtMs가 NaN이면 RangeError", () => {
    const random = makeRandom([0.99]);
    expect(() =>
      killZombie(
        { random, clock },
        {
          zombieType: ZOMBIE_TYPE.INTERN,
          isCritical: false,
          currentScore: Score.zero(),
          currentCombo: Combo.initial(),
          killedAtMs: Number.NaN,
          lastHitAtMs: 0,
        },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] lastHitAtMs가 Infinity이면 RangeError", () => {
    const random = makeRandom([0.99]);
    expect(() =>
      killZombie(
        { random, clock },
        {
          zombieType: ZOMBIE_TYPE.INTERN,
          isCritical: false,
          currentScore: Score.zero(),
          currentCombo: Combo.initial(),
          killedAtMs: 0,
          lastHitAtMs: Number.POSITIVE_INFINITY,
        },
      ),
    ).toThrow(RangeError);
  });

  it("[Error] killedAtMs < lastHitAtMs (시간 역행)이면 RangeError", () => {
    const random = makeRandom([0.99]);
    expect(() =>
      killZombie(
        { random, clock },
        {
          zombieType: ZOMBIE_TYPE.INTERN,
          isCritical: false,
          currentScore: Score.zero(),
          currentCombo: Combo.initial(),
          killedAtMs: 100,
          lastHitAtMs: 500,
        },
      ),
    ).toThrow(RangeError);
  });
});
