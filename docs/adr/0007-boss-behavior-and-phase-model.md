# ADR-0007: 보스 거동 및 페이즈 모델

> **[2026-07-20]** `Status: Superseded by ADR-0015`. 본 ADR이 다루는 보스 도메인(`domain/boss/*`,
> 보스 wave 분기, 보스 HUD)은 웨이브 클리커 단순화로 전부 삭제되었다. 본 문서는 역사적 기록으로
> 보존되며, 현행 CEO(탱커 필드 좀비) 설계는 `docs/adr/0015-wave-clicker-simplification.md`,
> `docs/game-design/bible.md` §2를 참조한다.

## Status

~~Accepted (2026-05-24)~~ → **Superseded by ADR-0015** (2026-07-20)

## Context

Bible §3은 CEO 보스에 대해 "Telegraph 1s / Engagement 3s / Climax 1s = 5초 연출"만 정의하고, 이동 패턴·미니언·격노 단계는 Open 상태였다. 사용자 피드백("CEO가 가만히 있어 너무 쉽다") 해소를 위해 보스 거동 강화 spec(`docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`)을 작성하면서 다음 4개 결정이 새로 도입되었다:

1. 새 도메인 디렉토리 `src/domain/boss/` 추가 (기존 `domain/powerup/boss.ts`와 책임 분리)
2. Lissajous 1:2 결정론 8자 궤도 도입 (`Math.sin` 순수 함수, IRandom 의존 없음)
3. D5 γ 격리 정책: 보스 wave 동안 미니언 도주는 fled 카운트 차단 (Bible §7 #10 carrot/stick 회피)
4. 보스 페이즈 모델 확장: Bible §3 "5초 연출"을 *연출 구간*으로 재해석, 실제 사용자 플레이 시간은 60초 envelope 안에서 동적 결정

CLAUDE.md §8 Rule #9 ("새 외부 의존성 추가 또는 아키텍처 변경 시 ADR 작성 필수")에 따라 본 ADR을 발행한다.

## Decision

본 spec implement에서 다음을 결정·구현했다:

### 1. 새 도메인 디렉토리 `src/domain/boss/` (4 파일)
- `boss-phase-config.ts` — Ch1~5 Phase 상수 (R, ω) lookup table
- `boss-movement.ts` — Lissajous 1:2 (8자) 위치 계산 + `clampDeltaMs` 헬퍼
- `boss-rage-level.ts` — HP% → RageLevel (0/1/2) + R/ω 배율 적용
- `minion-composition.ts` — Chapter → MinionSpec[] (신입/과장/팀장 다양화)

기존 `src/domain/powerup/boss.ts` (HP 곡선)는 그대로 두고, 후속 spec에서 `src/domain/boss/boss-stats.ts`로 통합 마이그레이션 예정.

### 2. Lissajous 1:2 결정론 8자 궤도
`x = cx + R·sin(2ωt), y = cy + R·sin(ωt)` 순수 함수. `Math.sin` 외 외부 의존 없음. P5 결정론 invariant 강제. property-based test (seed=42, numRuns=1000) P1a/P1b/P5로 회귀 가드.

### 3. D5 γ 격리 정책 — 어댑터 인라인 구현
도메인 추출 (`escape-counter.ts`)을 거부하고 `GameScene.bossWaveActive` 플래그 + `update()` lifespan 분기 가드로 처리. spec §5.3 N5/B2 fix 반영.

### 4. 보스 페이즈 모델 확장
Bible §3 "5초 연출"을 *연출 구간* (Telegraph 1s / Engagement 3s / Climax 1s)으로 재해석. 실제 사용자 플레이 시간은 60초 envelope 안에서 동적 결정 (Ch1 ~3-5초, Ch5 ~8-15초). spec §1.1 용어 정의로 SSOT.

### 5. Phase별 점진 도입
| Ch | R | ω | 미니언 | 격노 |
|----|---|---|--------|------|
| 1 | 80 | 0.5 | 0 | 없음 |
| 2 | 100 | 0.7 | 신입×2 | 없음 |
| 3 | 120 | 1.0 | 신입×3 + 과장×1 | 없음 |
| 4 | 130 | 1.3 | 신입×4 + 과장×2 | HP 50% (ω×1.3) |
| 5 | 150 | 1.6 | 신입×4 + 과장×3 + 팀장×1 | HP 67%/33% (ω×1.3 / ω×1.6 + R×1.15) |

### 6. boss-hud 색상 SSOT 단일화
boss-hud.ts가 자체 ratio literal (0.33/0.66) 대신 `computeRageLevel(hp, maxHp, chapter)` 호출 → rage 단계로 색상 매핑. Bible §3 HUD 녹/황/적 3등분과 격노 단계 자동 동기화.

## Consequences

**Positive**:
- 결정론 100% (Math.sin 순수 함수, IRandom 의존 없음) → property-based 회귀 가드 가능
- Hexagonal DIP 준수 (도메인 모듈 4개 외부 의존 0)
- Bible §7 Ethics 안티패턴 0건 충돌 (특히 #10 carrot/stick 회피)
- 60초 envelope 내 모든 보스 페이즈 종료 (E5 회귀 가드)
- 챕터별 점진 난이도 (Ch1 정적 X → Ch5 격노 2단)

**Negative / Trade-off**:
- `bossWaveActive` 플래그가 어댑터 상태로 leak (단순성 우선 — 도메인 추출 거부)
- Phaser 일시정지 후 복귀 시 보스 위치 시각 점프 가능 (sin은 ±R 안 안전, 다음 frame 정상 복구)
- `clampDeltaMs`는 boss-movement에 frame delta 헬퍼로 잔존 (현재 보스 위치 계산에는 미사용, Task 9.5 fix)
- `powerup/boss.ts` (HP 곡선) 위치 부적합 — 후속 spec에서 통합 마이그레이션

**검증 결과**:
- Unit + integration: 432/432 PASS
- Property: P1a/P1b/P2/P3/P5/P6 모두 1000회 fail 0
- E2E: E1~E5 모두 PASS (특히 E1 Lissajous 이동 회귀 가드)
- typecheck/lint: 0 error
- Bible §7 Ethics grep: `Notification.requestPermission` 0건

## Alternatives

- 회피 대시 (탭 반응) — 거부. Ethics #10 carrot/stick + 결정론 위반.
- 랜덤 텔레포트 단독 — 거부. Ethics #4 슬롯머신화.
- `domain/run/escape-counter.ts` 도메인 추출 — 거부. 현 시점 over-engineering.
- Phase별 패턴 변신 — 거부. MVP 학습 부담.
