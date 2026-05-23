# 수렴 검증 리포트 — CEO 보스 거동 강화 Spec

> 작업: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md` 수렴 검증
> 시작: 2026-05-23
> 모드: 문서 검증
> Tier: Tier 2

---

## Iteration 1 — 결과 (이전 라벨)

| 발견 | 라벨 |
|------|------|
| C1 escape-counter 부재 (5관점 합의) | CONFIRMED |
| C2 envelope vs 보스 페이즈 5초 충돌 | CONFIRMED |
| C3 boss-hud 임계 0.66 vs spec 0.67 불일치 | DISPUTED |
| C4 P1 invariant 수학 오류 | CONFIRMED |
| C5 §6.1/§8.1/§9.1 t<0 정책 불일치 | CONFIRMED |
| C6 ADR 작성 누락 | CONFIRMED |
| H1 InvariantError vs RangeError 컨벤션 | CONFIRMED |
| H2~H5, S1~S5 | CONFIRMED/CONTESTED |

→ 사용자 선택: **Critical 6건 (C1, C2, C4, C5, C6, H1) fix**

---

## Iteration 2 — Fix 후 재검증 결과

### 관점별 라벨 변화

| 발견 (Iter 1 → Iter 2) | Iter 1 | Iter 2 | 안정 카운터 |
|------------------------|--------|--------|-----------|
| C1 escape-counter | CONFIRMED | **RESOLVED** (5관점) | 해소 |
| C2 envelope vs phase | CONFIRMED | **RESOLVED** (메인) | 해소 (sub-RISK F1-1) |
| C3 boss-hud 임계 | DISPUTED | OK (코드 일치) + N5 NEW | 부분 해소 |
| C4 P1 invariant | CONFIRMED | **RESOLVED** (메인) | 해소 (sub-GAP 1.b) |
| C5 t<0 정책 | CONFIRMED | **RESOLVED** | 해소 (sub-GAP 2.b) |
| C6 ADR 누락 | CONFIRMED | **RESOLVED** (메인) | 해소 (sub-N1) |
| H1 RangeError | CONFIRMED | **RESOLVED** (TS+grep) | 해소 |
| H2 γ 격리 부작용 (fix X) | RISK | **STILL-RISK** | **2회 동일 → 안정 ≥ 2** |
| H3 Ch1 학습곡선 (fix X) | RISK | **STILL-RISK** | **2회 동일 → 안정 ≥ 2** |
| H4 도메인 4 분리 (fix X) | WEAK | **STILL-WEAK** | **2회 동일 → 안정 ≥ 2** |

### 신규 발견 (Iter 2에서 처음, 안정 카운터 0)

#### CONTRARIAN
- **F1-1** [STILL-RISK]: Ch5 격노 2단 시각·체감 가치 약함 (HP 10탭 게임에서 마지막 2~3탭만 격노 2단)
- **F1-3** [NEW]: ADR-0007 발행 시점 chicken-and-egg (spec이 ADR 인용하는데 ADR은 implement에 발행)
- **F2-2** [STILL-RISK]: GameScene 인라인 가드 SoC 위반 (정책이 어댑터에 leak)
- **F3-1** [NEW]: `clampDeltaMs` 도메인 위치 — 어댑터 책임 leak
- **F3-2** [NEW]: §6.1 `tMs<0` throw dead code 가능성

#### ARCHITECT
- **B1** [STILL-BUG]: §7 데이터 흐름 `:279`에 `setPositionFromDomain` 흔적 잔존 (§5.3 결정과 충돌)
- **B2** [STILL-BUG]: §5.4 의존성 그림에 `escapeCounter.skip()` 도메인 API처럼 표시 (fix 의도와 충돌)
- **N1** [NEW]: ADR chicken-and-egg (CONTRARIAN F1-3 일치)
- **N2** [NEW]: clampDeltaMs 위치 (CONTRARIAN F3-1 일치)
- **N3** [NEW]: §5.4 그림 충돌 (B2 동일)
- **N4** [NEW]: `bossWaveActive` `init()` 리셋 누락 회귀 위험
- **N5** [NEW]: §5.3 boss-hud 임계 양자택일 ("또는" 분기 잔존) 모호
- **N6** [NEW]: §5.3 game-scene 수정 4건 sub-change 단위 테스트 격리 부족
- **N7** [NEW]: `PHASE_CONFIGS[chapter]` `undefined` 처리 (TS `noUncheckedIndexedAccess`)

#### TESTING-ARCH
- **1.b** [STILL-GAP]: P1a/P1b `R_eff` 계산 식 명시 부재
- **1.c** [NEW]: bounding box "코너 체류 시간" UX 정량 부재
- **2.b** [STILL-GAP]: `clampDeltaMs` 3카테고리 라벨링 누락 ([Happy] 부재)
- **3.b** [NEW]: P3 `chapter+1` off-by-one 위험 (`c=5` → `composeMinions(6)` 호출)
- **5.b** [STILL-GAP]: applyRageMultipliers conditional mutation 잡지 못함
- **6.a/b/c** [STILL-GAP]: E3 격노 2단, E4 γ격리, E5 envelope 60초 E2E 시나리오 미추가 (TOP 3 GAP 잔존)
- **7.a** [NEW]: clampDeltaMs property test 추천 (단조성/range)
- **7.b** [NEW]: P5 결정론 invariant tMs 도메인 명시 누락
- **7.d** [NEW]: `boss-phase-config.test.ts` Ch1~4 (R,ω) 정확값 비교 미명시
- **7.e** [NEW]: game-scene.boss.test.ts γ 격리 어댑터 단위 검증 부재

#### RESEARCHER
- **인용 정확도 85.7% → 100%** (모든 인용 정확)
- 잔존 부재/불일치: **0건**

### 종합 메트릭

| 영역 | Iter 1 | Iter 2 | 변화 |
|------|--------|--------|------|
| 컨벤션 합치 | 60% | 95% | +35 |
| 어댑터-인라인 정책 | 40% | 80% | +40 |
| ADR 거버넌스 | 30% | 70% | +40 |
| 테스트 매트릭스 격리 | 80% | 75% | -5 (N6 발견) |
| SSOT 일관성 (boss-hud) | 50% | 50% | 0 (N5 잔존) |
| 컨벤션 합치 (as const union) | 50% | 50% | 0 (Iter1 #1c 미수정) |
| **종합** | **52%** | **72%** | **+20** |

### 수렴 판정

- ✅ **Critical 6건 (C1~C6, H1) 모두 RESOLVED 또는 해소** — fix 효과 확인됨
- ✅ **인용 정확도 100% 달성** (RESEARCHER)
- ⚠️ **H2/H3/H4 안정 카운터 ≥ 2** (사용자 fix 미선택, 잔존 RISK/WEAK)
- ❌ **신규 발견 17건** (모두 안정 카운터 0)
- ❌ **TOP 3 GAP (E3/E4/E5 E2E) 잔존** — implement 단계 회귀 가드 부재

**수렴 조건 충족 여부**:
- [ ] 모든 발견 안정 카운터 ≥ 2 (X — 신규 발견 17건 모두 0)
- [ ] CONTESTED 0건 (X — 일부 잔존)
- [ ] 새 발견 0건 (X — 17건 신규)

→ **공식적 수렴 미충족**, 그러나 ARCHITECT 평가: **"현 spec은 implement 진입 가능 임계에 근접"** (Must-fix 4건만 처리하면 충분).

---

## 다음 단계 권고

### Must-fix (implement 진입 전 ARCHITECT 권장 4건)

1. **B1 fix**: spec §7 `:279`의 `setPositionFromDomain` → `setPosition`으로 교체
2. **B2 fix**: §5.4 의존성 그림의 `escapeCounter.skip()` → `bossWaveActive 플래그 (어댑터-인라인 가드)`로 교체
3. **N5 fix**: §5.3 boss-hud 임계 단일 결정 명시 (`< 0.67`, `< 0.33`로 변경 또는 RageLevel import로 SSOT 단일화)
4. **N1 fix**: §13.2 "ADR-0007 stub은 spec Approved 직후 Proposed 상태로 커밋" 추가

### Should-fix (implement 직전 권장)

5. **6.a/b/c fix**: §9.4에 E3 격노 2단(HP 33%), E4 γ격리 회귀, E5 envelope 60초 E2E 시나리오 3개 추가
6. **N4 fix**: §12 R2에 `init()` 리셋 누락 회귀 위험 명시
7. **1.b fix**: §9.2 P1a/P1b 옆에 "R_eff := applyRageMultipliers(base, rage).R" 정의 한 줄 추가

### 사용자 선택 옵션

같은 spec을 다시 검증해도 위 신규 발견들이 반복될 뿐 (안정 카운터 +1만 됨). 본질적 결정 필요.
