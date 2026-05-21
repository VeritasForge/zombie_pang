# ADR 0003: TypeScript Strict + Biome 단일 + kebab-case + Named Export + Branded Types

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: Phase A 컨센서스 + Project Owner

---

## Context

좀비팡 코드베이스는 다음 조건을 만족해야 합니다.

1. **타입 안전성 최대화** — domain 모델(Score, Combo, Wave, ZombieId, CardId, Coin 등) swap 실수 방지
2. **단일 도구로 lint + format** — ESLint + Prettier 조합의 설정 충돌 / 빌드 속도 저하 회피
3. **AI 에이전트 친화** — Claude Code / Cursor / Codex 등이 파일명/export 패턴을 추측 없이 정확히 생성 가능
4. **Phaser 코드베이스 일관성** — Scene/Object/Manager가 일정한 명명 규칙

---

## Decision

### 5개 컨벤션

1. **TypeScript strict** (`strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes` 모두 활성화)
2. **Biome 단일 도구** (ESLint + Prettier 비채택)
3. **파일명 kebab-case** (`kill-zombie.ts`, `local-storage-save-store.ts`)
4. **Named export 강제** (default export 금지)
5. **Branded types** for domain identifiers (`Score`, `Coin`, `ZombieId`, `FloorNumber`, `ChapterNumber`)

### tsconfig.json 핵심 옵션

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Branded Types 예시

```ts
// shared/types/branded.ts
declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }

export type Score = Brand<number, 'Score'>
export type Coin = Brand<number, 'Coin'>
export type ZombieId = Brand<string, 'ZombieId'>
export type FloorNumber = Brand<number, 'FloorNumber'>     // 1~50
export type ChapterNumber = Brand<number, 'ChapterNumber'> // 1~5
export type WaveNumber = Brand<number, 'WaveNumber'>       // 1~10
export type CardId = Brand<string, 'CardId'>
export type StreakDays = Brand<number, 'StreakDays'>       // 0~7

export const asScore = (n: number): Score => {
  if (n < 0 || !Number.isFinite(n)) throw new RangeError(`Invalid Score: ${n}`)
  return n as Score
}

export const asFloorNumber = (n: number): FloorNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new RangeError(`Invalid FloorNumber: ${n}`)
  return n as FloorNumber
}
```

---

## Alternatives

### ESLint + Prettier vs Biome

| 기준 | ESLint + Prettier | Biome 1.9 |
|------|-------------------|-----------|
| 설정 파일 수 | 2~3개 (.eslintrc + .prettierrc + tsconfig) | 1개 (biome.json) |
| 빌드 속도 | ~5초 (typescript-eslint + prettier-plugin) | ~0.3초 (Rust 구현) |
| 충돌 가능성 | `eslint-config-prettier` 등 어댑터 필요 | 단일 도구로 충돌 없음 |
| 플러그인 생태계 | 풍부 (3000+ 플러그인) | 적음 (공식 룰만, 추가 룰 작성 어려움) |
| TypeScript 지원 | 1급 (@typescript-eslint) | 1급 (내장) |
| 사용 사례 | 거대 (90%+ JS/TS 프로젝트) | 신생 (Next.js 등 공식 채택) |
| AI 에이전트 친화 | 보통 (설정 복잡, 룰 충돌 시 디버깅 부담) | 우수 (단일 명령, 단일 설정) |

**Biome 채택**: 빌드 속도 + 단일 설정 + AI 친화. 좀비팡은 좁은 도메인 + 명확한 컨벤션이므로 풍부한 룰 생태계 불필요.

### Default export vs Named export

| 패턴 | 장점 | 단점 |
|------|------|------|
| Default export | import 시 이름 자유 | 리네임 추적 어려움 / 자동 import 부정확 / barrel과 충돌 |
| Named export | tooling 친화 (자동 import 정확) / 리네임 추적 가능 | import 보일러플레이트 약간 |

**Named export 강제**: AI 에이전트가 정확히 자동 import 가능, refactor 안전.

### Branded Types vs 일반 number/string

| 패턴 | 장점 | 단점 |
|------|------|------|
| 일반 `number` | 간단 | `addScore(score, comboKills)` 등에서 swap 실수 (둘 다 number) |
| Branded `Score \| Coin` | swap 실수 compile-time 차단 | `as Score` 캐스팅 함수 1개 필요 |

**Branded types 채택**: 좀비팡 도메인 식별자 8종(`Score`, `Coin`, `ZombieId`, `FloorNumber`, `ChapterNumber`, `WaveNumber`, `CardId`, `StreakDays`) — swap 실수 위험 크고 비용 낮음.

---

## Consequences

### 긍정적

1. **AI 에이전트 자율 코드 작성 정확도 향상** — 파일명/export 패턴이 결정적
2. **빌드 속도** — Biome ~0.3초 (ESLint ~5초 대비)
3. **swap 실수 차단** — `playSound(zombieId)` 자리에 `playSound(cardId)` 넣으면 compile error
4. **단일 설정 파일** (`biome.json`) — onboarding 비용 ↓

### 부정적

1. **Biome 플러그인 부족** — 커스텀 룰 추가 어려움 (예: 좀비팡 도메인 전용 룰). 현재까지 표준 룰로 충분
2. **branded type 캐스팅 함수 추가 부담** — `asScore()`, `asCoin()` 등. 도메인 컨스트럭터에 검증과 함께 흡수 가능
3. **kebab-case + PascalCase 혼합** — 파일은 kebab, export는 Pascal/camel — 학습 곡선 약간 (자동화로 해결)

---

## 12살 비유

> 좀비팡 코드는 **약속이 많은 도서관**입니다.
>
> - **kebab-case 파일명** = 책 표지에 *작은 알파벳*으로 통일된 제목 (찾기 쉬움)
> - **Named export** = 책에 *이름표*가 붙어 있어서 어떤 책인지 명확
> - **Branded types** = "이 책은 *과학책*"이라고 표시되어 있어서 *동화책* 자리에 잘못 꽂으면 알람이 울림
> - **TypeScript strict** = 책 빌릴 때 *대출증* 없으면 빌릴 수 없는 규칙
> - **Biome** = 도서관 사서 *한 명*이 책 정리 + 검수 + 청소를 다 함 (ESLint 정리 사서 + Prettier 청소 사서 따로 두지 않음)

---

## References

- TypeScript 공식 핸드북
- Matt Pocock — [Type vs Interface](https://www.totaltypescript.com/type-vs-interface-which-should-you-use)
- [Biome 공식](https://biomejs.dev/)
- [@tsconfig/strictest](https://www.npmjs.com/package/@tsconfig/strictest)
- 본 프로젝트 TypeScript 컨벤션: `docs/conventions/typescript.md`
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code`
