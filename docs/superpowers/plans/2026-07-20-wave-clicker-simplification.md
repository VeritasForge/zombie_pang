# Wave 클리커 단순화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 좀비팡을 "탭해서 처치 + 층이 오를수록 물량 증가"의 단순 웨이브 클리커로 되돌린다 — 보스전·메타 카드·서사 연출을 제거하고, 처치 목표(quota) 클리어 + 도주 한도 실패 모델로 50층을 오른다.

**Architecture:** Hexagonal 4계층 유지. 신규 `domain/run/floor-plan.ts`가 층별 난이도 커브의 SSOT. `GameScene`은 한 run 동안 유지되며 floor를 내부에서 증가시킨다(scene 재시작 없음). 트림 & 리튠 — 기존 검증 코드 최대 재사용.

**Tech Stack:** Phaser 3.80 + TypeScript 5.6(strict + noUncheckedIndexedAccess) + Vite 5 + Vitest 2(+ fast-check, vitest-canvas-mock) + Stryker 8 + Biome + Playwright.

**Spec:** `docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md`
**Branch:** `redesign/wave-clicker-simplification` (이미 생성됨)

## Global Constraints

- 파일명 kebab-case, named export 강제(default export 금지), barrel file 금지.
- `enum` 금지 → `as const` + union. `any` 금지 → `unknown`. `interface`는 Port에만.
- Domain 레이어: Phaser/DOM/`Date.now()`/`Math.random()`/`setTimeout` 직접 사용 금지 → Port 주입.
- 외부 이미지/사운드 자산 다운로드 금지 → Phaser Graphics + Web Audio 합성음.
- `Notification.requestPermission` 절대 호출 금지 (CI grep 차단).
- 카운트다운 압박 텍스트("남은 N초!") 금지.
- Debug/test hook은 `import.meta.env.DEV || VITE_ZP_E2E === "1"` env flag로 가드 (`.claude/rules/debug-hook-safety.md`).
- TDD 3 카테고리 강제: 모든 신규/변경 로직의 RED phase에 `[Happy]`/`[Boundary]`/`[Error]` 각 ≥1개.
- 커버리지 게이트: `src/domain/**` 100% (line/branch/function/statement), `src/application/**` ≥95%(branch 90%), `src/shared/**` 100%. Phaser adapter는 coverage 제외(vitest.config.ts:29).
- Task 완료 전 `pnpm typecheck && pnpm lint && pnpm test` exit 0. (Task마다 green 유지되도록 순서 설계됨.)
- `git push` 금지 — 로컬 커밋만.

---

## 파일 구조 맵

**신규**
- `src/domain/run/floor-plan.ts` — 층 1~50 → `{quota, cap, spawnRateMs, escapeLimit, band}` 순수 함수. 난이도 커브 SSOT.
- `src/domain/run/floor-plan.test.ts`, `src/domain/run/floor-plan.prop.test.ts`
- `docs/adr/0015-wave-clicker-simplification.md`

**수정(리튠)**
- `src/domain/wave/zombie-type.ts` — CEO를 탱커(hp 5)로, 직급별 hp 재조정. (+test)
- `src/domain/wave/spawner.ts` — `spawnForBand`/`delayForRate` 추가(Task 3), 구 메서드 제거(Task 6). (+test, prop.test)
- `src/adapters/phaser/scenes/game-scene.ts` — floor-plan 기반 루프로 전면 재작성.
- `src/adapters/phaser/scenes/hud-scene.ts` — coin 제거, quota 표시 추가.
- `src/adapters/phaser/scenes/game-over-scene.ts` — run-end 전용(카드/빌딩/부서명/streak/coin 제거).
- `src/application/start-run.ts` — meta/streak/random 제거. (+test)
- `src/application/kill-zombie.ts` — meta/coin 제거, 평평한 drop rate. (+test)
- `src/application/end-run.ts` — `chaptersCleared`→`floorsReached`, coin 제거. (+test)
- `src/infrastructure/container.ts` — `pickUpgrade` 제거.
- `src/adapters/phaser/managers/juice-manager.ts` — boss climax/approaching 제거.
- `tests/e2e/game-flow.spec.ts`, `tests/e2e/smoke.spec.ts` — 새 state 반영.
- `docs/game-design/bible.md`, `CLAUDE.md` — 방향 전환 반영.

**삭제(Task 6)**
- `src/domain/boss/*` (전체), `src/domain/meta/*` (전체), `src/domain/powerup/boss.ts`(+test)
- `src/domain/run/building-progress.ts`(+test), `src/domain/wave/wave.ts`(+test, prop.test)
- `src/application/spawn-boss-wave.ts`(+test), `src/application/tick-boss-position.ts`(+test), `src/application/pick-upgrade.ts`(+test)
- `src/adapters/phaser/objects/boss-hud.ts`, `src/adapters/phaser/objects/upgrade-card.ts`
- `tests/e2e/boss-wave.spec.ts`

**유지(변경 없음)**: `domain/score/*`, `domain/powerup/powerup.ts`+`drop-policy.ts`, `application/apply-powerup.ts`, `domain/wave/spawn-position.ts`, `adapters/phaser/objects/{zombie,particle}.ts`, PWA/audio/haptic/random/clock 인프라.

> **파워업 관련 발견사항(handoff에서 사용자에게 보고):** 현재 파워업은 도메인/use-case만 존재하고 화면 pickup UI가 없어 실제로 발동되지 않는다(`killZombie`의 `powerUpDropped`를 scene이 무시). 본 플랜은 "단순화"이므로 파워업을 **도메인 코드로 유지(삭제 안 함)**하되 신규 pickup UI는 추가하지 않는다(YAGNI). 실제 발동을 원하면 별도 플랜으로 분리.

---

## Task 1: 층별 난이도 커브 `floor-plan.ts` (신규 도메인)

**Files:**
- Create: `src/domain/run/floor-plan.ts`
- Test: `src/domain/run/floor-plan.test.ts`, `src/domain/run/floor-plan.prop.test.ts`

**Interfaces:**
- Consumes: `FloorNumber` 브랜드 타입은 참조만(입력은 raw `number`, 내부 검증).
- Produces:
  - `export const FLOOR_MIN = 1; FLOOR_MAX = 50; CAP_MAX = 12; SPAWN_RATE_MAX_MS = 1000; SPAWN_RATE_MIN_MS = 300;`
  - `export type FloorPlan = { readonly floor: number; readonly quota: number; readonly cap: number; readonly spawnRateMs: number; readonly escapeLimit: number; readonly band: number; }`
  - `export function bandOf(floor: number): number` (1~5)
  - `export function floorPlan(floor: number): FloorPlan`

- [ ] **Step 1: 실패 테스트 작성** — `src/domain/run/floor-plan.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { CAP_MAX, FLOOR_MAX, bandOf, floorPlan } from "./floor-plan";

describe("floorPlan", () => {
  // [Happy] 정상 흐름
  it("[Happy] floor 1은 quota 8, cap 3, spawnRate 1000, escapeLimit 5", () => {
    const p = floorPlan(1);
    expect(p.quota).toBe(8);
    expect(p.cap).toBe(3);
    expect(p.spawnRateMs).toBe(1000);
    expect(p.escapeLimit).toBe(5);
    expect(p.band).toBe(1);
  });

  it("[Happy] floor 50은 quota 상한, cap 12, spawnRate 300, escapeLimit 3", () => {
    const p = floorPlan(50);
    expect(p.quota).toBe(82); // round(8 + 49*1.5) = round(81.5) = 82
    expect(p.cap).toBe(CAP_MAX);
    expect(p.spawnRateMs).toBe(300);
    expect(p.escapeLimit).toBe(3);
    expect(p.band).toBe(5);
  });

  it("[Happy] quota는 층에 따라 단조 증가", () => {
    for (let f = 2; f <= FLOOR_MAX; f += 1) {
      expect(floorPlan(f).quota).toBeGreaterThanOrEqual(floorPlan(f - 1).quota);
    }
  });

  // [Boundary] 경계값
  it("[Boundary] band 경계: 10→band1, 11→band2, 20→band2, 21→band3, 50→band5", () => {
    expect(bandOf(10)).toBe(1);
    expect(bandOf(11)).toBe(2);
    expect(bandOf(20)).toBe(2);
    expect(bandOf(21)).toBe(3);
    expect(bandOf(50)).toBe(5);
  });

  it("[Boundary] escapeLimit: band1~2=5, band3~4=4, band5=3", () => {
    expect(floorPlan(10).escapeLimit).toBe(5); // band1
    expect(floorPlan(20).escapeLimit).toBe(5); // band2
    expect(floorPlan(21).escapeLimit).toBe(4); // band3
    expect(floorPlan(40).escapeLimit).toBe(4); // band4
    expect(floorPlan(41).escapeLimit).toBe(3); // band5
  });

  it("[Boundary] cap은 CAP_MAX를 넘지 않음", () => {
    for (let f = 1; f <= FLOOR_MAX; f += 1) {
      expect(floorPlan(f).cap).toBeLessThanOrEqual(CAP_MAX);
      expect(floorPlan(f).cap).toBeGreaterThanOrEqual(1);
    }
  });

  it("[Boundary] spawnRateMs는 [300,1000] 범위", () => {
    for (let f = 1; f <= FLOOR_MAX; f += 1) {
      const r = floorPlan(f).spawnRateMs;
      expect(r).toBeGreaterThanOrEqual(300);
      expect(r).toBeLessThanOrEqual(1000);
    }
  });

  // [Error] 예외
  it("[Error] floor < 1 은 RangeError", () => {
    expect(() => floorPlan(0)).toThrow(RangeError);
  });
  it("[Error] floor > 50 은 RangeError", () => {
    expect(() => floorPlan(51)).toThrow(RangeError);
  });
  it("[Error] 비정수 floor는 RangeError", () => {
    expect(() => floorPlan(1.5)).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인** — Run: `pnpm vitest run src/domain/run/floor-plan.test.ts` → FAIL(모듈 없음).

- [ ] **Step 3: 구현 작성** — `src/domain/run/floor-plan.ts`

```ts
// 층별 난이도 커브 SSOT. 층 1~50 → 처치 목표/동시 상한/스폰 간격/도주 한도/난이도 밴드.
// spec: docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md §4
// domain 순수성: 외부 의존성 0.

export const FLOOR_MIN = 1;
export const FLOOR_MAX = 50;
export const CAP_MAX = 12;
export const SPAWN_RATE_MAX_MS = 1000; // floor 1
export const SPAWN_RATE_MIN_MS = 300; // floor 50

export type FloorPlan = {
  readonly floor: number;
  readonly quota: number;
  readonly cap: number;
  readonly spawnRateMs: number;
  readonly escapeLimit: number;
  readonly band: number;
};

/** 층 1~10→1, 11~20→2, ..., 41~50→5. */
export function bandOf(floor: number): number {
  return Math.min(5, Math.floor((floor - 1) / 10) + 1);
}

function assertFloor(floor: number): void {
  if (!Number.isInteger(floor) || floor < FLOOR_MIN || floor > FLOOR_MAX) {
    throw new RangeError(`floorPlan: floor must be integer in [${FLOOR_MIN}, ${FLOOR_MAX}], got ${floor}`);
  }
}

export function floorPlan(floor: number): FloorPlan {
  assertFloor(floor);
  const band = bandOf(floor);
  const quota = Math.round(8 + (floor - 1) * 1.5);
  const cap = Math.min(CAP_MAX, Math.max(1, Math.round(3 + ((floor - 1) * 9) / 49)));
  const spawnRateMs = Math.round(
    SPAWN_RATE_MAX_MS + ((floor - 1) * (SPAWN_RATE_MIN_MS - SPAWN_RATE_MAX_MS)) / (FLOOR_MAX - FLOOR_MIN),
  );
  const escapeLimit = band <= 2 ? 5 : band <= 4 ? 4 : 3;
  return { floor, quota, cap, spawnRateMs, escapeLimit, band };
}
```

- [ ] **Step 4: 테스트 통과 확인** — Run: `pnpm vitest run src/domain/run/floor-plan.test.ts` → PASS.

- [ ] **Step 5: property invariant 작성** — `src/domain/run/floor-plan.prop.test.ts`

```ts
import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { CAP_MAX, FLOOR_MAX, FLOOR_MIN, floorPlan } from "./floor-plan";

const floorArb = fc.integer({ min: FLOOR_MIN, max: FLOOR_MAX });

test.prop([floorArb], { seed: 42, numRuns: 1000 })("quota 단조 증가", (f) => {
  if (f === FLOOR_MIN) return;
  expect(floorPlan(f).quota).toBeGreaterThanOrEqual(floorPlan(f - 1).quota);
});

test.prop([floorArb], { seed: 42, numRuns: 1000 })("spawnRateMs ∈ [300,1000]", (f) => {
  const r = floorPlan(f).spawnRateMs;
  expect(r).toBeGreaterThanOrEqual(300);
  expect(r).toBeLessThanOrEqual(1000);
});

test.prop([floorArb], { seed: 42, numRuns: 1000 })("cap ≤ CAP_MAX 그리고 ≥1", (f) => {
  const c = floorPlan(f).cap;
  expect(c).toBeLessThanOrEqual(CAP_MAX);
  expect(c).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 6: 전체 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add src/domain/run/floor-plan.ts src/domain/run/floor-plan.test.ts src/domain/run/floor-plan.prop.test.ts
git commit -m "feat(domain): 층별 난이도 커브 floor-plan — quota/cap/spawnRate/escapeLimit SSOT"
```

---

## Task 2: CEO 탱커화 — `zombie-type.ts` 리튠

**Files:**
- Modify: `src/domain/wave/zombie-type.ts:22-28` (SPECS)
- Test: `src/domain/wave/zombie-type.test.ts`

**Interfaces:** Produces — `specOf(type)`의 hp: intern 1, middle 1, lead 2, ceo 5 (Bible §7.1과 일치). reward: intern 10, middle 25, lead 50, ceo 100.

- [ ] **Step 1: 테스트 갱신(실패 유도)** — `src/domain/wave/zombie-type.test.ts`의 hp/reward 기대값을 아래로 수정. 없으면 추가:

```ts
import { describe, expect, it } from "vitest";
import { ZOMBIE_TYPE, isZombieType, specOf } from "./zombie-type";

describe("zombie-type specOf", () => {
  it("[Happy] intern은 hp1 reward10", () => {
    expect(specOf(ZOMBIE_TYPE.INTERN)).toMatchObject({ hp: 1, reward: 10 });
  });
  it("[Happy] CEO는 탱커 hp5 reward100 (보스 아님)", () => {
    expect(specOf(ZOMBIE_TYPE.CEO)).toMatchObject({ hp: 5, reward: 100 });
  });
  it("[Boundary] 직급 hp 계단: intern1 ≤ middle1 ≤ lead2 ≤ ceo5", () => {
    expect(specOf(ZOMBIE_TYPE.MIDDLE).hp).toBe(1);
    expect(specOf(ZOMBIE_TYPE.LEAD).hp).toBe(2);
    expect(specOf(ZOMBIE_TYPE.CEO).hp).toBe(5);
  });
  it("[Error] 알 수 없는 타입은 RangeError", () => {
    // @ts-expect-error 잘못된 입력
    expect(() => specOf("manager")).toThrow(RangeError);
  });
  it("[Boundary] isZombieType는 4종만 true", () => {
    expect(isZombieType("ceo")).toBe(true);
    expect(isZombieType("manager")).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm vitest run src/domain/wave/zombie-type.test.ts` → FAIL.

- [ ] **Step 3: SPECS 수정** — `src/domain/wave/zombie-type.ts` 의 `SPECS`를 아래로 교체:

```ts
const SPECS: Record<ZombieType, ZombieSpec> = {
  [ZOMBIE_TYPE.INTERN]: { type: ZOMBIE_TYPE.INTERN, hp: 1, lifespanMs: 2000, reward: 10 },
  [ZOMBIE_TYPE.MIDDLE]: { type: ZOMBIE_TYPE.MIDDLE, hp: 1, lifespanMs: 2000, reward: 25 },
  [ZOMBIE_TYPE.LEAD]: { type: ZOMBIE_TYPE.LEAD, hp: 2, lifespanMs: 2500, reward: 50 },
  // CEO는 보스가 아니라 HP 높은 희귀 탱커(field). hp 5 = 5회 탭.
  [ZOMBIE_TYPE.CEO]: { type: ZOMBIE_TYPE.CEO, hp: 5, lifespanMs: 3500, reward: 100 },
};
```

주석(`// CEO HP는 챕터별로...`)도 위 내용으로 갱신.

- [ ] **Step 4: 통과 확인** — Run: `pnpm vitest run src/domain/wave/zombie-type.test.ts` → PASS.

- [ ] **Step 5: 전체 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add src/domain/wave/zombie-type.ts src/domain/wave/zombie-type.test.ts
git commit -m "feat(domain): CEO를 탱커 좀비(hp5)로 리튠 — 보스 제거 대비, Bible §7.1 정렬"
```

> 참고: `spawn-boss-wave`/`minion-composition`이 아직 `specOf`를 참조하지만(삭제 전), hp 변화는 무해(구 게임은 field hp를 1로 강제). Task 6에서 함께 삭제.

---

## Task 3: `spawner.ts` band/rate API 추가 (additive)

**Files:**
- Modify: `src/domain/wave/spawner.ts`
- Test: `src/domain/wave/spawner.test.ts`, `src/domain/wave/spawner.prop.test.ts`

**Interfaces:** Produces (구 `spawn(wave)`/`nextSpawnDelayMs(wave)`는 Task 6까지 유지):
- `spawnForBand(band: number, random: IRandom): ZombieType` — band 1~5별 분포에서 추첨. band 클램프 [1,5].
- `delayForRate(spawnRateMs: number, random: IRandom): number` — base ± SPAWN_JITTER_MS, 최소 100ms.
- `export const BAND_CDF: ReadonlyArray<ReadonlyArray<{ threshold: number; type: ZombieType }>>` (index 0=band1).

- [ ] **Step 1: 실패 테스트 작성** — `src/domain/wave/spawner.test.ts`에 아래 describe 추가:

```ts
import { describe, expect, it } from "vitest";
import type { IRandom } from "@domain/ports/random";
import { Spawner } from "./spawner";
import { ZOMBIE_TYPE } from "./zombie-type";

function fixedRandom(value: number): IRandom {
  return { next: () => value, pick: (arr) => arr[0] as never };
}

describe("Spawner.spawnForBand", () => {
  it("[Happy] band1 낮은 난수는 intern", () => {
    expect(new Spawner().spawnForBand(1, fixedRandom(0.1))).toBe(ZOMBIE_TYPE.INTERN);
  });
  it("[Happy] band5 높은 난수는 CEO", () => {
    expect(new Spawner().spawnForBand(5, fixedRandom(0.99))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band1은 CEO가 나오지 않는다(난수 최댓값 근처도 lead 이하)", () => {
    expect(new Spawner().spawnForBand(1, fixedRandom(0.999))).not.toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Boundary] band<1 은 band1로, band>5 는 band5로 클램프", () => {
    expect(new Spawner().spawnForBand(0, fixedRandom(0.1))).toBe(ZOMBIE_TYPE.INTERN);
    expect(new Spawner().spawnForBand(9, fixedRandom(0.99))).toBe(ZOMBIE_TYPE.CEO);
  });
  it("[Error] 난수가 [0,1) 밖이면 RangeError", () => {
    expect(() => new Spawner().spawnForBand(1, fixedRandom(1))).toThrow(RangeError);
  });
});

describe("Spawner.delayForRate", () => {
  it("[Happy] 난수 0.5는 정확히 base(jitter 0)", () => {
    expect(new Spawner().delayForRate(500, fixedRandom(0.5))).toBe(500);
  });
  it("[Boundary] 난수 0은 base - 200", () => {
    expect(new Spawner().delayForRate(500, fixedRandom(0))).toBe(300);
  });
  it("[Boundary] 낮은 base에서도 최소 100ms 보장", () => {
    expect(new Spawner().delayForRate(120, fixedRandom(0))).toBeGreaterThanOrEqual(100);
  });
  it("[Error] base가 비유한/음수면 RangeError", () => {
    expect(() => new Spawner().delayForRate(-1, fixedRandom(0.5))).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm vitest run src/domain/wave/spawner.test.ts` → FAIL.

- [ ] **Step 3: 구현 추가** — `src/domain/wave/spawner.ts`에 아래를 추가(기존 `spawn`/`nextSpawnDelayMs`는 그대로 둔다):

```ts
// band 1~5별 좀비 분포(누적 CDF). 저층 신입 위주 → 고층 상급 비중 증가.
export const BAND_CDF: ReadonlyArray<ReadonlyArray<{ threshold: number; type: ZombieType }>> = [
  // band1
  [{ threshold: 0.85, type: ZOMBIE_TYPE.INTERN }, { threshold: 0.98, type: ZOMBIE_TYPE.MIDDLE }, { threshold: 1.0, type: ZOMBIE_TYPE.LEAD }],
  // band2
  [{ threshold: 0.70, type: ZOMBIE_TYPE.INTERN }, { threshold: 0.92, type: ZOMBIE_TYPE.MIDDLE }, { threshold: 0.99, type: ZOMBIE_TYPE.LEAD }, { threshold: 1.0, type: ZOMBIE_TYPE.CEO }],
  // band3
  [{ threshold: 0.55, type: ZOMBIE_TYPE.INTERN }, { threshold: 0.83, type: ZOMBIE_TYPE.MIDDLE }, { threshold: 0.96, type: ZOMBIE_TYPE.LEAD }, { threshold: 1.0, type: ZOMBIE_TYPE.CEO }],
  // band4
  [{ threshold: 0.45, type: ZOMBIE_TYPE.INTERN }, { threshold: 0.75, type: ZOMBIE_TYPE.MIDDLE }, { threshold: 0.93, type: ZOMBIE_TYPE.LEAD }, { threshold: 1.0, type: ZOMBIE_TYPE.CEO }],
  // band5
  [{ threshold: 0.38, type: ZOMBIE_TYPE.INTERN }, { threshold: 0.68, type: ZOMBIE_TYPE.MIDDLE }, { threshold: 0.90, type: ZOMBIE_TYPE.LEAD }, { threshold: 1.0, type: ZOMBIE_TYPE.CEO }],
];

const MIN_SPAWN_DELAY_MS = 100;
```

그리고 `Spawner` 클래스 안에 두 메서드 추가:

```ts
  spawnForBand(band: number, random: IRandom): ZombieType {
    const idx = Math.min(BAND_CDF.length - 1, Math.max(0, Math.floor(band) - 1));
    const cdf = BAND_CDF[idx];
    /* c8 ignore next 3 -- idx는 항상 유효 범위 */
    if (cdf === undefined) {
      throw new RangeError(`BAND_CDF[${idx}] undefined`);
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    const last = cdf.length - 1;
    for (let i = 0; i < last; i += 1) {
      const entry = cdf[i];
      /* c8 ignore next 3 -- last 범위 내 항상 존재 */
      if (entry === undefined) {
        throw new RangeError(`BAND_CDF[${idx}][${i}] undefined`);
      }
      if (r < entry.threshold) {
        return entry.type;
      }
    }
    const lastEntry = cdf[last];
    /* c8 ignore next 3 */
    if (lastEntry === undefined) {
      throw new RangeError(`BAND_CDF[${idx}] empty`);
    }
    return lastEntry.type;
  }

  delayForRate(spawnRateMs: number, random: IRandom): number {
    if (!Number.isFinite(spawnRateMs) || spawnRateMs <= 0) {
      throw new RangeError(`delayForRate: spawnRateMs must be positive finite, got ${spawnRateMs}`);
    }
    const r = random.next();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new RangeError(`IRandom.next must return [0, 1), got ${r}`);
    }
    const jitter = (r * 2 - 1) * SPAWN_JITTER_MS;
    return Math.max(MIN_SPAWN_DELAY_MS, spawnRateMs + jitter);
  }
```

- [ ] **Step 4: 통과 확인** — Run: `pnpm vitest run src/domain/wave/spawner.test.ts` → PASS.

- [ ] **Step 5: property 추가** — `src/domain/wave/spawner.prop.test.ts`에:

```ts
import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import type { IRandom } from "@domain/ports/random";
import { isZombieType } from "./zombie-type";
import { Spawner } from "./spawner";

test.prop([fc.integer({ min: 1, max: 5 }), fc.double({ min: 0, max: 0.9999, noNaN: true })], { seed: 42, numRuns: 1000 })(
  "spawnForBand는 항상 유효 ZombieType 반환",
  (band, r) => {
    const random: IRandom = { next: () => r, pick: (a) => a[0] as never };
    expect(isZombieType(new Spawner().spawnForBand(band, random))).toBe(true);
  },
);
```

- [ ] **Step 6: 전체 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add src/domain/wave/spawner.ts src/domain/wave/spawner.test.ts src/domain/wave/spawner.prop.test.ts
git commit -m "feat(domain): spawner band/rate API 추가 — band별 좀비 분포 + rate 기반 jitter (additive)"
```

---

## Task 4: `GameScene`/`HudScene`/`GameOverScene` 재작성 (현재 use-case API 대상)

> 이 Task는 scene 3개를 floor-plan 루프로 전면 교체하되, **아직 단순화되지 않은 현재 use-case 시그니처**에 맞춘다(`killZombie`에 `meta: MetaProgression.empty()` shim 전달, `endRun`에 `chaptersCleared` number 전달). 이렇게 하면 boss/meta 모듈이 아직 존재하는 상태에서도 typecheck가 green으로 유지된다. 실제 단순화는 Task 5.
> Phaser adapter는 coverage 제외이므로 canvas-mock smoke + `pnpm typecheck` green 확인이 검증 기준.

**Files:**
- Modify(전면 교체): `src/adapters/phaser/scenes/game-scene.ts`
- Modify(전면 교체): `src/adapters/phaser/scenes/hud-scene.ts`
- Modify(전면 교체): `src/adapters/phaser/scenes/game-over-scene.ts`

**Interfaces:**
- Consumes: `floorPlan`, `bandOf`, `FLOOR_MAX` (Task 1); `Spawner.spawnForBand`/`delayForRate` (Task 3); `specOf` (Task 2); 현재 `startRun`/`killZombie`/`endRun` (미변경).
- Produces(다음 Task/E2E가 의존): `window.__zp_state = { floor, quota, killed, score, fled, fledLimit, comboCount, isPaused, zombies[], sceneActive, activeScene }`; `window.__zp_test__ = { setFloor(n), forceZombieTimeout() }`; GameOver init data `{ score, floorsReached, reason, runId, runStartedAt }`.

- [ ] **Step 1: `game-scene.ts` 전면 교체** — 파일 전체를 아래로 교체:

```ts
// GameScene — 웨이브 클리커 메인 루프.
// 한 run 동안 유지되며 floor를 내부에서 증가. 도메인 직접 import 없이 floor-plan/spawner/use-case 사용.

import { MetaProgression } from "@domain/meta/progression"; // Task 5에서 제거되는 임시 shim
import { FLOOR_MAX, bandOf, floorPlan } from "@domain/run/floor-plan";
import { type Combo, Combo as ComboClass } from "@domain/score/combo";
import { Score } from "@domain/score/score";
import { findSpawnPoint } from "@domain/wave/spawn-position";
import { Spawner } from "@domain/wave/spawner";
import { ZOMBIE_TYPE, type ZombieType, specOf } from "@domain/wave/zombie-type";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLOR_HEX, INTERIOR_PALETTES, SCENE_KEYS, VIEWPORT, px } from "../config";
import { JuiceManager } from "../managers/juice-manager";
import { Zombie } from "../objects/zombie";

const SPAWN_AREA = {
  minX: px(60),
  maxX: VIEWPORT.width - px(60),
  minY: px(130),
  maxY: VIEWPORT.height - px(100),
};
const MIN_SPAWN_DISTANCE_PX = px(96);
const CRIT_DAMAGE = 2;

type ZpTestHooks = {
  readonly setFloor: (floor: number) => void;
  readonly forceZombieTimeout: () => void;
};

type ActiveZombie = {
  readonly id: string;
  readonly obj: Zombie;
  readonly type: ZombieType;
  readonly spawnedAt: number;
  readonly lifespanMs: number;
};

export type GameSceneInitData = {
  readonly floor?: number;
  readonly carryRunId?: string;
  readonly carryStartedAt?: number;
};

export class GameScene extends Phaser.Scene {
  private floor = 1;
  private score: Score = Score.zero();
  private combo: Combo = ComboClass.initial();
  private lastHitAtMs = 0;
  private fled = 0;
  private killedInFloor = 0;
  private zombies: ActiveZombie[] = [];
  private nextSpawnAtMs = 0;
  private nextZombieId = 0;
  private juice!: JuiceManager;
  private spawner = new Spawner();
  private runId = "";
  private runStartedAt = 0;
  private isPaused = false;

  constructor() {
    super({ key: SCENE_KEYS.game });
  }

  init(data: GameSceneInitData): void {
    this.floor = Math.max(1, Math.min(FLOOR_MAX, Math.floor(data.floor ?? 1)));
    this.score = Score.zero();
    this.combo = ComboClass.initial();
    this.lastHitAtMs = 0;
    this.fled = 0;
    this.killedInFloor = 0;
    this.zombies = [];
    this.nextZombieId = 0;
    this.isPaused = false;
    if (data.carryRunId !== undefined) this.runId = data.carryRunId;
    if (data.carryStartedAt !== undefined) this.runStartedAt = data.carryStartedAt;
  }

  create(): void {
    const container = getContainer(this);
    this.applyBackground();

    if (this.runId === "") {
      this.runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const result = container.useCases.startRun(
        {
          saveStore: container.ports.saveStore,
          clock: container.ports.clock,
          random: container.ports.random,
        },
        { runId: this.runId },
      );
      this.runStartedAt = result.startedAt;
    }

    this.juice = new JuiceManager(this, container.ports.audio, container.ports.haptic);
    if (!this.scene.isActive(SCENE_KEYS.hud)) {
      this.scene.launch(SCENE_KEYS.hud);
    }
    this.publishHud();
    this.scheduleNextSpawn();

    this.input.topOnly = true;
    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);

    this.publishE2eState();
    this.exposeTestHooks();
  }

  private applyBackground(): void {
    const palette = INTERIOR_PALETTES[bandOf(this.floor)] ?? INTERIOR_PALETTES[1];
    this.cameras.main.setBackgroundColor(palette ? palette.bg : COLOR_HEX.bgDark);
  }

  private plan() {
    return floorPlan(this.floor);
  }

  private needed(): number {
    return Math.max(0, this.plan().quota - this.killedInFloor);
  }

  private canSpawn(): boolean {
    const p = this.plan();
    return this.zombies.length < p.cap && this.zombies.length < this.needed();
  }

  private scheduleNextSpawn(): void {
    if (this.killedInFloor === 0 && this.zombies.length === 0) {
      this.nextSpawnAtMs = this.time.now; // 첫 좀비는 즉시
      return;
    }
    const container = getContainer(this);
    this.nextSpawnAtMs = this.time.now + this.spawner.delayForRate(this.plan().spawnRateMs, container.ports.random);
  }

  private spawnZombie(): void {
    if (!this.canSpawn()) return;
    const container = getContainer(this);
    const type = this.spawner.spawnForBand(bandOf(this.floor), container.ports.random);
    const spec = specOf(type);
    const existingPoints = this.zombies.map((z) => ({ x: z.obj.x, y: z.obj.y }));
    const point = findSpawnPoint(existingPoints, SPAWN_AREA, MIN_SPAWN_DISTANCE_PX, container.ports.random);
    const id = `z-${this.floor}-${this.nextZombieId++}`;
    const z = new Zombie(this, point.x, point.y, { id, type, hp: spec.hp, maxHp: spec.hp });
    this.zombies.push({ id, obj: z, type, spawnedAt: this.time.now, lifespanMs: spec.lifespanMs });
  }

  private onZombieDown(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject): void {
    if (this.isPaused) return;
    if (!(obj instanceof Zombie)) return;
    const container = getContainer(this);
    const localPoint = obj.getLocalPoint(pointer.x, pointer.y);
    const isCritical = obj.isHeadHit(localPoint.x, localPoint.y);
    const killed = obj.takeDamage(isCritical ? CRIT_DAMAGE : 1);

    if (!killed) {
      container.audioManager.play("hit");
      return;
    }

    const now = this.time.now;
    const result = container.useCases.killZombie(
      { random: container.ports.random, clock: container.ports.clock },
      {
        zombieType: obj.zombieType,
        isCritical,
        currentScore: this.score,
        currentCombo: this.combo,
        meta: MetaProgression.empty(), // Task 5에서 제거
        killedAtMs: now,
        lastHitAtMs: this.lastHitAtMs === 0 ? now : this.lastHitAtMs,
      },
    );
    this.score = result.newScore;
    this.combo = result.newCombo;
    this.lastHitAtMs = now;

    if (isCritical) {
      this.juice.applyKillJuice("crit", obj.x, obj.y, themeForZombie(obj.zombieType));
    } else {
      this.juice.applyKillJuice("normal", obj.x, obj.y, themeForZombie(obj.zombieType));
    }
    const c = this.combo.count();
    if (c === 5 || c === 10 || c === 15) {
      this.juice.applyKillJuice("combo_5+", obj.x, obj.y, themeForZombie(obj.zombieType));
    }

    this.removeZombie(obj.zombieId);
    this.killedInFloor += 1;
    this.publishHud();

    if (this.killedInFloor >= this.plan().quota) {
      this.onFloorCleared();
    }
  }

  private onFloorCleared(): void {
    if (this.floor >= FLOOR_MAX) {
      this.endRunWith("clear");
      return;
    }
    this.juice.applyKillJuice("wave_clear", VIEWPORT.width / 2, VIEWPORT.height / 2, "paper");
    this.floor += 1;
    this.killedInFloor = 0;
    this.applyBackground();
    this.scheduleNextSpawn();
    this.publishHud();
  }

  private removeZombie(id: string): void {
    const idx = this.zombies.findIndex((z) => z.id === id);
    if (idx >= 0) {
      const removed = this.zombies[idx];
      if (removed) removed.obj.destroy();
      this.zombies.splice(idx, 1);
    }
  }

  update(): void {
    if (this.isPaused) return;
    this.juice.tickFps();

    if (this.time.now >= this.nextSpawnAtMs && this.canSpawn()) {
      this.spawnZombie();
      this.scheduleNextSpawn();
    }

    const now = this.time.now;
    const toRemove: string[] = [];
    for (const z of this.zombies) {
      if (now - z.spawnedAt > z.lifespanMs) toRemove.push(z.id);
    }
    for (const id of toRemove) {
      this.fled += 1;
      this.combo = this.combo.miss();
      this.removeZombie(id);
    }
    if (toRemove.length > 0) {
      this.publishHud();
      if (this.fled >= this.plan().escapeLimit) {
        this.onFloorFail();
        return;
      }
      this.scheduleNextSpawn();
    }

    this.publishE2eState();
  }

  private onFloorFail(): void {
    this.endRunWith("fled_limit");
  }

  private endRunWith(reason: "clear" | "fled_limit"): void {
    this.isPaused = true;
    const delay = reason === "clear" ? 900 : 500;
    this.time.delayedCall(delay, () => {
      this.scene.stop(SCENE_KEYS.hud);
      this.scene.start(SCENE_KEYS.gameOver, {
        score: this.score,
        floorsReached: reason === "clear" ? FLOOR_MAX : Math.max(0, this.floor - 1),
        reason,
        runId: this.runId,
        runStartedAt: this.runStartedAt,
      });
      this.scene.stop();
    });
  }

  private publishHud(): void {
    const p = this.plan();
    this.registry.set("hud", {
      score: this.score.value(),
      comboCount: this.combo.count(),
      comboMultiplier: this.combo.multiplier(),
      floor: this.floor,
      killed: this.killedInFloor,
      quota: p.quota,
      fled: this.fled,
      fledLimit: p.escapeLimit,
    });
  }

  private publishE2eState(): void {
    if (typeof window === "undefined") return;
    const p = this.plan();
    const snapshot = {
      floor: this.floor,
      quota: p.quota,
      killed: this.killedInFloor,
      score: this.score.value(),
      fled: this.fled,
      fledLimit: p.escapeLimit,
      comboCount: this.combo.count(),
      isPaused: this.isPaused,
      zombies: this.zombies.map((z) => ({ id: z.id, type: z.type, x: z.obj.x, y: z.obj.y })),
      sceneActive: this.scene.isActive(),
      activeScene: SCENE_KEYS.game,
    };
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_state: unknown }).__zp_state = snapshot;
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.game;
  }

  private exposeTestHooks(): void {
    if (typeof window === "undefined") return;
    if (!import.meta.env.DEV && import.meta.env.VITE_ZP_E2E !== "1") return;
    // biome-ignore lint/style/useNamingConvention: e2e test hook 네임스페이스.
    (window as unknown as { __zp_test__: ZpTestHooks }).__zp_test__ = {
      setFloor: (floor: number): void => {
        this.floor = Math.max(1, Math.min(FLOOR_MAX, Math.floor(floor)));
        this.killedInFloor = 0;
        this.fled = 0;
        for (const z of [...this.zombies]) z.obj.destroy();
        this.zombies = [];
        this.applyBackground();
        this.scheduleNextSpawn();
        this.publishHud();
      },
      forceZombieTimeout: (): void => {
        const past = this.time.now - 1_000_000;
        for (const z of this.zombies) {
          (z as { spawnedAt: number }).spawnedAt = past;
        }
      },
    };
  }

  shutdown(): void {
    this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);
    if (this.juice) this.juice.destroy();
    for (const z of this.zombies) z.obj.destroy();
    this.zombies = [];
  }
}

function themeForZombie(type: ZombieType): "card" | "paper" | "coffee" | "usb" {
  switch (type) {
    case ZOMBIE_TYPE.INTERN:
      return "card";
    case ZOMBIE_TYPE.MIDDLE:
      return "paper";
    case ZOMBIE_TYPE.LEAD:
      return "coffee";
    case ZOMBIE_TYPE.CEO:
      return "usb";
    /* c8 ignore next 2 -- exhaustive */
    default:
      return "paper";
  }
}
```

- [ ] **Step 2: `hud-scene.ts` 전면 교체** — coin 제거, quota 표시, early_exit는 floorsReached 전달:

```ts
// HudScene — GameScene 위 overlay. Score/Combo/Floor/Quota/Fled + 정시 퇴근 버튼.

import Phaser from "phaser";
import { COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

type HudData = {
  readonly score: number;
  readonly comboCount: number;
  readonly comboMultiplier: number;
  readonly floor: number;
  readonly killed: number;
  readonly quota: number;
  readonly fled: number;
  readonly fledLimit: number;
};

const DEFAULT_HUD: HudData = {
  score: 0,
  comboCount: 0,
  comboMultiplier: 1,
  floor: 1,
  killed: 0,
  quota: 8,
  fled: 0,
  fledLimit: 5,
};

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private fledText!: Phaser.GameObjects.Text;
  private exitBtnZone!: Phaser.GameObjects.Zone;
  private hudListener: ((parent: unknown, value: HudData) => void) | undefined = undefined;

  constructor() {
    super({ key: SCENE_KEYS.hud });
  }

  create(): void {
    this.scoreText = this.add.text(px(16), px(12), "000000", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(22),
      color: COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    this.scoreText.setShadow(px(1), px(1), "#000000", px(2), true, true);

    this.comboText = this.add.text(VIEWPORT.width - px(16), px(12), "", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(18),
      color: COLOR_HEX.comboGold,
      fontStyle: "bold",
    });
    this.comboText.setOrigin(1, 0);

    this.floorText = this.add.text(VIEWPORT.width / 2, px(14), "1F  0/8", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    this.floorText.setOrigin(0.5, 0);

    this.fledText = this.add.text(px(16), VIEWPORT.height - px(30), "FLED 0/5", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });

    const exitText = this.add.text(VIEWPORT.width - px(16), px(44), "정시 퇴근", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(11),
      color: COLOR_HEX.neonPink,
    });
    exitText.setOrigin(1, 0);
    this.exitBtnZone = this.add.zone(VIEWPORT.width - px(40), px(50), px(80), px(24));
    this.exitBtnZone.setInteractive();
    if (this.exitBtnZone.input) this.exitBtnZone.input.cursor = "pointer";
    this.exitBtnZone.on("pointerdown", () => {
      const hud = (this.registry.get("hud") as HudData | undefined) ?? DEFAULT_HUD;
      this.scene.stop(SCENE_KEYS.hud);
      this.scene.stop(SCENE_KEYS.game);
      this.scene.start(SCENE_KEYS.gameOver, {
        score: hud.score,
        floorsReached: Math.max(0, hud.floor - 1),
        reason: "early_exit",
      });
    });

    this.refresh(DEFAULT_HUD);
    this.hudListener = (_parent: unknown, value: HudData) => this.refresh(value);
    this.registry.events.on(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
  }

  private refresh(data: HudData): void {
    if (!this.scoreText?.active) return;
    this.scoreText.setText(Math.floor(data.score).toString().padStart(6, "0"));
    const cm = data.comboMultiplier;
    this.comboText.setText(cm > 1 ? `×${cm.toFixed(1).replace(/\.0$/, "")} (${data.comboCount})` : "");
    this.floorText.setText(`${data.floor}F  ${data.killed}/${data.quota}`);
    this.fledText.setText(`FLED ${data.fled}/${data.fledLimit}`);
  }

  shutdown(): void {
    if (this.hudListener) {
      this.registry.events.off(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
      this.hudListener = undefined;
    }
  }
}
```

- [ ] **Step 3: `game-over-scene.ts` 전면 교체** — run-end 전용(카드/빌딩/부서명/streak/coin 제거). 아직 현재 `endRun`(chaptersCleared) 호출:

```ts
// GameOverScene — run 종료 결과. reason: clear / fled_limit / early_exit.

import { type LeaderboardEntry, STORAGE_KEYS_RUN } from "@application/end-run";
import { Score } from "@domain/score/score";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

type EndReason = "clear" | "early_exit" | "fled_limit";

export type GameOverInitData = {
  readonly score: Score | number;
  readonly floorsReached: number;
  readonly reason: EndReason;
  readonly runId?: string;
  readonly runStartedAt?: number;
};

function toScore(s: Score | number): Score {
  return typeof s === "number" ? Score.from(s) : s;
}

export class GameOverScene extends Phaser.Scene {
  private initData: GameOverInitData | null = null;

  constructor() {
    super({ key: SCENE_KEYS.gameOver });
  }

  init(data: GameOverInitData): void {
    this.initData = data;
  }

  create(): void {
    if (typeof window !== "undefined") {
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
      (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.gameOver;
    }
    const data = this.initData;
    if (!data) {
      this.scene.start(SCENE_KEYS.mainMenu);
      return;
    }
    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);
    this.renderRunEnd(data);
  }

  private renderRunEnd(data: GameOverInitData): void {
    const cx = VIEWPORT.width / 2;

    let title = "수고하셨습니다";
    let subtitle = "";
    if (data.reason === "clear") {
      title = "50층 완주";
      subtitle = "정시에 퇴근하셨습니다";
    } else if (data.reason === "fled_limit") {
      title = "오늘은 여기까지";
      subtitle = "해도 충분합니다";
    } else {
      title = "정시 퇴근";
      subtitle = "내일 또 만나요";
    }

    this.centerText(cx, px(100), title, 26, COLOR_HEX.neonPink, true);
    this.centerText(cx, px(140), subtitle, 14, COLOR_HEX.limeGreen, false);

    const result = this.callEndRun(data);

    this.centerText(cx, px(200), `SCORE: ${toScore(data.score).toString()}`, 18, COLOR_HEX.maskWhite, false);
    this.centerText(cx, px(230), `FLOORS: ${data.floorsReached} / 50`, 14, COLOR_HEX.maskWhite, false);
    if (result.highScoreUpdated) {
      this.centerText(cx, px(262), "NEW HIGH SCORE!", 14, COLOR_HEX.comboGold, true);
    }

    this.renderLeaderboard(cx, px(310));

    this.makeButton(cx, VIEWPORT.height - px(140), px(220), px(56), "다시 시작", COLORS.neonPink, () => {
      this.scene.start(SCENE_KEYS.game);
      this.scene.stop();
    });
    this.makeButton(cx, VIEWPORT.height - px(80), px(220), px(44), "메인 메뉴", COLORS.maskWhite, () => {
      this.scene.start(SCENE_KEYS.mainMenu);
      this.scene.stop();
    });
  }

  private callEndRun(data: GameOverInitData): { readonly highScoreUpdated: boolean } {
    const container = getContainer(this);
    const runId = data.runId ?? `run-${Date.now()}`;
    try {
      const result = container.useCases.endRun(
        { saveStore: container.ports.saveStore, clock: container.ports.clock },
        {
          runId,
          chaptersCleared: data.floorsReached, // Task 5에서 floorsReached로 rename
          finalScore: toScore(data.score),
          earnedCoin: 0, // Task 5에서 제거
          reason: data.reason,
        },
      );
      return { highScoreUpdated: result.highScoreUpdated };
    } catch {
      return { highScoreUpdated: false };
    }
  }

  private renderLeaderboard(cx: number, y: number): void {
    const container = getContainer(this);
    const raw = container.ports.saveStore.get<LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    const entries = Array.isArray(raw) ? raw.slice(0, 5) : [];
    this.centerText(cx, y, "TOP 5", 14, COLOR_HEX.limeGreen, false);
    if (entries.length === 0) {
      const t = this.add.text(cx, y + px(28), "(첫 기록을 만들어보세요)", {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0).setAlpha(0.6);
      return;
    }
    entries.forEach((entry, i) => {
      const floors = (entry as { floorsReached?: number; chaptersCleared?: number }).floorsReached
        ?? (entry as { chaptersCleared?: number }).chaptersCleared
        ?? 0;
      const text = `${i + 1}. ${Math.floor(entry.score).toString().padStart(6, "0")}  ${floors}F`;
      const t = this.add.text(cx, y + px(28) + i * px(22), text, {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0);
    });
  }

  private centerText(x: number, y: number, label: string, size: number, color: string, bold: boolean): void {
    const t = this.add.text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(size),
      color,
      ...(bold ? { fontStyle: "bold" } : {}),
    });
    t.setOrigin(0.5, 0.5);
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): void {
    const g = this.add.graphics();
    g.lineStyle(px(2), color, 1);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, px(10));
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(16),
      color: color === COLORS.neonPink ? COLOR_HEX.neonPink : COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 0.5);
    const zone = this.add.zone(x, y, w, h);
    zone.setInteractive();
    if (zone.input) zone.input.cursor = "pointer";
    zone.on("pointerdown", () => {
      getContainer(this).audioManager.play("menu_select");
      onClick();
    });
  }
}
```

- [ ] **Step 4: main-menu-scene의 GameScene start 인자 확인** — `src/adapters/phaser/scenes/main-menu-scene.ts`가 `this.scene.start(SCENE_KEYS.game, {chapter: ...})`를 호출하면 `{}` 또는 인자 없이 호출로 수정(floor 기본 1). Read 후 `chapter` 키 전달부만 제거.

- [ ] **Step 5: typecheck + smoke 확인**

Run: `pnpm typecheck` → 통과(boss/meta 모듈은 아직 존재, 새 scene은 미참조).
Run: `pnpm lint` → 통과.
Run: `pnpm test` → 통과(domain/application 테스트 불변, adapter는 coverage 제외).
Run: `pnpm dev` 후 수동으로 좀비 탭 → 층 상승/도주 동작 눈으로 확인(선택).

- [ ] **Step 6: 커밋**

```bash
git add src/adapters/phaser/scenes/game-scene.ts src/adapters/phaser/scenes/hud-scene.ts src/adapters/phaser/scenes/game-over-scene.ts src/adapters/phaser/scenes/main-menu-scene.ts
git commit -m "feat(adapters): GameScene/HUD/GameOver를 floor-plan 웨이브 클리커로 재작성 (보스·카드·서사 제거, meta shim 유지)"
```

---

## Task 5: 애플리케이션 use-case 단순화 + 호출부 정리

> 여기서 `startRun`/`killZombie`/`endRun`을 단순화하고, 그 호출부(새 scene 3개 + container)를 갱신한다. meta shim 제거. 이 Task 종료 시 프로덕션 코드에서 meta/coin/chapter 잔재가 use-case 레벨에서 사라진다.

**Files:**
- Modify: `src/application/start-run.ts` (+ `start-run.test.ts`)
- Modify: `src/application/kill-zombie.ts` (+ `kill-zombie.test.ts`)
- Modify: `src/application/end-run.ts` (+ `end-run.test.ts`)
- Modify: `src/adapters/phaser/scenes/game-scene.ts` (meta shim 제거), `game-over-scene.ts` (endRun 인자), `hud-scene.ts` (변경 없음 예상)

**Interfaces:**
- `startRun(deps: {saveStore, clock}, input: {runId}): {runId, startedAt, floor: 1}`
- `killZombie(deps: {random, clock}, input: {zombieType, isCritical, currentScore, currentCombo, killedAtMs, lastHitAtMs}): {newScore, newCombo, powerUpDropped}`
- `endRun(deps, input: {runId, floorsReached, finalScore, reason}): {durationMs, highScoreUpdated, leaderboardRank}` — `LeaderboardEntry.floorsReached`.

- [ ] **Step 1: `start-run` 테스트 갱신(실패)** — `start-run.test.ts`에서 meta/streak/random 관련 기대를 제거하고 아래 형태로:

```ts
it("[Happy] runId/startedAt/floor=1 반환, RUN_STARTED_AT 저장", () => {
  const saveStore = makeFakeSaveStore();
  const clock = { now: () => 1000 };
  const out = startRun({ saveStore, clock }, { runId: "run-1" });
  expect(out).toEqual({ runId: "run-1", startedAt: 1000, floor: 1 });
});
it("[Boundary] runId가 빈 문자열이면 RangeError", () => {
  expect(() => startRun({ saveStore: makeFakeSaveStore(), clock: { now: () => 0 } }, { runId: "" })).toThrow(RangeError);
});
it("[Error] clock.now가 비유한이면 RangeError", () => {
  expect(() => startRun({ saveStore: makeFakeSaveStore(), clock: { now: () => Number.NaN } }, { runId: "r" })).toThrow(RangeError);
});
```

- [ ] **Step 2: `start-run.ts` 단순화** — meta/streak 로드 제거, `STORAGE_KEYS`에서 META_DECK/STREAK 제거(RUN_STARTED_AT 유지), deps에서 random 제거:

```ts
import type { IClock } from "@domain/ports/clock";
import type { ISaveStore } from "@domain/ports/save-store";

export const STORAGE_KEYS = {
  RUN_STARTED_AT: "zombie-pang:v1:run-started-at",
} as const;

export type StartRunDeps = { readonly saveStore: ISaveStore; readonly clock: IClock };
export type StartRunInput = { readonly runId: string };
export type StartRunOutput = { readonly runId: string; readonly startedAt: number; readonly floor: 1 };

export function startRun(deps: StartRunDeps, input: StartRunInput): StartRunOutput {
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    throw new RangeError(`startRun: runId must be non-empty string, got "${String(input.runId)}"`);
  }
  const startedAt = deps.clock.now();
  if (!Number.isFinite(startedAt)) {
    throw new RangeError(`startRun: clock.now() returned non-finite value: ${startedAt}`);
  }
  deps.saveStore.set(STORAGE_KEYS.RUN_STARTED_AT, { runId: input.runId, startedAt });
  return { runId: input.runId, startedAt, floor: 1 };
}
```

`game-scene.ts` create()의 startRun 호출에서 `random` 인자 제거.

- [ ] **Step 3: `start-run` 통과 확인** — Run: `pnpm vitest run src/application/start-run.test.ts` → PASS.

- [ ] **Step 4: `kill-zombie` 테스트 갱신(실패)** — meta/coin 제거, drop은 flat rate:

```ts
it("[Happy] 처치 시 score/combo 누적, powerUpDropped 반환", () => {
  const out = killZombie(
    { random: { next: () => 0.99, pick: (a) => a[0] as never }, clock: { now: () => 0 } },
    { zombieType: ZOMBIE_TYPE.INTERN, isCritical: false, currentScore: Score.zero(), currentCombo: Combo.initial(), killedAtMs: 100, lastHitAtMs: 100 },
  );
  expect(out.newScore.value()).toBeGreaterThan(0);
  expect(out.powerUpDropped).toBeNull(); // 0.99 > BASE_DROP_RATE
});
it("[Happy] crit는 2배 점수", () => { /* isCritical true vs false 비교 */ });
it("[Boundary] 낮은 난수는 파워업 drop(BASE_DROP_RATE 미만)", () => {
  const out = killZombie(
    { random: { next: () => 0.0, pick: (a) => a[0] as never }, clock: { now: () => 0 } },
    { zombieType: ZOMBIE_TYPE.INTERN, isCritical: false, currentScore: Score.zero(), currentCombo: Combo.initial(), killedAtMs: 0, lastHitAtMs: 0 },
  );
  expect(out.powerUpDropped).not.toBeNull();
});
it("[Error] killedAtMs < lastHitAtMs 이면 RangeError", () => { /* ... */ });
```

- [ ] **Step 5: `kill-zombie.ts` 단순화** — `meta` 입력/`earnedCoin` 출력/`coinTierOf`/`MAX_COIN_TIER` 제거, drop은 `BASE_DROP_RATE`:

```ts
import type { IClock } from "@domain/ports/clock";
import type { IRandom } from "@domain/ports/random";
import { BASE_DROP_RATE, PowerUpDropPolicy } from "@domain/powerup/drop-policy";
import type { PowerUpType } from "@domain/powerup/powerup";
import type { Combo } from "@domain/score/combo";
import type { Score } from "@domain/score/score";
import type { ZombieType } from "@domain/wave/zombie-type";
import { specOf } from "@domain/wave/zombie-type";

export const CRITICAL_MULTIPLIER = 2;

export type KillZombieDeps = { readonly random: IRandom; readonly clock: IClock };
export type KillZombieInput = {
  readonly zombieType: ZombieType;
  readonly isCritical: boolean;
  readonly currentScore: Score;
  readonly currentCombo: Combo;
  readonly killedAtMs: number;
  readonly lastHitAtMs: number;
};
export type KillZombieOutput = {
  readonly newScore: Score;
  readonly newCombo: Combo;
  readonly powerUpDropped: PowerUpType | null;
};

export function killZombie(deps: KillZombieDeps, input: KillZombieInput): KillZombieOutput {
  if (!Number.isFinite(input.killedAtMs)) {
    throw new RangeError(`killZombie: killedAtMs must be finite, got ${input.killedAtMs}`);
  }
  if (!Number.isFinite(input.lastHitAtMs)) {
    throw new RangeError(`killZombie: lastHitAtMs must be finite, got ${input.lastHitAtMs}`);
  }
  if (input.killedAtMs < input.lastHitAtMs) {
    throw new RangeError(`killZombie: killedAtMs (${input.killedAtMs}) must be >= lastHitAtMs (${input.lastHitAtMs})`);
  }
  void deps.clock;

  const elapsed = input.killedAtMs - input.lastHitAtMs;
  const newCombo = input.currentCombo.decay(elapsed).hit();
  const spec = specOf(input.zombieType);
  const critMult = input.isCritical ? CRITICAL_MULTIPLIER : 1;
  const newScore = input.currentScore.add(spec.reward * newCombo.multiplier() * critMult);
  const powerUpDropped = new PowerUpDropPolicy().dropOnKill(deps.random, BASE_DROP_RATE);
  return { newScore, newCombo, powerUpDropped };
}
```

`game-scene.ts` onZombieDown의 killZombie 호출에서 `meta: MetaProgression.empty()` 줄과 `MetaProgression` import를 제거.

- [ ] **Step 6: `kill-zombie` 통과 확인** — Run: `pnpm vitest run src/application/kill-zombie.test.ts` → PASS.

- [ ] **Step 7: `end-run` 테스트 갱신(실패)** — `chaptersCleared`→`floorsReached`, coin 제거:

```ts
it("[Happy] floorsReached 기록 + high score 갱신 + leaderboard rank", () => {
  const out = endRun(deps, { runId: "r1", floorsReached: 12, finalScore: Score.from(500), reason: "fled_limit" });
  expect(out.highScoreUpdated).toBe(true);
  expect(out.leaderboardRank).toBe(1);
});
it("[Boundary] floorsReached 0 허용", () => { /* ... */ });
it("[Error] floorsReached 음수면 RangeError", () => {
  expect(() => endRun(deps, { runId: "r", floorsReached: -1, finalScore: Score.zero(), reason: "clear" })).toThrow(RangeError);
});
```

- [ ] **Step 8: `end-run.ts` 단순화** — `earnedCoin`/`totalCoin`/`TOTAL_COIN` 제거, `chaptersCleared`→`floorsReached`(입력·LeaderboardEntry·검증). 아래 diff 요지:
  - `STORAGE_KEYS_RUN`에서 `TOTAL_COIN` 제거.
  - `EndRunInput`: `chaptersCleared` 삭제 → `floorsReached: number`; `earnedCoin` 삭제.
  - `EndRunOutput`: `totalCoin` 삭제.
  - `LeaderboardEntry`: `chaptersCleared` → `floorsReached`.
  - 검증: `floorsReached` non-negative integer; earnedCoin 검증 블록 삭제; total coin 블록 삭제.
  - `newEntry`/`isLeaderboardEntry`의 필드명 반영.

`game-over-scene.ts` callEndRun을 `{ runId, floorsReached: data.floorsReached, finalScore, reason }`로 갱신(earnedCoin/chaptersCleared 제거). `renderLeaderboard`의 fallback을 `entry.floorsReached`로 단순화.

- [ ] **Step 9: 전체 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add src/application/start-run.ts src/application/start-run.test.ts src/application/kill-zombie.ts src/application/kill-zombie.test.ts src/application/end-run.ts src/application/end-run.test.ts src/adapters/phaser/scenes/game-scene.ts src/adapters/phaser/scenes/game-over-scene.ts
git commit -m "refactor(application): use-case에서 meta/coin/chapter 제거 — floor 기반으로 단순화"
```

---

## Task 6: 보스/메타/서사 모듈 삭제 + 잔여 정리

> 이 시점에서 프로덕션 코드가 이미 이 모듈들을 참조하지 않는다. 삭제 후 typecheck/test로 잔재 참조 없음을 증명.

- [ ] **Step 1: container에서 pickUpgrade 제거** — `src/infrastructure/container.ts`: `import { pickUpgrade }` 줄 삭제, `UseCases` 타입에서 `pickUpgrade` 제거, `useCases` 객체에서 `pickUpgrade` 제거.

- [ ] **Step 2: 구 spawner 메서드 + wave.ts 삭제**
  - `spawner.ts`에서 `spawn(wave)`, `nextSpawnDelayMs(wave)`, `NORMAL_WAVE_CDF`, `Wave` import 삭제. `spawner.test.ts`/`spawner.prop.test.ts`에서 구 메서드 테스트 삭제(신규 band/rate 테스트만 유지).
  - `rm src/domain/wave/wave.ts src/domain/wave/wave.test.ts src/domain/wave/wave.prop.test.ts`

- [ ] **Step 3: 보스/메타/서사 소스 삭제**

```bash
rm -r src/domain/boss
rm -r src/domain/meta
rm src/domain/powerup/boss.ts src/domain/powerup/boss.test.ts
rm src/domain/run/building-progress.ts src/domain/run/building-progress.test.ts
rm src/application/spawn-boss-wave.ts src/application/spawn-boss-wave.test.ts
rm src/application/tick-boss-position.ts src/application/tick-boss-position.test.ts
rm src/application/pick-upgrade.ts src/application/pick-upgrade.test.ts
rm src/adapters/phaser/objects/boss-hud.ts src/adapters/phaser/objects/upgrade-card.ts
```

- [ ] **Step 4: juice-manager 보스 연출 제거** — `src/adapters/phaser/managers/juice-manager.ts`에서 `setBossClimax`, `playBossApproaching`, `applyFreezeFrame`(보스 전용이면), `applyKillJuice`의 `"boss_kill"`/`"wave_clear"` 중 보스 관련 case 정리. **주의**: `"wave_clear"`는 새 scene의 `onFloorCleared`가 사용하므로 유지. `"boss_kill"` case와 boss climax 관련 필드/메서드만 제거.

- [ ] **Step 5: 잔재 참조 grep 검증** — 아래가 모두 0건이어야 함(테스트 파일·주석 제외):

```bash
grep -rn "domain/boss\|domain/meta\|building-progress\|spawn-boss-wave\|tick-boss-position\|pick-upgrade\|upgrade-card\|boss-hud\|MetaProgression\|DailyStreak\|isBossWave\|coinGain" src --include="*.ts"
```

- [ ] **Step 6: 전체 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add -A
git commit -m "chore: 보스·메타·서사 모듈 삭제 + 구 spawner/wave 정리 (grep 잔재 0건)"
```

---

## Task 7: E2E 시나리오 갱신

**Files:**
- Delete: `tests/e2e/boss-wave.spec.ts`
- Modify: `tests/e2e/game-flow.spec.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: boss E2E 삭제** — `rm tests/e2e/boss-wave.spec.ts`.

- [ ] **Step 2: `game-flow.spec.ts` state 타입 갱신** — `ZpState`를 새 snapshot(`floor, quota, killed, score, fled, fledLimit, comboCount, isPaused, zombies, sceneActive, activeScene`)으로 교체. `chapter`/`wave` 참조 전부 `floor`로.

- [ ] **Step 3: 3 시나리오 작성/갱신**
  1. **층 상승**: PUNCH IN → GameScene 진입 → 좀비 좌표를 polling해 quota만큼 탭 → `__zp_state.floor`가 2 이상으로 증가 확인.
  2. **층 실패(도주 한도)**: `window.__zp_test__.forceZombieTimeout()`을 반복 호출해 `fled >= fledLimit` 유도 → `__zp_scene === "GameOverScene"` 확인.
  3. **정시 퇴근**: HUD "정시 퇴근" zone 탭 → `__zp_scene === "GameOverScene"` + "정시 퇴근" 텍스트 확인.

```ts
// 예시(시나리오 2 골자)
test("도주 한도 초과 시 GameOver", async ({ page }) => {
  await page.goto("/");
  await clickUntilScene(page, /*center*/ x, y, "GameScene");
  // 스폰된 좀비를 강제 timeout시켜 도주 누적
  for (let i = 0; i < 10; i += 1) {
    await page.evaluate(() => (window as ZpWindow & { __zp_test__?: { forceZombieTimeout: () => void } }).__zp_test__?.forceZombieTimeout());
    await page.waitForTimeout(400);
    const scene = await page.evaluate(() => (window as ZpWindow).__zp_scene);
    if (scene === "GameOverScene") break;
  }
  expect(await page.evaluate(() => (window as ZpWindow).__zp_scene)).toBe("GameOverScene");
});
```

- [ ] **Step 4: 검증 + 커밋**

```bash
pnpm test:e2e || true   # 로컬 브라우저 환경에서 실행. CI green은 별도.
pnpm typecheck && pnpm lint && pnpm test
git add tests/e2e
git commit -m "test(e2e): 보스 시나리오 제거, 층 상승/도주 실패/정시 퇴근 3경로로 갱신"
```

---

## Task 8: ADR + Bible + CLAUDE.md 방향 전환 반영

**Files:**
- Create: `docs/adr/0015-wave-clicker-simplification.md`
- Modify: `docs/game-design/bible.md` (§1, §2), `CLAUDE.md` (핵심 차별점, §7, §9 Don'ts)

- [ ] **Step 1: ADR 작성** — `docs/adr/0015-wave-clicker-simplification.md` 에 5 섹션(Status: Accepted / Context: 사용자 요청으로 서사·보스·메타가 과중 → 단순 웨이브 클리커 회귀 / Decision: 층 오르기 골격+점수·콤보 유지, 보스·메타 카드·성장·서사 제거, 처치 목표 클리어+도주 한도 실패, 파워업/CEO 탱커/테마 유지, 코인 제거 / Consequences: 코드 대폭 축소, Bible §1·§2 상충 → 갱신, property invariant 7개 중 보스/카드/streak 관련 제거 / Alternatives: 전면 재작성(기각), 최소 물량 튜닝만(요청 불충족)).

- [ ] **Step 2: Bible 갱신** — `docs/game-design/bible.md` §1 핵심 약속과 §2 좀비/보스 서술에서 "퇴근시키는 게임"·5막 서사·CEO 보스전을 "탭 처치 웨이브 클리커, CEO는 탱커 좀비, 50층 완주형"으로 정정. 상충 문장에 각주로 ADR-0015 참조.

- [ ] **Step 3: CLAUDE.md 갱신** — §1 핵심 차별점(1번 항목), §7 도메인(보스·메타·streak 관련), §9 Don'ts(카드 15장/보스 관련 금지 항목)를 새 방향에 맞게 정정. Property invariant 목록(§6.3) 갱신.

- [ ] **Step 4: 최종 검증 + 커밋**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
git add docs CLAUDE.md
git commit -m "docs(adr): ADR-0015 웨이브 클리커 전환 + Bible/CLAUDE.md 정렬"
```

- [ ] **Step 5: mutation 게이트(선택, 시간 여유 시)** — Run: `pnpm test:mutation` → domain ≥80%, application ≥70% 확인. floor-plan/spawner의 mutation 생존자 있으면 [Boundary] 테스트 보강.

---

## Self-Review (작성 후 점검 결과)

**1. Spec coverage** — spec 각 절 대응:
- §2 결정표(범위/클리어/실패/파워업/CEO/테마/코인/챕터밴드/정시퇴근/접근) → Task 1~5, 8 전부 대응. 파워업은 "도메인 유지, UI 미추가"로 명시(handoff 플래그).
- §3 코어 루프 → Task 4 GameScene.
- §4 난이도 커브 → Task 1 floor-plan (수치 일치: floor1 quota8/cap3/rate1000/esc5, floor50 quota82/cap12/rate300/esc3).
- §5 제거/유지 → Task 6 삭제, 유지 목록 명시.
- §6 도메인/앱 변경 → Task 1~6.
- §7 테스트 계획 → 각 Task RED에 [Happy]/[Boundary]/[Error] + Task 1/3 property + Task 7 E2E.
- §8 ADR/Bible/CLAUDE → Task 8.
- §9 완료조건/금지/고려/제약 → Global Constraints + Task 6 grep + Task 8 build.

**2. Placeholder scan** — code step은 모두 실제 코드 포함. Task 5 end-run은 diff 요지 + 정확한 필드명 명시(전체 파일 재현 대신 지점 지정 — 기존 파일 구조 보존 목적, 변경 지점 완전 열거). Task 7 E2E는 시나리오 골자 코드 제공.

**3. Type consistency** — `floorPlan`/`bandOf`/`FLOOR_MAX`/`CAP_MAX`(Task1) ↔ GameScene 사용(Task4) 일치. `spawnForBand`/`delayForRate`(Task3) ↔ GameScene 일치. `killZombie` 새 시그니처(Task5) ↔ GameScene meta shim 제거(Task5 동일 Task 내) 일치. `endRun.floorsReached`(Task5) ↔ GameOver `callEndRun`(Task5) 일치. `__zp_state` 필드(Task4) ↔ E2E `ZpState`(Task7) 일치.

**4. Ambiguity** — 실패 판정은 `fled >= escapeLimit`(한도 도달 시 실패)로 확정. `floorsReached` = 완전히 클리어한 최고 층(clear=50, fail/early=floor-1)로 확정.

**주의(실행자에게):** Task 4→5는 논리적으로 이어지는 쌍이다(scene이 use-case를 소비). 각 Task 종료 시 `pnpm typecheck && lint && test` green을 반드시 확인하고, 안 되면 다음 Task로 넘어가지 말 것.
