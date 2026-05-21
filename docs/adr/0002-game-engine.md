# ADR 0002: 게임 엔진으로 Phaser 3 채택

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: Phase A-4 Research (`docs/research/phaser-vite-stack.md`) + Project Owner

---

## Context

좀비팡은 **PWA 캐주얼 액션 (수직 진행 tap-to-defeat)** + **모바일 portrait 390×844** + **첫 로딩 < 3MB** + **오프라인 전 기능** 요구사항을 가집니다.

### 평가 기준

| 기준 | 가중치 | 설명 |
|------|--------|------|
| 모바일 PWA 친화 | ★★★ | Touch 입력 1급, Portrait orientation lock, Service Worker 친화, install prompt 호환 |
| TypeScript 지원 | ★★★ | 1급 (공식 타입 정의), branded types, strict 모드 호환 |
| 학습 곡선 | ★★ | 신규 기여자 1주 이내 onboarding 가능 |
| 커뮤니티 / 생태계 | ★★ | StackOverflow, GitHub issue 응답성, 플러그인 풍부도 |
| 라이선스 | ★★★ | OSI-approved (MIT 등) + 상업 게임 출시 가능 |
| 번들 크기 | ★★ | gzip < 800KB 가능 여부 |
| 결정론 친화 | ★★ | 내부 RNG/Tween/Timer를 우회/대체 가능 여부 (property-based test) |

---

## Decision

**Phaser 3.80+ 채택**

### 결정 이유

1. **2D HTML5 게임 엔진 1위** — GitHub 36k+ stars, npm 주간 다운로드 50k+, StackOverflow 활성
2. **TypeScript 1급 지원** — 공식 `@types/phaser` 내장, strict 모드 호환
3. **PWA + 모바일 친화** — Touch 이벤트 1급, Portrait orientation 처리, Service Worker 충돌 없음
4. **자산 0 정책 호환** — `Phaser.GameObjects.Graphics`로 도형 직접 렌더 → 외부 이미지 자산 0 가능 (Bible §5 + 좀비 4종 표현)
5. **번들 크기** — Vite tree-shaking + Phaser 3.80 modular import로 gzip ~480KB
6. **MIT 라이선스** — 상업 게임 출시 가능, 로열티 0
7. **결정론 친화** — `Phaser.Math.RND.sow()` seed 가능, Tween/Timer는 update loop에서 IClock으로 추상화 가능 (Adapter 분리)
8. **공식 Vite template** — `phaserjs/template-vite-ts` 제공 → 초기 setup 1시간 이내

### 사용 패턴

- **Scene = UI Adapter**: `adapters/phaser/scenes/`에 격리, domain 호출만
- **GameObject = Domain ↔ Adapter bridge**: `objects/zombie.object.ts`처럼 도메인 데이터를 Phaser GameObject로 매핑
- **Manager = Service Singleton**: `managers/audio.manager.ts`처럼 cross-scene shared service
- **Phaser.Math.RND 비사용**: `infrastructure/random/seeded-random.ts`의 IRandom Port 주입 (결정론 강제)
- **Phaser.Time.addEvent 비사용**: `infrastructure/clock/system-clock.ts`의 IClock Port 주입

---

## Alternatives

| 대안 | 평점 | 거부 이유 |
|------|------|----------|
| **PixiJS 7** | ★★★ | 렌더링 엔진만 (씬/오디오/입력 등 직접 구현 필요). Phaser와 동급이나 게임 엔진이 아닌 그래픽 라이브러리. 좀비팡처럼 풀 게임 기능(scene, audio, particle, tween) 필요 시 자가 구현 부담 |
| **Three.js / Babylon.js** | ★ | 3D 엔진. 좀비팡은 2D portrait. 번들 크기 ~1MB (Three) ~3MB (Babylon) — 자산 < 3MB 제약 위반 |
| **Construct 3** | ★ | GUI 기반 노코드. TypeScript 1급 X, npm 패키지 X, AI 에이전트 (Claude/Cursor) 자율 코드 작성 불가능 |
| **Cocos2d-x / Cocos Creator** | ★★ | TypeScript 지원 약함 (Cocos Creator 3.x 일부), 한국 모바일 게임에 강세이나 PWA 출시 사례 적음. 번들 크기 큼 |
| **PlayCanvas** | ★★ | 3D 강세, 2D는 보조. Free tier에 cloud editor 종속 (offline dev 불편) |
| **순수 Canvas / WebGL** | ★ | scene/audio/input 전부 자가 구현. 좀비팡 60초 envelope에 필요한 tween/particle/timer 풀 자가 구현 부담 (~3개월) |
| **Unity WebGL** | ★ | 번들 크기 ~5MB+ 기본 (자산 < 3MB 제약 위반). C# → WASM 컴파일, TypeScript 코드베이스와 통합 불가 |

### 평가 매트릭스

| 엔진 | 모바일 PWA | TS 지원 | 학습 곡선 | 커뮤니티 | 라이선스 | 번들 크기 | 결정론 | 합계 |
|------|----------|--------|---------|---------|---------|---------|--------|------|
| **Phaser 3** | ★★★ | ★★★ | ★★★ | ★★★ | MIT | ★★ | ★★ | **17** |
| PixiJS 7 | ★★★ | ★★★ | ★★ | ★★★ | MIT | ★★★ | ★★ | 16 |
| Three.js | ★★ | ★★ | ★★ | ★★★ | MIT | ★ | ★★ | 12 |
| Babylon.js | ★★ | ★★★ | ★★ | ★★ | Apache 2.0 | ★ | ★★ | 12 |
| Cocos2d | ★★ | ★ | ★★ | ★★ | MIT | ★★ | ★ | 10 |
| Construct 3 | ★★ | ★ | ★★★ | ★★ | 상용 | ★★ | ★ | 11 |

---

## Consequences

### 긍정적

1. **풀 게임 기능 1일차부터 가용** — Scene 전환, Tween, Particle, Audio, Input, Camera 등 일체화
2. **TypeScript strict 호환** — `noUncheckedIndexedAccess` 등 활성화 후에도 빌드 가능
3. **공식 Vite template** — `phaserjs/template-vite-ts`로 시작 — vite-plugin-pwa와 충돌 없음
4. **PWA 친화** — Service Worker 등록과 Phaser 부팅 순서 충돌 없음 (Phaser는 `<canvas>` 동적 마운트)
5. **MIT 라이선스** — 상업 출시 가능

### 부정적

1. **번들 크기 ~480KB gzip** — Pixi 만 사용 시 ~200KB 대비 크지만, scene/audio/timer 등 자가 구현 부담 없음 (trade-off 수용)
2. **Adapter 격리 비용** — Phaser scene을 직접 도메인에 사용하면 Hexagonal 위반 → `adapters/phaser/scenes/`로 격리 필요 (ADR-0001 강제)
3. **Phaser RNG/Timer 우회 비용** — 결정론 요구 시 Phaser 내장 `Phaser.Math.RND`, `Phaser.Time.addEvent` 비사용 + IRandom/IClock Port 강제 (TDD 효율 위해 수용)

### 마이그레이션 시나리오 (Phaser → 다른 엔진)

ADR-0001 Hexagonal 덕분에 엔진 교체 시 영향 범위가 **`adapters/phaser/` 폴더 + `main.ts`로 한정**됩니다.

- Domain: 무영향
- Application use case: 무영향
- Adapters/persistence: 무영향
- Infrastructure: `register-sw.ts`, `install-prompt.ts`는 무영향. Audio/Haptic은 무영향
- 영향 범위: `adapters/phaser/{scenes, objects, managers, config.ts}` 전부 재작성 (예상 2주)

---

## 12살 비유

> 좀비팡을 만드는 **레고 세트의 종류**를 고르는 일입니다.
>
> - **Phaser 3** = 친구 집에 있는 *완성형 레고 도시 세트*. 도로, 집, 신호등이 다 들어있어서 바로 마을을 만들 수 있습니다.
> - **PixiJS** = 친구 집에 있는 *벽돌만 잔뜩* 있는 박스. 모든 걸 직접 만들어야 합니다.
> - **Three.js** = *3D 우주선 키트*. 2D 마을은 못 만듭니다.
> - **Unity WebGL** = *전동공구가 들어있는 산업용 키트*. 너무 무거워서 가방(자산 < 3MB)에 안 들어갑니다.
>
> 우리는 **마을 키트(Phaser)** 를 고릅니다. 마을 키트의 도로/집/신호등을 그대로 쓰되, "어디에 도로를 깔지"(domain 규칙)는 우리 설명서를 따릅니다.

---

## References

- 본 프로젝트 SSOT: `docs/game-design/bible.md` Title Page (기술 스택)
- Phase A 조사: `docs/research/phaser-vite-stack.md`
- Phaser 공식: https://docs.phaser.io/, https://github.com/phaserjs/template-vite-ts
- 비교 자료: https://html5gameengine.com/
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code`
