# Testing Conventions for 좀비팡

본 프로젝트의 모든 코드는 **TDD (Test-Driven Development)** 로 작성됩니다.

> **상위 SSOT**: `docs/adr/0004-tdd.md` (정식 박제)
> 본 문서는 **상세 가이드 + 좀비팡 도메인 예제 + grep 규칙**입니다.

---

## 1. TDD 5룰

| # | 룰 | 강제 방식 |
|---|----|----------|
| R1 | **RED → GREEN → REFACTOR** 사이클. 실패 테스트 없이 프로덕션 코드 작성 금지 | PR/Task 종료 시 grep 검증 |
| R2 | **3-카테고리 룰**: RED는 `[Happy]` `[Boundary]` `[Error]` 각 ≥1개 (사유 명시 시 면제) | grep 검증 + rl-verify |
| R3 | **Outside-In Acceptance First**: E2E(실패) → Integration(실패) → Unit(실패) 순 RED | Task 시작 시 acceptance test 작성 |
| R4 | **Behavior over Implementation**: `expect(result).toEqual(...)` 위주, mock 검증은 외부 어댑터 경계만 | code review |
| R5 | **Meaningful Coverage**: line 80% (도메인 100%) + 도메인 mutation score 80%+ | CI gate (vitest threshold + Stryker break) |

---

## 2. Testing Trophy (Kent C. Dodds)

```
            ┌──────────┐
           /    E2E     \      10% — Playwright (3 시나리오)
          /──────────────\
         / Integration    \    50% — adapters + use case (vitest-canvas-mock)
        /──────────────────\
       /       Unit         \  30% — domain + application
      /──────────────────────\
     /        Static          \ 10% — TypeScript strict + Biome
    └──────────────────────────┘
```

Test Pyramid가 아닌 **Testing Trophy** 채택 — Phaser scene/use case 경계가 좁아 단위만으로는 회귀 잡기 어려움.

---

## 3. 3 카테고리 룰 (필수)

모든 RED phase의 테스트는 다음 카테고리에서 **각각 ≥1개**:

| 카테고리 | 좀비팡 예시 |
|---------|-----------|
| `[Happy]` | combo 5kill 후 ×1.5 / Power-up 정상 발동 / wave 10 도달 시 CEO 보스 등장 |
| `[Boundary]` | combo decay 정확히 1500ms / spawn rate 하한 300ms / 도주 4→5 fail 경계 / streak 7→8 (상한+휴식) / Power-up 동시 활성 1→2→3 (한도) / freeze-frame 0/599/600/601ms / coin 0/1/9999 |
| `[Error]` | localStorage quota 초과 → graceful degrade / Vibration API 미지원 → no-op / RNG seed 미주입 → throw / 잘못된 power-up 타입 / negative score / 도주 누적 음수 |

### 규칙

- Happy만으로 PR/Task 머지 금지. 카테고리 누락 시 rl-verify가 차단
- 코드가 분기하는 모든 입력 영역에서 boundary 1개 이상 (truthy/falsy, optional 인자의 null/실제 값, 컬렉션의 빈/단일/다수)
- 명시적으로 catch하는 모든 예외 타입 **각각** 1개 (`catch (StoreQuotaError | StoreUnavailableError)`이면 2개)
- 단순 보관 Task의 `[Error]` 부재 시 PR/Task에 **사유 명시 필수**

### 예시: Combo

```ts
// src/domain/score/combo.test.ts
import { describe, it, expect } from 'vitest'
import { Combo } from './combo'
import { FakeClock } from '@/../tests/fakes/fake-clock'

describe('Combo', () => {
  // [Happy]
  it('[Happy] 5kill 누적 시 tier가 ×1.5로 승급한다', () => {
    const clock = new FakeClock()
    const combo = new Combo({ clock })
    for (let i = 0; i < 5; i++) combo.incrementOnKill()
    expect(combo.tier()).toBe(1.5)
  })

  // [Boundary] decay 1499ms vs 1500ms
  it('[Boundary] decay 직전 1499ms는 콤보 유지', () => {
    const clock = new FakeClock()
    const combo = new Combo({ clock })
    for (let i = 0; i < 5; i++) combo.incrementOnKill()
    clock.advance(1499)
    expect(combo.tier()).toBe(1.5)
  })

  it('[Boundary] decay 1500ms 도달 시 콤보 리셋', () => {
    const clock = new FakeClock()
    const combo = new Combo({ clock })
    for (let i = 0; i < 5; i++) combo.incrementOnKill()
    clock.advance(1501)
    expect(combo.tier()).toBe(1)
  })

  it('[Boundary] 늘어지는 회의 카드 보유 시 decay 2000ms', () => {
    const clock = new FakeClock()
    const combo = new Combo({ clock, decayMs: 2000 })
    for (let i = 0; i < 5; i++) combo.incrementOnKill()
    clock.advance(1999)
    expect(combo.tier()).toBe(1.5)
  })

  // [Error] IClock 미주입
  it('[Error] IClock 미주입 시 throw', () => {
    expect(() => new Combo({ clock: undefined as unknown as never }))
      .toThrow('IClock is required')
  })
})
```

---

## 4. 도구 스택

| 영역 | 도구 | 비고 |
|------|------|------|
| Test runner | **Vitest 2.x** | watch 8× 빠름, ESM 네이티브 |
| Canvas mock | **vitest-canvas-mock** | Phaser scene 단위 테스트 |
| Property-based | **fast-check 3.x + @fast-check/vitest** | seed=42, numRuns=1000 |
| E2E | **Playwright 1.48+** | Pixel 5 viewport (390×844) |
| Coverage | Vitest v8 provider | 내장 |
| Mutation | **Stryker 8.x + vitest-runner** | Domain ≥80%, Application ≥70% |
| Pre-commit | Husky + lint-staged | staged 파일만 검증 (선택) |

---

## 5. 레이어별 테스트 전략

| 레이어 | 종류 | 외부 의존성 처리 | 3 카테고리 | Mutation |
|--------|------|----------------|----------|----------|
| `domain/` | Pure Unit | Port mock (FakeClock, FakeRandom) | **필수 3개** | ≥80% |
| `application/` (Use Case) | Sociable Unit | Port를 `vi.fn()` stub | **필수 3개** | ≥70% |
| `adapters/persistence/` (LocalStorageSaveStore) | Contract test | jsdom localStorage | [Happy] + [Error] 필수 | — |
| `adapters/phaser/` (Scene, Object) | Smoke | vitest-canvas-mock | [Happy] 위주 | — |
| `infrastructure/` (SeededRandom, WebAudioSynth) | Integration | jsdom + Web Audio mock | [Happy] + [Error] | — |
| User Journey | E2E | Playwright + preview server | [Happy] 위주 (3개) | — |

### 도메인 객체 mock 금지

- Score, Combo, Wave 등 도메인 객체는 mock 금지 (실제 객체 사용)
- 외부 어댑터(localStorage, Web Audio, Vibration)만 Port mock 또는 jsdom

---

## 6. Property-based Test (fast-check)

```ts
// src/domain/score/score.prop.test.ts
import { describe, expect } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import { ScoreVO } from './score'

describe('Score property-based', () => {
  test.prop([fc.nat({ max: 100_000 })], { seed: 42, numRuns: 1000 })(
    '[Boundary] score는 임의의 자연수 누적 후에도 0 이상',
    (n) => {
      const score = ScoreVO.zero().add(n)
      expect(score.value()).toBeGreaterThanOrEqual(0)
    },
  )

  test.prop(
    [fc.array(fc.nat({ max: 1000 }), { minLength: 0, maxLength: 100 })],
    { seed: 42, numRuns: 1000 },
  )(
    '[Boundary] 어떤 누적 순서로도 최종 score = 단순 합',
    (deltas) => {
      const score = deltas.reduce((s, d) => s.add(d), ScoreVO.zero())
      const expected = deltas.reduce((a, b) => a + b, 0)
      expect(score.value()).toBe(expected)
    },
  )
})
```

### Property invariant 7개 (좀비팡 SSOT)

| # | Invariant | 도메인 |
|---|-----------|--------|
| 1 | `score ≥ 0` 항상 성립 | Score |
| 2 | Combo tier는 단조 증가하다 decay/miss에만 리셋 | Combo |
| 3 | `spawnRate(N ∈ [1,10]) ∈ [300, 1000]` ms | Wave |
| 4 | 처치 + 도주 = 스폰 | Spawner |
| 5 | 카드 3장 추첨: 중복 없음, 모두 풀에서 추출 | Meta |
| 6 | `streak ∈ [0,7]`, `coinMultiplier = 1 + 0.2 × streak` | DailyStreak |
| 7 | 동일 seed → 동일 spawn 시퀀스 (결정론) | SeededRandom |

---

## 7. Mutation Testing (Stryker)

```json
// stryker.config.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "mutate": [
    "src/domain/**/*.ts",
    "src/application/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.prop.test.ts"
  ],
  "testRunner": "vitest",
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": { "high": 90, "low": 70, "break": 70 },
  "incremental": true,
  "coverageAnalysis": "perTest"
}
```

### Mutation 예시

원본 코드:
```ts
if (this.kills >= 5) return 1.5
```

Stryker가 만든 mutant:
```ts
if (this.kills > 5) return 1.5       // mutant: >= → >
if (this.kills >= 4) return 1.5      // mutant: 5 → 4
if (this.kills >= 6) return 1.5      // mutant: 5 → 6
if (false) return 1.5                // mutant: condition → false
```

테스트가 위 mutant 4개를 모두 잡아내야 (kill) mutation score 100%.

`[Boundary] 5kill 정확히 ×1.5` 테스트가 있어야 `>= 5 → > 5` mutant를 잡습니다.

---

## 8. FakeClock + SeededRandom 패턴

```ts
// tests/fakes/fake-clock.ts
import type { IClock } from '@/domain/ports/clock.port'

export class FakeClock implements IClock {
  private t = 0
  now(): number { return this.t }
  monotonic(): number { return this.t }
  advance(ms: number): void { this.t += ms }
  set(ms: number): void { this.t = ms }
}

// tests/fakes/fake-random.ts
import type { IRandom } from '@/domain/ports/random.port'

export class FakeRandom implements IRandom {
  constructor(private values: number[]) {}
  private i = 0
  next(): number {
    const v = this.values[this.i % this.values.length]
    this.i += 1
    return v ?? 0
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
  pick<T>(arr: readonly T[]): T {
    const idx = Math.floor(this.next() * arr.length)
    if (arr.length === 0) throw new Error('empty array')
    return arr[idx] as T
  }
}
```

---

## 9. grep 검증 (자율 실행 강제)

각 Task 종료 시 `rl-verify`가 grep으로 3 카테고리 라벨 확인:

```bash
# Task C-3a 예시: Score / Combo
grep -c "\[Happy\]\|\[Boundary\]\|\[Error\]" src/domain/score/*.test.ts
# 기대: SUT 3개 × 3 카테고리 = 최소 9개
```

---

## 10. Anti-pattern 8개

| 안티패턴 | 이유 | 대체 |
|---------|------|------|
| `[Happy]`만 작성 후 GREEN 진입 | 회귀 위험 폭증 | 3 카테고리 RED 강제 |
| `expect(combo['kills']).toBe(5)` | 구현 디테일 결합 (private 접근) | `expect(combo.tier()).toBe(1.5)` |
| `vi.mock('@/domain/score/combo')` | 도메인 객체 mock 금지 | 실제 Combo 인스턴스 사용 |
| Snapshot 남용 | 의도 없는 변경에 깨짐 | 직렬화 출력에만 제한 |
| `Math.random()` in test | 비결정론 | FakeRandom 주입 |
| `setTimeout(..., 1500)` 실제 대기 | 테스트 30분+ | FakeClock.advance(1500) |
| `it('test 1', ...)` 모호한 이름 | 실패 시 의도 불명 | `it('[Happy] ...', ...)` 라벨 + 의도 |
| Coverage 100% 신화 | assertion 없는 테스트도 100% | mutation score로 검증 |

---

## 11. CI / Task 종료 게이트

```bash
# 모든 Task 종료 직전 자동 실행 (rl-verify가 호출)
pnpm typecheck                              # exit 0
pnpm lint                                   # exit 0
pnpm test                                   # exit 0 + per-path threshold
pnpm test:prop                              # exit 0
pnpm test:mutation                          # Domain ≥80%, App ≥70%

# grep 검증
grep -rc "\[Happy\]" src/**/*.test.ts       # ≥ SUT 수
grep -rc "\[Boundary\]" src/**/*.test.ts    # ≥ SUT 수
grep -rc "\[Error\]" src/**/*.test.ts       # ≥ SUT 수 (사유 명시 시 면제)
```

---

## 12. 12살 비유 (Kent C. Dodds 인용)

> 자동차를 만들 때 **시동 거는 부분(Happy)** 만 테스트하면 안 됩니다.
> **연료 0일 때(Boundary)**, **연료가 -10일 때(Error)** 도 함께 테스트해야 진짜 안전한 차입니다.
>
> 좀비팡에서:
> - **Happy**: 좀비 잡으면 점수 +100
> - **Boundary**: 정확히 5킬째 콤보가 ×1.5 되는지, 1499ms vs 1500ms decay 경계
> - **Error**: localStorage가 꽉 차 있을 때, 좀비 도주가 음수일 때, Vibration 없는 기기
>
> **Property-based** = 무작위 1000번 시험. "점수는 어떤 입력이든 음수 안 되는지" 1000번 다른 입력으로 확인.
> **Mutation** = 테스트 자체를 의심. 코드의 `>=`을 `>`로 바꿔봤을 때 테스트가 실패하는지. 통과하면 그 테스트는 *무의미*.

---

## 13. References

- Kent Beck — *Test-Driven Development: By Example*
- Kent C. Dodds — [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- Martin Fowler — [Is TDD Dead?](https://martinfowler.com/articles/is-tdd-dead/)
- fast-check 공식: https://fast-check.dev/
- Stryker Mutator: https://stryker-mutator.io/
- 본 프로젝트 ADR: `docs/adr/0004-tdd.md`
- 글로벌 룰: `~/.claude/CLAUDE.md` (3 카테고리 룰 원본)
- 본 문서와 충돌 시 우선순위: `Bible > ADR > 본 문서 > Code`
