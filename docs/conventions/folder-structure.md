# Folder Structure & File Naming for 좀비팡

좀비팡 디렉토리/파일 구조 명세.

> **상위 SSOT**: `docs/plan/zombie-pang-master-plan.md` §6.2 (디렉토리 트리)
> 본 문서는 **상세 가이드 + 명명 매트릭스 + 3회 룰**입니다.

---

## 1. 루트 구조

```
zombie_pang/
├── CLAUDE.md                       # SSOT (모든 에이전트 룰)
├── AGENTS.md → CLAUDE.md           # 심링크
├── .github/copilot-instructions.md → ../CLAUDE.md  # 심링크
├── README.md                       # 사람용 (1페이지)
├── LICENSE                         # MIT
├── package.json                    # pnpm + scripts
├── tsconfig.json                   # strict + noUncheckedIndexedAccess
├── vite.config.ts                  # Vite + vite-plugin-pwa
├── vitest.config.ts                # per-path coverage threshold
├── stryker.config.json             # mutation testing
├── playwright.config.ts            # Pixel 5 viewport
├── biome.json                      # linter + formatter
├── index.html                      # Vite entry (Pretendard subset)
├── .gitignore
├── .editorconfig
├── .nvmrc
├── docs/                           # 상세 룰
│   ├── adr/
│   │   ├── 0001-architecture.md
│   │   ├── 0002-game-engine.md
│   │   ├── 0003-coding-conventions.md
│   │   ├── 0004-tdd.md
│   │   ├── 0005-pwa-strategy.md
│   │   ├── 0006-game-design-principles.md
│   │   └── draft/                  # Phase A draft ADR 보존
│   ├── architecture/
│   │   └── hexagonal-game.md
│   ├── conventions/
│   │   ├── typescript.md
│   │   ├── phaser.md
│   │   ├── testing.md
│   │   └── folder-structure.md
│   ├── domain/
│   │   └── glossary.md
│   ├── game-design/
│   │   ├── bible.md                # Phase A-8 SSOT (변경 금지)
│   │   ├── core-loop.md            # Bible §3 view
│   │   ├── juice.md                # Bible §5 view
│   │   ├── balancing.md            # Bible §8 view
│   │   └── monetization-free.md    # Bible §7 view
│   ├── plan/
│   │   └── zombie-pang-master-plan.md
│   ├── debate/                     # Phase A consensus
│   ├── research/                   # Phase A research
│   ├── brainstorm/                 # Phase A brainstorm
│   └── demiurge/                   # rl-verify 산출물
├── public/
│   ├── manifest.webmanifest        # PWA manifest
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-maskable.png
├── src/
│   ├── domain/                     # 순수 POJO + Port interface
│   ├── application/                # 5 use case
│   ├── adapters/                   # Phaser UI + persistence
│   ├── infrastructure/             # SeededRandom / Audio / PWA + Composition root
│   ├── shared/                     # branded types + utils
│   └── main.ts                     # Phaser Game container 생성
├── tests/
│   ├── fakes/                      # FakeClock, FakeRandom, FakeSaveStore
│   ├── e2e/                        # Playwright 3 시나리오
│   └── setup.ts                    # vitest setup (canvas mock 등)
└── node_modules/                   # pnpm install
```

---

## 2. src/ 상세

### `src/domain/`

```
domain/
├── score/
│   ├── score.ts                # Score VO + add/multiply
│   ├── combo.ts                # Combo tier + decay (IClock)
│   ├── score.test.ts
│   ├── combo.test.ts
│   ├── score.prop.test.ts
│   └── combo.prop.test.ts
├── wave/
│   ├── wave.ts                 # 1~10 wave + spawn-rate 곡선
│   ├── spawner.ts              # IRandom, 4종 분포, Thumb Zone
│   ├── zombie-type.ts          # 신입/과장/팀장/CEO 4종
│   ├── *.test.ts
│   └── *.prop.test.ts
├── powerup/
│   ├── powerup.ts              # Bomb / Freeze / Magnet 3종
│   ├── powerup-drop.ts         # drop rate + Coin Tier 곱셈
│   ├── powerup-stack.ts        # 동시 활성 ≤ 2
│   ├── *.test.ts
│   └── *.prop.test.ts
├── meta/
│   ├── card.ts                 # Base 12 + Special 3 = 15장
│   ├── card-draw.ts            # 결정론 균등 3장 추첨
│   ├── unlock.ts               # Tier 2/3 + coin 게이트
│   ├── daily-streak.ts         # 7일 + 페널티 0
│   ├── *.test.ts
│   └── *.prop.test.ts
├── run/
│   ├── run.ts                  # 5챕터 × 10층 = 50층 상태
│   ├── chapter.ts              # 1~5, 누적 DPS 곡선
│   ├── floor.ts                # 1~50
│   ├── boss.ts                 # CEO 보스 3-phase, HP 곡선
│   └── *.test.ts
└── ports/
    ├── random.port.ts          # IRandom
    ├── clock.port.ts           # IClock
    ├── save-store.port.ts      # ISaveStore
    ├── audio.port.ts           # IAudio + SfxLayer
    └── haptic.port.ts          # IHaptic
```

### `src/application/`

```
application/
├── start-run.ts                # 새 런 시작 (streak + 영구 메타 로드)
├── kill-zombie.ts              # 좀비 처치 → Score + Combo + drop
├── apply-powerup.ts            # Power-up 활성화 (동시 ≤ 2)
├── pick-upgrade.ts             # 카드 fan-out → 1장 선택
├── end-chapter.ts              # 챕터 종료 (성공/조기 퇴근)
├── end-run.ts                  # 런 종료 (5챕터 클리어 / fail)
└── *.test.ts
```

### `src/adapters/`

```
adapters/
├── phaser/
│   ├── config.ts                          # Phaser.Game config
│   ├── scenes/
│   │   ├── boot.scene.ts                  # Phaser 초기화
│   │   ├── preload.scene.ts               # Graphics 도형 생성
│   │   ├── main-menu.scene.ts             # PUNCH IN 버튼
│   │   ├── game.scene.ts                  # 좀비 스폰, tap, juice
│   │   ├── hud.scene.ts                   # Score, Combo, Floor
│   │   └── game-over.scene.ts             # 사직서 + 카드 fan-out
│   ├── objects/
│   │   ├── zombie.object.ts               # ZombieObject (Container)
│   │   ├── particle.object.ts             # 사무 비품 8종
│   │   ├── upgrade-card.object.ts         # 카드 UI
│   │   └── boss.object.ts                 # CEO 3-phase
│   └── managers/
│       ├── audio.manager.ts               # SFX dispatcher
│       └── juice.manager.ts               # hit-stop / shake / particle
└── persistence/
    └── local-storage-save-store.ts        # implements ISaveStore
```

### `src/infrastructure/`

```
infrastructure/
├── pwa/
│   ├── register-sw.ts                     # Service Worker 등록
│   ├── install-prompt.ts                  # 챕터 1 클리어 후 1회
│   └── midnight-cue.ts                    # 00:00~06:00 cue
├── random/
│   └── seeded-random.ts                   # implements IRandom (mulberry32)
├── clock/
│   └── system-clock.ts                    # implements IClock (Date.now + performance.now)
├── audio/
│   └── web-audio-synth.ts                 # implements IAudio (Web Audio API)
├── haptic/
│   └── vibration-api.ts                   # implements IHaptic (navigator.vibrate + no-op)
└── container.ts                           # Composition root (factory wiring)
```

### `src/shared/`

```
shared/
├── types/
│   ├── branded.ts                         # Score, Coin, ZombieId, FloorNumber 등
│   └── result.ts                          # Result<T, E> discriminated union
└── utils/
    ├── assert.ts                          # assert(cond, msg): asserts cond
    └── clamp.ts                           # clamp(n, min, max)
```

### `src/main.ts`

```ts
// src/main.ts
import { useCases, ports } from './infrastructure/container'
import { game } from './adapters/phaser/config'

game.scene.start('BootScene', { useCases, ports })

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true, false))
}
```

---

## 3. 파일 네이밍 매트릭스 (10행)

| # | 종류 | 파일 케이스 | export 케이스 | 예시 파일 | 예시 export |
|---|------|-----------|-------------|---------|------------|
| 1 | Domain VO/Entity | kebab-case.ts | PascalCase | `score.ts`, `combo.ts` | `export class ScoreVO`, `export class Combo` |
| 2 | Port interface | kebab-case.port.ts | `I-` prefix interface | `random.port.ts`, `clock.port.ts` | `export interface IRandom` |
| 3 | Use Case | kebab-case.ts | camelCase verb + maker | `kill-zombie.ts`, `start-run.ts` | `export function makeKillZombie()` |
| 4 | Scene | kebab-case.scene.ts | PascalCase + Scene suffix | `game.scene.ts` | `export class GameScene extends Phaser.Scene` |
| 5 | GameObject | kebab-case.object.ts | PascalCase + Object suffix | `zombie.object.ts` | `export class ZombieObject extends Phaser.GameObjects.Container` |
| 6 | Manager | kebab-case.manager.ts | PascalCase + Manager suffix | `audio.manager.ts` | `export class AudioManager` |
| 7 | Adapter | kebab-case.ts (-store/-adapter suffix) | PascalCase + Store/Adapter suffix | `local-storage-save-store.ts` | `export class LocalStorageSaveStore` |
| 8 | Infrastructure 구현체 | kebab-case.ts | PascalCase | `seeded-random.ts`, `web-audio-synth.ts` | `export class SeededRandom`, `export class WebAudioSynth` |
| 9 | Constants | kebab-case.ts | UPPER_SNAKE_CASE | `spawn-rates.ts` | `export const SPAWN_RATE_INITIAL = 1000` |
| 10 | Test | `*.test.ts` / `*.prop.test.ts` | - | `score.test.ts`, `score.prop.test.ts` | - |

---

## 4. 폴더 네이밍 규칙

| 종류 | 규칙 | 예시 |
|------|------|------|
| 일반 폴더 | kebab-case | `score`, `wave`, `powerup`, `meta`, `run`, `ports` |
| Private 폴더 | `_` prefix | (Next.js 미사용이라 거의 없음) |
| 테스트 fakes | `tests/fakes/` | `fake-clock.ts`, `fake-random.ts` |

---

## 5. 3회 룰 (모듈 승격)

같은 모듈을 **3개 이상 위치에서 import**할 때 승격:

| 위치 | 처리 |
|------|------|
| 1곳 import | 그대로 (예: `src/adapters/phaser/scenes/game.scene.ts`만 사용) |
| 2곳 import | 그대로 |
| 3곳 import | `src/shared/utils/` 또는 `src/domain/`으로 승격 |

예시:
- `clamp(n, min, max)`가 score, wave, powerup 3곳에서 쓰이면 → `src/shared/utils/clamp.ts`로 이동
- `assertNotNull(x)`가 도메인 5곳에서 쓰이면 → `src/shared/utils/assert.ts`로 이동

---

## 6. Barrel 파일 금지

```ts
// src/domain/score/index.ts (만들지 말 것)
export * from './score'
export * from './combo'
```

**이유**: Vite tree-shaking 방해, import 그래프 추적 어려움.

**예외**: 없음 (좀비팡은 ORM 등 외부 라이브러리 종속 barrel 불필요).

---

## 7. 절대 경로 (`@/*`)

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```ts
// 권장
import { ScoreVO } from '@/domain/score/score'
import type { IRandom } from '@/domain/ports/random.port'

// 금지
import { ScoreVO } from '../../../domain/score/score'
```

상대 경로는 같은 폴더 또는 부모 1단계까지만 (`./`, `../`).

---

## 8. 좀비팡 도메인 모듈 명세

### 도메인 모듈별 책임 / Bible 인용

| 모듈 | 책임 | Bible 인용 |
|------|------|-----------|
| `score/` | Score VO + Combo VO | §3 (Combo decay 1500ms, tier 1.5/2/3), §8 |
| `wave/` | Wave 1~10, Spawner, ZombieType 4종 | §2 (좀비 4종), §3 (60초 시퀀스), §8 |
| `powerup/` | Power-up 3종 + drop rate + 동시 활성 ≤ 2 | §3, §4 (Tier 곱셈), §8 |
| `meta/` | Card 15장 + Daily Streak + Unlock 3-stage | §4 (Meta Progression), §8 |
| `run/` | Run state + Chapter 5 + Floor 50 + CEO Boss | §1, §2, §3, §8 |
| `ports/` | 5개 Port interface (IRandom, IClock, ISaveStore, IAudio, IHaptic) | — |

---

## 9. 12살 비유

> 좀비팡 폴더 구조는 **잘 정리된 도서관**입니다.
>
> - **`domain/`** = 도서관 *원칙 책*들이 모인 코너 (외부 출판사 무관)
> - **`application/`** = *대출/반납 안내문* (이 책으로 어떻게 운영할지)
> - **`adapters/phaser/`** = *대출 데스크의 컴퓨터 화면* (Phaser가 보여줌)
> - **`adapters/persistence/`** = *대출 기록 노트* (localStorage가 적어줌)
> - **`infrastructure/`** = *도서관 건물* (전기, 수도, 알람)
> - **`shared/`** = *공용 펜과 종이* (어디서나 쓰이는 작은 도구)
>
> 책 한 권을 **kebab-case 표지**로, 안에는 **named export 이름표**를 붙입니다.
> 똑같은 책이 *3곳에서 빌려진다면*, 그 책은 *공용 책꽂이(shared)* 로 옮깁니다 (3회 룰).

---

## 10. References

- 본 프로젝트 Master Plan: `docs/plan/zombie-pang-master-plan.md` §6.2
- 본 프로젝트 ADR: `docs/adr/0001-architecture.md`, `docs/adr/0003-coding-conventions.md`
- 본 프로젝트 SSOT: `docs/game-design/bible.md`
- 본 문서와 충돌 시 우선순위: `Bible > Master Plan > ADR > 본 문서 > Code`
