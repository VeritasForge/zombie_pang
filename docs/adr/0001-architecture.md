# ADR 0001: Hexagonal 4계층 (domain/application/adapters/infrastructure) 채택

- **Status**: Accepted
- **Date**: 2026-05-17
- **Last Updated**: 2026-05-17
- **Deciders**: Project Owner + Phase A debate consensus (0.847) + AI agent research

> **명명 주의**: 풀 **4계층 Hexagonal** (`domain/application/adapters/infrastructure`) + Port/Adapter 패턴입니다.
> 단순 "Scene-based"가 아니며, Phaser는 의도적으로 **Adapter** 위치에 한정합니다.
> 단일 검색/처치 use case 1개를 만드는 데 약 6~8개 파일이 생성됩니다. 이는 의도된 비용입니다 (테스트 가능성 + 결정론 RNG/Clock 분리).

---

## Context

좀비팡 (Off-Clock Pang) Phase C 코드 구현의 일관된 아키텍처를 결정해야 합니다.

### 요구사항

1. **TDD 친화** — 모든 RED phase는 `[Happy]/[Boundary]/[Error]` 3 카테고리 + Property-based + Mutation 80%
2. **결정론 강제** — RNG, Clock, RAF, setTimeout 등 비결정성을 외부화하여 property-based test에서 seed=42 재현 가능
3. **Phaser 종속성 격리** — 향후 PixiJS/Cocos2d 대체 가능성 확보. 도메인 규칙(Score, Combo, Wave)은 엔진 무관
4. **PWA 오프라인 친화** — localStorage / IndexedDB / Web Audio / Vibration API를 Adapter 뒤에 숨김
5. **5챕터 × 10층 = 50층 = 60초 × 5 envelope** — 게임 도메인 규칙이 풍부 (combo tier, spawn rate 곡선, 보스 HP 곡선)

### 후보

- **Scene-based only (Phaser scene 단일 layer)**
- **ECS (Entity-Component-System)**
- **Layered (data/business/UI 단순 3계층)**
- **DDD (Strategic + Tactical) full**
- **Clean Architecture (Uncle Bob)** 4-5 레이어 + DI 컨테이너
- **Hexagonal (Ports & Adapters)** ← 채택

---

## Decision

**Hexagonal 4계층 + Phaser는 Adapter + DI 컨테이너 생략 (단순 factory wiring)**

### 4 레이어 정의

```
┌──────────────────────────────────────────────────────────────┐
│ 외부 세계 (Browser / iOS Safari / localStorage / Audio)      │
├──────────────────────────────────────────────────────────────┤
│ infrastructure/   (Composition root, 외부 API 래퍼)          │
│   container.ts — 모든 Port 구현체 wiring (factory)           │
└──────────────┬───────────────────────────────────────────────┘
               │ Port 구현체 주입
┌──────────────▼───────────────────────────────────────────────┐
│ adapters/         (Phaser UI / persistence)                  │
└──────────────┬───────────────────────────────────────────────┘
               │ application use case 호출
┌──────────────▼───────────────────────────────────────────────┐
│ application/      (5 use case: start/kill/powerup/...)       │
└──────────────┬───────────────────────────────────────────────┘
               │ domain 순수 규칙 실행
┌──────────────▼───────────────────────────────────────────────┐
│ domain/           (POJO + Port interface, 외부 의존성 0)     │
└──────────────────────────────────────────────────────────────┘
의존성 방향: domain ← application ← adapters/infrastructure
```

### 레이어별 책임 & 제약

| 레이어 | 책임 | 의존 허용 | 의존 금지 |
|--------|------|-----------|----------|
| `domain/` | Score / Combo / Wave / Card / DailyStreak / Run 등 순수 규칙 + Port interface 선언 | 자기 자신만 | Phaser, DOM, setTimeout, Math.random, Date.now |
| `application/` | 5 use case (start-run, kill-zombie, apply-powerup, pick-upgrade, end-chapter, end-run) | `domain` | `adapters`, `infrastructure`, 외부 SDK |
| `adapters/phaser/` | Scene, GameObject, Manager (Phaser 종속 코드 전부) | `domain` (port), `application` (use case) | `infrastructure` 직접 |
| `adapters/persistence/` | LocalStorageSaveStore 등 ISaveStore 구현체 | `domain` (port) | `application`, `adapters/phaser` |
| `infrastructure/` | SeededRandom, SystemClock, WebAudioSynth, VibrationApi, PWA register-sw + Composition root (`container.ts`) | `domain`, `application`, `adapters` | (모든 레이어를 wiring) |

### DIP (Dependency Inversion Principle)

모든 화살표는 **안쪽(domain)** 을 향합니다. `infrastructure/`가 `domain/ports/`를 구현하므로 의존성이 역전됩니다.

```
adapters/phaser ──→ application ──→ domain
                          ↑
                          │ implements
infrastructure ───────────┘
```

### DI 컨테이너 생략

`infrastructure/container.ts`는 tsyringe/inversify 등 풀 DI 컨테이너 없이 **단순 factory wiring**으로 처리합니다. skeleton 단계에 boilerplate가 과도하기 때문.

```ts
// src/infrastructure/container.ts
import { SeededRandom } from './random/seeded-random'
import { SystemClock } from './clock/system-clock'
import { LocalStorageSaveStore } from '@/adapters/persistence/local-storage-save-store'
import { startRun } from '@/application/start-run'

const random = new SeededRandom(42)
const clock = new SystemClock()
const saveStore = new LocalStorageSaveStore()

export const useCases = {
  startRun: startRun({ random, clock, saveStore }),
  // ...
}
```

---

## Consequences

### 긍정적

1. **TDD 효율 극대화** — Domain은 Port mock + FakeClock + SeededRandom만 주입하면 외부 의존 0 상태로 100% 커버 가능
2. **결정론 강제** — seed=42로 fast-check property-based 1000회 재현, Stryker mutation 80% 강제
3. **엔진 교체 가능성** — Phaser → Pixi 이전 시 `adapters/phaser/` 폴더만 재작성. Domain/Application 무영향
4. **오프라인 PWA 친화** — localStorage / Web Audio / Vibration이 Port 뒤에 격리되어 iOS Safari 미지원 시 graceful fallback (no-op 구현체) 주입 용이
5. **Ethics 강제** — Notification.requestPermission, 카운트다운 압박 텍스트, 가챠 확률 등 Bible §7 안티패턴 10개를 도메인 레이어에서 차단 가능 (compile-time)

### 부정적

1. **파일 수 증가** — 단일 use case (예: 좀비 처치)에 약 6~8개 파일 (domain VO + use case + Port + Adapter + Phaser scene + 테스트들). skeleton 단계에 비용 부담
2. **Phaser scene 분리 학습 곡선** — Scene이 Adapter 역할이라는 점이 신규 기여자에게 직관적이지 않음 (Phaser scene-based 게임의 일반 관례와 다름)
3. **Domain의 Phaser 무지** — 도메인이 Phaser GameObject 좌표 / Tween / Animation을 알 수 없으므로, 시각 효과 결합은 Application 레이어 또는 Phaser Scene event listener에서 처리해야 함

### 거부된 대안

| 대안 | 거부 이유 |
|------|----------|
| **Scene-based only** (Phaser scene 단일 layer) | 게임 로직과 렌더 코드가 같은 파일 → TDD 불가능. Bible §3 60초 시퀀스 검증 불가. property-based 테스트 작성 시 Phaser 전체 부팅 필요 |
| **ECS** (Entity-Component-System) | bitECS/ECSY 등 학습 곡선. 좀비팡은 좀비/카드/Power-up 각 ~15종 — ECS 진가 발휘에 미달. 도메인 모델보다 데이터 지향이 강해 게임 디자인 변경 시 마이그레이션 부담 |
| **Layered (data/business/UI)** | data/UI 사이 추상화 약함. setTimeout/Math.random 직접 사용 막을 방법이 컨벤션 외 없음. Property-based test 비효율 |
| **풀 DDD** (Strategic + Tactical full) | Aggregate / Domain Event / Saga 등 좀비팡 규모에 과함. 카드 효과 발동을 Domain Event로 처리하면 60fps에서 이벤트 폭증 |
| **풀 Clean Architecture** (Uncle Bob 4-5 레이어 + DI 컨테이너) | Controller/Presenter/Boundary 등 boilerplate 폭증. tsyringe 등 DI 컨테이너 reflect-metadata 부담 |

---

## 12살 비유

> 게임을 **레고**로 만든다고 생각해보세요.
>
> - **domain** = 레고 설명서 (어떻게 조립해야 하는지 *규칙*만 적힌 책). 빨간 블록이든 파란 블록이든 똑같이 적용됩니다.
> - **application** = 레고 조립을 진행하는 *매뉴얼* (절차). 어떤 순서로 조립할지 알려줍니다.
> - **adapters** = 진짜 레고 블록을 손에 쥐고 *끼우는* 사람. Phaser가 여기 들어갑니다.
> - **infrastructure** = 레고 박스, 카운터, 부품 공급처. localStorage가 여기 들어갑니다.
>
> 설명서(domain)는 Phaser 대신 Pixi로 바꿔도 그대로 사용 가능합니다.
> 좀비를 *팡!* 하고 처치하는 규칙(Combo 5kill → ×1.5)은 게임 엔진과 무관하기 때문입니다.

---

## References

- 본 프로젝트 SSOT: `docs/game-design/bible.md` (Phase A-8 산출물)
- Master Plan: `docs/plan/zombie-pang-master-plan.md` §6 아키텍처 SSOT
- Hexagonal 상세: `docs/architecture/hexagonal-game.md`
- 외부:
  - Alistair Cockburn — [Hexagonal Architecture (Original)](https://alistair.cockburn.us/hexagonal-architecture/)
  - Vaughn Vernon — *Implementing Domain-Driven Design*
  - Robert C. Martin — *Clean Architecture*
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code`
