# CEO 보스 거동 강화 — 디자인 Spec

**작성일**: 2026-05-23
**상태**: Approved (디자인 합의 완료, 구현 플랜 작성 대기)
**작성자**: 좀비팡 팀 (brainstorming 협업)
**관련 SSOT**:
- Bible §2 (좀비 분류), §3 (보스 5초 연출), §5 (juice/SFX), §7 (Ethics 10 안티패턴)
- ADR-0001 (Hexagonal), ADR-0004 (TDD), ADR-0006 (Game design principles)
- CLAUDE.md §3~§8
**관련 명확화 노트**: [`docs/stratage/ceo-boss-movement-pattern-explained.md`](../../stratage/ceo-boss-movement-pattern-explained.md)

---

## 1. 문제 정의 (Problem)

현재 CEO 보스는 **화면 정중앙 고정 스폰**되며 이동 로직이 0개다 (`src/adapters/phaser/scenes/game-scene.ts:236-252`). 사용자 피드백:

> "CEO가 그냥 가만히 있어서 사냥이 너무 쉬운데, CEO가 표현될 때 부하 좀비들이 나오고, CEO가 계속 움직여서 잡기 어렵게 하면 어떨까?"

Bible §3은 CEO의 "Telegraph / Engagement / Climax" 5초 연출만 정의하고 **이동·미니언은 Open** 상태. 본 spec이 그 결정을 채운다.

### 1.1 용어 정의 (C2 fix)

본 spec에서 다음 용어를 구분한다:

| 용어 | 정의 | 시간 범위 |
|------|------|----------|
| **챕터 envelope** | wave 1 시작부터 wave 10 종료(챕터 결과 화면)까지의 총 시간 | 60초 (Bible 상한 68초) |
| **보스 페이즈 (Bible §3 연출)** | CEO 등장 후 Telegraph(1s) / Engagement(3s) / Climax(1s) 시각 연출 구간 | 고정 5초 (상한 8초) |
| **보스 페이즈 (본 spec 가용 시간)** | CEO 등장(wave 10 진입)부터 CEO HP=0까지의 **사용자 플레이 시간** | 동적 — Ch1 약 3~5초, Ch5 약 8~15초 (HP/Damage Tier/Tap rate에 따라 변동) |

본 spec의 "보스 페이즈"는 **사용자 플레이 시간**을 가리킨다. Bible §3의 5초 연출은 보스 처치 직후 Climax/freeze frame에만 적용된다 (보스 처치 전까지는 사용자 입력에 의해 길이가 결정됨).

**Bible §3 모델 확장**: 본 spec은 Bible §3 "보스 페이즈 5초"를 "연출 구간"으로 재해석하고, 실제 사용자 플레이 시간은 60초 envelope 안에서 동적으로 결정된다는 모델을 채택한다. 이 결정은 **ADR-0007 (보스 페이즈 모델)**에서 공식화한다 (§13 참조).

---

## 2. 목표 (Goals)

1. CEO 보스전이 **챕터별 점진 난이도 곡선**을 갖도록 한다 (Ch1 가장 쉬움 → Ch5 가장 어려움).
2. CEO에 **8자 궤도 이동**을 도입해 헤드샷 노리는 재미를 만든다.
3. 챕터 2부터 **미니언 (부하 좀비)** 을 함께 등장시켜 화면 압박을 만든다.
4. Bible §7 **Ethics 안티패턴 0건** 충돌을 유지한다.
5. **결정론 100%** 유지 — `IRandom` 의존성 추가하지 않는다.
6. **챕터 envelope 60초** (Bible 상한 68초) 안에 보스 페이즈 (사용자 플레이 시간) 가 끝난다. Ch5 최악 케이스 (HP 38, 4dmg/tap, weak spot 명중률 50%) 시뮬레이션: 평균 7~12초.

### 비목표 (Non-Goals)

- 새 zombie 종 추가 안 함 (Bible §2 4종 고정)
- 새 power-up 추가 안 함 (Bible §4 3종 고정)
- CEO 외형/아트 변경 안 함 (Bible §5 그대로)
- 미니언 HP/처치 점수 변경 안 함 (기존 신입=1HP·10점 / 과장=1HP·20점 / 팀장=2HP·30점)
- visual regression test 미포함 (MVP 범위 외)

---

## 3. 핵심 결정 (Decisions)

| # | 결정 | 채택안 | 근거 |
|---|------|--------|------|
| D1 | 적용 범위 (난이도 곡선) | Phase별 점진 도입, Ch1=이동만 시작 | 학습 곡선 보호 |
| D2 | 이동 패턴 | **8자 궤도 (Lissajous, sin 공식)** + 조합 ④ | 결정론 100% + Ethics 안전 + Bible §3 색상 연계 |
| D3 | 미니언 구성 | Phase별 종 다양화 (D 옵션) | 후반 챕터 다양성, 기존 4종 재사용 |
| D4 | 미니언 스폰 타이밍 | **초기 일괄 스폰** (A 옵션) | envelope 안전, 시각 임팩트 |
| D5 | 보스 wave 도주 fail 정책 | **γ 격리** — 보스 wave 동안 미니언 도주는 카운트 안 함 | Bible §7 #10 carrot/stick 좌절감 회피 |
| D6 | CEO 처치 시 잔여 미니언 | 즉시 폭사 + 점수 인정 | 시각 임팩트, envelope 안전 |

**의도적으로 거부한 옵션**:
- 회피 대시 (탭 반응) — Ethics #10 carrot/stick 위반 + 결정론 깨짐
- 랜덤 텔레포트 단독 — Ethics #4 슬롯머신화
- Phase별 패턴 변신 (조합 ②) — MVP 학습 부담 ↑
- 점진 미니언 스폰 (B 옵션) — envelope 위험

---

## 4. Phase 상수 테이블 (SSOT)

이 표가 본 디자인의 **데이터 진실 단일 출처(SSOT)**다. 코드 (`boss-phase-config.ts`)와 1:1 동기화한다.

| Phase | 챕터 | R (px) | ω (rad/s) | 미니언 | 격노 트리거 | 격노 효과 |
|-------|------|--------|-----------|--------|------------|----------|
| 1 | Ch1 | 80 | 0.5 | 0 | 없음 | - |
| 2 | Ch2 | 100 | 0.7 | 신입×2 | 없음 | - |
| 3 | Ch3 | 120 | 1.0 | 신입×3 + 과장×1 | 없음 | - |
| 4 | Ch4 | 130 | 1.3 | 신입×4 + 과장×2 | HP 50% | ω ×1.3 |
| 5 | Ch5 | 150 | 1.6 | 신입×4 + 과장×3 + 팀장×1 | HP 67% / 33% | ω ×1.3 / ω ×1.6 + R ×1.15 |

**수치 근거**:
- **R 정의** (C4 fix): R은 8자(Lissajous 1:2) 곡선의 **per-axis 진폭(amplitude)**. bounding box = `[center.x - R, center.x + R] × [center.y - R, center.y + R]`. 곡선이 사각형을 모두 채우지 않으나, **유클리드 거리 `‖pos - center‖`는 최대 √2·R**에 도달할 수 있음 (예: ωt ≈ 0.95 부근에서 |x|·|y| 둘 다 크게).
- 최대 R(150) → x축 진폭 ±150, y축 진폭 ±150. bounding box 폭 300px < 화면 폭 390px (77%). 손가락 가림은 중앙 위주 활동으로 회피 (per-axis 진폭의 의미).
- 최대 ω(1.6 rad/s) → 8자 1주기 약 3.9초. **보스 페이즈 가용 시간**(§1 정의 참조)이 5~15초이므로 1~4회 회전. 격노 2단 적용 시 ω·1.6 → 1주기 2.45초.
- 미니언 최대 8 + CEO 1 = 화면 객체 9개 (탭 정확도 한계 안).
- 격노 1단(ω×1.3) / 2단(ω×1.6 + R×1.15) — Bible §3 HUD 녹/황/적 3등분과 매칭.

**격노 트리거 부동소수점 정책** (구현 시 정확성 보장):
- 코드는 **literal 비교** 사용: `ratio <= 0.5`, `ratio <= 0.67`, `ratio <= 0.33`
- 2/3, 1/3 분수 사용 안 함 (부동소수점 정밀도 불일관 회피)
- 의미: "약 67%/33% 부근" — 정확한 분수 경계가 아닌 의도된 근사값

---

## 5. 아키텍처 (Hexagonal 4계층 준수)

CLAUDE.md §4 DIP 규칙 — 도메인은 Phaser/DOM 무의존.

### 5.1 신규 도메인 모듈 (`src/domain/boss/`)

| 파일 | 책임 | 외부 의존 |
|------|------|----------|
| `boss-movement.ts` | 8자 궤도 위치 계산 | 순수 함수 (Math.sin) |
| `boss-rage-level.ts` | HP% → 격노 단계 + R/ω 배율 | 순수 함수 |
| `minion-composition.ts` | Chapter → MinionSpec[] | 순수 함수 |
| `boss-phase-config.ts` | Phase 상수 테이블 (Ch1~5) | 상수만 |

### 5.2 신규 application use case (`src/application/`)

| 파일 | 책임 | 주입 Port |
|------|------|----------|
| `spawn-boss-wave.ts` | chapter → {boss, minions[]} | (없음) |
| `tick-boss-position.ts` | dt 누적 → 새 위치, dt clamp | `IClock` |

### 5.3 수정 대상

**C1 fix**: `src/domain/run/` 디렉토리는 **현재 코드베이스에 부재** (도주 카운트는 `GameScene.fled` 인스턴스 변수로만 관리, `game-scene.ts:84,400-407`). 도메인 추출 대신 어댑터 내 가드로 처리 (SIMPLIFIER 권장).

| 파일 | 변경 | 이유 |
|------|------|------|
| `src/domain/wave/spawner.ts` | boss wave에서 `spawnBossWave` 사용 | D4 일괄 스폰 정책 |
| `src/adapters/phaser/scenes/game-scene.ts` | (a) `spawnBoss()` → 미니언 N개 생성 (`findSpawnPoint` × N 재사용), (b) frame `update()`에서 `clampDeltaMs` → `computeBossPosition` 호출, (c) **`private bossWaveActive: boolean` 플래그 추가, `update()` 내 미니언 lifespan 도주 분기 (`game-scene.ts:399-410`)를 `if (this.bossWaveActive && z.type !== ZOMBIE_TYPE.CEO) continue` 가드**, (d) CEO 처치 시 잔여 미니언 한 frame 내 일괄 폭사 + `bossWaveActive = false` | D2, D4, D5, D6 |
| `src/adapters/phaser/objects/zombie.ts` | (실제 파일명, `.object.ts` 아님) Phaser `setPosition(x, y)` 직접 사용 — 별도 wrapper 도입 안 함 (SIMPLIFIER 권장) | YAGNI |
| `src/adapters/phaser/objects/boss-hud.ts` | **N5 fix (단일 결정)**: 색상 결정을 `computeRageLevel(hp, maxHp, chapter)` 결과로 변환 — `rage===2 → lead(빨강), rage===1 → middle(노랑), rage===0 → intern(녹색)`. 도메인 임계가 SSOT 단일 출처가 됨. boss-hud의 기존 `ratio < 0.33`, `< 0.66` literal 비교 폐기 | C3/N5 fix |

### 5.4 의존성 방향 (불변)

```
[Phaser GameScene] ──→ [tick-boss-position] ──→ [boss-movement(t, R, ω)]
                  ──→ [spawn-boss-wave]    ──→ [minion-composition(chapter)]
                                          ──→ [boss-phase-config[chapter]]
                  ──→ [bossWaveActive 플래그 (어댑터-인라인 가드)]  (B2 fix)
                       └─ update() 미니언 lifespan 분기에서 fled 차단
            ↑
            └── IClock Port (주입) — domain은 Date.now 모름
```

---

## 6. 도메인 모델 상세 (시그니처)

### 6.1 `boss-movement.ts`

```ts
type BossPosition = { x: number; y: number };

export function computeBossPosition(
  tMs: number,
  center: { x: number; y: number },
  R: number,
  omegaRadPerSec: number
): BossPosition {
  if (tMs < 0) {
    throw new RangeError(`tMs must be non-negative (got ${tMs})`);
  }
  const t = tMs / 1000;
  return {
    x: center.x + R * Math.sin(2 * omegaRadPerSec * t),
    y: center.y + R * Math.sin(omegaRadPerSec * t),
  };
}

export function clampDeltaMs(dt: number, maxDt = 100): number {
  if (dt < 0) return 0;
  if (dt > maxDt) return maxDt;
  return dt;
}
```

**왜 `sin(2ωt) × sin(ωt)`**: 가로가 세로의 2배 주기 → ∞ 모양 (Lissajous 1:2 곡선). 단일 함수로 8자.

**`t<0` 정책** (C5 fix): IClock 역행/시계 점프로 음수 t 주입 시 `RangeError` 즉시 throw. 어댑터에서 `clampDeltaMs`로 dt 미리 정규화 → 도메인은 음수를 받지 않음이 invariant. §8.1 / §9.1과 일치.

### 6.2 `boss-rage-level.ts`

```ts
import type { ChapterNumber } from '@shared/types/branded';

export type RageLevel = 0 | 1 | 2;
export type PhaseConfig = { R: number; omega: number };

export function computeRageLevel(
  hp: number,
  maxHp: number,
  chapter: ChapterNumber
): RageLevel {
  if (maxHp <= 0) {
    throw new RangeError(`maxHp must be positive (got ${maxHp})`);
  }
  if (chapter <= 3) return 0;
  const ratio = hp / maxHp;
  if (chapter === 4) return ratio <= 0.5 ? 1 : 0;
  // chapter === 5
  if (ratio <= 0.33) return 2;
  if (ratio <= 0.67) return 1;
  return 0;
}

export function applyRageMultipliers(base: PhaseConfig, rage: RageLevel): PhaseConfig {
  if (rage === 0) return base;
  if (rage === 1) return { ...base, omega: base.omega * 1.3 };
  return { R: base.R * 1.15, omega: base.omega * 1.6 }; // rage === 2
}
```

**에러 정책** (H1 fix): 기존 코드 컨벤션 (`src/domain/score/`, `combo.ts`, `powerup/boss.ts` 등 30+건)이 `RangeError` 사용 — 본 spec도 `RangeError`로 통일. `InvariantError` 클래스 신규 도입 안 함.

### 6.3 `minion-composition.ts`

```ts
export type MinionType = 'intern' | 'middle' | 'lead';
export type MinionSpec = { type: MinionType; count: number };

export function composeMinions(chapter: ChapterNumber): readonly MinionSpec[] {
  switch (chapter) {
    case 1: return [];
    case 2: return [{ type: 'intern', count: 2 }];
    case 3: return [{ type: 'intern', count: 3 }, { type: 'middle', count: 1 }];
    case 4: return [{ type: 'intern', count: 4 }, { type: 'middle', count: 2 }];
    case 5: return [
      { type: 'intern', count: 4 },
      { type: 'middle', count: 3 },
      { type: 'lead',   count: 1 },
    ];
  }
}

export function totalMinions(chapter: ChapterNumber): number {
  return composeMinions(chapter).reduce((sum, spec) => sum + spec.count, 0);
}
```

### 6.4 `boss-phase-config.ts`

```ts
export const PHASE_CONFIGS = {
  1: { R: 80,  omega: 0.5 },
  2: { R: 100, omega: 0.7 },
  3: { R: 120, omega: 1.0 },
  4: { R: 130, omega: 1.3 },
  5: { R: 150, omega: 1.6 },
} as const satisfies Record<ChapterNumber, PhaseConfig>;
```

---

## 7. 데이터 흐름

```
[Wave 10 진입]
        │
        ▼
spawn-boss-wave(chapter)
  → composeMinions(chapter) → MinionSpec[]
  → PHASE_CONFIGS[chapter] → {R, ω}
  → return { boss: BossSpec, minions: MinionSpec[] }
        │
        ▼
GameScene.spawnBoss()  (Bible §3 Telegraph 0~1s 페이즈 동안)
  → Boss zombie 객체 생성 (center, t=0 즉시)
  → Minions N마리 객체 생성 동시 (t=0 즉시, 한 frame 내 일괄)
    - 기존 spawner 좌표 로직 재사용 (화면 위쪽에서 등장)
  → nextSpawnAtMs = +∞ (일반 좀비 스폰 차단)
  → bossWaveActive = true (D5 γ 격리: update() 미니언 lifespan 도주 가드 활성화)
  → bossStartTimeMs = clock.now()
        │
        ▼ (매 frame, ~60fps)
GameScene.update(time, delta)
  → t = clock.now() - bossStartTimeMs
  → rage = computeRageLevel(bossHp, maxHp, chapter)
  → eff  = applyRageMultipliers(PHASE_CONFIGS[chapter], rage)
  → pos  = computeBossPosition(t, center, eff.R, eff.omega)
  → bossZombie.setPosition(pos.x, pos.y)   (B1 fix: Phaser Container 상속 메서드 직접 사용, wrapper 없음)
        │
        ▼ (사용자 탭 발생 시)
Phaser pointer-down → kill-zombie
  • 미니언 처치: 일반 zombie 처치 로직 재사용 (점수, 콤보, drop rate)
  • CEO 처치: HP -1, rage 재계산
        │
        ▼ (CEO HP → 0)
end-boss-fight
  • 잔여 미니언 한 frame 내 일괄 폭사 (개별 destroy 호출 + 점수 합산 1회)
    - Power-up drop 정상 적용 (각 미니언별 5% / Coin Tier 적용)
  • Bible §5 24p 파편 + 600ms freeze (CEO 1회 트리거만, 미니언 폭사는 freeze 추가 안 함)
  • Bible §3 Climax 0.3× 슬로우모션
  • bossWaveActive = false (정상 복귀, 일반 wave 도주 카운트 재개)
  • 챕터 결과 화면 전환
```

### 7.1 정책 매트릭스

| 상호작용 | 정책 |
|---------|------|
| 미니언 처치 점수 | 일반 좀비와 동일 (신입=10, 과장=20, 팀장=30) |
| 미니언 처치 콤보 | 일반 콤보 시스템에 합산 |
| 미니언 power-up drop | 일반 wave와 동일 (5%, Coin Tier로 ~6.5%) |
| 미니언 도주 | **카운트 안 함** (D5 γ 격리: GameScene `bossWaveActive=true` 가드, `update()` 미니언 lifespan 분기에서 `fled` 증가 차단) |
| CEO 처치 시 잔여 미니언 | 즉시 폭사 + 점수 인정 (D6) |
| 보스 wave 진입 시 도주 카운트 | 유지 (초기화 안 함) |

---

## 8. 엣지 케이스 & 에러 처리

### 8.1 도메인 함수 엣지 케이스

| 함수 | 케이스 | 정책 |
|------|--------|------|
| `computeBossPosition(t=0)` | sin(0)=0 → center 반환 | 정상 (Boundary) |
| `computeBossPosition(tMs<0)` | 어댑터 `clampDeltaMs` 거치므로 발생 불가. 발생 시 `RangeError` throw | Error |
| `computeRageLevel` HP=50%/67%/33% 경계 | `<=` 사용으로 명확 | Boundary |
| `computeRageLevel` HP<0 | ratio<0 → 모든 임계 통과 → rage=2 | 자연 처리 (Happy) |
| `computeRageLevel` HP>maxHp | ratio>1 → rage=0 | 자연 처리 (Boundary) |
| `computeRageLevel` maxHp≤0 | 즉시 `RangeError` throw | Error |
| `composeMinions(chapter=1)` | `[]` 반환 | Happy |
| `applyRageMultipliers(invalid)` | TS exhaustive switch | 컴파일러 보장 |

### 8.2 어댑터 엣지 케이스

| 케이스 | 정책 |
|--------|------|
| Phaser 일시정지 → 복귀 후 큰 dt | `tick-boss-position`에서 dt > 100ms → 100 clamp |
| 미니언 화면 위쪽 스폰 | 일반 좀비 스폰 좌표 로직 재사용 |
| 보스 처치 직후 추가 탭 | bossZombie destroy → pointer-down null 가드 |
| 보스 wave 동안 미니언 도주 | `bossWaveActive=true` 가드 분기 → `fled` 미증가 |
| `clock.now()` 시계 점프 | dt<0 → 0 clamp + 1회 console.warn |

### 8.3 외부 의존성 graceful fallback

| 의존성 | 실패 시 | 정책 |
|--------|--------|------|
| Vibration API 미지원 | iOS Safari 등 | no-op (Bible §6) |
| `IClock` 시계 역행 | 시스템 시계 변경 | dt=0 clamp + console.warn |

---

## 9. 테스트 전략

### 9.1 테스트 매트릭스

| 파일 | [Happy] | [Boundary] | [Error] | Property | 커버리지 |
|------|---------|-----------|---------|----------|---------|
| `boss-movement.test.ts` | t=1000ms 위치 | t=0 → center, t=π/ω 좌표 | `tMs<0` → throw `RangeError`; `clampDeltaMs(-1)`→0, `clampDeltaMs(150)`→100 | P1a, P1b, P5 | 100% |
| `boss-rage-level.test.ts` | Ch5 HP 50% → rage 1; rage 0/1/2 적용 시 R/ω 정확값 (mutation kill) | HP 50%/67%/33% 경계 (양/같음/음 3점), Ch1~3 무조건 0, Ch4 HP 51%→rage 0, Ch5 HP 68%→rage 0, Ch5 HP 34%→rage 1 | `maxHp=0` → throw `RangeError`, `maxHp=-1` → throw `RangeError` | P2 | 100% |
| `minion-composition.test.ts` | Ch3 → 신입3+과장1 | Ch1 → `[]` | (TS exhaustive — 부재 사유: 컴파일러 보장) | P3, P4 | 100% |
| `boss-phase-config.test.ts` | Ch5 → R=150, ω=1.6 | Ch1/Ch5 양 끝 | (lookup table — 부재 사유) | - | 100% |
| `spawn-boss-wave.test.ts` (app) | Ch3 → {boss, minions:[신입3,과장1]} | Ch1 → minions:[] | (Port 무관 — 부재 사유) | - | ≥95% |
| `tick-boss-position.test.ts` (app) | dt=16ms 누적 후 위치 갱신 | dt=0 → 동일 위치 | dt>100ms → 100 clamp, dt<0 → 0 clamp | P5 | ≥95% |
| `game-scene.boss.test.ts` (adapter) | spawnBoss → boss+minion N객체 | Ch1=미니언 0, Ch5=8 | (canvas-mock smoke) | - | ≥70% |

### 9.2 Property-based invariant 6개 신규 (seed=42, numRuns=1000)

Bible 기존 7개에 추가 → 총 13개. **P1을 per-axis로 분리** (C4 fix).

**R_eff 정의** (1.b fix): `R_eff := applyRageMultipliers(PHASE_CONFIGS[chapter], computeRageLevel(hp, maxHp, chapter)).R`. P1a/P1b 모두 격노 적용 후 effective R 사용. property 구현자는 base R이 아닌 이 식을 정확히 사용해야 falsification 의미가 성립.

**P5 도메인 명시** (7.b fix): `fc.integer({min: 0, max: 60_000})` (envelope 60초 범위 안). 큰 tMs에서 IEEE 754 정밀도 저하 회피.

| # | Invariant | 검증 대상 |
|---|-----------|----------|
| P1a | `∀tMs∈[0, 60000]. cx - R_eff ≤ computeBossPosition(tMs).x ≤ cx + R_eff` | `boss-movement` |
| P1b | `∀tMs∈[0, 60000]. cy - R_eff ≤ computeBossPosition(tMs).y ≤ cy + R_eff` | `boss-movement` |
| P2 | `∀(chapter ∈ [1..5], hp ∈ [0..maxHp]). rage ∈ {0,1,2}` | `boss-rage-level` |
| P3 | `∀chapter ∈ [1..5]. totalMinions(chapter+1) ≥ totalMinions(chapter)` (단조 증가, c=1→2 포함) | `minion-composition` |
| P5 | 동일 `(tMs, center, R, ω)` → 동일 위치 (결정론, IEEE 754 부동소수점) | `boss-movement` |
| **P6 신규** | `∀(chapter, hp1 ≤ hp2). computeRageLevel(hp1, ...) ≥ computeRageLevel(hp2, ...)` (격노 단조성, HP 줄수록 rage 비감소) | `boss-rage-level` |

**삭제된 invariant**:
- **P4 폐기**: `totalMinions(1)=0`은 단일 상수 검증 → `[Boundary]` 단위 테스트로 흡수 (property로 부적합).

**테스트 케이스 추가**:
- `applyRageMultipliers(base={R:100,ω:1}, rage=0)` = `{R:100, ω:1}` (identity)
- `applyRageMultipliers(..., rage=1)` = `{R:100, ω:1.3}` (정확 mutation kill)
- `applyRageMultipliers(..., rage=2)` = `{R:115, ω:1.6}` (정확 mutation kill)

### 9.3 Mutation 임계 (Stryker)

| 모듈 | 임계 |
|------|------|
| `domain/boss/*` | **≥ 80%** (break threshold) |
| `application/spawn-boss-wave`, `tick-boss-position` | **≥ 70%** |

### 9.4 E2E 시나리오 (Playwright, Pixel 5)

| # | 시나리오 | 검증 |
|---|---------|------|
| E1 | Ch1 보스 등장 → 5초 위치 추적 | CEO `x` 좌표 표준편차 > 30px (정적 아님, 정량화) |
| E2 | Ch3 보스 등장 직후 한 frame (~16ms) | 화면 객체 정확히 5개 (CEO + 신입3 + 과장1) |
| E3 | Ch5 보스 HP 67%/33% 도달 (격노 1단/2단) | HUD 색상 녹→황 (rage 1) → 황→적 (rage 2). 보스 frame 간 좌표 차이 → ω 추정값이 base × 1.3 (rage 1), base × 1.6 + R × 1.15 (rage 2) 근사 |
| **E4 (γ 격리 회귀, N4 fix)** | Ch3 보스 wave 진입 후 미니언 5마리 의도적 도주 | `fled` 카운터 변하지 않음 (D5 γ 격리 회귀 가드, R2/R2b mitigation) |
| **E5 (envelope 회귀)** | Ch5 보스 페이즈 시작 ~ CEO 처치 종료 | 총 elapsed time ≤ 60000ms (Bible 챕터 envelope 60초 회귀 가드) |

### 9.5 테스트 작성 순서 (TDD RED-GREEN-REFACTOR)

```
1. boss-phase-config.test.ts       (가장 단순)
2. minion-composition.test.ts      (Property 동시)
3. boss-rage-level.test.ts         (invariant throw)
4. boss-movement.test.ts           (Property 동시)
5. spawn-boss-wave.test.ts         (use case)
6. tick-boss-position.test.ts      (IClock 주입)
7. game-scene.boss.test.ts         (adapter integration)
8. E1/E2/E3 Playwright             (최종 검증)
```

---

## 10. 검증 게이트 (완료조건)

본 spec 구현 완료 = 아래 모두 exit 0.

| # | 명령 | 임계 |
|---|------|------|
| 1 | `pnpm typecheck` | error 0, no `any` |
| 2 | `pnpm lint` | error 0 |
| 3 | `pnpm test` | domain/boss/ 100%, application/ ≥95%, adapter/ ≥70% |
| 4 | `pnpm test:prop` | P1~P5 모두 0건 실패 (seed=42, 1000회) |
| 5 | `pnpm test:mutation` | domain/boss/ ≥80%, application ≥70% |
| 6 | `pnpm test:e2e` | E1/E2/E3 모두 통과 |
| 7 | Bible §7 Ethics grep | `Notification.requestPermission` 등장 0건 (변경 없음 확인) |

---

## 11. 금지사항 (Don'ts)

- 🚫 도메인에 Phaser/DOM import — **대신** POJO + Port 주입
- 🚫 `Math.random()` / `Date.now()` / `setTimeout` 도메인 직접 사용 — **대신** `IClock` Port (본 spec은 `IRandom` 미사용)
- 🚫 새 zombie 종 추가 — **대신** 기존 4종 재사용
- 🚫 미니언 HP/점수 변경 — **대신** 기존 값 그대로
- 🚫 회피 대시·랜덤 텔레포트 단독 채택 — **대신** 8자 + 격노 단계
- 🚫 점진 미니언 스폰 — **대신** 초기 일괄 스폰 (envelope 안전)
- 🚫 visual regression test — **대신** 본 spec은 게임 로직만 (후속 spec에서 다룸)
- 🚫 외부 이미지/사운드 자산 다운로드 — **대신** 기존 Phaser Graphics + Web Audio 재사용

---

## 12. 위험 (Risks)

| # | 위험 | 영향 | 완화 |
|---|------|------|------|
| R1 | Ch5 미니언 9개 + 8자 이동 → 탭 정확도 ↓ | 사용자 좌절 | E2E E3 시나리오에서 화면 객체 9개 가시성 확인 |
| R2 | 보스 wave 진입 시 `bossWaveActive=true` 설정 누락 또는 `update()` 가드 분기 누락 | 미니언 도주 → 일반 fled 카운트 누적 → 챕터 fail 트리거 | `spawnBoss()` 안에서 `bossWaveActive=true` 항상 설정 + E4 시나리오로 회귀 가드 (`pnpm test:e2e`) |
| **R2b (N4 fix)** | GameScene `init()` 진입 시 `bossWaveActive=false` 리셋 누락 | 챕터 retry/다음 챕터에서 일반 wave 도주가 영원히 카운트 안 됨 (정책 leak) | `init()` 메서드에서 모든 상태 변수 초기화 시 `bossWaveActive=false` 명시 + 단위 테스트로 회귀 가드 |
| R3 | Phaser 일시정지 후 dt 폭증 → 보스 화면 밖 순간이동 | 시각 깨짐 | tick-boss-position에서 dt > 100ms clamp |
| R4 | Ch4/Ch5 격노 단계 전환 시점에 색상 변화가 한 frame 늦음 | 가벼운 시각 desync | rage 계산을 위치 계산보다 먼저 수행 (코드 순서 강제) |

---

## 13. 참고 / 부록

### 13.1 참조 문서

- 명확화 노트: `docs/stratage/ceo-boss-movement-pattern-explained.md` (옵션 비교, ASCII 시각화, Ethics·결정론 개념 설명)
- Bible §2 보스 명세: `docs/game-design/bible.md:62-82`
- Bible §3 5초 연출: `docs/game-design/bible.md:135-143`
- 현재 spawnBoss 코드: `src/adapters/phaser/scenes/game-scene.ts:236-252` (spawnBoss), `:183-201` (scheduleNextSpawn 보스 라우팅)
- 현재 HP 곡선: `src/domain/powerup/boss.ts:11-17` (HP_BY_CHAPTER), `:25-33` (함수)
- 현재 boss-hud 색상 임계: `src/adapters/phaser/objects/boss-hud.ts:51-53`
- 현재 fled 카운트: `src/adapters/phaser/scenes/game-scene.ts:84,400-407` + `const FLED_LIMIT = 5` (`:21`)
- ADR-0001 (Hexagonal): `docs/adr/0001-architecture.md`
- ADR-0004 (TDD 3 카테고리 + fast-check + Stryker): `docs/adr/0004-tdd.md`
- ADR-0006 (Game design principles, Ethics 10 안티패턴): `docs/adr/0006-game-design-principles.md`

### 13.2 신규 ADR 발행 계획 (C6 fix — CLAUDE.md §8 Rule #9 준수)

본 spec implement 단계에서 **ADR-0007 (보스 거동 및 페이즈 모델)** 을 발행한다. 5 섹션 (Status/Context/Decision/Consequences/Alternatives) 필수.

**ADR-0007 Decision 섹션이 다룰 4개 결정**:

1. **새 도메인 디렉토리 `src/domain/boss/` 도입** — `domain/powerup/boss.ts`(HP 곡선)와 책임 분리. 추후 `powerup/boss.ts` → `boss/boss-stats.ts` 마이그레이션은 후속 spec.
2. **Lissajous 1:2 결정론 8자 궤도** — `Math.sin` 순수 함수, IRandom 의존 없음. P5 결정론 invariant 강제.
3. **D5 γ 격리 정책** (보스 wave 동안 미니언 도주 카운트 차단) — Bible §7 #10 (carrot/stick) 회피 명분. 어댑터 `bossWaveActive` 플래그로 구현 (도메인 추출 미수행, 본 spec 범위).
4. **보스 페이즈 모델 확장** (§1.1 정의) — Bible §3 "보스 페이즈 5초"를 "연출 구간"으로 재해석. 사용자 플레이 시간은 60초 envelope 안에서 동적으로 결정.

**Alternatives 섹션이 다룰 거부 옵션**:
- 회피 대시 (Ethics #10 위반)
- 랜덤 텔레포트 단독 (Ethics #4/#9 위반)
- `domain/run/escape-counter.ts` 도메인 추출 (현 시점 over-engineering)
- Phase별 패턴 변신 (학습 부담)

**ADR-0007 발행 시점** (N1 fix):
- **Stub (Proposed)**: 본 spec Approved 직후 즉시 커밋 — 5 섹션 헤더(Status: Proposed / Context / Decision / Consequences / Alternatives)만이라도 생성하여 spec ↔ ADR 양방향 링크 확립. 거버넌스 chicken-and-egg 회피.
- **Accepted 전환**: implement 첫 PR에서 Status `Proposed → Accepted` + Decision 본문 채움 (`docs/adr/0007-boss-behavior-and-phase-model.md`).
