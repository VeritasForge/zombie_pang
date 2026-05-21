# TypeScript Conventions for 좀비팡

본 프로젝트 TypeScript 작성 규칙. 모든 코드는 이 컨벤션을 따라야 하며, 새 파일 작성 전 본 문서를 읽고 확인할 것.

> **상위 SSOT**: `docs/adr/0003-coding-conventions.md` (정식 박제)
> 본 문서는 **상세 가이드 + 좀비팡 도메인 예제**입니다.

---

## 1. tsconfig.json 핵심 옵션 (강제)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,

    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,

    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 옵션 체크리스트

| 옵션 | 기본 | 좀비팡 | 사유 |
|------|------|--------|------|
| `strict` | false | **true** | 모든 strict 옵션 일괄 활성화 |
| `noUncheckedIndexedAccess` | false | **true** | `arr[i]` 결과는 `T \| undefined`로 좁힘 → narrowing 강제 |
| `exactOptionalPropertyTypes` | false | **true** | `{ x?: string }` 에 `{ x: undefined }` 대입 금지 |
| `noImplicitOverride` | false | **true** | Phaser scene `override create()` 누락 차단 |
| `noFallthroughCasesInSwitch` | false | **true** | switch fall-through 차단 (좀비 4종 분기 안전) |
| `useUnknownInCatchVariables` | true (TS 4.4+) | **true** | catch (e: unknown) 강제 |
| `noUnusedLocals` | false | **true** | dead code 차단 |
| `noUnusedParameters` | false | **true** | unused param `_` prefix 강제 |
| `verbatimModuleSyntax` | false | **true** | `import type` / `import` 분리 강제 |

---

## 2. `type` vs `interface`

| 선택 | 사용처 |
|------|--------|
| `type` (기본) | 거의 모든 경우 — 도메인 모델, props, 유니온, 함수 시그니처, branded types |
| `interface` | **Port 인터페이스** (`I-` prefix), 라이브러리 공개 API, 의도적으로 declaration merging이 필요한 경우 |

**이유**: declaration merging은 의도하지 않은 확장의 원인 (Matt Pocock, Total TypeScript 권고).

```ts
// 좀비팡 도메인 — type 기본
type Zombie = {
  readonly id: ZombieId
  readonly type: ZombieType
  readonly hp: number
  readonly position: { x: number; y: number }
}

// 좀비팡 Port — interface 사용
interface IRandom {
  next(): number
  range(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
}
```

---

## 3. `enum` 금지 — `as const` + 유니온

```ts
// 금지
enum ZombieType {
  Intern = 'INTERN',
  Middle = 'MIDDLE',
}

// 권장
export const ZOMBIE_TYPE = {
  INTERN: 'INTERN',
  MIDDLE: 'MIDDLE',
  LEAD: 'LEAD',
  CEO: 'CEO',
} as const

export type ZombieType = (typeof ZOMBIE_TYPE)[keyof typeof ZOMBIE_TYPE]
// 'INTERN' | 'MIDDLE' | 'LEAD' | 'CEO'
```

**이유**: `enum`은 런타임 코드 생성, tree-shaking 방해, `const enum`과 혼란.

좀비팡에서 자주 쓰는 union:

```ts
// SFX layer
export const SFX_LAYER = {
  L1_IMPACT: 'L1_IMPACT',
  L2_GROAN: 'L2_GROAN',
  L3_CRIT: 'L3_CRIT',
  L4_PANG: 'L4_PANG',
  L5_POWERUP: 'L5_POWERUP',
  L6_WAVE_CLEAR: 'L6_WAVE_CLEAR',
  L7_HIT: 'L7_HIT',
} as const
export type SfxLayer = (typeof SFX_LAYER)[keyof typeof SFX_LAYER]

// Power-up type
export const POWERUP_TYPE = {
  BOMB: 'BOMB',
  FREEZE: 'FREEZE',
  MAGNET: 'MAGNET',
} as const
export type PowerUpType = (typeof POWERUP_TYPE)[keyof typeof POWERUP_TYPE]

// Card category
export const CARD_CATEGORY = {
  DAMAGE: 'DAMAGE',
  CRIT: 'CRIT',
  DURATION: 'DURATION',
  COIN_GAIN: 'COIN_GAIN',
  SPECIAL: 'SPECIAL',
} as const
export type CardCategory = (typeof CARD_CATEGORY)[keyof typeof CARD_CATEGORY]
```

---

## 4. `any` 금지 — `unknown` + narrowing

```ts
// 금지
function parse(data: any) { return data.foo }

// 권장
function parse(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'foo' in data && typeof data.foo === 'string') {
    return data.foo
  }
  throw new TypeError('Invalid input')
}

// catch에서 unknown
try { saveStore.save('runState', json) }
catch (e: unknown) {
  if (e instanceof StoreQuotaError) {
    // graceful degrade — 메모리만 유지
  } else {
    throw e
  }
}
```

---

## 5. Branded Types — 도메인 식별자 강제

좀비팡은 도메인 식별자 8종을 branded type으로 강제합니다.

```ts
// src/shared/types/branded.ts
declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }

export type Score = Brand<number, 'Score'>
export type Coin = Brand<number, 'Coin'>
export type ZombieId = Brand<string, 'ZombieId'>
export type CardId = Brand<string, 'CardId'>
export type FloorNumber = Brand<number, 'FloorNumber'>     // 1~50
export type ChapterNumber = Brand<number, 'ChapterNumber'> // 1~5
export type WaveNumber = Brand<number, 'WaveNumber'>       // 1~10
export type StreakDays = Brand<number, 'StreakDays'>       // 0~7

// 캐스팅 함수 (검증 포함)
export const asScore = (n: number): Score => {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`Invalid Score: ${n}`)
  return n as Score
}

export const asFloorNumber = (n: number): FloorNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new RangeError(`Invalid FloorNumber: ${n}`)
  return n as FloorNumber
}

export const asChapterNumber = (n: number): ChapterNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new RangeError(`Invalid ChapterNumber: ${n}`)
  return n as ChapterNumber
}

export const asStreakDays = (n: number): StreakDays => {
  if (!Number.isInteger(n) || n < 0 || n > 7) throw new RangeError(`Invalid StreakDays: ${n}`)
  return n as StreakDays
}
```

### 사용 예시

```ts
// 함수 시그니처에서 swap 실수 차단
function spawnZombie(floor: FloorNumber, wave: WaveNumber): ZombieId {
  return crypto.randomUUID() as ZombieId
}

// 호출자
const id = spawnZombie(asFloorNumber(15), asWaveNumber(5))
// id의 타입은 ZombieId — string으로 swap 불가

// compile error 발생 케이스
spawnZombie(asWaveNumber(5), asFloorNumber(15))  // 인자 swap → 컴파일 거부
```

---

## 6. 에러 처리 — Discriminated Union (Use Case 반환용)

```ts
// src/shared/types/result.ts
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// 사용
export function makeStartRun({ saveStore }: Deps) {
  return (): Result<RunState, 'LOAD_FAILED'> => {
    try {
      const json = saveStore.load('runState')
      const state = json ? JSON.parse(json) : initialRunState()
      return { ok: true, value: state }
    } catch {
      return { ok: false, error: 'LOAD_FAILED' }
    }
  }
}
```

**이유**: `neverthrow`의 `Result` 클래스 인스턴스는 직렬화 시 메서드가 사라짐. discriminated union이 호환.

---

## 7. Import 순서 (Biome `organizeImports` 자동)

```ts
// 1. Node built-in (Node 환경에서만)
import { readFile } from 'node:fs/promises'

// 2. External
import Phaser from 'phaser'
import { fc, test } from '@fast-check/vitest'

// 3. Internal alias (@/*)
import type { IRandom, IClock } from '@/domain/ports/random.port'
import { Score } from '@/domain/score/score'

// 4. 상대 경로
import { CONFIG } from './config'
```

- `import type` 분리 강제 (`verbatimModuleSyntax: true` + Biome `useImportType`)
- Barrel files (`index.ts` re-export) **금지**

---

## 8. Export — Named 강제

```ts
// 권장
export function killZombie() { /* */ }
export class Combo { /* */ }
export const SPAWN_RATE_INITIAL = 1000
export type KillZombieResult = { /* */ }

// 금지
export default function killZombie() { /* */ }
```

**예외**: 없음 (Phaser scene 클래스도 named export 강제).

---

## 9. Barrel Files 금지

```ts
// src/domain/score/index.ts (만들지 말 것)
export * from './score'
export * from './combo'

// 직접 경로
import { Score } from '@/domain/score/score'
import { Combo } from '@/domain/score/combo'
```

**이유**: Vite tree-shaking에 방해 + import 그래프 추적 어려움.

---

## 10. 좀비팡 도메인 타입 예제

### Score VO

```ts
// src/domain/score/score.ts
import { asScore, type Score } from '@/shared/types/branded'

export class ScoreVO {
  private constructor(private readonly _value: Score) {}

  static zero(): ScoreVO { return new ScoreVO(asScore(0)) }
  static from(n: number): ScoreVO { return new ScoreVO(asScore(n)) }

  add(delta: number): ScoreVO {
    if (delta < 0) throw new RangeError('Score delta must be non-negative')
    return new ScoreVO(asScore(this._value + delta))
  }

  value(): Score { return this._value }
}
```

### Combo VO (IClock 주입)

```ts
// src/domain/score/combo.ts
import type { IClock } from '@/domain/ports/clock.port'

export type ComboTier = 1 | 1.5 | 2 | 3

export class Combo {
  private kills = 0
  private lastKillAt = 0
  private decayMs = 1500

  constructor(private readonly deps: { clock: IClock; decayMs?: number }) {
    if (deps.decayMs !== undefined) this.decayMs = deps.decayMs
  }

  incrementOnKill(): void {
    const now = this.deps.clock.monotonic()
    if (now - this.lastKillAt > this.decayMs) this.kills = 0
    this.kills += 1
    this.lastKillAt = now
  }

  tier(): ComboTier {
    const now = this.deps.clock.monotonic()
    if (now - this.lastKillAt > this.decayMs) return 1
    if (this.kills >= 15) return 3
    if (this.kills >= 10) return 2
    if (this.kills >= 5) return 1.5
    return 1
  }
}
```

---

## 11. 안티패턴 요약

| 안티패턴 | 대체 |
|---------|------|
| `enum X { ... }` | `as const` 객체 + union 추출 |
| `any` | `unknown` + narrowing |
| `interface` 기본 사용 | `type` 기본 (port만 interface) |
| default export | named export |
| `index.ts` barrel re-export | 직접 경로 |
| `score: number` 직접 사용 | `Score` branded |
| `throw new Error('msg')` (use case) | `Result<T, E>` discriminated union |
| `setTimeout(...)` (도메인) | `IClock` Port 주입 |
| `Math.random()` (도메인) | `IRandom` Port 주입 |
| `localStorage.setItem(...)` (도메인) | `ISaveStore` Port 주입 |
| catch에서 `e: any` | `e: unknown` + `instanceof` narrowing |
| Phaser scene에서 직접 게임 규칙 작성 | use case 호출만 |

---

## 12. References

- TypeScript 공식 핸드북
- Matt Pocock — [Type vs Interface](https://www.totaltypescript.com/type-vs-interface-which-should-you-use)
- [@tsconfig/strictest](https://www.npmjs.com/package/@tsconfig/strictest)
- 본 프로젝트 ADR: `docs/adr/0003-coding-conventions.md`
- 본 프로젝트 SSOT: `docs/game-design/bible.md`
- 본 문서와 충돌 시 우선순위: `Bible > ADR > 본 문서 > Code`
