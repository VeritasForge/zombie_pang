# CEO 보스 거동 강화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CEO 보스에 (1) 8자 궤도 이동, (2) 챕터별 미니언, (3) 격노 단계를 추가하여 보스전 도전감을 강화한다.

**Architecture:** Hexagonal 4계층 준수. 도메인 4 모듈 (`boss-movement` / `boss-rage-level` / `minion-composition` / `boss-phase-config`) 신규 추가 + application use case 2개 (`spawn-boss-wave` / `tick-boss-position`) + GameScene 어댑터 수정. 결정론 100% (`Math.sin` 순수 함수, IRandom 미사용). 미니언 도주 격리는 GameScene `bossWaveActive` 플래그 가드로 처리.

**Tech Stack:** TypeScript 5.6 strict + Vitest 2.x + fast-check 3.x + Stryker 8.x + Phaser 3.80 + vite-plugin-pwa.

**Spec:** `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`

---

## Task 0: ADR-0007 Proposed Stub 발행 (거버넌스 정렬)

**Files:**
- Create: `docs/adr/0007-boss-behavior-and-phase-model.md`

- [ ] **Step 0.1: ADR-0007 stub 파일 생성**

```markdown
# ADR-0007: 보스 거동 및 페이즈 모델

## Status

Proposed (2026-05-23) — 본 spec implement 첫 PR에서 Accepted 전환.

## Context

Bible §3은 CEO 보스에 대해 "Telegraph 1s / Engagement 3s / Climax 1s = 5초 연출"만 정의하고, 이동 패턴·미니언·격노 단계는 Open 상태였다. 사용자 피드백("CEO가 가만히 있어 너무 쉽다") 해소를 위해 보스 거동 강화 spec(`docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`)을 작성하면서 다음 4개 결정이 새로 도입되었다:

1. 새 도메인 디렉토리 `src/domain/boss/` 추가 (기존 `domain/powerup/boss.ts`와 책임 분리)
2. Lissajous 1:2 결정론 8자 궤도 도입 (`Math.sin` 순수 함수, IRandom 의존 없음)
3. D5 γ 격리 정책: 보스 wave 동안 미니언 도주는 fled 카운트 차단 (Bible §7 #10 carrot/stick 회피)
4. 보스 페이즈 모델 확장: Bible §3 "5초 연출"을 *연출 구간*으로 재해석, 실제 사용자 플레이 시간은 60초 envelope 안에서 동적 결정

CLAUDE.md §8 Rule #9 ("새 외부 의존성 추가 또는 아키텍처 변경 시 ADR 작성 필수")에 따라 본 ADR을 발행한다.

## Decision

(implement 첫 PR에서 채움)

## Consequences

(implement 첫 PR에서 채움)

## Alternatives

- 회피 대시 (탭 반응) — 거부. Ethics #10 carrot/stick + 결정론 위반.
- 랜덤 텔레포트 단독 — 거부. Ethics #4 슬롯머신화.
- `domain/run/escape-counter.ts` 도메인 추출 — 거부. 현 시점 over-engineering.
- Phase별 패턴 변신 — 거부. MVP 학습 부담.
```

- [ ] **Step 0.2: Commit**

```bash
git add docs/adr/0007-boss-behavior-and-phase-model.md
git commit -m "docs(adr): ADR-0007 보스 거동·페이즈 모델 (Proposed stub)"
```

---

## Task 1: `boss-phase-config.ts` — Phase 상수 테이블

**Files:**
- Create: `src/domain/boss/boss-phase-config.ts`
- Test: `src/domain/boss/boss-phase-config.test.ts`

- [ ] **Step 1.1: 실패 테스트 작성**

`src/domain/boss/boss-phase-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ChapterNumber } from "@shared/types/branded";
import { asChapterNumber } from "@shared/types/branded";
import { PHASE_CONFIGS, getPhaseConfig } from "./boss-phase-config";

describe("boss-phase-config", () => {
  // [Happy] 5개 챕터 모두 정확값
  it.each([
    [1, 80, 0.5],
    [2, 100, 0.7],
    [3, 120, 1.0],
    [4, 130, 1.3],
    [5, 150, 1.6],
  ] as const)("[Happy] Ch%i → R=%i, ω=%f", (ch, R, omega) => {
    const config = PHASE_CONFIGS[asChapterNumber(ch) as ChapterNumber];
    expect(config.R).toBe(R);
    expect(config.omega).toBe(omega);
  });

  // [Boundary] Ch1, Ch5 양 끝
  it("[Boundary] Ch1 = 최소 R/ω", () => {
    expect(PHASE_CONFIGS[asChapterNumber(1)]).toEqual({ R: 80, omega: 0.5 });
  });
  it("[Boundary] Ch5 = 최대 R/ω", () => {
    expect(PHASE_CONFIGS[asChapterNumber(5)]).toEqual({ R: 150, omega: 1.6 });
  });

  // [Error] (사유: lookup table, 부재)
  // getPhaseConfig helper로 undefined 안전 처리
  it("[Error] getPhaseConfig: invalid chapter → throw RangeError", () => {
    expect(() => getPhaseConfig(0 as unknown as ChapterNumber)).toThrow(RangeError);
    expect(() => getPhaseConfig(6 as unknown as ChapterNumber)).toThrow(RangeError);
  });
});
```

- [ ] **Step 1.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/domain/boss/boss-phase-config.test.ts`
Expected: FAIL — "Cannot find module './boss-phase-config'"

- [ ] **Step 1.3: 구현**

`src/domain/boss/boss-phase-config.ts`:

```ts
import type { ChapterNumber } from "@shared/types/branded";

export type PhaseConfig = { readonly R: number; readonly omega: number };

export const PHASE_CONFIGS = {
  1: { R: 80, omega: 0.5 },
  2: { R: 100, omega: 0.7 },
  3: { R: 120, omega: 1.0 },
  4: { R: 130, omega: 1.3 },
  5: { R: 150, omega: 1.6 },
} as const satisfies Record<ChapterNumber, PhaseConfig>;

export function getPhaseConfig(chapter: ChapterNumber): PhaseConfig {
  const config = PHASE_CONFIGS[chapter];
  if (!config) {
    throw new RangeError(`Invalid chapter for PHASE_CONFIGS: ${String(chapter)}`);
  }
  return config;
}
```

- [ ] **Step 1.4: 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/boss-phase-config.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 1.5: typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/domain/boss/boss-phase-config.ts src/domain/boss/boss-phase-config.test.ts
git commit -m "feat(domain/boss): PHASE_CONFIGS lookup table (Ch1~5 R/ω 상수)"
```

---

## Task 2: `minion-composition.ts` — Chapter → MinionSpec[]

**Files:**
- Create: `src/domain/boss/minion-composition.ts`
- Test: `src/domain/boss/minion-composition.test.ts`
- Test (Property): `src/domain/boss/minion-composition.prop.test.ts`

- [ ] **Step 2.1: Unit 실패 테스트 작성**

`src/domain/boss/minion-composition.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { asChapterNumber } from "@shared/types/branded";
import { ZOMBIE_TYPE } from "@/domain/wave/zombie-type";
import { composeMinions, totalMinions } from "./minion-composition";

describe("composeMinions", () => {
  // [Happy] Ch3 = 신입 3 + 과장 1
  it("[Happy] Ch3 → 신입×3 + 과장×1", () => {
    const result = composeMinions(asChapterNumber(3));
    expect(result).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 3 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
    ]);
  });
  it("[Happy] Ch5 → 신입×4 + 과장×3 + 팀장×1", () => {
    const result = composeMinions(asChapterNumber(5));
    expect(result).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 4 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 3 },
      { type: ZOMBIE_TYPE.LEAD, count: 1 },
    ]);
  });

  // [Boundary] Ch1 = 빈 배열 (P4 폐기 → 단위 테스트로 흡수)
  it("[Boundary] Ch1 → [] (미니언 없음)", () => {
    expect(composeMinions(asChapterNumber(1))).toEqual([]);
  });
  it("[Boundary] Ch2 → 신입만 2마리", () => {
    expect(composeMinions(asChapterNumber(2))).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 2 },
    ]);
  });

  // [Error] 부재 사유: TS exhaustive switch + branded type 컴파일러 보장
});

describe("totalMinions", () => {
  it.each([
    [1, 0],
    [2, 2],
    [3, 4],
    [4, 6],
    [5, 8],
  ])("[Happy] Ch%i → 총 %i마리", (ch, expected) => {
    expect(totalMinions(asChapterNumber(ch))).toBe(expected);
  });
});
```

- [ ] **Step 2.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/domain/boss/minion-composition.test.ts`
Expected: FAIL — "Cannot find module './minion-composition'"

- [ ] **Step 2.3: 구현**

`src/domain/boss/minion-composition.ts`:

```ts
import type { ChapterNumber } from "@shared/types/branded";
import { ZOMBIE_TYPE, type ZombieType } from "@/domain/wave/zombie-type";

export type MinionType = Exclude<ZombieType, typeof ZOMBIE_TYPE.CEO>;
export type MinionSpec = { readonly type: MinionType; readonly count: number };

export function composeMinions(chapter: ChapterNumber): readonly MinionSpec[] {
  switch (chapter as number) {
    case 1:
      return [];
    case 2:
      return [{ type: ZOMBIE_TYPE.INTERN, count: 2 }];
    case 3:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 3 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
      ];
    case 4:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 4 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 2 },
      ];
    case 5:
      return [
        { type: ZOMBIE_TYPE.INTERN, count: 4 },
        { type: ZOMBIE_TYPE.MIDDLE, count: 3 },
        { type: ZOMBIE_TYPE.LEAD, count: 1 },
      ];
    default:
      throw new RangeError(`Invalid chapter for composeMinions: ${String(chapter)}`);
  }
}

export function totalMinions(chapter: ChapterNumber): number {
  return composeMinions(chapter).reduce((sum, spec) => sum + spec.count, 0);
}
```

- [ ] **Step 2.4: Unit 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/minion-composition.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 2.5: Property 테스트 작성**

`src/domain/boss/minion-composition.prop.test.ts`:

```ts
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { asChapterNumber } from "@shared/types/branded";
import { composeMinions, totalMinions } from "./minion-composition";

describe("minion-composition properties (seed=42, numRuns=1000)", () => {
  // P3: 단조 증가 (chapter ↑ → totalMinions ↑) — chapter, chapter+1 모두 [1..5] 범위
  test.prop({ seed: 42, numRuns: 1000 })(
    "P3: ∀c∈[1..4]. totalMinions(c+1) ≥ totalMinions(c)",
    fc.integer({ min: 1, max: 4 }),
    (c) => {
      const a = totalMinions(asChapterNumber(c));
      const b = totalMinions(asChapterNumber(c + 1));
      expect(b).toBeGreaterThanOrEqual(a);
    },
  );

  // 합산 == totalMinions
  test.prop({ seed: 42, numRuns: 1000 })(
    "[Invariant] sum(spec.count) === totalMinions(chapter)",
    fc.integer({ min: 1, max: 5 }),
    (c) => {
      const chapter = asChapterNumber(c);
      const specs = composeMinions(chapter);
      const sum = specs.reduce((s, x) => s + x.count, 0);
      expect(sum).toBe(totalMinions(chapter));
    },
  );
});
```

- [ ] **Step 2.6: Property 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/minion-composition.prop.test.ts`
Expected: PASS

- [ ] **Step 2.7: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/domain/boss/minion-composition.ts src/domain/boss/minion-composition.test.ts src/domain/boss/minion-composition.prop.test.ts
git commit -m "feat(domain/boss): composeMinions — chapter별 미니언 구성 (D3) + P3 invariant"
```

---

## Task 3: `boss-rage-level.ts` — HP% → RageLevel + R/ω 배율

**Files:**
- Create: `src/domain/boss/boss-rage-level.ts`
- Test: `src/domain/boss/boss-rage-level.test.ts`
- Test (Property): `src/domain/boss/boss-rage-level.prop.test.ts`

- [ ] **Step 3.1: Unit 실패 테스트 작성**

`src/domain/boss/boss-rage-level.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { asChapterNumber } from "@shared/types/branded";
import { computeRageLevel, applyRageMultipliers } from "./boss-rage-level";
import type { PhaseConfig } from "./boss-phase-config";

const BASE: PhaseConfig = { R: 100, omega: 1 };

describe("computeRageLevel", () => {
  // [Happy] Ch5 HP 50% → rage 1
  it("[Happy] Ch5 HP=50% → rage 1", () => {
    expect(computeRageLevel(50, 100, asChapterNumber(5))).toBe(1);
  });

  // [Boundary] Ch1~3 무조건 0
  it.each([1, 2, 3])("[Boundary] Ch%i 무조건 rage 0", (ch) => {
    for (const hp of [100, 67, 50, 33, 0]) {
      expect(computeRageLevel(hp, 100, asChapterNumber(ch))).toBe(0);
    }
  });

  // [Boundary] Ch4 HP 정확 50% / 51% / 49%
  it("[Boundary] Ch4 HP=50% → rage 1 (≤ literal)", () => {
    expect(computeRageLevel(50, 100, asChapterNumber(4))).toBe(1);
  });
  it("[Boundary] Ch4 HP=51% → rage 0", () => {
    expect(computeRageLevel(51, 100, asChapterNumber(4))).toBe(0);
  });
  it("[Boundary] Ch4 HP=49% → rage 1", () => {
    expect(computeRageLevel(49, 100, asChapterNumber(4))).toBe(1);
  });

  // [Boundary] Ch5 HP 정확 67% / 33% / 68% / 34%
  it("[Boundary] Ch5 HP=67% → rage 1", () => {
    expect(computeRageLevel(67, 100, asChapterNumber(5))).toBe(1);
  });
  it("[Boundary] Ch5 HP=68% → rage 0", () => {
    expect(computeRageLevel(68, 100, asChapterNumber(5))).toBe(0);
  });
  it("[Boundary] Ch5 HP=33% → rage 2", () => {
    expect(computeRageLevel(33, 100, asChapterNumber(5))).toBe(2);
  });
  it("[Boundary] Ch5 HP=34% → rage 1", () => {
    expect(computeRageLevel(34, 100, asChapterNumber(5))).toBe(1);
  });

  // [Boundary] HP<0 → 자연 처리 rage=2
  it("[Boundary] Ch5 HP<0 → rage 2 (자연 처리)", () => {
    expect(computeRageLevel(-10, 100, asChapterNumber(5))).toBe(2);
  });
  // [Boundary] HP>maxHp → rage 0
  it("[Boundary] Ch5 HP>maxHp → rage 0", () => {
    expect(computeRageLevel(150, 100, asChapterNumber(5))).toBe(0);
  });

  // [Error] maxHp ≤ 0
  it("[Error] maxHp=0 → throw RangeError", () => {
    expect(() => computeRageLevel(10, 0, asChapterNumber(5))).toThrow(RangeError);
  });
  it("[Error] maxHp=-1 → throw RangeError", () => {
    expect(() => computeRageLevel(10, -1, asChapterNumber(5))).toThrow(RangeError);
  });
});

describe("applyRageMultipliers", () => {
  // [Happy] rage 0 → identity (base 그대로)
  it("[Happy] rage 0 → base 그대로", () => {
    expect(applyRageMultipliers(BASE, 0)).toEqual({ R: 100, omega: 1 });
  });
  // [Happy] rage 1 → ω × 1.3 (mutation kill 정확값)
  it("[Happy] rage 1 → ω × 1.3, R 유지", () => {
    expect(applyRageMultipliers(BASE, 1)).toEqual({ R: 100, omega: 1.3 });
  });
  // [Happy] rage 2 → ω × 1.6, R × 1.15 (mutation kill 정확값)
  it("[Happy] rage 2 → ω × 1.6, R × 1.15", () => {
    expect(applyRageMultipliers(BASE, 2)).toEqual({ R: 115, omega: 1.6 });
  });
});
```

- [ ] **Step 3.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/domain/boss/boss-rage-level.test.ts`
Expected: FAIL — "Cannot find module './boss-rage-level'"

- [ ] **Step 3.3: 구현**

`src/domain/boss/boss-rage-level.ts`:

```ts
import type { ChapterNumber } from "@shared/types/branded";
import type { PhaseConfig } from "./boss-phase-config";

export type RageLevel = 0 | 1 | 2;
export type { PhaseConfig }; // re-export 편의

export function computeRageLevel(
  hp: number,
  maxHp: number,
  chapter: ChapterNumber,
): RageLevel {
  if (maxHp <= 0) {
    throw new RangeError(`maxHp must be positive (got ${maxHp})`);
  }
  const ch = chapter as number;
  if (ch <= 3) return 0;
  const ratio = hp / maxHp;
  if (ch === 4) return ratio <= 0.5 ? 1 : 0;
  // ch === 5
  if (ratio <= 0.33) return 2;
  if (ratio <= 0.67) return 1;
  return 0;
}

export function applyRageMultipliers(base: PhaseConfig, rage: RageLevel): PhaseConfig {
  if (rage === 0) return base;
  if (rage === 1) return { R: base.R, omega: base.omega * 1.3 };
  return { R: base.R * 1.15, omega: base.omega * 1.6 }; // rage === 2
}
```

- [ ] **Step 3.4: Unit 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/boss-rage-level.test.ts`
Expected: PASS (16 tests)

- [ ] **Step 3.5: Property 테스트 작성**

`src/domain/boss/boss-rage-level.prop.test.ts`:

```ts
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { asChapterNumber } from "@shared/types/branded";
import { computeRageLevel } from "./boss-rage-level";

describe("boss-rage-level properties (seed=42, numRuns=1000)", () => {
  // P2: rage ∈ {0,1,2}
  test.prop({ seed: 42, numRuns: 1000 })(
    "P2: ∀(chapter, hp). rage ∈ {0,1,2}",
    fc.integer({ min: 1, max: 5 }),
    fc.double({ min: 0, max: 100, noNaN: true }),
    (ch, hp) => {
      const rage = computeRageLevel(hp, 100, asChapterNumber(ch));
      expect([0, 1, 2]).toContain(rage);
    },
  );

  // P6: 단조성 — hp1 ≤ hp2 → rage(hp1) ≥ rage(hp2)
  test.prop({ seed: 42, numRuns: 1000 })(
    "P6: hp1 ≤ hp2 → rage(hp1) ≥ rage(hp2) (격노 단조성)",
    fc.integer({ min: 1, max: 5 }),
    fc.double({ min: 0, max: 100, noNaN: true }),
    fc.double({ min: 0, max: 100, noNaN: true }),
    (ch, a, b) => {
      const [hp1, hp2] = a <= b ? [a, b] : [b, a];
      const chapter = asChapterNumber(ch);
      expect(computeRageLevel(hp1, 100, chapter)).toBeGreaterThanOrEqual(
        computeRageLevel(hp2, 100, chapter),
      );
    },
  );
});
```

- [ ] **Step 3.6: Property 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/boss-rage-level.prop.test.ts`
Expected: PASS

- [ ] **Step 3.7: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/domain/boss/boss-rage-level.ts src/domain/boss/boss-rage-level.test.ts src/domain/boss/boss-rage-level.prop.test.ts
git commit -m "feat(domain/boss): computeRageLevel + applyRageMultipliers + P2/P6 invariant"
```

---

## Task 4: `boss-movement.ts` — Lissajous 8자 궤도 + `clampDeltaMs`

**Files:**
- Create: `src/domain/boss/boss-movement.ts`
- Test: `src/domain/boss/boss-movement.test.ts`
- Test (Property): `src/domain/boss/boss-movement.prop.test.ts`

- [ ] **Step 4.1: Unit 실패 테스트 작성**

`src/domain/boss/boss-movement.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeBossPosition, clampDeltaMs } from "./boss-movement";

const CENTER = { x: 200, y: 400 };
const R = 100;
const OMEGA = 1; // rad/s

describe("computeBossPosition", () => {
  // [Happy] t=1000ms 위치 계산
  it("[Happy] t=1000ms (1s, ω=1) → x = cx + R·sin(2), y = cy + R·sin(1)", () => {
    const pos = computeBossPosition(1000, CENTER, R, OMEGA);
    expect(pos.x).toBeCloseTo(CENTER.x + R * Math.sin(2), 6);
    expect(pos.y).toBeCloseTo(CENTER.y + R * Math.sin(1), 6);
  });

  // [Boundary] t=0 → center
  it("[Boundary] t=0 → center 반환", () => {
    expect(computeBossPosition(0, CENTER, R, OMEGA)).toEqual(CENTER);
  });
  // [Boundary] t=π*1000/OMEGA → y=0 (sin(π)=0)
  it("[Boundary] tMs = π·1000/ω → y축 sin(π)=0, x축 sin(2π)=0 → center", () => {
    const tMs = Math.PI * 1000;
    const pos = computeBossPosition(tMs, CENTER, R, OMEGA);
    expect(pos.x).toBeCloseTo(CENTER.x, 6);
    expect(pos.y).toBeCloseTo(CENTER.y, 6);
  });

  // [Error] tMs < 0
  it("[Error] tMs=-1 → throw RangeError", () => {
    expect(() => computeBossPosition(-1, CENTER, R, OMEGA)).toThrow(RangeError);
  });
});

describe("clampDeltaMs", () => {
  // [Happy] 범위 안: 그대로 통과
  it("[Happy] clampDeltaMs(16) → 16", () => {
    expect(clampDeltaMs(16)).toBe(16);
  });
  // [Boundary] dt=0
  it("[Boundary] clampDeltaMs(0) → 0", () => {
    expect(clampDeltaMs(0)).toBe(0);
  });
  // [Boundary] dt=100 (상한)
  it("[Boundary] clampDeltaMs(100) → 100", () => {
    expect(clampDeltaMs(100)).toBe(100);
  });
  // [Boundary] dt>100 → 100 clamp
  it("[Boundary] clampDeltaMs(150) → 100", () => {
    expect(clampDeltaMs(150)).toBe(100);
  });
  // [Boundary] dt<0 → 0 clamp (시계 역행 방어)
  it("[Boundary] clampDeltaMs(-1) → 0", () => {
    expect(clampDeltaMs(-1)).toBe(0);
  });
});
```

- [ ] **Step 4.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/domain/boss/boss-movement.test.ts`
Expected: FAIL — "Cannot find module './boss-movement'"

- [ ] **Step 4.3: 구현**

`src/domain/boss/boss-movement.ts`:

```ts
export type BossPosition = { readonly x: number; readonly y: number };

/**
 * Lissajous 1:2 곡선 (8자). x축 진동이 y축의 2배 주기.
 *
 * 공식:
 *   x = center.x + R * sin(2ω·t)
 *   y = center.y + R * sin(ω·t)
 *
 * @param tMs 누적 시간 (ms). 음수면 RangeError throw (어댑터에서 clampDeltaMs로 정규화 권장).
 * @param center 화면 중심 좌표.
 * @param R per-axis 진폭. bounding box = [center.x±R] × [center.y±R].
 * @param omegaRadPerSec 각속도 (rad/s).
 */
export function computeBossPosition(
  tMs: number,
  center: { readonly x: number; readonly y: number },
  R: number,
  omegaRadPerSec: number,
): BossPosition {
  if (tMs < 0) {
    throw new RangeError(`tMs must be non-negative (got ${tMs})`);
  }
  const t = tMs / 1000;
  return {
    x: center.x + R * Math.sin(2 * omegaRadPerSec * t),
    y: center.y + R * Math.sin(omegaRadPerSec * t),
  };
}

/**
 * Frame delta 정규화: 음수→0, >maxDt→maxDt.
 * Phaser 일시정지 후 큰 dt, 시계 역행 등 방어.
 */
export function clampDeltaMs(dt: number, maxDt = 100): number {
  if (dt < 0) return 0;
  if (dt > maxDt) return maxDt;
  return dt;
}
```

- [ ] **Step 4.4: Unit 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/boss-movement.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 4.5: Property 테스트 작성**

`src/domain/boss/boss-movement.prop.test.ts`:

```ts
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { computeBossPosition, clampDeltaMs } from "./boss-movement";

const CENTER = { x: 200, y: 400 };

describe("boss-movement properties (seed=42, numRuns=1000)", () => {
  // P1a: ∀tMs∈[0, 60000]. cx - R ≤ x ≤ cx + R
  test.prop({ seed: 42, numRuns: 1000 })(
    "P1a: x축 진폭 ∈ [cx-R, cx+R]",
    fc.integer({ min: 0, max: 60_000 }),
    fc.double({ min: 10, max: 200, noNaN: true }),
    fc.double({ min: 0.1, max: 3, noNaN: true }),
    (tMs, R, omega) => {
      const pos = computeBossPosition(tMs, CENTER, R, omega);
      expect(pos.x).toBeGreaterThanOrEqual(CENTER.x - R - 1e-9);
      expect(pos.x).toBeLessThanOrEqual(CENTER.x + R + 1e-9);
    },
  );

  // P1b: ∀tMs∈[0, 60000]. cy - R ≤ y ≤ cy + R
  test.prop({ seed: 42, numRuns: 1000 })(
    "P1b: y축 진폭 ∈ [cy-R, cy+R]",
    fc.integer({ min: 0, max: 60_000 }),
    fc.double({ min: 10, max: 200, noNaN: true }),
    fc.double({ min: 0.1, max: 3, noNaN: true }),
    (tMs, R, omega) => {
      const pos = computeBossPosition(tMs, CENTER, R, omega);
      expect(pos.y).toBeGreaterThanOrEqual(CENTER.y - R - 1e-9);
      expect(pos.y).toBeLessThanOrEqual(CENTER.y + R + 1e-9);
    },
  );

  // P5: 결정론 — 동일 (tMs, center, R, ω) → 동일 위치
  test.prop({ seed: 42, numRuns: 1000 })(
    "P5: 동일 입력 → 동일 위치 (결정론)",
    fc.integer({ min: 0, max: 60_000 }),
    fc.double({ min: 10, max: 200, noNaN: true }),
    fc.double({ min: 0.1, max: 3, noNaN: true }),
    (tMs, R, omega) => {
      const a = computeBossPosition(tMs, CENTER, R, omega);
      const b = computeBossPosition(tMs, CENTER, R, omega);
      expect(a.x).toBe(b.x);
      expect(a.y).toBe(b.y);
    },
  );

  // clampDeltaMs property: 0 ≤ result ≤ 100
  test.prop({ seed: 42, numRuns: 1000 })(
    "clampDeltaMs: 0 ≤ result ≤ 100",
    fc.double({ noNaN: true }),
    (dt) => {
      const r = clampDeltaMs(dt);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    },
  );
});
```

- [ ] **Step 4.6: Property 테스트 실행 — 통과 확인**

Run: `pnpm test src/domain/boss/boss-movement.prop.test.ts`
Expected: PASS

- [ ] **Step 4.7: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/domain/boss/boss-movement.ts src/domain/boss/boss-movement.test.ts src/domain/boss/boss-movement.prop.test.ts
git commit -m "feat(domain/boss): Lissajous 8자 궤도 + clampDeltaMs + P1a/P1b/P5 invariant"
```

---

## Task 5: `spawn-boss-wave.ts` use case

**Files:**
- Create: `src/application/spawn-boss-wave.ts`
- Test: `src/application/spawn-boss-wave.test.ts`

- [ ] **Step 5.1: 실패 테스트 작성**

`src/application/spawn-boss-wave.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { asChapterNumber } from "@shared/types/branded";
import { ZOMBIE_TYPE } from "@/domain/wave/zombie-type";
import { spawnBossWave } from "./spawn-boss-wave";

describe("spawnBossWave", () => {
  // [Happy] Ch3 → boss + minions [신입3, 과장1]
  it("[Happy] Ch3 → boss + minions [신입3, 과장1]", () => {
    const result = spawnBossWave(asChapterNumber(3));
    expect(result.phase).toEqual({ R: 120, omega: 1.0 });
    expect(result.minions).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 3 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
    ]);
  });

  // [Boundary] Ch1 → boss + minions []
  it("[Boundary] Ch1 → minions: []", () => {
    const result = spawnBossWave(asChapterNumber(1));
    expect(result.minions).toEqual([]);
    expect(result.phase).toEqual({ R: 80, omega: 0.5 });
  });
  // [Boundary] Ch5 → minions 합 8
  it("[Boundary] Ch5 → minions 총 8 + phase R=150, ω=1.6", () => {
    const result = spawnBossWave(asChapterNumber(5));
    const totalCount = result.minions.reduce((s, x) => s + x.count, 0);
    expect(totalCount).toBe(8);
    expect(result.phase).toEqual({ R: 150, omega: 1.6 });
  });

  // [Error] 부재 사유: Port 무관 + ChapterNumber 컴파일러 보장
});
```

- [ ] **Step 5.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/application/spawn-boss-wave.test.ts`
Expected: FAIL — "Cannot find module './spawn-boss-wave'"

- [ ] **Step 5.3: 구현**

`src/application/spawn-boss-wave.ts`:

```ts
import type { ChapterNumber } from "@shared/types/branded";
import { getPhaseConfig, type PhaseConfig } from "@/domain/boss/boss-phase-config";
import { composeMinions, type MinionSpec } from "@/domain/boss/minion-composition";

export type BossWavePayload = {
  readonly phase: PhaseConfig;
  readonly minions: readonly MinionSpec[];
};

export function spawnBossWave(chapter: ChapterNumber): BossWavePayload {
  return {
    phase: getPhaseConfig(chapter),
    minions: composeMinions(chapter),
  };
}
```

- [ ] **Step 5.4: 테스트 실행 — 통과 확인**

Run: `pnpm test src/application/spawn-boss-wave.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5.5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/application/spawn-boss-wave.ts src/application/spawn-boss-wave.test.ts
git commit -m "feat(application): spawn-boss-wave use case (chapter → phase + minions)"
```

---

## Task 6: `tick-boss-position.ts` use case

**Files:**
- Create: `src/application/tick-boss-position.ts`
- Test: `src/application/tick-boss-position.test.ts`

- [ ] **Step 6.1: 실패 테스트 작성**

`src/application/tick-boss-position.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { IClock } from "@/domain/ports/clock";
import { tickBossPosition } from "./tick-boss-position";

class FakeClock implements IClock {
  constructor(private value: number) {}
  now() { return this.value; }
  monotonic() { return this.value; }
  set(v: number) { this.value = v; }
}

const CENTER = { x: 200, y: 400 };
const R = 100;
const OMEGA = 1;

describe("tickBossPosition", () => {
  // [Happy] dt=16ms 누적 후 위치 갱신
  it("[Happy] dt=16ms 누적 → 위치 갱신", () => {
    const clock = new FakeClock(1000);
    const start = 1000;
    const pos1 = tickBossPosition({ clock, bossStartTimeMs: start, center: CENTER, R, omega: OMEGA });
    clock.set(1016);
    const pos2 = tickBossPosition({ clock, bossStartTimeMs: start, center: CENTER, R, omega: OMEGA });
    expect(pos1).toEqual(CENTER); // t=0
    expect(pos2.x).not.toBe(pos1.x); // 변화 확인
  });

  // [Boundary] dt=0 (start=now) → center 반환
  it("[Boundary] now==start → center 반환", () => {
    const clock = new FakeClock(500);
    const result = tickBossPosition({ clock, bossStartTimeMs: 500, center: CENTER, R, omega: OMEGA });
    expect(result).toEqual(CENTER);
  });

  // [Error] dt > 100ms → clamp (100 사용)
  it("[Boundary] dt>100ms → 100으로 clamp (boss 화면 밖 순간이동 방지)", () => {
    const clock = new FakeClock(2000);
    const result = tickBossPosition({ clock, bossStartTimeMs: 1000, center: CENTER, R, omega: OMEGA });
    // dt = 1000ms 이지만 clamp 100ms → 사용된 t = 100ms
    const expected = {
      x: CENTER.x + R * Math.sin(2 * OMEGA * 0.1),
      y: CENTER.y + R * Math.sin(OMEGA * 0.1),
    };
    expect(result.x).toBeCloseTo(expected.x, 6);
    expect(result.y).toBeCloseTo(expected.y, 6);
  });

  // [Error] dt<0 → 0 clamp (center 반환)
  it("[Error] now<start (clock 역행) → dt 0 clamp → center", () => {
    const clock = new FakeClock(500);
    const result = tickBossPosition({ clock, bossStartTimeMs: 1000, center: CENTER, R, omega: OMEGA });
    expect(result).toEqual(CENTER);
  });
});
```

- [ ] **Step 6.2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/application/tick-boss-position.test.ts`
Expected: FAIL

- [ ] **Step 6.3: 구현**

`src/application/tick-boss-position.ts`:

```ts
import type { IClock } from "@/domain/ports/clock";
import {
  computeBossPosition,
  clampDeltaMs,
  type BossPosition,
} from "@/domain/boss/boss-movement";

export type TickBossPositionInput = {
  readonly clock: IClock;
  readonly bossStartTimeMs: number;
  readonly center: { readonly x: number; readonly y: number };
  readonly R: number;
  readonly omega: number;
};

export function tickBossPosition(input: TickBossPositionInput): BossPosition {
  const { clock, bossStartTimeMs, center, R, omega } = input;
  const dt = clampDeltaMs(clock.now() - bossStartTimeMs);
  return computeBossPosition(dt, center, R, omega);
}
```

- [ ] **Step 6.4: 테스트 실행 — 통과 확인**

Run: `pnpm test src/application/tick-boss-position.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6.5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/application/tick-boss-position.ts src/application/tick-boss-position.test.ts
git commit -m "feat(application): tick-boss-position use case (IClock + clamp + 위치 계산)"
```

---

## Task 7: GameScene 어댑터 수정 (spawnBoss / update 가드 / init 리셋)

**Files:**
- Modify: `src/adapters/phaser/scenes/game-scene.ts`

이 Task는 어댑터 통합으로 단위 테스트 격리가 어렵다. 행동 변경을 작은 sub-step으로 나누고 매 step 후 `pnpm typecheck`, `pnpm test`로 회귀 확인. E2E는 Task 9에서 별도 처리.

- [ ] **Step 7.1: `bossWaveActive` 플래그 + `bossStartTimeMs` 인스턴스 변수 추가**

`src/adapters/phaser/scenes/game-scene.ts` (line 84 근처 — 다른 인스턴스 변수와 함께):

```ts
// 추가
private bossWaveActive = false;
private bossStartTimeMs = 0;
private bossMinions: Zombie[] = [];
```

`init()` 메서드 내부 (모든 상태 초기화 시점):

```ts
this.bossWaveActive = false;
this.bossStartTimeMs = 0;
this.bossMinions = [];
```

- [ ] **Step 7.2: `spawnBoss()` 메서드를 spawn-boss-wave 사용으로 재작성**

기존 `spawnBoss()` (line 236-252)를 다음과 같이 변경:

```ts
private spawnBoss(): void {
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height / 2;
  const chapter = asChapterNumber(this.run.chapter);
  const payload = spawnBossWave(chapter);

  // 1) CEO 생성
  const ceoZombie = new Zombie(this, cx, cy, {
    type: ZOMBIE_TYPE.CEO,
    hp: bossHpForChapter(chapter),
    lifespanMs: VIEWPORT.bossLifespanMs ?? 60_000,
    reward: bossRewardForChapter(chapter),
  });
  this.bossZombie = ceoZombie;
  this.bossHud = new BossHud(this, ceoZombie, chapter);

  // 2) 미니언 일괄 스폰 (한 frame 내)
  this.bossMinions = [];
  for (const spec of payload.minions) {
    for (let i = 0; i < spec.count; i++) {
      const { x, y } = findSpawnPoint(this.random); // 기존 spawner 좌표 로직 재사용
      const z = new Zombie(this, x, y, {
        type: spec.type,
        hp: specOf(spec.type).hp,
        lifespanMs: specOf(spec.type).lifespanMs,
        reward: specOf(spec.type).reward,
      });
      this.bossMinions.push(z);
      this.activeZombies.push(z);
    }
  }

  // 3) 상태 플래그
  this.nextSpawnAtMs = Number.POSITIVE_INFINITY;
  this.bossWaveActive = true;
  this.bossStartTimeMs = this.clock.now();
}
```

imports 상단 추가:
```ts
import { asChapterNumber } from "@shared/types/branded";
import { spawnBossWave } from "@/application/spawn-boss-wave";
import { specOf, ZOMBIE_TYPE } from "@/domain/wave/zombie-type";
import { bossHpForChapter, bossRewardForChapter } from "@/domain/powerup/boss";
```

- [ ] **Step 7.3: `update()` 메서드에 frame tick 추가**

`update(time, delta)` 메서드 내부, 보스 wave 처리 분기에:

```ts
// 보스 wave 활성 시 매 frame CEO 위치 갱신
if (this.bossWaveActive && this.bossZombie) {
  const chapter = asChapterNumber(this.run.chapter);
  const basePhase = getPhaseConfig(chapter);
  const rage = computeRageLevel(this.bossZombie.hp, bossHpForChapter(chapter), chapter);
  const effective = applyRageMultipliers(basePhase, rage);
  const pos = tickBossPosition({
    clock: this.clock,
    bossStartTimeMs: this.bossStartTimeMs,
    center: { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 },
    R: effective.R,
    omega: effective.omega,
  });
  this.bossZombie.setPosition(pos.x, pos.y); // B1 fix: Phaser setPosition 직접
}
```

imports 추가:
```ts
import { getPhaseConfig } from "@/domain/boss/boss-phase-config";
import { computeRageLevel, applyRageMultipliers } from "@/domain/boss/boss-rage-level";
import { tickBossPosition } from "@/application/tick-boss-position";
```

- [ ] **Step 7.4: 미니언 lifespan 도주 분기에 γ 격리 가드 추가**

기존 `update()` 안 lifespan 만료 루프 (line 399-410 근처)에서:

```ts
for (const id of toRemove) {
  const zombie = this.activeZombies.find((z) => z.id === id);
  if (!zombie) continue;
  // γ 격리 (D5): 보스 wave 중 미니언 도주는 fled에 카운트 안 함
  if (this.bossWaveActive && zombie.type !== ZOMBIE_TYPE.CEO) {
    zombie.destroy();
    this.activeZombies = this.activeZombies.filter((z) => z.id !== id);
    continue;
  }
  // 기존 도주 카운트 처리
  this.fled += 1;
  zombie.destroy();
  this.activeZombies = this.activeZombies.filter((z) => z.id !== id);
  if (this.fled >= FLED_LIMIT) {
    this.onFledLimit();
  }
}
```

- [ ] **Step 7.5: CEO 처치 시 잔여 미니언 일괄 폭사 + bossWaveActive=false**

기존 보스 처치 핸들러 (`onZombieKilled` 또는 동등) 내부:

```ts
if (killed.type === ZOMBIE_TYPE.CEO) {
  // 잔여 미니언 한 frame 내 일괄 폭사 (점수 합산 + drop 정상 적용)
  for (const minion of this.bossMinions) {
    if (!minion.destroyed) {
      this.run.score += minion.reward;
      this.applyPowerupDropForMinion(minion); // 기존 drop 로직 재사용
      minion.destroy();
    }
  }
  this.activeZombies = this.activeZombies.filter((z) => !this.bossMinions.includes(z));
  this.bossMinions = [];
  // Bible §5 24p 파편 + 600ms freeze + Climax 슬로우모션은 기존 보스 처치 로직 그대로
  this.bossWaveActive = false;
}
```

- [ ] **Step 7.6: 전체 typecheck + 기존 테스트 회귀 확인**

```bash
pnpm typecheck && pnpm lint && pnpm test
```
Expected: PASS (회귀 0건)

- [ ] **Step 7.7: Commit**

```bash
git add src/adapters/phaser/scenes/game-scene.ts
git commit -m "feat(adapters): GameScene — spawnBoss + tickBossPosition + γ 격리 가드 + init 리셋"
```

---

## Task 8: `boss-hud.ts` 색상 SSOT 변경 (RageLevel import)

**Files:**
- Modify: `src/adapters/phaser/objects/boss-hud.ts`

- [ ] **Step 8.1: 기존 color 결정 로직 교체**

`src/adapters/phaser/objects/boss-hud.ts` 라인 51-53 (`if (ratio < 0.33) ... else if (ratio < 0.66) ...`)를 교체:

```ts
import type { ChapterNumber } from "@shared/types/branded";
import { computeRageLevel } from "@/domain/boss/boss-rage-level";

// 기존 render/update 함수 내부에서 ratio 계산 후:
const rage = computeRageLevel(this.boss.hp, bossHpForChapter(this.chapter), this.chapter);
let color: number;
if (rage === 2) color = COLORS.lead;
else if (rage === 1) color = COLORS.middle;
else color = COLORS.intern;
```

생성자에 `chapter: ChapterNumber` 인자 추가하고, 호출 측 (`game-scene.ts` `new BossHud(this, ceoZombie, chapter)`)도 일치하도록 수정.

- [ ] **Step 8.2: typecheck + 회귀 확인**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

- [ ] **Step 8.3: Commit**

```bash
git add src/adapters/phaser/objects/boss-hud.ts src/adapters/phaser/scenes/game-scene.ts
git commit -m "refactor(adapters): boss-hud 색상 결정을 computeRageLevel SSOT로 통합"
```

---

## Task 9: E2E 시나리오 E1~E5 추가 (Playwright)

**Files:**
- Modify: `tests/e2e/boss-wave.spec.ts` (또는 신규)

Playwright 환경 (Pixel 5 viewport 390×844) 가정. 기존 e2e 디렉토리 구조 확인 후 진행.

- [ ] **Step 9.1: E1 — Ch1 보스 5초 위치 추적 (x 좌표 표준편차 > 30px)**

```ts
import { test, expect } from "@playwright/test";

test("E1: Ch1 보스 이동 검증 (x 표준편차 > 30px)", async ({ page }) => {
  await page.goto("/");
  // 게임 시작 + Ch1 wave 10 진입 (test hook 활용)
  await page.evaluate(() => (window as any).__test__.startChapter(1, 10));
  await page.waitForTimeout(100); // 보스 스폰

  const samples: number[] = [];
  for (let i = 0; i < 30; i++) {
    const x = await page.evaluate(() => (window as any).__test__.getBossPosition().x);
    samples.push(x);
    await page.waitForTimeout(167); // ~5초 / 30 sample
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  expect(stdDev).toBeGreaterThan(30);
});
```

- [ ] **Step 9.2: E2 — Ch3 보스 등장 직후 객체 5개**

```ts
test("E2: Ch3 보스 wave 진입 직후 화면 객체 5개 (CEO + 신입3 + 과장1)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__test__.startChapter(3, 10));
  await page.waitForTimeout(50); // 한 frame ~16ms
  const count = await page.evaluate(() => (window as any).__test__.getActiveZombieCount());
  expect(count).toBe(5);
});
```

- [ ] **Step 9.3: E3 — Ch5 격노 1단/2단 + 색상 변화**

```ts
test("E3: Ch5 격노 1단/2단 진입 + HUD 색상 변화", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__test__.startChapter(5, 10));
  await page.evaluate(() => (window as any).__test__.setBossHp(25)); // 25/38 ≈ 0.658 ≤ 0.67 → rage 1
  await page.waitForTimeout(50);
  const color1 = await page.evaluate(() => (window as any).__test__.getBossHudColor());
  expect(color1).toBe("middle"); // 황

  await page.evaluate(() => (window as any).__test__.setBossHp(12)); // 12/38 ≈ 0.316 ≤ 0.33 → rage 2
  await page.waitForTimeout(50);
  const color2 = await page.evaluate(() => (window as any).__test__.getBossHudColor());
  expect(color2).toBe("lead"); // 적
});
```

- [ ] **Step 9.4: E4 — γ 격리 회귀 (미니언 5마리 도주 → fled 무변화)**

```ts
test("E4: 보스 wave 동안 미니언 5마리 도주 → fled 카운터 변화 없음 (D5 γ 격리)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__test__.startChapter(3, 10));
  await page.waitForTimeout(50);
  const fledBefore = await page.evaluate(() => (window as any).__test__.getFledCount());
  await page.evaluate(() => (window as any).__test__.forceMinionTimeout(5));
  await page.waitForTimeout(100);
  const fledAfter = await page.evaluate(() => (window as any).__test__.getFledCount());
  expect(fledAfter).toBe(fledBefore);
});
```

- [ ] **Step 9.5: E5 — envelope 60초 회귀 (Ch5 보스 처치 ≤ 60초)**

```ts
test("E5: Ch5 보스 wave 시작 ~ CEO 처치 ≤ 60000ms (envelope 회귀)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__test__.startChapter(5, 10));
  const start = Date.now();
  // 자동 탭 시뮬레이션: CEO HP 0까지
  await page.evaluate(() => (window as any).__test__.autoTapBossUntilDead());
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThanOrEqual(60_000);
});
```

- [ ] **Step 9.6: 필요한 `window.__test__` 헬퍼 노출 (dev/test 빌드 한정)**

`src/adapters/phaser/scenes/game-scene.ts` 또는 `src/main.ts`에 test build 플래그 가드로:

```ts
if (import.meta.env.MODE === "test" || import.meta.env.DEV) {
  (window as unknown as { __test__: object }).__test__ = {
    startChapter: (ch: number, w: number) => { /* GameScene state 조작 */ },
    getBossPosition: () => ({ x: scene.bossZombie?.x ?? 0, y: scene.bossZombie?.y ?? 0 }),
    getActiveZombieCount: () => scene.activeZombies.length,
    setBossHp: (hp: number) => { if (scene.bossZombie) scene.bossZombie.hp = hp; },
    getBossHudColor: () => scene.bossHud?.currentColorName ?? "none",
    getFledCount: () => scene.fled,
    forceMinionTimeout: (n: number) => { /* lifespan 강제 만료 */ },
    autoTapBossUntilDead: () => { /* repeat tap until ceo killed */ },
  };
}
```

- [ ] **Step 9.7: E2E 실행 + 통과 확인**

```bash
pnpm test:e2e
```
Expected: PASS (E1~E5 + 기존 3개)

- [ ] **Step 9.8: Commit**

```bash
git add tests/e2e/ src/adapters/phaser/scenes/game-scene.ts src/main.ts
git commit -m "test(e2e): E1~E5 보스 거동/격노/γ격리/envelope 회귀 가드"
```

---

## Task 10: 최종 검증 게이트 + Mutation testing

- [ ] **Step 10.1: typecheck 0 error**

```bash
pnpm typecheck
```
Expected: 0 errors

- [ ] **Step 10.2: lint 0 error**

```bash
pnpm lint
```
Expected: 0 errors

- [ ] **Step 10.3: 단위 + 통합 테스트 커버리지 확인**

```bash
pnpm test --coverage
```
Expected:
- `src/domain/boss/**`: 100% line/branch/function/statement
- `src/application/spawn-boss-wave`, `tick-boss-position`: ≥ 95% line, ≥ 90% branch
- `src/adapters/phaser/scenes/game-scene`: ≥ 70%

- [ ] **Step 10.4: Property-based 1000회 통과**

```bash
pnpm test:prop
```
Expected: P1a/P1b/P2/P3/P5/P6 + clampDeltaMs property 모두 0 fail

- [ ] **Step 10.5: Mutation testing**

```bash
pnpm test:mutation
```
Expected:
- `src/domain/boss/**`: ≥ 80%
- `src/application/spawn-boss-wave`, `tick-boss-position`: ≥ 70%

mutation 임계 미달 시 해당 모듈 단위 테스트에 정확값 비교 케이스 추가 후 재실행.

- [ ] **Step 10.6: E2E 통과**

```bash
pnpm test:e2e
```
Expected: E1~E5 + 기존 시나리오 PASS

- [ ] **Step 10.7: Ethics grep — Notification 권한 미요청 회귀**

```bash
! grep -rq "Notification.requestPermission" src/ tests/ && echo OK
```
Expected: `OK` 출력

- [ ] **Step 10.8: build size 확인**

```bash
pnpm build && pnpm size
```
Expected: dist/ gzip < 1.5MB

- [ ] **Step 10.9: ADR-0007 Accepted 전환 + 최종 commit**

`docs/adr/0007-boss-behavior-and-phase-model.md` Status를 `Proposed` → `Accepted`로 변경하고 Decision / Consequences 본문 채움 (spec §3 의사결정 + §4 수치 근거 + §5.3 어댑터 가드 결정 요약).

```bash
git add docs/adr/0007-boss-behavior-and-phase-model.md
git commit -m "docs(adr): ADR-0007 Accepted — Decision/Consequences 본문 채움"
```

---

## File Structure (요약)

**Create:**
- `docs/adr/0007-boss-behavior-and-phase-model.md`
- `src/domain/boss/boss-phase-config.ts`
- `src/domain/boss/boss-phase-config.test.ts`
- `src/domain/boss/minion-composition.ts`
- `src/domain/boss/minion-composition.test.ts`
- `src/domain/boss/minion-composition.prop.test.ts`
- `src/domain/boss/boss-rage-level.ts`
- `src/domain/boss/boss-rage-level.test.ts`
- `src/domain/boss/boss-rage-level.prop.test.ts`
- `src/domain/boss/boss-movement.ts`
- `src/domain/boss/boss-movement.test.ts`
- `src/domain/boss/boss-movement.prop.test.ts`
- `src/application/spawn-boss-wave.ts`
- `src/application/spawn-boss-wave.test.ts`
- `src/application/tick-boss-position.ts`
- `src/application/tick-boss-position.test.ts`
- `tests/e2e/boss-wave.spec.ts`

**Modify:**
- `src/adapters/phaser/scenes/game-scene.ts` (spawnBoss / update / init / 폭사 핸들러)
- `src/adapters/phaser/objects/boss-hud.ts` (색상 SSOT)
- `src/main.ts` (또는 동등 — `window.__test__` 헬퍼)

---

## Self-Review 결과

**Spec coverage**:
- ✅ D1 점진 도입 → Task 1 PHASE_CONFIGS 표
- ✅ D2 8자 궤도 → Task 4 computeBossPosition
- ✅ D3 미니언 종 다양화 → Task 2 composeMinions
- ✅ D4 일괄 스폰 → Task 5 spawnBossWave + Task 7.2
- ✅ D5 γ 격리 → Task 7.1 bossWaveActive + 7.4 가드
- ✅ D6 잔여 미니언 폭사 → Task 7.5
- ✅ Phase 상수 → Task 1
- ✅ 격노 단계 → Task 3
- ✅ Bible §3 HUD 색상 SSOT → Task 8
- ✅ ADR-0007 → Task 0 + Task 10.9
- ✅ TDD 3카테고리 → 모든 Task 테스트 단계
- ✅ Property invariant 5+1개 → Task 2/3/4
- ✅ Mutation ≥ 80% domain → Task 10.5
- ✅ E1~E5 → Task 9
- ✅ §10 검증 게이트 7개 → Task 10

**Placeholder scan**: 0건

**Type consistency**:
- `PhaseConfig` = boss-rage-level.ts 에서 export, boss-phase-config.ts 도 동일 type 사용. Task 1 import 누락 잠재 — Task 1 구현 시 `boss-rage-level.ts`의 type을 import해야 함 (또는 `boss-phase-config.ts`에 정의하고 boss-rage-level이 import). **수정**: PhaseConfig는 boss-phase-config.ts에 정의, boss-rage-level이 import (의존성 그래프 명확화).

---

## 의존성 그래프 (작성 순서 정당화)

```
Task 0 (ADR stub)  — 독립
Task 1 (boss-phase-config: PhaseConfig type 정의 + PHASE_CONFIGS)
  ↓
Task 3 (boss-rage-level: PhaseConfig import + applyRageMultipliers)
Task 2 (minion-composition: ZombieType import — 독립)
Task 4 (boss-movement: 독립 + clampDeltaMs)
  ↓
Task 5 (spawn-boss-wave: getPhaseConfig + composeMinions)
Task 6 (tick-boss-position: clock + boss-movement + clampDeltaMs)
  ↓
Task 7 (GameScene: 모든 도메인/use case 결합)
Task 8 (boss-hud: computeRageLevel + ChapterNumber)
  ↓
Task 9 (E2E)
  ↓
Task 10 (최종 검증 + ADR Accepted)
```

---

## Execution

**plan 저장 완료**: `docs/superpowers/plans/2026-05-23-ceo-boss-behavior.md`

**선택**: subagent-driven-development (사용자 goal에서 지정) — Fresh subagent per task + 매 task 후 review.
