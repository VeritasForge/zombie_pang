# 좀비팡 (Off-Clock Pang) — Agent Instructions

본 파일은 모든 AI 코딩 에이전트(Claude Code, Cursor, GitHub Copilot, Codex, Gemini, Windsurf 등)가 읽는 **Single Source of Truth (SSOT)** 입니다.
`AGENTS.md`, `.github/copilot-instructions.md`는 이 파일의 심링크입니다. 내용은 여기에만 작성하세요.

> **상위 SSOT**: 본 파일과 `docs/game-design/bible.md` (Phase A-8 산출물)가 충돌하면 **Bible이 우선**합니다.
> 본 파일과 코드가 충돌하면 **코드를 본 파일에 맞춥니다**.

---

## 1. Project Overview

- **무엇**: 50층 좀비 사옥에서 야근을 끝내고 옥상까지 올라가 퇴근하는 **B급 코믹 호러 PWA 캐주얼 액션**. 한 손 30~60초 마이크로세션.
- **한 줄 컨셉**: *"당신은 마지막 사원이다. 50층 좀비 사옥에서 야근을 끝내고 옥상까지 올라가 퇴근하라."*
- **장르**: PWA 캐주얼 액션 (수직 진행 tap-to-defeat) — 한국+글로벌 모바일 18~35세
- **현재 단계**: **MVP 개발 (Phase C)** — 5챕터(난이도 밴드) × 10층 = 50층 완주, 좀비 4종(CEO는 탱커 필드 좀비), Power-up 3종(발동 배선 완료), 오프라인 전 기능. 카드 15장·출근 도장은 웨이브 클리커 단순화(ADR-0015)로 제거됨.
- **루트**: `/Users/cjynim/lab/zombie_pang`
- **핵심 차별점** (ADR-0015 갱신, 2026-07-20 — 웨이브 클리커 단순화로 보스전·메타 카드·서사 연출 제거):
  1. 좀비를 탭해서 처치하며 층을 오르는 웨이브 클리커 — 층별 처치 목표(quota) 클리어 / 도주 한도 초과 시 실패
  2. 언제든 *정시 퇴근* 버튼으로 현재 점수 종료 가능, 계속 진행과 동등 가중치
  3. Notification·광고 0, FOMO 트리거 0 (Ethics-aware game design)
  4. PWA 단일 배포, 5초 로딩, 오프라인 전 기능

### 12살 비유

> 좀비팡은 **점심도시락**입니다. 정해진 양이 있고, 다 먹으면 끝납니다. 무한 리필 뷔페(Candy Crush 무한 retention)가 아닙니다.
> "오늘은 여기까지 해도 충분합니다" — 게임이 *끝난다*는 약속이 핵심입니다.

---

## 2. Tech Stack

| # | 영역 | 선택 | 이유 |
|---|------|------|------|
| 1 | **Engine** | Phaser 3.80+ | 2D HTML5 게임 엔진 1위, TypeScript 1급, 모바일 PWA 친화, MIT |
| 2 | **Language** | TypeScript 5.6+ (strict + `noUncheckedIndexedAccess`) | 타입 안전성, 도메인 모델 brand types, 결정론 강제 |
| 3 | **Bundler** | Vite 5.x | ESM 네이티브, Phaser 공식 template-vite-ts 채택, HMR <50ms |
| 4 | **Test (Unit)** | Vitest 2.x + vitest-canvas-mock | Vite 통합, ESM, watch 8x 빠름, Phaser canvas mock |
| 5 | **Property-based** | fast-check 3.x + @fast-check/vitest | invariant 1000회 검증, 결정론 RNG/Clock 친화 |
| 6 | **Mutation** | Stryker 8.x + @stryker-mutator/vitest-runner | meaningful coverage, 도메인 ≥80% 강제 |
| 7 | **PWA** | vite-plugin-pwa 0.20+ + Workbox | Service Worker autoUpdate, precache, iOS Safari 호환 |
| 8 | **Linter/Formatter** | Biome 1.9+ | ESLint+Prettier 단일 대체, 빠른 Rust 구현 |
| 9 | **E2E** | Playwright 1.48+ | 다중 브라우저, Pixel 5 viewport 390×844 시뮬레이션 |
| 10 | **Package Manager** | pnpm 9.x (engines.pnpm ≥9) | 빠른 설치, 디스크 효율, workspace 미사용 |
| 11 | **Architecture** | Hexagonal 4계층 (domain/application/adapters/infrastructure) | DIP로 Phaser/DOM 외부화 → TDD 효율 |
| 12 | **RNG** | `SeededRandom` (infra) + `IRandom` Port (domain) | 결정론 테스트 + property-based seed=42 재현 가능 |
| 13 | **Audio** | Web Audio API 합성 (외부 사운드 파일 0) | 라이선스 리스크 0, 자산 < 3MB, Bible §5 4-layer SFX |

**의도적 미채택**: React/Vue (Phaser scene으로 충분), Three.js/Babylon (3D 불필요), Cocos2d (TS 지원 약함), ESLint+Prettier (Biome 단일화), Jest (Vitest로 대체), 외부 이미지/사운드 (Graphics + 합성음).

---

## 3. Commands

```bash
pnpm install              # 의존성 설치 (lockfile 단일화)
pnpm dev                  # Vite dev 서버 (http://localhost:5173)
pnpm build                # tsc -b && vite build → dist/
pnpm preview              # dist/ 미리보기 (port 4173)

pnpm typecheck            # tsc -b --noEmit (strict + noUncheckedIndexedAccess)
pnpm lint                 # biome check src tests (자동 수정 포함)
pnpm format               # biome format --write src tests

pnpm test                 # vitest run --coverage (unit + integration)
pnpm test:watch           # vitest (watch 모드)
pnpm test:prop            # vitest run **/*.prop.test.ts (fast-check property-based)
pnpm test:mutation        # stryker run (도메인 모듈 mutation testing)
pnpm test:e2e             # playwright test (Pixel 5 viewport)

pnpm lighthouse           # lhci autorun (PWA ≥90, Performance ≥80)
pnpm size                 # dist/ 사이즈 확인 (< 1.5MB gzip 목표)
```

### 검증 게이트 (Phase C 종료 조건)

모든 명령이 **exit 0**이어야 완료로 인정합니다.

| 단계 | 임계 |
|------|------|
| typecheck | error 0 (no `any`) |
| lint | error 0 |
| test | domain 100% / application 95% / adapters/persistence 90% / adapters/phaser 70% / infrastructure 80% / shared 100% |
| test:prop | seed=42, numRuns=1000, invariant 0건 실패 |
| test:mutation | domain ≥80%, application ≥70% |
| build | dist/ 생성, gzip < 1.5MB |
| test:e2e | 3개 시나리오 통과 (30초 플레이 / wave10 보스 / 메타 카드) |
| lighthouse | PWA ≥90, Performance ≥80, Installable true |

---

## 4. Architecture

**Hexagonal 4계층 + Phaser는 Adapter** (자세한 내용은 `docs/adr/0001-architecture.md`, `docs/architecture/hexagonal-game.md`).

```
┌──────────────────────────────────────────────────────────────┐
│ 외부 세계 (Browser / iOS Safari / localStorage / Audio API)  │
├──────────────────────────────────────────────────────────────┤
│ infrastructure/   (Composition root, 외부 API 래퍼)          │
│   SeededRandom / SystemClock / WebAudioSynth / VibrationApi  │
│   PWA (register-sw / install-prompt / midnight-cue)          │
│   container.ts ←── 모든 Port 구현체 wiring                    │
└──────────────┬───────────────────────────────────────────────┘
               │ Port 구현체 주입
┌──────────────▼───────────────────────────────────────────────┐
│ adapters/         (Phaser UI / persistence)                  │
│   phaser/scenes/{boot, preload, main-menu, game, hud, end}   │
│   phaser/objects/{zombie, particle, upgrade-card, boss}      │
│   phaser/managers/{audio, juice}                             │
│   persistence/local-storage-save-store.ts                    │
└──────────────┬───────────────────────────────────────────────┘
               │ application use case 호출
┌──────────────▼───────────────────────────────────────────────┐
│ application/      (use case 함수)                            │
│   start-run / kill-zombie / apply-powerup                    │
│   pick-upgrade / end-chapter / end-run                       │
└──────────────┬───────────────────────────────────────────────┘
               │ domain 순수 규칙 실행
┌──────────────▼───────────────────────────────────────────────┐
│ domain/           (POJO + Port interface, 외부 의존성 0)     │
│   score/ combo / wave / spawner / zombie-type                │
│   powerup/ powerup-drop / powerup-stack                      │
│   meta/ card / card-draw / unlock / daily-streak             │
│   run/ chapter / floor / boss                                │
│   ports/ random / clock / save-store / audio / haptic        │
└──────────────────────────────────────────────────────────────┘
의존성 방향:  domain ←─ application ←─ adapters/infrastructure
```

**의존성 규칙 (DIP)**: `domain`은 어떤 것도 import하지 않습니다. Port는 `domain/ports/`에 interface로 선언하고, 구현은 `infrastructure/`에서 합니다. Phaser/DOM/localStorage/Web Audio는 모두 Adapter 뒤에 숨깁니다.

### 12살 비유

> 게임을 **레고**로 만든다고 생각해보세요.
> - **domain** = 레고 설명서 (어떻게 조립해야 하는지 규칙만 적힌 책)
> - **application** = 레고 조립을 진행하는 매뉴얼 (절차)
> - **adapters** = 진짜 레고 블록을 손에 쥐고 끼우는 사람
> - **infrastructure** = 레고 박스, 카운터, 부품 공급처
>
> 설명서(domain)는 빨간 블록이든 파란 블록이든 동일합니다. Phaser 대신 Pixi로 바꿔도 설명서는 그대로입니다.

---

## 5. Coding Conventions

상세: `docs/conventions/typescript.md`, `docs/conventions/phaser.md`, `docs/conventions/folder-structure.md`, `docs/adr/0003-coding-conventions.md`.

### 파일 / Export

- 파일명: **kebab-case** (`kill-zombie.ts`, `local-storage-save-store.ts`)
- export: **named export 강제** (default export 금지)
- export 케이스: 컴포넌트/클래스 PascalCase / 함수 camelCase / 상수 UPPER_SNAKE_CASE
- Barrel files (`index.ts` re-export) **금지**

### TypeScript

- `type` 기본, `interface`는 Port 인터페이스 + 라이브러리 공개 API에만
- `enum` **금지** → `as const` 객체 + union 추출
- `any` **금지** → `unknown` + narrowing
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`

### Branded Types (좀비팡 도메인)

```ts
// shared/types/branded.ts
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type Score = Brand<number, 'Score'>;
export type Coin = Brand<number, 'Coin'>;
export type FloorNumber = Brand<number, 'FloorNumber'>;   // 1~50
export type ChapterNumber = Brand<number, 'ChapterNumber'>; // 1~5
export type WaveNumber = Brand<number, 'WaveNumber'>;     // 1~10
export type ZombieId = Brand<string, 'ZombieId'>;
export type CardId = Brand<string, 'CardId'>;
export type StreakDays = Brand<number, 'StreakDays'>;     // 0~7
```

### 좀비팡 게임 도메인 네이밍 매트릭스

| 종류 | 파일 케이스 | export 케이스 | 예시 |
|------|-------------|---------------|------|
| Domain VO / Entity | kebab-case.ts | PascalCase | `score.ts` → `export class Score` |
| Port | kebab-case.port.ts | I-prefix interface | `random.port.ts` → `export interface IRandom` |
| Use Case | kebab-case.ts | camelCase verb | `kill-zombie.ts` → `export function killZombie()` |
| Adapter | kebab-case.ts | PascalCase class | `local-storage-save-store.ts` → `class LocalStorageSaveStore` |
| Phaser Scene | kebab-case.scene.ts | PascalCase + Scene suffix | `game.scene.ts` → `class GameScene extends Phaser.Scene` |
| Phaser Object | kebab-case.object.ts | PascalCase + GameObject | `zombie.object.ts` → `class ZombieObject extends Phaser.GameObjects.Container` |
| Manager | kebab-case.manager.ts | PascalCase + Manager | `audio.manager.ts` → `class AudioManager` |
| Constants | kebab-case.ts | UPPER_SNAKE_CASE | `spawn-rates.ts` → `export const SPAWN_RATE_INITIAL = 1000` |
| Test | `*.test.ts` | - | `score.test.ts` |
| Property Test | `*.prop.test.ts` | - | `score.prop.test.ts` |

### Import 순서 (Biome `organizeImports` 자동)

```ts
// 1. external
import Phaser from 'phaser'
import { fc, test } from '@fast-check/vitest'

// 2. internal alias (@/)
import type { IRandom } from '@/domain/ports/random.port'
import { Score } from '@/domain/score/score'

// 3. relative
import { CONFIG } from './config'
```

---

## 6. Testing — TDD + Property + Mutation (핵심)

상세: `docs/conventions/testing.md`, `docs/adr/0004-tdd.md`.

### 6.1 3 카테고리 룰 (강제)

모든 RED phase는 `[Happy]/[Boundary]/[Error]` 각 ≥1개 포함. PR/Task 종료 시 `grep -c` 검증.

| 카테고리 | 좀비팡 예시 |
|---------|------------|
| `[Happy]` | combo 5kill 후 ×1.5 승급 / Power-up 정상 발동 / wave 10 도달 시 CEO 보스 등장 |
| `[Boundary]` | combo decay 정확히 1500ms / spawn rate 하한 300ms / 좀비 도주 4→5 fail 경계 / streak 7→8일 (상한+휴식 모달) / coin 0/1/9999 / Power-up 동시 활성 1→2→3 (한도) / freeze-frame 0/599/600/601ms |
| `[Error]` | localStorage quota 초과 → graceful degrade / Vibration API 미지원 → no-op / RNG seed 미주입 → throw / 잘못된 power-up 타입 / negative score 시도 / 도주 누적이 음수 |

### 6.2 커버리지 매트릭스 (per-path threshold)

| 레이어 | Line | Branch | Function | Statement | 추가 검증 |
|--------|------|--------|----------|-----------|----------|
| `domain/` | **100%** | **100%** | **100%** | **100%** | Mutation ≥ 80%, fast-check invariant |
| `application/` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Mutation ≥ 70%, Port mock 주입 |
| `adapters/persistence/` | ≥ 90% | ≥ 85% | ≥ 90% | ≥ 90% | Contract test |
| `adapters/phaser/` | ≥ 70% | ≥ 60% | ≥ 70% | ≥ 70% | jest-canvas-mock smoke |
| `infrastructure/` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% | SW precache 검증, graceful fallback |
| `shared/` | **100%** | **100%** | **100%** | **100%** | Branded types, helpers |

### 6.3 Property-based Invariant 6개 (seed=42, numRuns=1000) — ADR-0015 갱신

보스 HP 곡선(#3.84 등), 챕터 카드 3장 균등 추첨, Daily Streak 곡선 invariant는 대상 도메인(`domain/boss/*`, `domain/meta/*`)이 웨이브 클리커 단순화로 삭제되어 제거되었다. 상세: `docs/adr/0015-wave-clicker-simplification.md`.

| # | Invariant | 도메인 |
|---|-----------|--------|
| 1 | `score ≥ 0` 항상 성립 | Score |
| 2 | Combo tier는 단조 증가하다 decay/miss에만 리셋 | Combo |
| 3 | 임의의 floor F (1~50)에 대해 `floorPlan(F).quota`는 단조 증가 | FloorPlan |
| 4 | 임의의 floor F (1~50)에 대해 `floorPlan(F).spawnRateMs ∈ [300, 1000]` ms | FloorPlan |
| 5 | 임의의 floor F (1~50)에 대해 `floorPlan(F).cap ∈ [1, CAP_MAX]`(clamp) | FloorPlan |
| 6 | 동일 seed → 동일 spawn 시퀀스 (결정론) | SeededRandom |

추가 invariant: Power-up 동시 활성 ≤ 2(`MAX_CONCURRENT_EFFECTS`) / `dropOnKill` 결과는 항상 `{bomb, freeze, magnet, null}` 중 하나.

### 6.4 Mutation Score 임계

```
Domain      ≥ 80%   (break threshold)
Application ≥ 70%
```

### 6.5 Testing Trophy

```
            ┌──────────┐
           /    E2E     \      10% — Playwright (3 시나리오)
          /──────────────\
         / Integration    \    50% — adapters + use case (vitest-canvas-mock)
        /──────────────────\
       /       Unit         \  30% — domain + application
      /──────────────────────\
     /        Static          \ 10% — TypeScript strict + Biome + tsc --noEmit
    └──────────────────────────┘
```

---

## 7. Game Domain

상세: `docs/domain/glossary.md` (용어 30+개 정의 + 타입 시그니처). **ADR-0015(2026-07-20) 갱신**: 보스전·메타 카드·출근 도장·서사 연출 제거. 배경·상세: `docs/adr/0015-wave-clicker-simplification.md`.

### 7.1 좀비 4종 (Phaser Graphics only, 외부 아트 0)

| 명칭 | 직급 | 속도 | HP (tap) | 마스크 색 | 첫 등장 |
|------|------|------|----------|-----------|---------|
| 신입 / Intern | 갓 감염 | 빠름 | 1 | 흰 (`#F0EAD6`) | 1F |
| 과장 / Middle | 책임감 짓눌림 | 중간 | 1 | 회색 (`#7A7A7A`) | 3F |
| 팀장 / Lead | 회의 미종결 | 느림 | 2 | 진회색 (`#3A3A3A`) | 6F |
| CEO / Founder Zero | 탱커 필드 좀비(희귀, 보스 아님) | 매우 느림 | 5 | 검정 (`#0A0A0A`) | 11F부터(밴드 2), 등장 확률 1%→10% |

### 7.2 Wave / Floor / Chapter

- **5 챕터(난이도 밴드) × 10층 = 50층** = MVP 풀 게임. 챕터는 서사 없는 난이도 구간(`floorPlan().band`)일 뿐이다.
- 층 클리어: `floorPlan(F).quota`만큼 처치 → 다음 층. 층 실패: 도주 누적이 `floorPlan(F).escapeLimit` 도달 → run 종료(조기 퇴근 톤, *"오늘은 여기까지 해도 충분합니다."*)
- spawn rate: 1000ms(1층) → 300ms(50층), 선형 감소
- 동시 최대 좀비 수(cap): 3(1층) → 12(50층 상한)
- 도주 한도(escapeLimit): 밴드 1~2(1~20층) 5, 밴드 3~4(21~40층) 4, 밴드 5(41~50층) 3
- 층별 60초 envelope·보스 climax는 제거됨 — 층 진행은 시간이 아닌 quota/도주 카운트로만 결정된다.

### 7.3 Combo / Crit

- combo tier: ×1 → ×1.5 (5kill) → ×2 (10kill) → ×3 (15kill)
- combo decay: 1500ms 고정(`DEFAULT_DECAY_MS`) — 카드 보너스로 인한 연장 없음(메타 카드 제거)
- crit: 머리 tap → ×2 고정(`CRITICAL_MULTIPLIER`) — 카드 보너스로 인한 ×2.5 없음(메타 카드 제거)

### 7.4 Power-up 3종

| Power-up | 효과 | 지속 | drop rate |
|----------|------|------|-----------|
| 폭탄 (Bomb) | 화면 전체 좀비 즉시 처치 | 즉발 | 평평한 기본율 5%(`BASE_DROP_RATE`) |
| 빙결 (Freeze) | 좀비 스폰·노화 3초 정지 | 3초 | 평평한 기본율 5% |
| 자석 (Magnet) | 100px 반경 좀비 자동 처치 | 3초 | 평평한 기본율 5% |

- 처치 시 3종 중 하나를 균등 추첨해 드롭 여부 결정. 메타/코인 tier 결합 없음(코인 제거로 무의미).
- 처치 위치에 탭 가능한 pickup이 생성되고, 일정 시간 미획득 시 소멸. pickup 탭 → `applyPowerUp` 호출로 실제 발동(기존에는 drop만 계산되고 화면 배선이 없었음 — 이번에 실제로 연결됨).
- 동시 활성 한도 **2개**(`MAX_CONCURRENT_EFFECTS`, 빙결·자석 등 지속형 효과에만 적용) — 폭탄은 즉발이라 한도 무관.
- 보스 확정 drop(구 30%)은 보스전 제거로 더 이상 발생하지 않는다.

### 7.5 메타 카드 / 출근 도장 — 제거됨

카드 15장(Base 12 + Special 3), Tier/coin 기반 unlock, Daily Streak(출근 도장 +20%/일, 7일 상한)는 웨이브 클리커 단순화로 전부 삭제되었다. 코인(coin) 재화도 unlock 게이트가 사라져 사용처가 없어 함께 제거되었다.

### 7.6 결정론 vs 가변 (Layer 1 / Layer 2)

| 영역 | Layer 1 (결정론) | Layer 2 (가변) |
|------|-----------------|----------------|
| 좀비 처치 / 콤보 / Crit | ✅ | — |
| Power-up drop rate (평평한 기본율) | ✅ | — |
| 층 진행 (quota 클리어 / 도주 실패) | ✅ | — |

- 챕터 카드 3장 추첨, 사옥 인테리어 재건 순서, 골드 폭증 등 기존 Layer 2 사례는 해당 시스템 자체가 삭제되어 더 이상 존재하지 않는다.

---

## 8. Agent Behavior Rules — 반드시 준수 (9개)

1. **Bible/ADR 우선 참조**: 결정 미정 시 `docs/game-design/bible.md` §1~§9, `docs/adr/0001~0006` 순으로 확인. 코드와 충돌하면 **코드를 Bible에 맞춥니다**.
2. **AskUserQuestion 발생 = 자율주행 실패 신호**: Phase C는 사용자 개입 0회 가정. 결정 미정이면 ADR Tentative Default 적용 후 진행 (블록 시 `<task-id>.blocked.md` 작성 후 중단).
3. **TDD 3 카테고리 강제**: 모든 RED phase는 `[Happy]/[Boundary]/[Error]` 각 ≥1개. PR/Task 종료 직전 `grep -c "\[Happy\]\|\[Boundary\]\|\[Error\]"` 자동 검증.
4. **1 /rl 콜 = 1 Task**: 단일 `.claude/ralph-loop.local.md` 상태 파일 충돌 방지. 병렬 /rl 금지.
5. **검증 명령 통과**: Task 완료 전 `pnpm typecheck && pnpm lint && pnpm test` exit 0. 실패 시 Task 완료 금지.
6. **Domain 순수성**: Domain 레이어에서 Phaser/DOM/setTimeout/Math.random/Date.now 직접 사용 금지 → Port 주입.
7. **자산 0 정책**: 외부 이미지/사운드 다운로드 금지. Phaser Graphics 도형 + Web Audio 합성음만.
8. **Notification 권한 영구 비요청**: 코드베이스에서 `Notification.requestPermission` 등장 = Ethics 위반. CI grep으로 차단.
9. **ADR 기록**: 새 외부 의존성 추가 또는 아키텍처 변경 시 `docs/adr/NNNN-*.md` 작성. 5 섹션 (Status/Context/Decision/Consequences/Alternatives) 필수.

---

## 9. Don'ts (안티패턴)

`docs/plan/zombie-pang-master-plan.md` §2 + Bible §7 흡수.

| 금지 | 대신 | 사유 |
|------|------|------|
| 가이드(CLAUDE.md/docs) 작성 전 코드 작성 | C-2 가이드를 C-3 이전에 완료 | 가이드가 이후 모든 코드의 SSOT |
| Domain에 Phaser/DOM import | POJO + Port interface로 외부화 | DIP 위반 시 TDD 효율 붕괴 |
| Happy path만 테스트하고 GREEN 진입 | 3 카테고리 각 1개 이상 라벨링 | 글로벌 CLAUDE.md 강제 규칙 |
| `Math.random()` / `Date.now()` / `setTimeout` 도메인 직접 사용 | `IRandom`, `IClock` Port 주입 | 결정론 테스트 + 100% 브랜치 커버 |
| `AskUserQuestion`으로 결정 미루기 | Bible/ADR Tentative Default 적용 | 자율주행 막힘 = 실패 신호 |
| 한 /rl에서 2개 이상 Task 처리 | 1콜 = 1Task | ralph-loop 상태 충돌 + 컨텍스트 폭주 |
| PWA manifest/SW를 마지막에 부가 | C-1 스켈레톤부터 vite-plugin-pwa 골격 | 캐싱 누락 시 오프라인 깨짐 |
| 외부 이미지/사운드 자산 다운로드 | Phaser Graphics 도형 + Web Audio 합성음 | 자산 < 3MB + 라이선스 리스크 0화 |
| 좀비 4종 외 추가 종 | MVP: 신입/과장/팀장/CEO 4종 고정 (CEO는 탱커 필드 좀비, 보스 아님) | Bible §2 + MVP 범위 |
| 보스전(rage/climax/미니언/페이즈) 재도입 | CEO는 hp 5 탱커 필드 좀비로만 유지 | ADR-0015 (웨이브 클리커 단순화) |
| 메타 카드·성장·출근 도장·코인 재화 재도입 | 층 오르기 + 점수/콤보/파워업만 유지 | ADR-0015 (웨이브 클리커 단순화) |
| 외부 광고 SDK | MVP는 광고 0개 (ADR-0001 Open) | Bible §7 안티패턴 #7 |
| `Notification.requestPermission` 호출 | **영구 비요청** (v1/v2/v3 전부) | Bible §6 + Ethics §7 안티패턴 #2 |
| 카운트다운 압박 텍스트 ("남은 5초!") | HUD 숫자(quota/도주 카운트)만으로 긴장 표현 | Bible §3 + Ethics §7 안티패턴 #6 |
| `git push` (사용자 명시 요청 전) | 로컬 커밋만 | 환경 안전 원칙 |
| Wake Lock API 사용 | 60초 세션이므로 불필요 | Bible §6 |
| Energy/Stamina 시스템 | 재접속 강제 = 야근의 정의 | Bible §7 안티패턴 #3 |
| 확률 가변 가챠 시스템 신규 도입 | 결정론적 고정 확률만 허용(현재 Power-up 평평한 5%) | Bible §7 안티패턴 #4 |
| Snapshot 테스트 남용 | behavior 기반 expect | Vitest 안티패턴 |
| Cypress 신규 채택 | Playwright | E2E 일관성 |
| ESLint + Prettier 추가 | Biome 단일 | 빌드 속도 + 일관성 |
| debug/test hook을 `typeof window` 가드만으로 노출 | `import.meta.env.DEV \|\| VITE_ZP_E2E` env flag 가드 | production cheat 차단 (상세: `.claude/rules/debug-hook-safety.md`) |

---

## 10. References

### 좀비팡 프로젝트 문서

- **상위 SSOT**: `docs/game-design/bible.md` (Phase A-8, 9 섹션)
- **Master Plan**: `docs/plan/zombie-pang-master-plan.md` (Phase B-0, 11 Task)
- **ADR**:
  - `docs/adr/0001-architecture.md` (Hexagonal 4계층)
  - `docs/adr/0002-game-engine.md` (Phaser 3 선택)
  - `docs/adr/0003-coding-conventions.md` (TS strict + Biome)
  - `docs/adr/0004-tdd.md` (3 카테고리 + fast-check + Stryker)
  - `docs/adr/0005-pwa-strategy.md` (vite-plugin-pwa + iOS 한계)
  - `docs/adr/0006-game-design-principles.md` (Ethics 10 안티패턴)
- **Architecture**: `docs/architecture/hexagonal-game.md`
- **Conventions**:
  - `docs/conventions/typescript.md`
  - `docs/conventions/phaser.md`
  - `docs/conventions/testing.md`
  - `docs/conventions/folder-structure.md`
- **Domain**: `docs/domain/glossary.md`

### 외부 참조

- Phaser 3 공식 문서: https://docs.phaser.io/
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/
- Workbox: https://developer.chrome.com/docs/workbox/
- fast-check: https://fast-check.dev/
- Stryker Mutator: https://stryker-mutator.io/
- Kent Beck — *Test-Driven Development: By Example*
- Kent C. Dodds — [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### 글로벌 룰

- `~/.claude/CLAUDE.md` (한국어 응답 가이드라인, 3 카테고리 룰 원본, 12살 비유 등)
- 본 SSOT가 글로벌 룰을 override하는 경우 명시적으로 표기. 현재까지 override 없음.
