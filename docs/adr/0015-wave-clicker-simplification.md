# ADR 0015: 웨이브 클리커 단순화 — 보스전·메타 카드·서사 연출 제거

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: 사용자 요청 (브레인스토밍 세션) + `docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md`

---

## Context

좀비팡 MVP는 Phase A Bible(§1~§2)이 정의한 *"CEO 보스를 매 챕터 사냥하고, 카드 15장 메타 성장 + 출근 도장(daily streak) + 5막 서사 연출이 쌓이는"* 구조로 구현되어 있었다. 사용자는 이 상층 구조(보스전 연출·미니언·rage/climax, 메타 카드 진행, 코인 재화, 챕터별 인테리어/서사 텍스트)가 *"게임을 무겁게 만들었다"*고 판단하고, **"좀비를 탭해서 처치하고, 층이 오를수록 물량이 늘어나는" 단순 웨이브 클리커**로 되돌릴 것을 요청했다.

이 요청은 브레인스토밍을 거쳐 `docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md`로 설계되었고, Task 1~8에서 **트림 & 리튠**(백지 재작성이 아닌 기존 검증 코드 재사용) 방식으로 이미 구현되었다:

- `f0582d1` chore: 보스·메타·서사 모듈 삭제 + 구 spawner/wave 정리
- `981919e` feat(domain): CEO를 탱커 좀비(hp5)로 리튠 — 보스 제거 대비
- `915ba81` feat(domain): 층별 난이도 커브 floor-plan — quota/cap/spawnRate/escapeLimit SSOT
- `fb25210` refactor(application): use-case에서 meta/coin/chapter 제거 + apply-powerup 메타 의존 제거
- `c3afe6d` feat(adapters): GameScene/HUD/GameOver를 floor-plan 웨이브 클리커로 재작성
- `b40c4b4` feat(adapters): 파워업 pickup 배선 — 폭탄/빙결/자석 실제 발동

CLAUDE.md §8 Rule #9("새 외부 의존성 추가 또는 아키텍처 변경 시 ADR 작성 필수")에 따라, 그리고 이 방향 전환이 **상위 SSOT(Bible §1/§2)와 정면 충돌**하므로 본 ADR을 발행한다.

---

## Decision

### 결정 요약

| 항목 | 결정 |
|------|------|
| 단순화 범위 | 층 오르기 골격 + 점수/콤보/crit 유지, **보스전·메타 카드·성장·서사 연출 제거** |
| 층 클리어 조건 | **처치 목표(quota)** 달성 — `floorPlan(floor).quota`만큼 처치하면 다음 층 |
| 층 실패 조건 | **도주 한도(escapeLimit)** 초과 — 놓친 좀비 누적이 한도 도달 시 그 층에서 run 종료 |
| 파워업 3종 | **유지 + 실제 발동 배선** — 폭탄/빙결/자석, drop은 평평한 기본율, 동시 타이머 효과 ≤2 |
| CEO | **탱커 필드 좀비로 유지** — 보스 아님, HP 5(다른 종 대비 최다), 밴드가 오를수록 등장 확률 상승(band2 1% ~ band5 10%) |
| 사무실 테마 비주얼 | **유지** (직급별 마스크/색, particle 테마), 서사 텍스트·인테리어 컷씬은 제거 |
| 코인(Coin) | **제거** — 메타 unlock 게이트가 사라져 사용처 없음 |
| 챕터 그룹핑 | **난이도 밴드로만 유지** — 5×10=50층, 서사·부서명·인테리어 모티프 없음 |
| "정시 퇴근" 버튼 | **유지** — Ethics 기둥, 그대로 동작 |
| 구현 접근 | **트림 & 리튠** — 기존 검증 코드 최대 재사용 |

### 코어 루프 (변경 후)

```
run 시작 (floor 1)
   │
   ▼
┌────────────────────────────────────────────┐
│ FLOOR F 플레이                               │
│  • 좀비가 spawnRateMs(F) 간격 등장, 동시 최대 cap(F) │
│  • 탭 = 처치 (머리 탭 = crit ×2, 연속 처치 = 콤보)  │
│  • 클리어: quota(F)마리 처치                   │
│  • 실패: 도주 누적 ≥ escapeLimit(F)             │
└────────────────────────────────────────────┘
   │ 클리어                         │ 실패
   ▼                               ▼
 floor == 50 ?                 run 종료 (fled_limit) → 점수 정산
   │ yes → 완주(clear) → run 종료
   │ no  → floor + 1 (카드 선택·보스전 없이 곧바로 다음 층)
```

- 층 사이에 카드 선택 화면·보스 등장이 없다. "정시 퇴근" 버튼은 플레이 중 언제든 현재 점수로 run을 종료한다(`EndRunReason = "early_exit"`).

### 실제 수치 (코드 SSOT: `src/domain/run/floor-plan.ts`)

- `quota(F) = round(8 + (F − 1) × 1.5)` — 단조 증가 (floor 1: 8마리 ~ floor 50: 81마리).
- `cap(F)` — 동시 화면 상한, `CAP_MAX = 12`로 clamp.
- `spawnRateMs(F)` — 1000ms(floor 1) → 300ms(floor 50) 선형 감소.
- `escapeLimit(F)` — band 1~2(1~20층) 5, band 3~4(21~40층) 4, band 5(41~50층) 3.
- 밴드는 서사 없는 난이도 구간일 뿐이다(`bandOf(floor)`, 10층 단위 1~5).

### 파워업 배선 (코드 SSOT: `src/application/apply-powerup.ts`, `src/domain/powerup/drop-policy.ts`, `src/adapters/phaser/scenes/game-scene.ts`)

- 드롭: 처치 시 `BASE_DROP_RATE = 0.05`(평평한 5%, 메타/코인 tier 결합 없음)로 pickup 생성, 일정 시간 미획득 시 소멸.
- 발동: pickup 탭 → `applyPowerUp` 호출. 폭탄(즉발 전체 처치) / 빙결(3000ms 스폰·노화 정지) / 자석(3000ms, 100px 자동 처치).
- 동시 활성 한도: 타이머 효과(빙결/자석) 최대 2개(`MAX_CONCURRENT_EFFECTS = 2`). 폭탄은 즉발이라 한도 무관.

### 제거된 것

- 보스 도메인 전체(`domain/boss/*`: climax, movement, rage-level, phase-config, minion-composition), 보스 wave 분기, 보스 HUD.
- 메타 도메인 전체(`domain/meta/*`: card, card-pool, progression, daily-streak), 카드 선택 화면, 코인 재화(HUD 표시·`end-run.ts`의 `totalCoin` 등).
- 서사 연출(`building-progress.ts`, 챕터 인테리어 모티프, 무텍스트 보스 cue, juice-manager의 보스 climax/waveClear 건물 점등 경로).

---

## Consequences

### 긍정적

1. **코드 규모 축소** — `game-scene.ts`가 보스/카드/서사 경로 제거로 대폭 축소, 유지보수 대상 축소.
2. **TDD 효율 회복** — floor-plan이 난이도 커브의 단일 출처(SSOT)가 되어 property-based invariant(quota 단조/spawnRate 범위/cap clamp)로 즉시 회귀 가드 가능.
3. **Ethics 기둥 보존** — "게임은 끝난다"(50층 완주), "정시 퇴근" 동등 가중치, Notification·광고·FOMO 트리거 0, 카운트다운 압박 텍스트 금지는 그대로 유지된다. ADR-0006의 결정은 무효화되지 않는다.
4. **파워업이 실제로 동작하게 됨** — 기존에는 drop만 계산되고 화면 배선이 없었으나, 이번에 pickup→발동 경로가 실제로 연결되었다(순수 버그 수정 아님, 범위 내 개선).

### 부정적 / 상충 — 상위 문서 갱신 필요

이 방향 전환은 **Bible §1/§2, CLAUDE.md와 정면 충돌**하므로 해당 문서를 본 ADR 기준으로 갱신했다:

- **Bible §1** — *"좀비를 죽이는 게임이 아니라 퇴근시키는 게임"* 핵심 차별점 문구, *"좀비 처치 = 동료의 퇴근"* 서사 프레이밍이 더 이상 코드와 일치하지 않는다. §1에 본 ADR 참조 각주를 추가하고 웨이브 클리커 현실에 맞게 정정했다.
- **Bible §2** — 5챕터=5막 서사 구조(부서명·인테리어 톤), CEO 보스 표(10층마다 등장, HP 5, "보스" 표기), CEO 대사 표가 더 이상 코드와 일치하지 않는다. §2에 본 ADR 참조 각주를 추가하고, 챕터를 난이도 밴드로, CEO를 탱커 필드 좀비로 정정했다.
- **CLAUDE.md §1** — 핵심 차별점 (1)번 "퇴근시키는 게임" 문구를 웨이브 클리커 현실(quota 클리어 + escape 실패)로 정정.
- **CLAUDE.md §7** — 좀비 4종 표의 CEO "보스" 표기, Wave/Floor/Chapter의 챕터=서사 서술, Power-up drop rate 표의 Coin Tier 결합, Meta Card 15장·Daily Streak 절 전체가 삭제된 시스템을 서술하고 있어 wave-clicker 현실로 정정.
- **CLAUDE.md §9 Don'ts** — "카드 15장 외 추가 금지", streak 페널티 금지 등 이미 삭제된 시스템을 전제로 한 금지 항목을 정리.
- **CLAUDE.md §6.3 Property invariant 표** — 보스 HP 곡선, 카드 3장 균등 추첨, streak 곡선 invariant는 대상 도메인 자체가 삭제되어 무효. floor-plan quota 단조/spawnRate 범위/cap clamp invariant로 대체.
- **ADR-0007(보스 거동 및 페이즈 모델)** — 본 ADR로 그 대상 도메인(`domain/boss/*`)이 전부 삭제되어 사실상 역사적 기록으로만 남는다. 파일 자체는 변경하지 않았다(본 Task는 Bible/CLAUDE.md 갱신으로 범위를 한정) — 후속 정리에서 Status를 "Superseded by ADR-0015"로 표기하는 것을 권장한다.

### 제거된 property invariant (7개 중)

- 보스 HP 곡선(챕터별 1.00×~3.84×) — `domain/powerup/boss.ts` 및 `domain/boss/*` 삭제로 대상 소멸.
- 카드 3장 균등 추첨 — `domain/meta/card*` 삭제로 대상 소멸.
- Daily Streak 곡선(`streak ∈ [0,7]`, `coinMultiplier = 1 + 0.2 × streak`) — `domain/meta/daily-streak` 삭제로 대상 소멸.

### 유지된 property invariant

- `score ≥ 0` (`domain/score/score.prop.test.ts`)
- Combo tier 단조 비감소 (`domain/score/combo.prop.test.ts`)
- 동일 seed → 동일 시퀀스 결정론 (`infrastructure/random/seeded-random.test.ts`)

### 신규 property invariant

- `floorPlan(F).quota` 단조 증가, `F ∈ [1,50]` (`domain/run/floor-plan.prop.test.ts`)
- `floorPlan(F).spawnRateMs ∈ [300, 1000]`
- `floorPlan(F).cap ∈ [1, CAP_MAX]`

---

## Alternatives

| 대안 | 거부 이유 |
|------|----------|
| **전면 재작성** (백지에서 새 웨이브 클리커) | 검증된 테스트 자산(도메인 100% 커버리지 규율 하 구축)을 폐기하는 셈이라 YAGNI 위반. spec §2가 "트림 & 리튠"을 명시. |
| **최소 물량 커브 튜닝만** (보스·메타는 유지, 난이도만 조정) | 사용자 요청의 핵심("서사·보스·메타가 과중하다")을 충족하지 못한다. 근본 원인(상층 구조 자체의 무게)이 해결되지 않는다. |
| **보스만 제거, 메타 카드는 유지** | 코인 재화 없이는 카드 unlock 게이트가 무의미해지고, 서사 없는 성장 시스템만 남아 "복잡성 대비 게임성 이득"이 낮다고 브레인스토밍에서 판단, 카드 15장 전체를 함께 제거. |

---

## References

- Spec: `docs/superpowers/specs/2026-07-20-wave-clicker-simplification-design.md`
- 코드 SSOT: `src/domain/run/floor-plan.ts`, `src/domain/wave/{spawner,zombie-type}.ts`, `src/domain/powerup/{powerup,drop-policy}.ts`, `src/application/{start-run,kill-zombie,apply-powerup,end-run}.ts`, `src/adapters/phaser/scenes/{game-scene,hud-scene,game-over-scene}.ts`
- 관련 ADR: ADR-0006(게임 디자인 원칙 — Ethics 10 안티패턴/Layer 1·2 분리는 본 ADR 이후에도 유효), ADR-0007(보스 거동 및 페이즈 모델 — 대상 도메인 삭제로 사실상 moot)
- 갱신된 상위 문서: `docs/game-design/bible.md` §1, §2 / `CLAUDE.md` §1, §6.3, §7, §9
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code` (ADR-0006과 동일 원칙 적용)
