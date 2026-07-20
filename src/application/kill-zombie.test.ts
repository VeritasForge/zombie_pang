import { MetaProgression } from "@domain/meta/progression";
import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import { POWERUP_TYPE } from "@domain/powerup/powerup";
import { Combo } from "@domain/score/combo";
import { Score } from "@domain/score/score";
import { ZOMBIE_TYPE, specOf } from "@domain/wave/zombie-type";
import { describe, expect, it, vi } from "vitest";
import { _coinTierOf, killZombie } from "./kill-zombie";

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
  it("[Happy] intern 처치 → score += 10 × 1.0 × 1, combo 1", () => {
    const random = makeRandom([0.99]); // drop 안 함
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        meta: MetaProgression.empty(),
        killedAtMs: 1000,
        lastHitAtMs: 1000,
      },
    );

    expect(out.newScore.value()).toBe(10);
    expect(out.newCombo.count()).toBe(1);
    expect(out.powerUpDropped).toBeNull();
    expect(out.earnedCoin).toBe(10); // baseReward × 1 (no coin gain)
  });

  it("[Happy] critical hit + combo ×1.5 적용", () => {
    const random = makeRandom([0.99]);
    // 5 hit 누적된 combo
    let combo = Combo.initial();
    for (let i = 0; i < 5; i += 1) combo = combo.hit();
    // count=5 → tier x1.5
    expect(combo.tier()).toBe("x1_5");

    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.MIDDLE,
        isCritical: true,
        currentScore: Score.from(100),
        currentCombo: combo,
        meta: MetaProgression.empty(),
        killedAtMs: 1100,
        lastHitAtMs: 1000,
      },
    );

    // 6 hit 누적 → 여전히 x1.5
    expect(out.newCombo.count()).toBe(6);
    // reward 25 × 1.5 × 2 = 75
    expect(out.newScore.value()).toBe(175);
  });

  it("[Happy] meta coinGain 30% 적용 → coin 13", () => {
    const random = makeRandom([0.99]);
    const meta = MetaProgression.fromDeck(["COIN_T3"]);
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        meta,
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    // 10 × 1.3 = 13
    expect(out.earnedCoin).toBe(13);
  });

  it("[Happy] random.next < dropRate → bomb drop", () => {
    const random = makeRandom([0.001], 0); // 0.001 < 0.05, pick 첫번째 (bomb)
    const out = killZombie(
      { random, clock },
      {
        zombieType: ZOMBIE_TYPE.INTERN,
        isCritical: false,
        currentScore: Score.zero(),
        currentCombo: Combo.initial(),
        meta: MetaProgression.empty(),
        killedAtMs: 0,
        lastHitAtMs: 0,
      },
    );
    expect(out.powerUpDropped).toBe(POWERUP_TYPE.BOMB);
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
        meta: MetaProgression.empty(),
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
        meta: MetaProgression.empty(),
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
        meta: MetaProgression.empty(),
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
        meta: MetaProgression.empty(),
        killedAtMs: 500,
        lastHitAtMs: 500,
      },
    );
    expect(out.newCombo.count()).toBe(3);
  });

  it("[Boundary] coin tier 카운트 최대 3까지 clamp", () => {
    const meta = MetaProgression.fromDeck(["COIN_T1", "COIN_T2", "COIN_T3"]);
    expect(_coinTierOf(meta)).toBe(3);
  });

  it("[Boundary] coin tier 0장이면 0", () => {
    expect(_coinTierOf(MetaProgression.empty())).toBe(0);
  });

  it("[Boundary] coin tier — non-coin 카드는 카운트 제외", () => {
    const meta = MetaProgression.fromDeck(["DAMAGE_T1", "CRIT_T1"]);
    expect(_coinTierOf(meta)).toBe(0);
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
        meta: MetaProgression.empty(),
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
          meta: MetaProgression.empty(),
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
          meta: MetaProgression.empty(),
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
          meta: MetaProgression.empty(),
          killedAtMs: 100,
          lastHitAtMs: 500,
        },
      ),
    ).toThrow(RangeError);
  });
});
