# 좀비팡 단순화 — Wave 클리커 전환 설계

> 작성일: 2026-07-20
> 산출: brainstorming 세션
> 유형: 게임 방향 전환(설계) + 기존 코드 트림 & 리튠

---

## 1. 배경과 목표

### 무엇을 바꾸나
기존 좀비팡은 *"상사가 퇴근시키지 않아 좀비가 된 동료를 퇴근시키고, 층마다 CEO 보스를 사냥한다"*는 서사·시스템 위에, 메타 성장 카드 15장·출근 도장·보스 연출·챕터별 서사 연출이 두껍게 쌓여 있었다. 이번 작업은 이 상층 구조를 걷어내고, **"좀비를 탭해서 처치하고, 층이 오를수록 더 많은 좀비가 나오는" 단순한 웨이브 클리커**로 되돌린다.

### 유지되는 핵심
- **게임은 끝난다**: 50층을 완주하면 게임이 종료된다(도시락 컨셉). 무한 리텐션을 추구하지 않는다.
- **정시 퇴근 존중**: 언제든 현재 점수로 종료할 수 있는 "정시 퇴근" 버튼을 남긴다.
- **자산 0 정책**: Phaser Graphics 도형 + Web Audio 합성음. 외부 이미지/사운드 없음.
- **사무실·좀비 테마**: 직급별 마스크/색 등 시각 정체성은 유지(서사 텍스트·연출만 제거).

### 목표(성공 정의)
50층을 처치 목표(quota) 채우기로 오르고, 좀비를 너무 많이 놓치면(escape 한도 초과) 층에 실패하며, 층이 오를수록 물량이 늘어나는 게임. 보스전·메타 카드·출근 도장·서사 연출은 코드에서 사라진다.

---

## 2. 확정된 설계 결정 (요약)

| 항목 | 결정 |
|------|------|
| 단순화 범위 | 층 오르기 골격 + 점수/콤보 유지, **보스·메타·서사 제거** |
| 층 클리어 조건 | **처치 수 목표(quota)** — 목표 수만큼 처치하면 다음 층 |
| 실패 조건 | **도주 한도** — 놓친 좀비 누적이 층별 한도를 넘으면 그 층 실패 |
| 파워업 3종 | **유지** (폭탄/빙결/자석) — drop은 평평한 기본율로 단순화 |
| CEO | **탱커 좀비로 유지** — 보스 아님, HP 높은 희귀 좀비 |
| 사무실 테마 비주얼 | **유지** (직급 마스크/색), 무거운 서사 연출은 제거 |
| 코인(Coin) | **제거** — 메타 해금 사인이 사라져 사용처 없음 |
| 챕터 그룹핑 | **난이도 밴드로만 유지** — 5×10=50층, 서사·이름·인테리어 모티프 제거 |
| 정시 퇴근 버튼 | **유지** — 윤리 기둥, 이미 구현됨 |
| 구현 접근 | **트림 & 리튠** — 기존 검증 코드 최대 재사용, 백지 재작성 아님 |

---

## 3. 코어 루프

```
run 시작 (floor 1)
   │
   ▼
┌──────────────────────────────────────────────────┐
│ FLOOR F 플레이                                     │
│  • 좀비가 spawnRate(F) 간격으로 등장 (동시 최대 cap(F)) │
│  • 탭 = 처치 (머리 탭 = crit ×2, 연속 처치 = 콤보 승급)  │
│  • 클리어 목표: quota(F)마리 처치                       │
│  • 실패 조건: 도주 누적 > escapeLimit(F)                │
└──────────────────────────────────────────────────┘
   │ 클리어                              │ 실패
   ▼                                    ▼
 floor == 50 ?                      게임 오버 → 점수 정산
   │ yes → 완주 엔딩(게임 끝)
   │ no  → floor + 1 (연속 상승, 카드 선택·보스전 없음)
```

- 층 사이에 카드 선택 화면·보스 등장 없이 곧바로 다음 층으로 이어진다.
- "정시 퇴근" 버튼은 플레이 중 언제든 눌러 현재 점수로 run을 종료한다.

---

## 4. 난이도 커브 (층이 오를수록 "점점 더 많이")

세 축으로 물량을 키운다. **아래 수치는 초안이며 플레이 테스트로 튜닝한다.**

| 층 (Floor) | 처치 목표 `quota` | 동시 최대 `cap` | spawnRate | 도주 한도 `escapeLimit` |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 8 | 3 | 1000ms | 5 |
| 10 | 20 | 5 | 800ms | 5 |
| 25 | 45 | 8 | 550ms | 4 |
| 40 | 68 | 11 | 380ms | 4 |
| 50 | 80 | 12 | 300ms | 3 |

**커브 정의(초안)**
- `quota(F) = round(8 + (F - 1) × 1.5)` → 1층 8마리 ~ 50층 ≈ 81마리, 단조 증가.
- `cap(F)`: 동시 화면 물량 상한. 모바일 한 손 탭 가능성 유지를 위해 12 근처에서 포화.
- `spawnRateMs(F)`: 기존 1000→300ms 범위 재사용, 층에 따라 선형 감소(하한 300ms).
- `escapeLimit(F)`: 전반부(밴드 1~2, 1~20층) 5로 관대, 중반 이후(밴드 3, 21층~) 4, 최상층부(밴드 5 후반) 3으로 조여 긴장감 부여. 위 표의 floor 25=4, floor 50=3과 일치.
- **좀비 구성**: 저층 신입 위주 → 고층에 과장/팀장/CEO(탱커) 비중 증가. 기존 확률 분포(CDF)를 층 밴드별로 이동.

**챕터 밴드**(난이도 구간, 서사 없음)

| 밴드 | 층 | 성격 |
|:---:|:---:|------|
| 1 | 1~10 | 튜토리얼 감각, 신입 위주 |
| 2 | 11~20 | 과장 등장 증가 |
| 3 | 21~30 | 팀장(HP 3) 본격 등장, escape 한도 조임 시작 |
| 4 | 31~40 | 고물량 + CEO 탱커 산발 |
| 5 | 41~50 | 최대 물량, 완주 직전 |

---

## 5. 제거 대상 vs 유지 대상 (실제 파일 기준)

### 제거 (보스 / 메타 / 서사)

| 영역 | 대상 |
|------|------|
| 보스 도메인 | `src/domain/boss/*` (boss-climax, boss-movement, boss-rage-level, boss-phase-config, minion-composition 및 각 테스트), `src/domain/powerup/boss.ts` |
| 보스 애플리케이션/어댑터 | `src/application/spawn-boss-wave.ts`, `src/application/tick-boss-position.ts`, `src/adapters/phaser/objects/boss-hud.ts`, `game-scene.ts`의 보스 wave 분기·미니언·rage/climax 경로 |
| 메타 도메인 | `src/domain/meta/*` (card, card-pool, progression, daily-streak 및 각 테스트) |
| 메타 애플리케이션/어댑터 | `src/application/pick-upgrade.ts`, `src/adapters/phaser/objects/upgrade-card.ts`, `start-run.ts`의 meta/streak 로드, `kill-zombie.ts`의 `coinGain`/coin tier 의존 |
| 서사 연출 | `src/domain/run/building-progress.ts`, `juice-manager.ts`의 보스 climax/waveClear freeze·건물 점등, 챕터별 인테리어 모티프, 무텍스트 보스 cue |
| 코인 | `earnedCoinAccum`/`earnedCoin`/`coinGain`/HUD 코인 표시(`hud-scene.ts`), `end-run.ts`의 `totalCoin` 처리 |

### 유지 (재사용)

- `src/domain/wave/spawner.ts` — 보스 wave 분기만 제거, 층 밴드별 좀비 분포로 조정.
- `src/domain/score/*` — score, combo, crit 그대로.
- `src/domain/powerup/powerup.ts` + `drop-policy.ts` — 파워업 3종, 동시 활성 ≤2, drop은 평평한 기본율(메타 tier 결합 제거).
- 좀비 4종 (`zombie-type.ts`) — CEO는 HP 높은 희귀 탱커로 유지.
- HUD 점수/콤보/층/도주 표시 + "정시 퇴근" 버튼, high score / leaderboard(`end-run.ts`), PWA·오디오·햅틱 인프라.
- 기본 타격감 juice — kill/crit 파티클·셰이크·히트스톱, 콤보 승급 연출.

---

## 6. 도메인 / 애플리케이션 변경

- **신규** `src/domain/run/floor-plan.ts`: 층 1~50 → `{ quota, cap, spawnRateMs, escapeLimit, 좀비믹스 }`를 반환하는 순수 함수/VO(Value Object, 값 객체). Section 4 커브의 단일 출처(SSOT). 불변식(단조 증가, 범위 clamp)을 이 모듈이 보증.
- **`src/domain/wave/wave.ts`**: 챕터 결합·`isBossWave()`/`BOSS_WAVE` 제거. spawn count/rate 개념을 floor-plan으로 흡수할지 검토(중복 제거).
- **`src/domain/wave/spawner.ts`**: 보스 wave 분기 제거, 층 밴드별 좀비 분포(CDF) 적용.
- **`src/application/start-run.ts`**: meta/streak 로드 제거 → `{ runId, startedAt, floor: 1 }`만 반환.
- **`src/application/kill-zombie.ts`**: meta 의존 제거, 파워업 drop = 평평한 기본율.
- **`src/application/end-run.ts`**: `chaptersCleared` → `floorsReached`(도달 층), coin 제거, reason enum 정리(`clear` / `early_exit` / `fled_limit`).
- **`src/adapters/phaser/scenes/game-scene.ts`**: 보스·카드·서사 경로 삭제, floor-plan 기반 spawn/clear/fail 로직으로 정리(현재 822줄 → 대폭 축소). 층 진행은 기존 `killed + fled` 카운트 로직을 "killed가 quota 도달 → 클리어 / fled가 escapeLimit 초과 → 실패"로 분리 조정.

> 정확한 파일 이동·삭제 순서와 모듈 경계 확정은 다음 단계(writing-plans)에서 다룬다. 본 문서는 동작과 경계를 규정한다.

---

## 7. 테스트 계획

### 3 카테고리 강제 (프로젝트 규칙)
신규 `floor-plan` 및 리튠된 `wave`/`spawner`/`start-run`/`kill-zombie`/`end-run`의 RED phase마다 `[Happy]`/`[Boundary]`/`[Error]` 각 ≥1개.

- `[Boundary]` 예: floor 1/50 경계, quota 하한/상한, escapeLimit 밴드 전환(25→26층), cap 포화점, spawnRate 하한 300ms.
- `[Error]` 예: floor < 1 또는 > 50, 비정수 floor 입력.

### 커버리지 게이트
- domain 100% (line/branch/function/statement), application ≥95%.
- 제거로 인해 커버리지 미달·dead import가 발생하는 파일이 없도록 정리.

### Property-based invariant (seed=42, numRuns=1000)
- **삭제**: 보스 HP 곡선, 카드 3장 균등 추첨, streak 곡선, 파워업 drop의 메타 tier 결합 부분.
- **유지**: `score ≥ 0`, combo 단조성, 동일 seed 결정론.
- **신규**:
  1. 모든 `F ∈ [1,50]`: `quota(F) ≥ quota(F-1)` (단조 증가).
  2. 모든 `F ∈ [1,50]`: `spawnRateMs(F) ∈ [300, 1000]`.
  3. 모든 `F ∈ [1,50]`: `cap(F) ≤ CAP_MAX` (상한 clamp).

### E2E (Playwright, Pixel 5 viewport)
1. 초반 몇 개 층 처치 → 층 상승 확인.
2. 도주 한도 초과 → 층 실패(게임 오버) 경로.
3. "정시 퇴근" 버튼 → 현재 점수로 종료 경로.

---

## 8. 문서 / ADR 갱신 (필수)

이번 방향 전환은 상위 SSOT와 정면 충돌한다:
- **Bible §1/§2** — *"좀비를 죽이는 게임이 아니라 퇴근시키는 게임"* 및 5막 서사·보스 구조.
- **CLAUDE.md** — 동일 핵심 차별점, Don'ts의 "좀비 4종 외 추가 금지" 등 관련 항목.

조치:
1. **신규 ADR 작성** — 방향 전환(보스·메타·서사 제거, 웨이브 클리커 회귀)을 5섹션(Status/Context/Decision/Consequences/Alternatives)으로 기록. 규칙 8-9: 아키텍처/방향 변경 시 ADR 필수.
2. **Bible §1/§2 갱신** — 서사·보스·메타 관련 서술을 새 방향에 맞게 정정.
3. **CLAUDE.md 갱신** — 핵심 차별점·Don'ts에서 제거된 시스템 관련 항목 정리.

---

## 9. 완료조건 / 금지사항 / 고려사항 / 제약사항

### 완료조건 (측정 가능)
- `pnpm typecheck && pnpm lint && pnpm test` exit 0.
- 커버리지 게이트 통과 (domain 100% / application ≥95%).
- `grep -rn "boss\|meta\|card\|streak\|coin\|building-progress" src --include="*.ts"` 결과에 제거 대상 잔재 0건(유지 대상 제외).
- E2E 3경로(층 상승 / 층 실패 / 정시 퇴근) 통과.
- `pnpm build` gzip < 1.5MB.

### 금지사항
- 백지 재작성 대신 **기존 코드 트림 & 리튠**.
- 외부 이미지/사운드 자산 다운로드 금지 → Graphics 도형 + Web Audio 합성음.
- `Notification.requestPermission` 절대 금지(v1/v2/v3 전부).
- 도메인에서 Phaser/DOM/`Date.now()`/`Math.random()`/`setTimeout` 직접 사용 금지 → Port 주입 유지.
- 카운트다운 압박 텍스트("남은 N초!") 추가 금지.

### 고려사항
- 동시 물량 상한(`cap`)은 모바일 한 손 탭 가능성을 해치지 않아야 함.
- 파워업 평평한 drop율의 밸런스(너무 잦으면 단조로움 붕괴).
- 제거 시 dead import·타입 오류·커버리지 누락을 남기지 말 것.
- 콤보/crit는 유지되므로 점수 곡선이 물량 증가와 함께 과팽창하지 않는지 확인.

### 제약사항
- Phaser 3 + TypeScript strict(+ noUncheckedIndexedAccess).
- 한 손 30~60초 마이크로세션 유지.
- gzip < 1.5MB.

---

## 10. 범위 밖 (YAGNI)

- 신규 좀비 종·파워업·엔딩 연출 추가.
- 코인 대체 재화·상점·성장 시스템.
- 온라인 리더보드(로컬 leaderboard만 유지).
- 무한 모드(50층 완주형 유지).
