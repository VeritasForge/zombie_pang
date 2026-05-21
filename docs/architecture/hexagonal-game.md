# Hexagonal Architecture for 좀비팡 (Game-Adapted)

좀비팡의 핵심 아키텍처 패턴은 **Hexagonal (Ports & Adapters) + Phaser는 Adapter** 입니다.
Scene-based 단일 layer 게임 코드는 의도적으로 채택하지 않습니다 — TDD/Property-based/Mutation 강제와 충돌하기 때문.

> **상위 SSOT**: `docs/adr/0001-architecture.md` (정식 박제)
> 본 문서는 **상세 가이드 + 코드 예제 + 게임 도메인 특화 패턴**입니다.

---

## 1. 4 레이어 정의

```
┌──────────────────────────────────────────────────────────────┐
│ 외부 세계 (Browser / iOS Safari / localStorage / Audio API)  │
├──────────────────────────────────────────────────────────────┤
│ infrastructure/   (Composition root, 외부 API 래퍼)          │
│   container.ts ── 모든 Port 구현체 wiring (factory)          │
│   random/seeded-random.ts   ── implements IRandom            │
│   clock/system-clock.ts     ── implements IClock             │
│   audio/web-audio-synth.ts  ── implements IAudio             │
│   haptic/vibration-api.ts   ── implements IHaptic            │
│   pwa/{register-sw, install-prompt, midnight-cue}.ts         │
└─────────────────────────┬────────────────────────────────────┘
                          │ Port 구현체 주입
┌─────────────────────────▼────────────────────────────────────┐
│ adapters/         (Phaser UI / persistence)                  │
│   phaser/scenes/{boot, preload, main-menu, game, hud, end}   │
│   phaser/objects/{zombie, particle, upgrade-card, boss}      │
│   phaser/managers/{audio, juice}                             │
│   persistence/local-storage-save-store.ts (implements        │
│                                            ISaveStore)       │
└─────────────────────────┬────────────────────────────────────┘
                          │ application use case 호출
┌─────────────────────────▼────────────────────────────────────┐
│ application/      (5 use case)                               │
│   start-run / kill-zombie / apply-powerup                    │
│   pick-upgrade / end-chapter / end-run                       │
└─────────────────────────┬────────────────────────────────────┘
                          │ domain 순수 규칙 실행
┌─────────────────────────▼────────────────────────────────────┐
│ domain/           (POJO + Port interface, 외부 의존성 0)     │
│   score/{score, combo}                                       │
│   wave/{wave, spawner, zombie-type}                          │
│   powerup/{powerup, powerup-drop, powerup-stack}             │
│   meta/{card, card-draw, unlock, daily-streak}               │
│   run/{run, chapter, floor, boss}                            │
│   ports/{random, clock, save-store, audio, haptic}.port.ts   │
└──────────────────────────────────────────────────────────────┘
의존성 방향: domain ← application ← adapters/infrastructure
```

---

## 2. 레이어별 책임 & 제약

| 레이어 | 책임 | 의존 허용 | 의존 금지 |
|--------|------|-----------|----------|
| `domain/` | Entity (id 동등성), VO (값 동등성), 도메인 불변조건, 규칙 함수 | 자기 자신만 | Phaser, DOM, setTimeout, Math.random, Date.now |
| `application/` | Use case 함수, port를 통한 도메인 조율 | `domain` | `adapters`, `infrastructure`, 외부 SDK |
| `adapters/phaser/` | Scene/Object/Manager (Phaser 종속) | `domain` (port), `application` (use case) | `infrastructure` 직접 |
| `adapters/persistence/` | ISaveStore 구현 (localStorage) | `domain` (port) | `application`, `adapters/phaser` |
| `infrastructure/` | Port 구현 + Composition root (`container.ts`) + PWA register | `domain`, `application`, `adapters` (wiring) | (모든 레이어를 wiring하는 위치) |

---

## 3. 의존성 방향 (DIP, Dependency Inversion Principle)

모든 화살표는 **안쪽(domain)** 을 향합니다. `infrastructure/`가 `domain/ports/`를 구현하므로 의존성이 역전됩니다.

```
adapters/phaser ──→ application ──→ domain
                          ↑
                          │ implements
infrastructure ───────────┘
```

**도메인은 어떤 것도 import하지 않습니다.** import 그래프는 단방향입니다.

---

## 4. Port / Adapter 패턴 (좀비팡 도메인 예제)

### Port 5종 (domain/ports/)

```ts
// src/domain/ports/random.port.ts
export interface IRandom {
  next(): number              // [0, 1)
  range(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
}

// src/domain/ports/clock.port.ts
export interface IClock {
  now(): number               // epoch ms
  monotonic(): number         // performance.now() equiv
}

// src/domain/ports/save-store.port.ts
export interface ISaveStore {
  load(key: string): string | null
  save(key: string, value: string): void  // throws on quota
  remove(key: string): void
}

// src/domain/ports/audio.port.ts
export type SfxLayer = 'L1_IMPACT' | 'L2_GROAN' | 'L3_CRIT' | 'L4_PANG' | 'L5_POWERUP' | 'L6_WAVE_CLEAR' | 'L7_HIT'

export interface IAudio {
  play(layer: SfxLayer): void
  setMasterVolume(v: number): void
  resume(): Promise<void>
}

// src/domain/ports/haptic.port.ts
export interface IHaptic {
  pulse(pattern: number | number[]): void   // no-op if unsupported
}
```

### Use Case (application/)

```ts
// src/application/kill-zombie.ts
import type { IRandom } from '@/domain/ports/random.port'
import type { IClock } from '@/domain/ports/clock.port'
import { Combo } from '@/domain/score/combo'
import { PowerUpDrop } from '@/domain/powerup/powerup-drop'

export type KillZombieDeps = {
  random: IRandom
  clock: IClock
}

export type KillZombieInput = {
  zombieHp: number
  isCrit: boolean
  coinTier: 0 | 1 | 2 | 3
  hasSpecialCard_Sajiksrn한방: boolean
}

export type KillZombieResult = {
  scoreDelta: number
  newComboTier: 1 | 1.5 | 2 | 3
  droppedPowerUp: 'BOMB' | 'FREEZE' | 'MAGNET' | null
}

export function makeKillZombie({ random, clock }: KillZombieDeps) {
  const combo = new Combo({ clock })
  return (input: KillZombieInput): KillZombieResult => {
    combo.incrementOnKill()
    const baseScore = 100
    const critMultiplier = input.isCrit
      ? (input.hasSpecialCard_Sajiksrn한방 ? 2.5 : 2.0)
      : 1.0
    const scoreDelta = Math.floor(baseScore * combo.tier() * critMultiplier)
    const drop = PowerUpDrop.roll({ random, coinTier: input.coinTier })
    return { scoreDelta, newComboTier: combo.tier(), droppedPowerUp: drop }
  }
}
```

### Adapter — Persistence (adapters/persistence/)

```ts
// src/adapters/persistence/local-storage-save-store.ts
import type { ISaveStore } from '@/domain/ports/save-store.port'

export class LocalStorageSaveStore implements ISaveStore {
  load(key: string): string | null {
    try { return localStorage.getItem(key) }
    catch { return null }   // SecurityError (private mode 등)
  }
  save(key: string, value: string): void {
    try { localStorage.setItem(key, value) }
    catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        throw new StoreQuotaError('localStorage quota exceeded')
      }
      throw e
    }
  }
  remove(key: string): void {
    try { localStorage.removeItem(key) } catch { /* graceful */ }
  }
}

export class StoreQuotaError extends Error {
  override readonly name = 'StoreQuotaError'
}
```

### Adapter — Phaser Scene (adapters/phaser/scenes/)

```ts
// src/adapters/phaser/scenes/game.scene.ts
import Phaser from 'phaser'
import type { useCases } from '@/infrastructure/container'

export class GameScene extends Phaser.Scene {
  private useCases!: typeof useCases

  constructor() { super('GameScene') }

  init(data: { useCases: typeof useCases }) {
    this.useCases = data.useCases
  }

  create() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const zombie = this.findZombieAt(pointer.x, pointer.y)
      if (!zombie) return
      const result = this.useCases.killZombie({
        zombieHp: zombie.hp,
        isCrit: this.isHeadTap(zombie, pointer),
        coinTier: this.currentCoinTier(),
        hasSpecialCard_Sajiksrn한방: this.hasCard('SAJIKSRN_HANBANG'),
      })
      this.applyKill(zombie, result)
    })
  }
}
```

### Composition root (infrastructure/container.ts)

```ts
// src/infrastructure/container.ts
import { SeededRandom } from './random/seeded-random'
import { SystemClock } from './clock/system-clock'
import { WebAudioSynth } from './audio/web-audio-synth'
import { VibrationApiHaptic } from './haptic/vibration-api'
import { LocalStorageSaveStore } from '@/adapters/persistence/local-storage-save-store'
import { makeStartRun } from '@/application/start-run'
import { makeKillZombie } from '@/application/kill-zombie'

const random = new SeededRandom(/* seed = */ Date.now())
const clock = new SystemClock()
const audio = new WebAudioSynth()
const haptic = new VibrationApiHaptic()
const saveStore = new LocalStorageSaveStore()

export const useCases = {
  startRun: makeStartRun({ random, clock, saveStore }),
  killZombie: makeKillZombie({ random, clock }),
  // ...
}

export const ports = { random, clock, audio, haptic, saveStore }
```

### main.ts (Phaser Game container 생성)

```ts
// src/main.ts
import Phaser from 'phaser'
import { useCases, ports } from '@/infrastructure/container'
import { GameScene } from '@/adapters/phaser/scenes/game.scene'
import { BootScene } from '@/adapters/phaser/scenes/boot.scene'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 390,
  height: 844,
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.PORTRAIT,
  },
  scene: [BootScene, GameScene],
})

// Scene이 시작될 때 useCases 주입
game.scene.start('BootScene', { useCases, ports })
```

---

## 5. 의존성 그래프 (ASCII)

```
                                  external world
                                  ┌────────────┐
                                  │ Browser    │
                                  │ Audio API  │
                                  │ localStore │
                                  └─────┬──────┘
                                        │
                       infrastructure ──┴── container.ts
                       (Port 구현체들)        (wiring)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  SeededRandom         WebAudioSynth          LocalStorage
  SystemClock          VibrationApiHaptic     SaveStore
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │ implements
                              ▼
                       domain/ports/*.port.ts
                              │
                              │ used by
                              ▼
                       application/use-cases
                              │
                              │ executes
                              ▼
                       domain/{score, wave, powerup, meta, run}
                       (POJO 순수 규칙)
                              ▲
                              │ called by
        ┌─────────────────────┴─────────────────────┐
        │                                            │
  adapters/phaser/scenes              adapters/phaser/objects
  (GameScene, HudScene)               (ZombieObject, BossObject)
        │
        │ rendered by
        ▼
  Phaser.Game (main.ts)
```

---

## 6. 게임 도메인 특화 패턴

### 6.1 Scene = UI Adapter

Phaser Scene은 **UI Adapter**입니다. 도메인 규칙을 실행하지 않고, **이벤트 → use case 호출 → 결과 시각화**만 합니다.

| Scene | 책임 | use case 호출 |
|-------|------|--------------|
| `BootScene` | Phaser 초기화, asset load (Graphics 도형이라 거의 없음), audio context resume | (없음) |
| `PreloadScene` | localStorage 로드, useCases 주입 받기 | startRun (메인 메뉴 진입 시 호출 X) |
| `MainMenuScene` | PUNCH IN 버튼, 메뉴 UI | startRun (PUNCH IN tap에서 호출) |
| `GameScene` | 좀비 스폰, tap 입력, particle/shake/sfx | killZombie, applyPowerUp |
| `HudScene` | Score, Combo, Floor 표시 (parallel scene) | (state subscribe만) |
| `GameOverScene` | 사직서 컷씬, 카드 fan-out, install prompt | endChapter, pickUpgrade, endRun |

### 6.2 Manager = Service Singleton

Cross-scene 공유 service는 **Manager**로 분리합니다.

```ts
// src/adapters/phaser/managers/audio.manager.ts
export class AudioManager {
  private ctx: AudioContext
  constructor() { this.ctx = new AudioContext() }
  play(layer: SfxLayer) { /* Web Audio synth */ }
}
```

- `AudioManager`는 ISfx Port 구현체 (infrastructure에 두는 게 더 정통)
- 단, Phaser scene event listener와 강하게 결합된 SFX는 manager로 격리 가능
- 좀비팡은 `infrastructure/audio/web-audio-synth.ts`에 두고 Phaser scene에서 IAudio 주입받음 (DIP 강제)

### 6.3 GameObject = Domain ↔ Adapter bridge

```ts
// src/adapters/phaser/objects/zombie.object.ts
import Phaser from 'phaser'
import type { ZombieType } from '@/domain/wave/zombie-type'

export class ZombieObject extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, public readonly type: ZombieType, public readonly id: ZombieId) {
    super(scene, x, y)
    this.add(this.drawBody(type))
    this.setSize(80, 80)  // hit box
    this.setInteractive()
  }

  private drawBody(type: ZombieType): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics()
    // type에 따라 색 / 크기 / 마스크 그림
    return g
  }
}
```

- `ZombieType`은 domain (POJO)
- `ZombieObject`는 adapter (Phaser GameObject)
- bridge 함수가 `type → drawBody` 매핑

### 6.4 Prefab 패턴 (객체 풀)

좀비/파티클은 60fps에서 빈번히 생성/제거됩니다. Phaser Group + object pool로 GC 압력 완화:

```ts
const zombieGroup = scene.physics.add.group({
  classType: ZombieObject,
  maxSize: 50,
  runChildUpdate: true,
})
const zombie = zombieGroup.get(x, y) as ZombieObject | null
if (zombie) zombie.setActive(true).setVisible(true)
```

---

## 7. Next.js / React와 비교 (없음)

좀비팡은 React/Next.js 미사용. Phaser scene이 UI 책임 전부. presentation layer는 Phaser scene이 곧 presentation입니다.

---

## 8. 금지 사항 (안티패턴)

- Domain 레이어에서 `import Phaser from 'phaser'` → **컴파일 거부 + Biome 룰 추가**
- Domain에서 `setTimeout`, `Math.random`, `Date.now`, `performance.now` 직접 호출 → Port 주입
- `adapters/phaser/scenes/game.scene.ts`에서 `localStorage.setItem` 직접 호출 → `ISaveStore` Port 경유
- `application/`에서 `import Phaser` → DIP 위반
- `import 'phaser'`를 도메인 테스트에서 → 도메인 테스트는 Phaser 부팅 없이 실행 가능해야 함

---

## 9. 12살 비유

> 좀비팡 코드를 **자동차**로 비유하면:
>
> - **domain** = *운전 규칙* (빨간불에 멈춤, 추월은 왼쪽). 차종(Phaser/Pixi)과 무관
> - **application** = *운전자의 동작* (브레이크 밟기, 액셀 밟기) — 규칙을 어떻게 실행할지
> - **adapters** = *운전석의 페달과 핸들* — 사람이 직접 만지는 부분 (Phaser scene)
> - **infrastructure** = *엔진, 바퀴, 연료통* — 외부 세계와 닿는 부분 (localStorage, Audio API)
>
> 운전 규칙(domain)은 *자동차 종류와 무관*합니다. Phaser든 Pixi든 같은 규칙으로 돌아갑니다.
> 페달과 핸들(adapters)은 자동차마다 다르지만, "브레이크를 밟으면 멈춘다"는 application 동작은 같습니다.

---

## 10. References

- 본 프로젝트 ADR: `docs/adr/0001-architecture.md`
- 본 프로젝트 SSOT: `docs/game-design/bible.md`
- Alistair Cockburn — [Hexagonal Architecture (Original)](https://alistair.cockburn.us/hexagonal-architecture/)
- Vaughn Vernon — *Implementing Domain-Driven Design*
- Robert C. Martin — *Clean Architecture*
- Phaser 3 공식: https://docs.phaser.io/
- 본 문서와 충돌 시 우선순위: `Bible > ADR > 본 문서 > Code`
