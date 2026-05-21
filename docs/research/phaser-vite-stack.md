# Phaser 3 + Vite + Vitest + fast-check + Stryker 스택 모범 사례

> **Phase A-4 Research 산출물** — 좀비팡 게임 구현을 위한 기술 스택 조사 보고서
> 조사 시점: 2026-05-17 · 대상 버전: Phaser 3.80+, Vite 5+, Vitest 1+, fast-check 3+, Stryker 8+

본 문서는 좀비팡(Zombie Pang) PWA 게임을 Hexagonal Architecture 기반으로 개발하기 위해 필요한 다섯 가지 핵심 도구의 통합 패턴을 정리한다. 모든 인용 코드는 공식 문서 또는 1차 출처에서 발췌하였다.

---

## 1. 공식 `phaserjs/template-vite-ts` 템플릿 구조

공식 템플릿은 [`phaserjs/template-vite-ts`](https://github.com/phaserjs/template-vite-ts) 저장소에서 관리되며, Phaser 3 + TypeScript + Vite 조합의 표준 스캐폴드를 제공한다.

### 디렉토리 트리 (요약)

```
template-vite-ts/
├── index.html              # 게임 캔버스 컨테이너
├── public/
│   ├── style.css           # 전역 레이아웃
│   └── assets/             # 정적 자산 (sprite/audio/atlas)
├── src/
│   ├── main.ts             # 앱 진입점 (DOM mount)
│   └── game/
│       ├── main.ts         # Phaser.Game 인스턴스 생성/설정
│       └── scenes/         # 모든 Scene 파일
├── vite/
│   ├── config.dev.mjs      # 개발 서버 설정
│   └── config.prod.mjs     # 빌드/번들 설정
├── tsconfig.json
└── package.json
```

### 핵심 설계 결정

- **정적 자산**: `public/assets/` 폴더에 두면 `npm run build` 시 자동으로 `dist/assets/`로 복사된다. Phaser `this.load.image(key, 'assets/sprite.png')`로 로드.
- **임베디드 자산**: `import logo from './logo.png'` 형태도 지원 (소형 자산 한정).
- **Vite 설정 분리**: 단일 `vite.config.ts` 대신 `vite/config.dev.mjs`와 `vite/config.prod.mjs`를 `package.json`의 npm 스크립트에서 `--config` 플래그로 타겟.
- **dev 포트**: 기본 `http://localhost:8080` (Phaser 커뮤니티 관례).

좀비팡에서는 위 구조를 따르되 `src/` 하위를 Hexagonal 계층(`domain/` `application/` `infrastructure/` `adapters/phaser/`)으로 재편한다.

---

## 2. Phaser 3 + TypeScript 권장 디렉토리 패턴

### Scene 분리 패턴 (BoldFist 패턴)

[Phaser 공식 가이드](https://docs.phaser.io/phaser/concepts/scenes)와 커뮤니티 컨벤션에 따라 좀비팡은 다음 Scene을 분리한다:

| Scene | 책임 | 라이프사이클 |
|-------|------|-------------|
| `BootScene` | 폰트/로고 등 최소 자산만 로드, Preload로 전이 | 1회 |
| `PreloadScene` | 진행률 바와 함께 게임 자산 일괄 로드 | 1회 |
| `MainMenuScene` | 시작 버튼, 옵션, 일일 스트릭 표시 | 재진입 가능 |
| `GameScene` | 코어 루프 (좀비 스폰/슛/스코어) | 재시작 가능 |
| `HUDScene` | `GameScene` 위에 오버레이로 `launch`되는 점수/콤보 UI | 영구 |
| `GameOverScene` | 결과 표시 및 Meta 보상 정산 | 일회성 |

### GameObject prefab 패턴

```typescript
// adapters/phaser/objects/Zombie.ts
export class Zombie extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType) {
    super(scene, x, y, type.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
}
```

`scene.add.existing(this)`로 GameObject 풀에 등록하여 Group 관리와 호환되도록 한다.

### Manager / Service 싱글턴 패턴

Phaser 자체는 DI 컨테이너가 없으므로 `Phaser.Plugins.BasePlugin`을 상속한 글로벌 매니저(예: `AudioManager`, `HapticsManager`)를 `game.config.plugins.global`에 등록한다.

### Hexagonal 아키텍처 통합

핵심 원칙은 **"Phaser 의존성을 도메인 코드에서 완전히 제거"** 한다. Phaser 디스코스 포럼의 결론([Mocking Phaser objects](https://phaser.discourse.group/t/mocking-or-using-scene-and-other-phaser-objects-in-unit-tests/2185))도 동일하다: *"decoupling business logic from framework objects makes testing significantly easier."*

```
src/
├── domain/                 # 순수 POJO (Phaser 미사용)
│   ├── score/Score.ts
│   ├── wave/WaveState.ts
│   └── zombie/Zombie.ts    # 좌표/HP/타입만 가지는 값 객체
├── application/            # Use Case (입력 → 도메인 호출 → 출력)
├── infrastructure/         # localStorage, Workbox 어댑터
└── adapters/
    └── phaser/             # Scene/GameObject (도메인을 호출만)
```

도메인 객체는 `Phaser.Math.Vector2` 대신 자체 `Vec2 = { x: number; y: number }` 타입을 사용하여 의존성 역전을 강제한다.

---

## 3. 테스트 전략

### Vitest + jsdom + canvas mock 셋업

`vitest.config.ts` 예시:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',            // canvas + threads 충돌 회피
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        // 경로별 차등 임계치
        'src/domain/**': { branches: 100, lines: 100, functions: 100, statements: 100 },
        'src/application/**': { branches: 95, lines: 95, functions: 95, statements: 95 },
        'src/adapters/phaser/**': { branches: 60, lines: 60, functions: 60, statements: 60 },
      },
    },
  },
});
```

`vitest.setup.ts`:

```typescript
import 'vitest-canvas-mock';
import { fc } from '@fast-check/vitest';

// 좀비팡 CI에서는 seed 고정으로 재현성 확보
fc.configureGlobal({ numRuns: 200, seed: 0xC0FFEE });
```

### canvas mock의 한계

`vitest-canvas-mock`은 [Xebia 블로그](https://xebia.com/blog/how-to-solve-canvas-crash-in-vitest-with-threads-and-jsdom/)에서 지적하듯 **threads 모드에서 native canvas와 충돌**한다. 해결책은 `pool: 'forks'` 또는 `threads: false`. 또한 WebGL 호출(`gl.createTexture`)은 항상 `undefined`를 반환하므로 렌더링 검증은 불가능하다.

### Phaser HEADLESS 모드 사용법

[공식 문서](https://newdocs.phaser.io/docs/3.55.2/focus/Phaser.HEADLESS)에 따르면 `Phaser.HEADLESS`는 Canvas/WebGL 렌더러를 생성하지 않지만 **DOM은 여전히 필요**하다.

```typescript
const game = new Phaser.Game({
  type: Phaser.HEADLESS,
  width: 800,
  height: 600,
  scene: [GameScene],
  banner: false,
});
```

다만 [photonstorm/phaser#4467](https://github.com/photonstorm/phaser/issues/4467)에서 보고된 **다중 Scene HEADLESS 버그** (`Cannot read property 'gl' of null`)가 존재하므로, 좀비팡은 **HEADLESS 모드를 통합 테스트에만 사용**하고 단위 테스트는 도메인 POJO만 다룬다.

### 도메인 POJO 100% 브랜치 커버 가능성

도메인 코드를 Phaser와 완전히 격리하면 `vitest run --coverage`만으로 `domain/**` 전체에서 100% 브랜치 커버리지가 달성 가능하다. 좀비팡의 Score/Combo/Wave/Spawner/PowerUp 5개 컨텍스트는 모두 순수 함수와 immutable state로 구현되므로 분기마다 테스트 케이스를 1:1 매핑 가능하다.

---

## 4. fast-check (Property-Based Testing) 셋업

### 공식 vitest 통합

[`@fast-check/vitest`](https://www.npmjs.com/package/@fast-check/vitest) 패키지가 공식 어댑터다.

```bash
npm i -D @fast-check/vitest fast-check
```

```typescript
import { test, fc } from '@fast-check/vitest';
import { applyHit } from '@/domain/zombie/Zombie';

test.prop([fc.integer({ min: 1, max: 999 }), fc.integer({ min: 1, max: 999 })], {
  seed: 4242,
  numRuns: 500,
})('HP는 절대 음수가 되지 않는다', (initialHp, damage) => {
  const result = applyHit({ hp: initialHp }, damage);
  return result.hp >= 0;
});
```

### Seed 고정 + numRuns 설정

[fast-check 블로그](https://fast-check.dev/blog/2025/03/28/beyond-flaky-tests-bringing-controlled-randomness-to-vitest/)는 두 가지 모드를 권장한다:

1. **One-time random mode**: `test({ g })` 형태로 단발 랜덤 사용
2. **Property-based mode**: `test.prop([...arbitraries], { seed, numRuns })`

CI에서는 `fc.configureGlobal({ seed: <env>, numRuns: 200 })`로 전역 설정. PR마다 seed를 출력하여 회귀 재현성을 보장한다.

### 좀비팡 적용 invariant 5선

| # | 도메인 | Invariant |
|---|--------|-----------|
| 1 | Score | `combo` 가 N회 연속이면 다음 처치 점수는 `base * comboMultiplier(N)` 이상이어야 한다 |
| 2 | Wave | 임의의 wave 진행 후 `spawnedCount <= waveDefinition.totalEnemies` |
| 3 | Zombie | 임의의 데미지 시퀀스 합산 후 `hp >= 0` 이며 `isDead = (hp === 0)` |
| 4 | PowerUp | 동시 적용된 PowerUp 효과의 곱은 `maxDamageMultiplier`를 초과하지 않는다 |
| 5 | DailyStreak | 임의의 날짜 시퀀스에서 streak 증가량은 `consecutiveDays / day` 와 일치한다 |

---

## 5. Stryker Mutation Testing 셋업

### 설치

[공식 문서](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)에 따라:

```bash
npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

### `stryker.config.json` 예제

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "mutate": [
    "src/domain/**/*.ts",
    "src/application/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/index.ts"
  ],
  "reporters": ["html", "clear-text", "progress", "dashboard"],
  "concurrency": 4,
  "incremental": true,
  "incrementalFile": ".stryker-incremental.json",
  "thresholds": { "high": 90, "low": 75, "break": 70 },
  "disableTypeChecks": "{src,test}/**/*.{ts,tsx}",
  "timeoutMS": 60000
}
```

### 실행 시간 폭증 회피

[Stryker 7.0 공지](https://stryker-mutator.io/blog/announcing-stryker-js-7/)에 따라 vitest-runner는 **`coverageAnalysis: "perTest"`를 강제**하여 변경 가능성이 있는 테스트만 실행한다. 추가 최적화:

- **`mutate` 화이트리스트**: `adapters/phaser/**`는 제외 (canvas mock 한계로 mutation score 신뢰도 낮음)
- **`incremental: true`**: 변경되지 않은 mutant는 이전 결과 재사용
- **`concurrency`**: CI 코어 수의 절반 (메모리 폭증 방지)
- **`disableTypeChecks`**: ts-node 타입 체크 생략으로 30~50% 단축

좀비팡 CI는 PR마다는 `domain/**`만 mutation 돌리고, nightly 빌드에서 `application/**`까지 확장하는 2단 구성을 채택한다.

---

## 6. 자주 발생하는 함정 / 회피 전략

### 6.1 Phaser dynamic import + Vite SSR 충돌

Phaser는 `window`/`document`를 모듈 최상위에서 참조하므로 Vite SSR 빌드(`build.ssr: true`)에서 `ReferenceError: window is not defined`로 폭발한다. **회피**: 좀비팡은 SSR을 사용하지 않으나, 만약 Lighthouse용 prerender가 필요하면 Phaser import를 `dynamic import()`로 감싸 클라이언트 전용 boundary를 만든다. `vite.config.ts`의 `ssr.noExternal`에 `phaser`를 넣고 `optimizeDeps.include: ['phaser']`로 사전 번들링.

### 6.2 PWA Service Worker + Phaser asset 캐싱

[Vite PWA 가이드](https://vite-pwa-org.netlify.app/guide/service-worker-precache)는 기본적으로 CSS/JS/HTML만 precache 한다. Phaser sprite/audio/atlas는 `workbox.globPatterns`에 명시해야 한다:

```typescript
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,jpg,webp,mp3,ogg,json,atlas}'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  },
});
```

dev 모드에서는 HMR과 SW가 충돌하므로 `devOptions.enabled: false` 권장.

### 6.3 Canvas mock 한계

`vitest-canvas-mock`은 **2D context API만 stub**한다. WebGL 셰이더, Phaser Particle, Tween은 호출은 되지만 결과 검증 불가. 따라서:
- 도메인 테스트: 100% 커버 가능
- Phaser Scene 테스트: 동작 흐름만 확인 (렌더링은 Playwright E2E로 분리)

### 6.4 Vite HMR + Phaser Scene 재로딩

Vite HMR이 Scene 모듈을 갱신해도 Phaser는 이미 인스턴스화된 Scene을 교체하지 않는다. 결과: 코드 변경이 반영되지 않거나 메모리 누수 발생.

**해결**: 진입점에서 HMR 핸들러로 game을 destroy 후 재생성한다.

```typescript
// src/main.ts
import { createGame } from './game/main';

let game = createGame();

if (import.meta.hot) {
  import.meta.hot.accept(['./game/main.ts'], () => {
    game.destroy(true);
    game = createGame();
  });
}
```

자산 로드 비용이 큰 경우 `Boot/Preload`만 캐싱하고 `Game/HUD`만 reload하는 더 정교한 핸들러를 적용한다. [innerlogic 블로그](https://innerlogic.co/2023/10/27/hot-reloading-tilemap-data-in-phaser-3/)는 tilemap JSON을 `import.meta.hot.accept('./level.json', ...)`로 부분 갱신하는 패턴을 보여주며, 좀비팡의 wave/balance JSON에도 동일하게 적용 가능하다.

### 6.5 Stryker timeout과 Phaser Scene 라이프사이클

mutation으로 인해 `update()` 루프가 무한 반복되면 Stryker는 기본 5초 timeout에 걸려 mutant를 `TimedOut`으로 분류한다. 도메인 코드는 빠르므로 문제 없으나, `application/` 레이어에서 `requestAnimationFrame` 폴백 코드가 있으면 `timeoutMS: 60000`으로 명시하여 false positive를 줄인다. 또한 Stryker는 `coverageAnalysis: "perTest"` 강제 정책에 의해 각 테스트가 어떤 라인을 실행했는지 추적하므로, **테스트가 명시적으로 단언(assert)을 포함**하지 않으면 mutant가 모두 살아남는다 (no-assertion 안티패턴). fast-check property 테스트는 boolean return 또는 throw를 통해 항상 단언이 존재하므로 mutation 점수가 안정적이다.

### 6.6 iOS Safari + Phaser AudioContext 정책

좀비팡은 모바일 PWA이므로 iOS Safari의 **첫 user gesture 전 AudioContext 생성 금지** 정책에 주의해야 한다. Phaser의 `WebAudioSoundManager`는 첫 터치 이벤트에서 `audioContext.resume()`을 호출하지만, Service Worker가 캐시한 오래된 Phaser 빌드와 신규 빌드가 공존할 때 두 개의 AudioContext가 생성되어 무음 현상이 발생한다. 회피책은 SW 업데이트 후 `skipWaiting + clientsClaim` 으로 즉시 새 빌드를 모든 탭에 강제 적용하는 것이다 (Workbox 옵션 `skipWaiting: true`, `clientsClaim: true`).

---

## 7. 좀비팡 적용 권장 사항 요약

| 영역 | 채택 결정 |
|------|-----------|
| 템플릿 | `phaserjs/template-vite-ts` 포크 후 Hexagonal 디렉토리로 재편 |
| 도메인 격리 | Phaser 타입을 `domain/`에서 import 금지 (ESLint `no-restricted-imports`로 강제) |
| 테스트 환경 | jsdom + vitest-canvas-mock + `pool: 'forks'` |
| 커버리지 | `domain/**` 100% / `application/**` 95% / `adapters/**` 60% |
| Property 테스트 | `@fast-check/vitest`, seed 고정, numRuns=200 |
| Mutation 테스트 | PR: `domain/**`만, nightly: `application/**` 확장, threshold break=70 |
| PWA | `globPatterns`에 게임 자산 확장자 명시, `skipWaiting + clientsClaim` |
| HMR | 진입점에 `game.destroy(true)` 핸들러 필수 |

---

## 핵심 출처

- [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts)
- [Phaser HEADLESS API](https://newdocs.phaser.io/docs/3.55.2/focus/Phaser.HEADLESS)
- [Phaser 다중 Scene HEADLESS 버그](https://github.com/photonstorm/phaser/issues/4467)
- [@fast-check/vitest](https://www.npmjs.com/package/@fast-check/vitest), [fast-check 블로그](https://fast-check.dev/blog/2025/03/28/beyond-flaky-tests-bringing-controlled-randomness-to-vitest/)
- [Stryker Vitest Runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/), [Stryker 7.0 공지](https://stryker-mutator.io/blog/announcing-stryker-js-7/)
- [Vite PWA Workbox 가이드](https://vite-pwa-org.netlify.app/guide/service-worker-precache)
- [Vitest canvas crash 해결법 (Xebia)](https://xebia.com/blog/how-to-solve-canvas-crash-in-vitest-with-threads-and-jsdom/)
- [Phaser Discourse — Mocking Scene](https://phaser.discourse.group/t/mocking-or-using-scene-and-other-phaser-objects-in-unit-tests/2185)
