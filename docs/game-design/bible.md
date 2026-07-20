# 좀비팡 (Off-Clock Pang) — Game Design Bible

> **Phase A-8 산출물** — Single Source of Truth (SSOT) for Phase B Master Plan + Phase C Implementation
> 작성: 2026-05-17 / 통합 입력: Phase A-0~A-7 모든 산출물
> 본 문서는 Phase B/C에서 모든 결정의 참조점이다. 본 문서와 코드가 충돌하면, 코드가 틀린 것이다.

---

## Title Page

| 항목 | 내용 |
|---|---|
| **타이틀 (한)** | 좀비팡 |
| **타이틀 (EN)** | Off-Clock Pang |
| **코드네임** | 퇴근팡 |
| **장르** | PWA 캐주얼 액션 (수직 진행 tap-to-defeat) |
| **한 줄 컨셉** | "당신은 마지막 사원이다. 50층 좀비 사옥에서 야근을 끝내고 옥상까지 올라가 퇴근하라." |
| **타겟 유저** | 한 손 30~60초 마이크로세션을 원하는 18~35세 모바일 사용자 (한국 + 글로벌) |
| **핵심 차별점** | (1) 좀비를 탭해서 처치하며 층을 오르는 웨이브 클리커 — 층별 처치 목표(quota) 클리어 / 도주 한도 초과 시 실패 (ADR-0015) / (2) 언제든 정시 퇴근 버튼으로 현재 점수 종료 가능, 계속 진행과 동등 가중치 / (3) Notification·광고 없음, FOMO 트리거 0 / (4) PWA 단일 배포, 5초 로딩 |
| **MVP 범위** | 50층(5개 난이도 밴드 × 10층), 좀비 4종(CEO는 탱커 필드 좀비), Power-up 3종(실제 발동 배선), 오프라인 전 기능 — 카드 15장·출근 도장은 ADR-0015로 제거됨 |
| **기술 스택** | Phaser 3 + TypeScript + Vite + Vitest + fast-check + Stryker + vite-plugin-pwa + Biome + Playwright |

---

## §1. 게임 컨셉 SSOT

> **[ADR-0015 갱신, 2026-07-20]** 아래 "좀비를 죽이는 게임이 아니라 퇴근시키는 게임" 프레이밍·핵심 약속 목록은 사용자 요청에 따른 웨이브 클리커 단순화(보스전·메타 카드·서사 연출 제거)로 코드와 불일치하게 되어 갱신되었다. 배경·상세 결정: `docs/adr/0015-wave-clicker-simplification.md`.

좀비팡은 **번아웃이 물리적으로 발현된 직장**을 무대로 한 **한 손 30~60초 수직 진행 캐주얼 액션**이다. 좀비를 탭해서 처치하며 50층 좀비 사옥을 오른다 — 각 층은 처치 목표(quota)를 채우면 클리어되고, 도주(놓친 좀비) 누적이 층별 한도를 넘으면 그 자리에서 게임이 종료된다. 50층을 완주하면 게임이 *끝난다*.

**톤은 B급 코믹 호러**다. 네온 핑크 / 라임 그린 + 비통한 코미디(melancholic slapstick)의 교집합. *Plants vs Zombies와 Inside 사이, Mike Judge의 Office Space에 더 가까운 자리*. 사무실·좀비 비주얼 테마(직급별 마스크·색)는 유지하되, 보스전 연출·챕터별 서사 컷씬·성장 카드는 없다.

**핵심 약속** (ADR-0015 이후 유효한 4가지 — Daily Streak·카드 가챠는 시스템 자체가 삭제되어 제거):
1. 게임은 *끝난다* — 50층 완주 시 게임 종료, 무한 retention 추구하지 않음
2. 언제든 *정시 퇴근* 버튼으로 현재 점수를 확정하고 종료 가능 (계속 진행과 동등 가중치)
3. 자산 0 정책 — Phaser Graphics 도형 + Web Audio 합성음만 사용, 외부 이미지/사운드 다운로드 없음
4. Notification·광고·FOMO 트리거 *0*

**플레이어 정체성**: 이름 없음, 사번 `EMP-0427`. 야근 중 우연히 살아남은 마지막 정상인. 무기는 사무 비품(키보드·스테이플러·정수기 통·결재판) — 총·도검 0개. 좀비 처치 = *동료의 퇴근*(탭 처치를 감싸는 시각 테마일 뿐, 대사·컷씬 텍스트는 없음). 승리 = 50층 완주 후 게임 종료(사직서 제출 컷씬 없음).

**언어 정책**: 게임 화면 텍스트 0줄 (HUD 숫자 제외). screen reader용 aria-label은 풍부. "팡!" 의성어는 글로벌 출시에도 음역 유지 (카타카나·영문 금지).

---

## §2. World & Story Bible — 50층 사옥 / 5 난이도 밴드 / 4종 좀비

> **[ADR-0015 갱신, 2026-07-20]** "5막 구조"·CEO 보스 조우·보스 대사는 웨이브 클리커 단순화로 제거되어 갱신되었다. 챕터는 이제 서사 없는 난이도 밴드이고, CEO는 정형화된 보스가 아니라 낮은 확률로 등장하는 탱커 필드 좀비다. 배경·상세 결정: `docs/adr/0015-wave-clicker-simplification.md`.

### 세계관 설정

정체불명의 다국적 IT 회사가 입주한 **50층 사옥**. 사옥 자체가 던전이고, 한 층이 하나의 Wave다. CEO가 **"무기한 야근 명령"**을 내린 뒤 전 사원이 좀비화됐다. 좀비 바이러스의 정체는 **번아웃의 물질화** — WHO 2019 번아웃 직업현상 분류를 학술 알리바이로 인용. CEO 자신도 좀비화되어 사옥 어딘가를 배회하는 탱커 좀비로 등장한다 — 챕터마다 정형화된 보스로 조우하지 않는다.

### 5개 난이도 밴드 (서사 없음)

챕터는 순수 **난이도 구간**이다 — 부서명·인테리어 모티프·컷씬 없이 10층 단위로 물량과 좀비 구성만 달라진다(`src/domain/run/floor-plan.ts`의 `bandOf`, `src/domain/wave/spawner.ts`의 `BAND_CDF`가 SSOT).

| 밴드 | 층 | 성격 |
|:---:|:---:|---|
| 1 | 1F~10F | 신입 위주(85%), CEO 미등장, 도주 한도 5 |
| 2 | 11F~20F | 과장 비중 증가, CEO 최초 등장(1%), 도주 한도 5 |
| 3 | 21F~30F | 팀장(hp 2) 비중 증가(13%), 도주 한도 5→4로 조임 |
| 4 | 31F~40F | 고물량, CEO 비중 확대(7%), 도주 한도 4 |
| 5 | 41F~50F | 최대 물량, CEO 비중 10%, 도주 한도 4→3, 완주 직전 |

### 좀비 4종 (Phaser Graphics only — 외부 아트 에셋 0)

| 명칭 | 직급 | 속도 | HP (tap) | Phaser 표현 | 색 / 마스크 사인 |
|---|---|---|---|---|---|
| 신입 / Intern | 갓 감염 | 빠름 | 1 | 작은 원 + 사각형 명찰 | 흰 마스크 |
| 과장 / Middle | 책임감 짓눌림 | 중간 | 1 | 중간 사각형 + 종이 파티클 | 회색 마스크 |
| 팀장 / Lead | 회의 미종결 | 느림 | 2 (crack 시각화) | 큰 사각형 + 분노 게이지 링 | 어두운 회색 마스크 |
| CEO / Founder Zero | 탱커 필드 좀비 (희귀, 밴드 2부터 등장) | 매우 느림 | 5 | 거대 원 + Graphics 후광 + 차트 폴리곤 | 검정 마스크 |

**추상화 다이얼 50%**: 인간 실루엣 + 표정 없는 마스크 (ADR-0004 Resolved). 25%는 폭력 정상화 임계 초과, 100%는 *대상 정체성 소거 → 모두에 폭력 가능*이라는 메시지 위험.

### CEO 등장 방식 (구 "보스 대사" 절 — 제거됨)

CEO는 더 이상 챕터당 1회 정형화된 보스로 조우하지 않으며, 등장 시 대사·컷씬이 없다(§1 언어 정책 "게임 화면 텍스트 0줄"과 일관). 밴드 2(11층~)부터 다른 좀비와 함께 낮은 확률로 무작위 등장하고, 고밴드로 갈수록 등장 확률이 늘어난다(밴드2 1% → 밴드5 10%). 처치 시 다른 좀비와 동일하게 hp 5어치 탭으로 처리된다.

50층 완주 = 게임 종료. 사직서 제출 컷씬은 없으며, 결과 화면에 "50층 완주" / "정시에 퇴근하셨습니다" 텍스트로만 표현된다(`src/adapters/phaser/scenes/game-over-scene.ts`).

---

## §3. Core Loop Bible — 60초 envelope + Layer 1/2 분리

### 단위

**1 게임 세션 = 1 챕터 = 10 층 = 60초 envelope** (CEO 보스 5초 포함, 상한 68초)

### 60초 시퀀스

| Time | 층 | 좀비 | 학습/이벤트 |
|---|---|---|---|
| 0~3s | 1F | 1 (basic) | tap = 팡 학습 |
| 3~9s | 2~3F | 2~3 | 콤보 ×1.5 발동 |
| 9~14s | 4F | 4 + powerup | variable reward 학습 |
| 14~20s | 5F | 5 (+fast 1) | 첫 도주 + FLED 카운터 |
| 20~27s | 6~7F | 6~7 (혼합) | Flow 진입 |
| 27~37s | 8~9F | 8~9 (+tank 1) | 난이도 peak |
| 50~55s | 9F end | — | "BOSS APPROACHING" cue |
| 55~60s | 10F | CEO 단일 | 5tap 처치 phase |

### 챕터 전환 시퀀스 (Layer 1 → Layer 2)

```
T+60.0  | CEO 처치 충돌
T+60.0~0.6 | freeze frame (desaturate 80% + vignette 12% + 1px scale oscillation)
T+60.6  | 사옥 외관 줌아웃 + 한 층 색 채워짐
T+61.8  | 카드 3장 fan-out (0.15초 stagger)
T+62.5  | "PUNCH OUT! 17:30" cutscene 1s
T+63.5  | retrospective 1줄
T+64.5  | install prompt (챕터 1만, 1회)
T+65.5  | 3택: [다음 챕터] / [카드 자세히] / [정시 퇴근]
```

### Layer 1 (결정론) vs Layer 2 (가변)

| 영역 | Layer 1 | Layer 2 |
|---|---|---|
| 좀비 처치 | 결정론 | — |
| 콤보 / Crit | 결정론 | — |
| Power-up drop rate | 결정론 (Coin Tier로 곱셈 누적만) | — |
| 챕터 카드 3장 추첨 | — | **결정론** (균등 추첨) |
| 사옥 인테리어 재건 순서 | — | 가변 |
| 골드 폭증 ×5 (1~3% 확률) | — | 가변 |

### Fail / Success

- **Fail 조건**: 좀비 도주 5마리 누적 = 챕터 fail
- **Fail 톤 리프레임**: *fail 모달*이 아닌 *조기 퇴근 모달*. 자막 *"오늘은 여기까지 해도 충분합니다."* (ADR-CL-0002 Proposed)
- **Success 시 3택**: 계속 / 카드 자세히 / 정시 퇴근 (모두 동등 가중치, default highlight 없음)
- **메타 보존**: 챕터 중간 정시 퇴근해도 그 챕터 카드·골드·인테리어 보존

### CEO 보스 5초 3-phase

| Phase | 시간 | 연출 |
|---|---|---|
| Telegraph | 0~1s | 셰이크 8px, 저음 cue |
| Engagement | 1~4s | HP 3등분 색상 변화 (녹 → 황 → 적), 콤보 SFX |
| Climax | 4~5s | 슬로우모션 0.3배속, 마지막 tap에서 0.6초 freeze |

카운트다운 압박 텍스트 ("남은 시간 5초!") **금지**. 보스 자체 위협만 사용.

### 5챕터 누적 난이도 곡선

| 챕터 | 누적 DPS | 보스 HP | 예상 클리어율 |
|---|---|---|---|
| 1 | ×1.00 | 1.00× | ~92% |
| 2 | ×1.85 | 1.50× | ~90% |
| 3 | ×3.10 | 2.25× | ~88% |
| 4 | ×4.20 | 3.10× | ~87% |
| 5 | ×5.36 | 3.84× | ~88% |

5번 곱하면 풀런 클리어 ~85%. difficulty-balancer Flow Zone 목표 달성.

---

## §4. Meta Progression Bible — 카드 15장 / 출근 도장 / Unlock 3-stage

### 카드 15장 명세표

#### Base 12장 (4 카테고리 × 3 Tier)

| ID | 카테고리 | Tier | 카드명 | 효과 | 인테리어 매핑 |
|---|---|---|---|---|---|
| 1 | Damage | T1 | 양손 회수 | +1 | 합판 벽재 |
| 2 | Damage | T2 | 의자 휘두르기 | +2 | 콘크리트 벽재 |
| 3 | Damage | T3 | 정수기통 던지기 | +3 | 방탄유리 벽재 |
| 4 | Crit% | T1 | 정확한 한 방 | +5% | 형광등 회의실 |
| 5 | Crit% | T2 | 빈틈을 노린 일격 | +10% | 스포트 회의실 |
| 6 | Crit% | T3 | 카운터 펀치 | +15% | 무대조명 회의실 |
| 7 | Duration | T1 | 점심시간 연장 | +0.5s | 정수기 3통 |
| 8 | Duration | T2 | 야근 거부권 | +1s | 정수기 6통 |
| 9 | Duration | T3 | 휴가 일수 추가 | +1.5s | 자동급수 정수기 |
| 10 | Coin Gain | T1 | 잔돈 모으기 | +10% | 흑백 복합기 |
| 11 | Coin Gain | T2 | 회식비 절약 | +20% | 컬러 복합기 |
| 12 | Coin Gain | T3 | 성과급 협상 | +30% | A3 컬러 복합기 |

#### Special 3장

| ID | 카드명 | 효과 | 인테리어 컷씬 (0.8s) |
|---|---|---|---|
| 13 | 자기장 ID카드 | 자석 PowerUp 범위 +20px | 휴게실 자판기 신설 |
| 14 | 늘어지는 회의 | 콤보 유지 시간 +0.5s | 벽시계 → 모래시계 |
| 15 | 사직서 한 방 | crit damage ×2 → ×2.5 | 사장실 책상이 비어 있음 |

### Unlock 페이스 — 3-stage

#### Stage 1 (Day 0~3)
- 노출 카드: Damage T1 + Crit% T1 + Duration T1 + Coin Gain T1 (4장)

#### Stage 2 (Day 3~14)
- 챕터 2 클리어 → Tier 2 4장 unlock
- 챕터 4 클리어 → Tier 3 4장 unlock

#### Stage 3 (Day 7~70) — 누적 coin 게이트
- 1000 coin → 자기장 ID카드 + 휴게실 자판기 컷씬
- 3000 coin → 늘어지는 회의 + 벽시계 → 모래시계 컷씬
- 10000 coin → 사직서 한 방 + 사장실 책상 빈 컷씬 *(ADR-0007 Open: 출시 1주 후 5000~10000 조정 가능)*

### Daily Streak — 출근 도장 (ADR-0003 Resolved → Option B)

- "오늘 출근하면 +20% coin" — 상승 보너스만
- 끊겨도 **페널티 0**
- 누적 = 선형 +20%/일, 7일 상한
- 8일째 자동 휴식 모달 ("연차 사용")
- UI = 벽시계 도장 7개, 끊겨도 도장은 흐려질 뿐 사라지지 않음
- 메인 메뉴 우상단 24×24px 배지만, 게임 중 강조 금지

### 가변 보상 Layer 2 (ADR-0002 Resolved → Option B)

- 사옥 인테리어 재건 = 가변 (방마다 회복 순서/세부 가변)
- 매 처치 1~3% 확률로 골드 폭증 ×5배 = 가변
- 챕터 카드 3장 추첨 = 결정론 균등 추첨

### Power-up 3종

| Power-up | 효과 | 지속 | drop rate (Coin T0 / T3) |
|---|---|---|---|
| 폭탄 | 화면 전체 좀비 즉시 처치 | 즉발 | 1.67% / 2.17% |
| 빙결 | 모든 좀비 3초 정지 | 3초 | 1.67% / 2.17% |
| 자석 | 좀비 끌어당김 + 자동 처치 | 3초 | 1.67% / 2.17% |
| 합계 | — | — | 5% / **6.5%** (max) |

- 보스 처치 시 30% 확정 drop (3종 균등 추첨)
- **동시 활성 한도 2개**
- 곱셈 누적만 허용, 덧셈 누적 금지 (ADR-0008 Resolved → 슬롯머신화 방지)
- UI 표기: "Tier 3에서 drop 빈도 증가" (정성 표현) — *"최대 15%"* 정량 표기 금지

### 영구 메타 정책

- 카드 = 한 런 안에서만 누적, 런 끝나면 starting deck로 리셋
- 영구 메타 = starting deck 1장 선택권만 (Hades 패턴)
- 메타 기록은 *퇴근해도 보존* — 진행 손실 페널티 = 강박 트리거 = 금지

---

## §5. Juice & Game Feel Bible — 0.4초 6중주 + B급 코믹 호러

### 0.4초 손맛 6중주

매 처치: hit-stop 4프레임 → screen shake 6px (감쇠 0.85) → flash white 1f (crit) → particle 8p → 4-layer SFX → +100 popup. **6개 cue가 0.4초 안에 동시 폭발**.

### Juice 매트릭스 (60fps 기준)

| 이벤트 | hit-stop | shake | particle | flash | SFX | haptic | freeze |
|---|---|---|---|---|---|---|---|
| Normal kill | 4f (66ms) | 6px | 8p | — | L1+L2 | — | — |
| Crit kill | 6f (100ms) | 9px | 12p | 1f white | L1+L2+L3 | 50ms | — |
| Combo 5+ | — | — | +ring 1개 | — | L4 ("팡!") | [30,20,30] | — |
| PowerUp pickup | — | — | sparkle 6p | 1f color | L5 | — | — |
| Boss kill | 8f (133ms) | 12→6px decay | 24p | 2f gold | L1-L4 full | [100,40,100] (240ms) | **600ms** |
| Wave clear | — | — | confetti 16p | — | L6 | — | 300ms |
| Hit (피격) | 2f | 4px | — | 1f red | L7 | 100ms | — |

### Particle 풀 (사무 비품 8종)

기본 풀: 사원증, 종이(A4), 커피잔, USB, 명함, 클립, 스테이플러 심, 포스트잇

| 좀비 | 기본 particle |
|---|---|
| 신입 | 사원증 + 포스트잇 |
| 과장 | 종이 + 명함 |
| 팀장 | 커피잔 + 클립 |
| CEO 보스 | USB + 종이 + 사원증 (3종 24p) |

**Adaptive Degradation**: 동시 표시 24p → FPS<50 3프레임 연속 시 6p로 다운그레이드, 30프레임 alpha decay.

### 4-layer SFX (Web Audio API, 외부 파일 0)

| Layer | 합성 | 톤 |
|---|---|---|
| L1 impact | 80Hz square 30ms + 220Hz sine 50ms decay | 의자 다리 책상 충돌음 |
| L2 zombie groan | 110~180Hz sawtooth + LFO 4Hz 12% | 회의실 마이크 피드백 |
| L3 crit punch | 600Hz triangle 20ms + white noise 15ms band-pass 2kHz | 결재 도장 *쾅* |
| L4 combo "팡!" | 1.2kHz sine 15ms + 600Hz square 60ms + reverb 80ms | 풍선껌 터지는 톤 |
| L5 powerup | 880→1320→1760Hz arpeggio 90ms | 자판기 동전 |
| L6 wave clear | C5-E5-G5 chord 350ms | 엘리베이터 *띵* |
| L7 hit damage | 60Hz sawtooth 80ms decay + low-pass 400Hz | 형광등 *틱* |

### "팡!" 의성어

- 트리거: crit + combo 5+ **동시 조건만**
- 1.5초 squash (0→1.2→1.0), Y -20px 부유, fade out
- 폰트: Pretendard Black, fill #FFCE00, stroke #1A1A1A 3px
- 처치된 좀비 좌표 위 -40px, 32~40px

### Screen shake 자동 감쇠

- thumb zone 침범 시 6→3px 자동 감쇠
- 22시 이후 진동 자동 1/3 강도

### Haptic 한정 이벤트

- 콤보 5+, 보스 처치, wave clear **3개만**
- normal kill에 haptic 금지

---

## §6. PWA & Mobile UX Bible

### Portrait / tap-only

- **viewport**: 390×844 portrait 강제
- 조작: tap-only (swipe/pinch v2도 보류)
- **hit box 80×80** (visible 64×64), fast 좀비 90×90
- 좀비 간 최소 거리 96px
- Thumb Zone 스폰: 하단 60% (70%) + 중앙 (20%) + 상단 (10%, 도주 전용)

### 첫 30초 onboarding — 텍스트 0줄

- 별도 Tutorial scene 없음, 1F가 곧 tutorial
- 모든 cue = motion + sound + 숫자 (텍스트 0)
- screen reader용 aria-label 풍부

### PWA 자산 < 3MB

| # | 자산 | 크기 |
|---|---|---|
| 1 | core JS (Phaser + 게임 코드) | gzip ≤ 800KB |
| 2 | UI atlas | ≤ 200KB |
| 3 | 좀비/boss 스프라이트 | ≤ 400KB |
| 4 | SFX 5개 | ≤ 300KB |
| 5 | BGM | **lazy load** |

- 첫 로딩 5~8초 (3G)
- 우상단 dot: 회색 = online, 황색 = offline
- 전 기능 오프라인 작동
- localStorage / IndexedDB에 카드 deck + 진행도 영구 저장

### Install prompt 정책

- 챕터 1 클리어 후, 카드 선택 후, **1회 노출**
- dismiss 7일 cooldown, 3회 누적 시 영구 비노출
- 카피: *"홈 화면에 두고 출근길에 켜세요"*
- iOS: 가이드 모달 ("[공유] → [홈 화면에 추가]")
- 압박 카피 / 배지 / 빨간 점 금지

### 자정 cue

- 00:00~06:00 첫 실행 시 (세션 1회)
- 메시지: *"오늘은 충분히 했어요. 좀비도 잠들었어요."*
- 화면 50% 디밍 + BGM 30% 볼륨
- 옵션: [그래도 1라운드만] / [내일 봐요]
- 22시 이후 진동 자동 1/3 강도

### 권한 정책

- **Notification 권한 영구 비요청** (v1/v2/v3 전부)
- 첫 진입 시 권한 다이얼로그 0개
- Wake Lock 사용 안 함 (60초 세션)
- 광고 없음 (ADR-0001 Open, MVP는 미적용)

### 접근성 (WCAG 2.1 AA)

| # | 항목 | 구현 |
|---|---|---|
| 1 | Color contrast | dark #0a0a0f vs 형광 좀비 ≥ 7:1 |
| 2 | Tap target | hit box 80×80 |
| 3 | prefers-reduced-motion | shake/particle 50% 감쇠 (제거 X) |
| 4 | prefers-color-scheme | dark 강제 |
| 5 | 색약 | 색 + 실루엣 동시 시그널 |
| 6 | Screen reader | aria-live "Floor N, fled X of 5" |
| 7 | forced-colors | 좀비 1px black outline |
| 8 | lang | `<html lang="ko">` (v1) |

### iOS Safari 대응 5개 핵심

1. Vibration: `typeof navigator.vibrate === 'function'` + no-op
2. Install: meta tag + 가이드 모달
3. AudioContext: PUNCH IN tap에서 `resume()`
4. Orientation: lock 시도 + 실패 시 landscape overlay
5. PWA standalone display + safe-area env()

### viewport / safe-area

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1">
```

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  background: #0a0a0f;
}
```

---

## §7. Ethics & Anti-Pattern Bible — 회피 항목 10개

좀비팡이 **명시적으로 회피**하는 10개 안티패턴:

| # | 회피 항목 | 사유 |
|---|---|---|
| 1 | **Streak 페널티** | 상실 회피 = 행동 중독 트리거. WHO 분류 거리 확보 |
| 2 | **푸시 알림 (Notification)** | FOMO 트리거, 좀비팡 컨셉과 정면 배치 |
| 3 | **Energy / Stamina 시스템** | "재접속 강제" = 야근의 정의 |
| 4 | **가챠 카드** | plays-to-extinction 곡선. 카드는 결정론 풀 |
| 5 | **무한 retention 추구** | 게임은 *끝난다*는 약속 위반 |
| 6 | **카운트다운 압박 텍스트** | "남은 시간 5초!" = 시간 압박 dark pattern |
| 7 | **광고 강제 시청** | MVP 미적용 (ADR-0001 Open) |
| 8 | **첫 진입 권한 다이얼로그** | 이탈률 +35%, 사용자 가치 미확인 상태 강요 |
| 9 | **카드 가챠 확률 표기에 "최대 15%"** | 슬롯머신화. *"빈도 증가"* 정성 표현만 |
| 10 | **메타 진행 손실 페널티** | "그만두면 손해" = 강박 트리거. 메타는 퇴근해도 보존 |

**핵심 원칙**: *"플레이어가 원해서 켜는지, streak이 끊길까봐 켜는지 구분 불가능하면 후자로 간주하여 폐기"*

---

## §8. 상수 & 수치 명세

### Viewport / Display

| 상수 | 값 |
|---|---|
| viewport | 390×844 portrait 강제 |
| canvas background | `#0a0a0f` (dark 강제) |
| 색약 친화 좀비 색 contrast | ≥ 7:1 vs bg |

### 좀비 / Spawn

| 상수 | 값 |
|---|---|
| spawn rate (시작) | 1000ms |
| spawn rate (wave 10 = 10층) | 300ms |
| zombie lifespan (시작) | 2000ms |
| zombie lifespan (끝) | 1200ms |
| 좀비 간 최소 거리 | 96px |
| hit box (basic/middle/lead) | 80×80 |
| hit box (fast) | 90×90 |
| visible size | 64×64 |
| Thumb Zone 분포 | 하단 60% (70%) + 중앙 (20%) + 상단 (10%) |
| 좀비 도주 fail 임계 | 5마리 누적 |

### Combo / Crit

| 상수 | 값 |
|---|---|
| combo decay (default) | 1500ms |
| combo decay (Combo Decay Resistance) | 2000ms (+0.5s) |
| combo tier | ×1 → ×1.5 (5kill) → ×2 (10kill) → ×3 (15kill) |
| critical (머리 tap) | 2× score |
| critical (with Sajiksrn한방) | 2.5× score |

### Round / Chapter

| 상수 | 값 |
|---|---|
| round goal | 60초 = wave 10 (10층) |
| envelope 상한 | 68초 |
| 챕터 수 (MVP) | 5 (= 50층) |
| 보스 페이즈 | 마지막 5초 (상한 8초) |
| freeze frame (CEO 처치) | 600ms |
| freeze frame (normal kill) | **금지** |

### Card / Meta

| 상수 | 값 |
|---|---|
| 카드 풀 | 15장 (Base 12 + Special 3) |
| 챕터 종료 fan-out | 3장 추첨 / 1장 선택 |
| 추첨 방식 | 결정론 균등 |
| Unlock — Tier 2 | 챕터 2 클리어 |
| Unlock — Tier 3 | 챕터 4 클리어 |
| Unlock — Magnet Range | 1000 coin |
| Unlock — Combo Decay Resistance | 3000 coin |
| Unlock — Critical Multiplier | 10000 coin (조정 가능, ADR-0007) |

### Power-up

| 상수 | 값 |
|---|---|
| 기본 drop rate (합계) | 5% (3종 균등) |
| 보스 처치 시 drop | 30% 확정 |
| Coin T3 누적 최대 | 6.5% (×1.3 곱셈) |
| 동시 활성 한도 | 2개 |
| 빙결 지속 | 3초 (+ Duration Tier) |
| 자석 지속 | 3초 (+ Duration Tier) |
| 자석 라인 시각화 | 0.2초 |

### Juice

| 상수 | 값 |
|---|---|
| hit-stop (normal) | 4f (66ms @ 60fps) |
| hit-stop (crit) | 6f (100ms) |
| hit-stop (boss) | 8f (133ms) |
| shake (normal) | 6px (감쇠 0.85) |
| shake (crit) | 9px |
| shake (boss) | 12→6px decay |
| shake (thumb zone 침범) | 자동 6→3px 감쇠 |
| particle 동시 한도 | 24p (FPS<50 3f 연속 시 6p) |
| haptic (boss) | [100, 40, 100] (240ms) |
| haptic (combo 5+) | [30, 20, 30] (80ms) |
| haptic (22시 이후) | 자동 1/3 강도 |

### Daily Streak

| 상수 | 값 |
|---|---|
| 일일 보너스 | +20% coin |
| 누적 방식 | 선형 +20%/일 |
| 상한 | 7일 (+140%) |
| 페널티 | **0 (없음)** |
| 8일째 | 자동 휴식 모달 |

### PWA

| 상수 | 값 |
|---|---|
| 첫 로딩 자산 합계 | < 3MB |
| Service Worker cache 한도 (iOS) | 50MB / 도메인 |
| Install prompt 노출 | 챕터 1 클리어 후 1회 |
| dismiss cooldown | 7일 |
| dismiss 누적 영구 비노출 | 3회 |
| 자정 cue 시간대 | 00:00~06:00 |
| 자정 cue 빈도 | 세션 1회 |
| 야간 진동 시작 | 22:00 |
| Notification 권한 | **영구 비요청** |

---

## §9. References

### Phase A-0~A-3 Debate Consensus

- [docs/debate/concept/consensus.md](../debate/concept/consensus.md) — 컨셉 (0.786)
- [docs/debate/core-loop/consensus.md](../debate/core-loop/consensus.md) — Core Loop (0.86)
- [docs/debate/meta-juice/consensus.md](../debate/meta-juice/consensus.md) — Meta + Juice (0.87)
- [docs/debate/pwa-ux/consensus.md](../debate/pwa-ux/consensus.md) — PWA UX (0.87)

### Phase A-4~A-6 Research

- [docs/research/phaser-vite-stack.md](../research/phaser-vite-stack.md) — Phaser 3 + Vite + Vitest + fast-check + Stryker
- [docs/research/pwa-mobile.md](../research/pwa-mobile.md) — PWA Workbox + iOS Safari
- [docs/research/addictive-loop.md](../research/addictive-loop.md) — 중독성 모바일 게임 + 안티패턴

### Phase A-7 Brainstorm 통합

- [docs/brainstorm/zombie-pang-concept.md](../brainstorm/zombie-pang-concept.md)
- [docs/brainstorm/zombie-pang-core-loop.md](../brainstorm/zombie-pang-core-loop.md)
- [docs/brainstorm/zombie-pang-meta.md](../brainstorm/zombie-pang-meta.md)
- [docs/brainstorm/zombie-pang-juice.md](../brainstorm/zombie-pang-juice.md)
- [docs/brainstorm/zombie-pang-pwa.md](../brainstorm/zombie-pang-pwa.md)

### ADR (draft / Phase A-9 정식 박제 예정)

- [ADR-0001 Ads Integration](../adr/draft/ADR-0001-ads-integration.md) — **Open** (Phase B 재논의)
- [ADR-0002 Variable Reward Scope](../adr/draft/ADR-0002-variable-reward-scope.md) — **Resolved (Option B)**
- [ADR-0003 Daily Streak Strength](../adr/draft/ADR-0003-daily-streak-strength.md) — **Resolved (Option B)**
- [ADR-0004 Zombie Abstraction Dial](../adr/draft/ADR-0004-zombie-abstraction-dial.md) — **Resolved (Option B, 50% 마스크)**
- ADR-0005 Meta Card Unlock FOMO (신규 박제 권고) — **Open**
- ADR-0006 Freeze Frame 600ms Live Signal (신규 박제 권고) — **Open**
- ADR-0007 Special Card 10000 Coin 임계 (신규 박제 권고) — **Open**
- ADR-0008 Power-up Drop Rate 누적 방식 (신규 박제 권고) — **Resolved (곱셈 누적만)**
- ADR-CL-0001 정시 퇴근 버튼 위치 — **Open** (출시 30일 후 데이터 재검증)
- ADR-CL-0002 챕터 fail graceful exit 톤 — **Proposed**

### 합의도 종합

| Phase | 합의도 |
|---|---|
| A-0 Concept | 0.786 |
| A-1 Core Loop | 0.86 |
| A-2 Meta + Juice | 0.87 |
| A-3 PWA UX | 0.87 |
| **평균** | **0.847** (목표 0.85 초과) |

---

**본 Bible은 Phase B Master Plan과 Phase C 코드 구현의 SSOT(Single Source of Truth)다.** 본 문서의 결정과 코드가 충돌하면, 코드를 본 문서에 맞춘다. 본 문서를 변경하려면 ADR을 통과해야 한다.
