# Phaser Conventions for 좀비팡

Phaser 3.80+ 사용 규칙. 좀비팡은 Phaser를 **Adapter 위치**에 한정합니다 (Hexagonal ADR-0001).

> **상위 SSOT**: `docs/adr/0001-architecture.md`, `docs/adr/0002-game-engine.md`
> 본 문서는 **Phaser 코드 작성 규칙 + 좀비팡 도메인 예제**입니다.

---

## 1. Phaser 위치 — `adapters/phaser/`

Phaser 종속 코드는 모두 `src/adapters/phaser/` 안에만 작성합니다.

```
src/adapters/phaser/
├── config.ts                  # Phaser.Game config (viewport, scale, scene 등록)
├── scenes/
│   ├── boot.scene.ts          # Phaser 초기화, audio context resume
│   ├── preload.scene.ts       # Graphics 도형 생성, atlas 빌드 (외부 자산 0)
│   ├── main-menu.scene.ts     # PUNCH IN 버튼, Daily Streak 배지
│   ├── game.scene.ts          # 좀비 스폰, tap 입력, particle/shake
│   ├── hud.scene.ts           # Score, Combo, Floor 표시 (parallel)
│   └── game-over.scene.ts     # 사직서 컷씬, 카드 fan-out, install prompt
├── objects/
│   ├── zombie.object.ts       # ZombieObject (Phaser.GameObjects.Container)
│   ├── particle.object.ts     # 사무 비품 8종 particle (사원증, 종이 등)
│   ├── upgrade-card.object.ts # 카드 fan-out UI
│   └── boss.object.ts         # CEO 보스 (3-phase: telegraph/engagement/climax)
└── managers/
    ├── audio.manager.ts       # SFX dispatcher (IAudio Port 위임)
    └── juice.manager.ts       # Hit-stop / shake / particle 통합
```

**금지**:
- `domain/` 또는 `application/`에서 `import Phaser` (DIP 위반)
- `adapters/phaser/`에서 `localStorage` 직접 호출 (`ISaveStore` Port 경유)
- Phaser scene 안에서 게임 규칙 작성 (use case 호출만)

---

## 2. Scene 분리 패턴

### 6개 Scene + 책임 분리

| Scene | 책임 | 라이프사이클 | use case 호출 |
|-------|------|-------------|--------------|
| `BootScene` | Phaser 초기화 | once on app start | (없음) |
| `PreloadScene` | Graphics 도형 생성, useCases 주입 받기 | once | (없음) |
| `MainMenuScene` | PUNCH IN 버튼 | recurring | `startRun` (PUNCH IN tap) |
| `GameScene` | 좀비 스폰, tap, particle | per run | `killZombie`, `applyPowerUp` |
| `HudScene` | Score, Combo, Floor 표시 | parallel with GameScene | (state subscribe) |
| `GameOverScene` | 사직서 컷씬, 카드 fan-out | per chapter end | `endChapter`, `pickUpgrade`, `endRun` |

### Scene 전환

```ts
// MainMenuScene → GameScene + HudScene (parallel)
this.scene.start('GameScene', { useCases: this.useCases })
this.scene.launch('HudScene', { useCases: this.useCases })

// GameScene → GameOverScene (보스 처치 시)
this.scene.stop('HudScene')
this.scene.start('GameOverScene', { useCases: this.useCases, runState: this.runState })
```

### useCases 주입

```ts
// src/adapters/phaser/scenes/preload.scene.ts
import Phaser from 'phaser'
import type { useCases } from '@/infrastructure/container'

export class PreloadScene extends Phaser.Scene {
  private _useCases!: typeof useCases
  constructor() { super('PreloadScene') }
  override init(data: { useCases: typeof useCases }) {
    this._useCases = data.useCases
  }
  override create() {
    this.scene.start('MainMenuScene', { useCases: this._useCases })
  }
}
```

---

## 3. GameObject Prefab 패턴

### Container 기반 좀비

```ts
// src/adapters/phaser/objects/zombie.object.ts
import Phaser from 'phaser'
import type { ZombieType } from '@/domain/wave/zombie-type'
import type { ZombieId } from '@/shared/types/branded'

const MASK_COLORS: Record<ZombieType, number> = {
  INTERN: 0xF0EAD6,
  MIDDLE: 0x7A7A7A,
  LEAD: 0x3A3A3A,
  CEO: 0x0A0A0A,
}

export class ZombieObject extends Phaser.GameObjects.Container {
  private body!: Phaser.GameObjects.Graphics
  public hp: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    public readonly type: ZombieType,
    public readonly id: ZombieId,
  ) {
    super(scene, x, y)
    this.hp = type === 'LEAD' ? 2 : type === 'CEO' ? 5 : 1
    this.draw()
    this.setSize(type === 'INTERN' ? 90 : 80, type === 'INTERN' ? 90 : 80)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  private draw(): void {
    this.body = this.scene.add.graphics()
    this.body.fillStyle(0x1A1A1A, 1) // dark silhouette
    this.body.fillCircle(0, 0, 28)
    // 마스크 색 사각형
    this.body.fillStyle(MASK_COLORS[this.type], 1)
    this.body.fillRect(-10, -8, 20, 8)
    this.add(this.body)
  }

  takeHit(): boolean {
    this.hp -= 1
    if (this.hp <= 0) return true   // killed
    this.scene.tweens.add({ targets: this, scale: 0.9, duration: 50, yoyo: true })
    return false
  }
}
```

### Object Pool (60fps GC 압력 완화)

```ts
// src/adapters/phaser/scenes/game.scene.ts (excerpt)
private zombiePool!: Phaser.GameObjects.Group

override create() {
  this.zombiePool = this.add.group({
    classType: ZombieObject,
    maxSize: 50,
    runChildUpdate: true,
  })
}

private spawn(type: ZombieType, x: number, y: number): void {
  const zombie = this.zombiePool.get(x, y, undefined, undefined, true) as ZombieObject | null
  if (zombie) {
    zombie.setActive(true).setVisible(true)
  }
}
```

---

## 4. Manager Singleton

Cross-scene 공유 service는 Manager로 분리. 단, **infrastructure에 두는 것이 우선**입니다 (DIP).

```ts
// src/adapters/phaser/managers/juice.manager.ts
import Phaser from 'phaser'

export class JuiceManager {
  constructor(private readonly scene: Phaser.Scene) {}

  hitStop(durationMs: number): void {
    this.scene.time.timeScale = 0
    setTimeout(() => { this.scene.time.timeScale = 1 }, durationMs)
  }

  shake(intensity: number, durationMs: number): void {
    this.scene.cameras.main.shake(durationMs, intensity / 1000)
  }

  emitParticles(x: number, y: number, count: number): void {
    /* Graphics 기반 사무 비품 particle */
  }
}
```

- `infrastructure/audio/web-audio-synth.ts`가 `IAudio` Port 구현
- `adapters/phaser/managers/audio.manager.ts`는 IAudio 주입받아 Phaser scene event와 연결

---

## 5. scene.registry / EventEmitter 사용처

### scene.registry — Cross-scene state share

```ts
// HudScene이 GameScene의 점수를 보고 싶을 때
this.registry.set('score', 1500)
// HudScene 내부
const score = this.registry.get('score') as number
this.registry.events.on('changedata-score', (_p: unknown, value: number) => {
  this.scoreText.setText(`${value}`)
})
```

**원칙**: registry는 *순수 표시용 state*만. 도메인 state는 use case 반환값 → infrastructure에서 saveStore 호출.

### EventEmitter — Scene 내부 event

```ts
// GameScene 내부
this.events.on('zombie-killed', (data: { score: number }) => { /* */ })
this.events.emit('zombie-killed', { score: 100 })
```

---

## 6. Scene Transitions

| 전환 | 방법 | 사유 |
|------|------|------|
| Boot → Preload | `this.scene.start('PreloadScene')` | sequential |
| Preload → MainMenu | `this.scene.start('MainMenuScene', { useCases })` | sequential + data 전달 |
| MainMenu → Game + Hud | `this.scene.start('GameScene'); this.scene.launch('HudScene')` | parallel |
| Game → GameOver | `this.scene.stop('HudScene'); this.scene.start('GameOverScene')` | sequential |
| GameOver → Game (다음 챕터) | `this.scene.start('GameScene', { chapter: 2 })` | sequential |
| GameOver → MainMenu (정시 퇴근) | `this.scene.start('MainMenuScene')` | sequential |

---

## 7. Asset 0 정책

좀비팡은 **외부 이미지/사운드 파일 0**입니다.

| 자산 종류 | 방법 |
|----------|------|
| 좀비 4종 | `Phaser.GameObjects.Graphics`로 도형 (`fillCircle`, `fillRect`) |
| 사무 비품 particle 8종 | Graphics로 작은 사각형 + 색 |
| UI 카드 | Graphics + Pretendard 시스템 폰트 (`Pretendard, sans-serif`) |
| SFX 7 layer | Web Audio API 합성 (oscillator + envelope) |
| BGM | lazy load (v2 이후), MVP는 SFX만 |
| 아이콘 (PWA manifest) | 단색 PNG 192/512 (build 시 generate) |

### Preload에서 Graphics 자산 생성

```ts
// src/adapters/phaser/scenes/preload.scene.ts (excerpt)
private generateGraphicsTextures(): void {
  // 좀비 INTERN texture (90×90)
  const g = this.add.graphics()
  g.fillStyle(0x1A1A1A, 1).fillCircle(45, 45, 32)
  g.fillStyle(0xF0EAD6, 1).fillRect(35, 38, 20, 8)
  g.generateTexture('zombie-intern', 90, 90)
  g.destroy()
  // ...
}
```

---

## 8. Vite HMR + game.destroy() 패턴

Vite HMR 시 Phaser game 인스턴스가 중복 마운트되지 않도록 `game.destroy()` 호출.

```ts
// src/main.ts
import { game } from './adapters/phaser/config'

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true, false)
  })
}
```

---

## 9. 메모리 누수 회피

| 패턴 | 누수 위험 | 대처 |
|------|----------|------|
| `setTimeout` 직접 호출 | scene 종료 후에도 실행 | `IClock` Port 사용 (cancellable) |
| `EventEmitter.on` without `off` | scene 재진입 시 중복 listener | `scene.events.off()` in `shutdown()` |
| Object pool `get(x, y)` 후 `destroy()` | pool에서 제거 안 됨 | `setActive(false).setVisible(false)` |
| 외부 fetch | abort 미처리 | `AbortController` 강제 (좀비팡은 외부 fetch 0이라 해당 없음) |

```ts
override shutdown() {
  this.events.off('zombie-killed')
  this.zombiePool.clear(true, true)
}
```

---

## 10. Phaser 내장 우회 (결정론 강제)

| Phaser 내장 | 좀비팡 정책 |
|-------------|-----------|
| `Phaser.Math.RND` | **비사용** — `IRandom` Port (SeededRandom) 주입 |
| `Phaser.Time.addEvent` | **비사용** (도메인 로직) — `IClock` Port. 단, 시각 효과 timer는 가용 |
| `scene.time.delayedCall` | 시각 효과만 가용. 도메인 timer는 IClock |
| `Phaser.Math.Easing` | 시각 효과 한정 가용 |
| `Phaser.Sound` | **비사용** — `IAudio` Port (WebAudioSynth) 주입 |

---

## 11. Update Loop

```ts
override update(_time: number, delta: number) {
  // 시각 효과만 (시간은 IClock 사용)
  this.shakeDecay(delta)
  this.particleAlphaDecay(delta)
}
```

- `update`에서 도메인 호출 금지. 도메인은 이벤트 기반 (input → use case 호출).

---

## 12. 안티패턴

| 안티패턴 | 대체 |
|---------|------|
| Domain에서 `import Phaser` | Phaser는 adapters에만 |
| Phaser scene에서 게임 규칙 작성 | use case 호출만 |
| `Math.random()` Phaser scene 내부 | `IRandom` Port |
| `Phaser.Math.RND.between()` | `IRandom.range()` |
| `setTimeout(() => combo.decay(), 1500)` | `IClock.monotonic()` 기반 decay |
| Phaser scene 안에서 `localStorage.setItem` | `ISaveStore` Port |
| External image / sound asset | Graphics + Web Audio 합성 |
| default export scene | named export (`export class GameScene`) |

---

## 13. 12살 비유

> Phaser는 **레고 도시 키트**입니다. 키트에는 *집, 도로, 신호등, 가로등*이 들어 있습니다.
>
> - **Scene** = *동네* (예: 게임 동네, 메뉴 동네)
> - **GameObject** = *집/사람/차* (좀비, 좀비, 좀비)
> - **Manager** = *시청* (오디오 시청, 효과 시청)
> - **scene.registry** = *동네 게시판* (다른 동네에서도 볼 수 있음)
> - **EventEmitter** = *동네 안내 방송*
>
> 키트(Phaser)는 도시를 만드는 데 도움 줄 뿐, *교통 규칙*(domain)은 별도 책에 적어둡니다.
> 그래야 *키트가 LEGO에서 Mega Bloks로 바뀌어도* 교통 규칙은 그대로입니다.

---

## 14. References

- 본 프로젝트 ADR: `docs/adr/0001-architecture.md` (Hexagonal), `docs/adr/0002-game-engine.md` (Phaser 채택)
- 본 프로젝트 SSOT: `docs/game-design/bible.md`
- Phaser 공식 문서: https://docs.phaser.io/
- Phaser TypeScript template: https://github.com/phaserjs/template-vite-ts
- 본 문서와 충돌 시 우선순위: `Bible > ADR > 본 문서 > Code`
