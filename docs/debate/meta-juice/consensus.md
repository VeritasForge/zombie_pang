# 좀비팡 Meta + Juice 토론 — Consensus (Phase A-2)

> 작성: 메디에이터 / 단계: Phase A-2 종료
> 입력: 7명 페르소나 × 1라운드 = 7개 입장 문서 (round-1-*.md)
> 결정 방식: 가중 융합 + 자기수정 수렴 신호 + ADR 박제
> 합의도 점수: **0.87 (87%)** — 잔여 항목은 ADR-0005/0006 신규 박제로 처리

---

## 0. 전제 컨센서스 재확인 (Phase A-0/A-1)

- 컨셉: 50층 좀비 사옥에서 야근 끝내고 퇴근 / B급 코믹 호러
- 1세션 = 1챕터 = 10층 = 60초 envelope (CEO 보스 5초 포함, 상한 68초)
- 좀비 4종 (신입/과장/팀장/CEO), 50% 마스크
- Layer 1 결정론 (좀비 처치) / Layer 2 가변 (사옥 재건)
- 챕터 종료 시 카드 3장 중 1장 선택. 단일 스탯 부스트, deck 5종 × 3티어 = 15장
- 카드 = 수치 stat boost + 세계관적 인테리어 변화 (이중 매핑)
- 5챕터 = 5막 (신입부서 / 영업본부 / R&D / 임원실 / CEO 집무실+옥상)
- 0.6초 freeze frame after CEO kill
- 정시 퇴근 버튼 챕터 끝 + 메뉴 동등 노출

---

## 1. 7개 시드 질문 — 최종 합의안

### Q1. Meta Tree 구조 — 15장 deck 정확한 분류

**채택**: 4 base × 3 tier (12장) + Special 3장 = **15장 풀**.

#### Base 12장 (4 카테고리 × 3 티어)

| 카드 코드 | Tier 1 명 | Tier 2 명 | Tier 3 명 | 효과 | 인테리어 매핑 |
|---|---|---|---|---|---|
| **Damage** | 양손 회수 | 의자 휘두르기 | 정수기통 던지기 | +1 / +2 / +3 | 사옥 벽재 (합판→콘크리트→방탄유리) |
| **Crit%** | 정확한 한 방 | 빈틈을 노린 일격 | 카운터 펀치 | +5% / +10% / +15% | 회의실 조명 (형광등→스포트→무대) |
| **PowerUp Duration** | 점심시간 연장 | 야근 거부권 | 휴가 일수 추가 | +0.5s / +1s / +1.5s | 정수기 (3통→6통→자동급수) |
| **Coin Gain** | 잔돈 모으기 | 회식비 절약 | 성과급 협상 | +10% / +20% / +30% | 복합기 (흑백→컬러→A3 컬러) |

#### Special 3장

| 카드 코드 | 카드명 | 효과 | 인테리어 |
|---|---|---|---|
| **Magnet Range** | 자기장 ID카드 | 자석 PowerUp 범위 +20px | 휴게실 자판기 신설 |
| **Combo Decay Resistance** | 늘어지는 회의 | 콤보 유지 시간 +0.5s | 벽시계 → 모래시계 |
| **Critical Multiplier** | 사직서 한 방 | crit damage ×2 → ×2.5 | 사장실 책상이 비어 있음 |

**시너지 v2 시점**: 챕터 5 클리어율 88%±5% 데이터가 측정된 후 (출시 후 1~2주 데이터 검증 통과 시점). 출시 즉시 v2 도입 금지.

근거:
- **meta-progression-strategist**: 단일 스탯 + 이중 매핑(수치+인테리어)이 의사결정과 세계관 회복을 동시 충족.
- **difficulty-balancer**: 챕터 5 누적 시 DPS 5.36×, 보스 HP 3.84× → 클리어율 ~88% 목표 안에 들어옴.
- **compulsion-architect**: Special 3장이 *next anticipation*을 만드는 비대칭 보상 — *천장 인식*.
- **narrative-thematist**: 모든 카드명이 *야근 속 작은 저항* 톤 일관 — 카드명/부제목 분리로 정확성 확보.
- **mobile-ux-pragmatist**: 카드 110×160px portrait fan-out, 한국어 6자 이하 카드명 가독성 확보.

---

### Q2. Daily Streak 정확한 규칙 (ADR-0003 결정)

**채택**: **Option B (상승 보너스만, 페널티 0)** — *Resolved*.

- "오늘 출근하면 +20% coin" *상승 보너스만*. 끊겨도 *패널티 없음*.
- 누적 방식 = **선형 +20%/일, 7일 상한** (8일째도 +140% 유지 또는 자동 휴식 모달).
- streak UI = *벽시계 도장 7개*. 끊겨도 도장은 *흐려질 뿐* (사라지지 않음).
- 메인 메뉴 우측 상단 24×24px 배지. 게임 진입 후 강조 금지.

근거:
- **dark-pattern-critic**: streak이 *접근 동기*로만 작동, *상실 회피* 0 — WHO 행동중독 분류 거리 최대 확보.
- **compulsion-architect**: 상실 회피가 아닌 접근 동기 원칙과 정합.
- **difficulty-balancer**: 복리 폭주 방지 위해 선형 +20%/일 7일 상한 필수.
- **meta-progression-strategist**: streak 보너스가 Special 3장 unlock 시간 단축 동기로 연결.
- **narrative-thematist**: "벽시계 도장이 흐려진다"는 톤 — *야근 누적이 아닌 정시 퇴근 누적*.

**ADR-0003 → Resolved (Option B)**.

---

### Q3. 가변 보상 Layer 2 범위 (ADR-0002 결정)

**채택**: **Option B (인테리어 + 골드 폭증, 카드는 결정론 풀)** — *Resolved*.

- 사옥 인테리어 재건 = 가변 (방마다 회복 순서·세부 사물 다름).
- 매 처치 1~3% 확률로 **골드 폭증 ×5배** 트리거 = 가변.
- 챕터 종료 카드 3장 추첨 = **결정론 풀에서 균등 추첨** (가변 아님).
- 시너지 콤보·power-up 드랍률 = 결정론 (Coin Gain Tier로 추가 곱셈만 허용, 덧셈 누적 금지).

근거:
- **dark-pattern-critic**: 가변 빈도 챕터당 0.5회 = PGSI 임계 미달. 카드 결정론으로 빌드 자율성 보장.
- **difficulty-balancer**: Option C는 챕터별 DPS 분산 ×1.8 증가 → 클리어율 ±12%p 진동 → flow 깨짐.
- **compulsion-architect**: 카드 가챠 가변은 plays-to-extinction 곡선 생성.
- **meta-progression-strategist**: 카드 = 결정의 단위, 인테리어 = 세계의 단위. 분리 필수.
- **narrative-thematist**: 골드 폭증 = "예상치 못한 야근 수당" 톤 — 미세 카타르시스.

**ADR-0002 → Resolved (Option B)**.

---

### Q4. 좀비 추상화 다이얼 (ADR-0004 결정)

**채택**: **Option B (50% 마스크)** *유지* — *Resolved*.

- 인간 실루엣 유지 + 얼굴 영역은 표정 없는 마스크.
- 마스크 표면 텍스처에 직급별 작은 사인: 신입(흰색), 과장(회색), 팀장(어두운 회색), CEO(검정).

근거:
- **dark-pattern-critic**: 25%는 폭력 정상화 임계 초과, 100%는 *대상의 정체성 소거*로 *모두에 폭력 가능*이라는 메시지 위험.
- **game-feel-juicer**: 75% 이상은 fusiform face area 발화 손실로 손맛 23~40% 감소.
- **narrative-thematist**: 75%는 직급 메타포 소실. 50% = *얼굴은 비어 있지만 직급은 남았다*는 핵심 서사.
- **mobile-ux-pragmatist**: portrait 12×12px sprite에서 표정 표현 불가 → 50% 마스크 단일 색이 가독성 유리.

**ADR-0004 → Resolved (Option B 유지)**.

---

### Q5. Juice 효과 카탈로그

#### 5-1. 이벤트별 매트릭스 (정확한 수치, 60fps 기준)

| 이벤트 | hit-stop | shake | particle | flash | SFX layer | haptic | freeze |
|---|---|---|---|---|---|---|---|
| **Normal kill** | 4f (66ms) | 6px | 8p (사원증) | — | 1+2 | — | — |
| **Crit kill** | 6f (100ms) | 9px | 12p (사원증+종이) | 1f white | 1+2+3 | 50ms | — |
| **Combo 5+** | — | — | +ring 1개 | — | 4 ("팡!") | [30,20,30] (80ms) | — |
| **PowerUp pickup** | — | — | sparkle 6p | 1f color | 5 | — | — |
| **Boss kill** | 8f (133ms) | 12px → 6px decay | 24p (USB+커피+종이) | 2f gold | 1-4 full | **[100,40,100]** (240ms) | **600ms** |
| **Wave clear** | — | — | confetti 16p | — | 6 | — | 300ms |
| **Hit (사용자 피격)** | 2f | 4px | — | 1f red | 7 | 100ms | — |

> Boss kill의 haptic 패턴은 mobile-ux-pragmatist의 200ms 한도 제안을 반영해 `[80,30,80,30,80]` (290ms) → `[100,40,100]` (240ms)로 *조정 후 채택* (절충: 240ms는 임계와 가까우나 boss 카타르시스 보존).

#### 5-2. Particle 8개 풀 + adaptive 24→6 다운그레이드

**기본 풀 8종**: 사원증, 종이(A4), 커피잔, USB, 명함, 클립, 스테이플러 심, 포스트잇

**좀비별 변형**:
| 좀비 | 기본 particle | 서사적 의미 |
|---|---|---|
| 신입 | 사원증 + 포스트잇 | 입사 첫날의 흔적 / 전달되지 못한 메모 |
| 과장 | 종이 + 명함 | 결재되지 못한 보고서 / 교환되지 못한 연결 |
| 팀장 | 커피잔 + 클립 | 식어버린 야근 동반자 / 고정 도구가 풀어짐 |
| CEO 보스 | USB + 종이 + 사원증 | 데이터 유출 / KPI의 잔해 (3종 혼합 24p) |

**Adaptive 룰**:
- 동시 표시 한도 24개
- FPS < 50 *3프레임 연속* 감지 시 → 한도 6개로 다운그레이드
- 다운그레이드 신호 비가시: 30프레임에 걸쳐 alpha decay 점진 축소
- 정지 중에도 *1px scale oscillation*으로 라이브 신호 (freeze frame 600ms 알림 충돌 방지)

#### 5-3. 4-layer SFX 합성 사양 (Web Audio API only, 외부 파일 0)

| Layer | 합성 사양 | 서사 톤 |
|---|---|---|
| 1 impact | 80Hz square 30ms + 220Hz sine 50ms decay | 의자 다리가 책상에 부딪힌 둔탁한 소리 |
| 2 zombie groan | 110~180Hz sawtooth + LFO 4Hz 깊이 12% | 회의실 마이크 피드백 / 복사기 동작음 |
| 3 crit punch | 600Hz triangle 20ms + white noise 15ms band-pass 2kHz | 결재 도장 *쾅* |
| 4 combo "팡!" | 1.2kHz sine 15ms + 600Hz square 60ms + reverb 80ms | 풍선껌 터지는 톤 / 회사 단톡방 알림음 |
| 5 powerup chime | 880Hz → 1320Hz → 1760Hz arpeggio 90ms | 자판기 동전 떨어지는 톤 |
| 6 wave clear | C5-E5-G5 chord 350ms | 엘리베이터 도착 *띵* + 화답 |
| 7 hit damage | 60Hz sawtooth 80ms decay + low-pass 400Hz | 형광등 깜빡이는 *틱* |

**구현 노드**: `OscillatorNode` + `GainNode` + `BiquadFilterNode` 조합. 외부 사운드 파일 0개.

#### 5-4. "팡!" 의성어

- **트리거**: crit + combo 5+ **동시 조건만**. 단독 발생 시 노출 안 함.
- **노출**: 1.5초 / scale 0→1.2→1.0 (squash) / Y -20px 부유 / fade out
- **폰트**: 굵은 sans-serif (Pretendard Black 권장). 카타카나·영문 금지.
- **색**: fill #FFCE00 (포스트잇 노란색), stroke #1A1A1A 3px (회의실 칠판)
- **위치**: 처치된 좀비 좌표 위 -40px. 화면 중앙 고정 금지.
- **크기**: portrait 360px 폭에서 글자 32~40px

#### 5-5. Freeze frame 0.6초

- **CEO 처치 전용**. normal kill에 freeze 절대 금지.
- t0 처치 충돌 → 모든 입자 정지 + desaturate 80% + vignette 12% → 0.6초 후 desaturate 해제 + 사옥 줌아웃.
- 정지 중 1px scale oscillation으로 라이브 신호 유지.

---

### Q6. Power-up 3종 drop rate

**채택**: **기본 5% 균등 분포 + 보스 처치 시 30% 확정 + Coin Gain 메타 카드 누적 시 최대 15% (덧셈 누적 금지, 곱셈만)**.

- 폭탄 / 빙결 / 자석 = 균등 분포 (각 33.3%)
- 보스 처치 30% 확정 (3종 중 균등 추첨)
- Coin Gain Tier 1/2/3 누적 시 drop rate = 5% × (1.1 / 1.2 / 1.3) → 최대 **6.5%** *주의: 곱셈만 허용*
- *플레이어 멘탈 모델용 표기*: "Coin Gain Tier 3에서 drop rate ~15%까지 곡선" (compulsion-architect 표현) ↔ 수치적으로는 ×1.3 곱셈 곡선 (dark-pattern-critic 슬롯머신화 방지)
- **동시 활성 한도 2개** (3종 동시 = portrait 컨트롤 책임 분산 임계)
- drop 시 자석 라인 0.2초 시각화 (mobile-ux-pragmatist 0.3→0.2 조정)

> **합의 노트**: "최대 15%" 표현은 합의 시드 질문에 등장했으나, dark-pattern-critic이 *덧셈 누적 슬롯머신화* 위험을 지적함에 따라 **수치적 상한은 곱셈 누적 6.5%** 로 확정. UI 표기는 "Tier 3에서 drop 빈도 증가"로 정성 표현.

근거:
- **difficulty-balancer**: 5% × 35체/챕터 + 보스 0.3 = 평균 1.8회 → mastery 곡선 자연.
- **dark-pattern-critic**: 곱셈 누적 강제 — 덧셈 누적은 슬롯머신화.
- **compulsion-architect**: 보스 30% 확정 = next anticipation 강화.
- **mobile-ux-pragmatist**: 동시 활성 2개 한도 = portrait 컨트롤 안정성.

---

### Q7. Meta 카드 unlock 페이스 — 3-stage

**채택**: 3-stage unlock 구조.

#### Stage 1 (Day 0~3): 첫 게임 = 4 base Tier 1만 풀
- 노출 카드 = Damage T1 + Crit% T1 + PowerUp Duration T1 + Coin Gain T1 (4장)
- 챕터 종료 시 3장 fan-out도 이 4장에서만 추첨
- 의도: 학습 곡선 단순화

#### Stage 2 (Day 3~14): 챕터 게이트
- **챕터 2 클리어 (누적 20층, 보스 #2 처치)** → Tier 2 4장 unlock
- **챕터 4 클리어 (누적 40층, 보스 #4 처치)** → Tier 3 4장 unlock
- meta-progression-strategist의 *각 5단위 챕터 게이트 통과 시* 해석 채택 (v1 단순화)

#### Stage 3 (Day 7~70): 누적 coin 게이트로 Special 3장
- **누적 1000 coin** → 자기장 ID카드 (Magnet Range) unlock + 휴게실 자판기 컷씬 0.8초
- **누적 3000 coin** → 늘어지는 회의 (Combo Decay Resistance) unlock + 벽시계 → 모래시계 컷씬
- **누적 10000 coin** → 사직서 한 방 (Critical Multiplier) unlock + 사장실 책상이 비어 있는 컷씬 1회

> **임계값 조정 권고**: 10000 coin = 10주차는 길다. 출시 1주 데이터 검증 후 5000~10000 사이에서 조정 (dark-pattern-critic 권고).

#### UX 룰

- "처음 보는 카드" = 카드 자체에 sparkle particle 6p 1초간. 강제 모달 금지.
- 누적 coin 진행 표시 = 상단 6px 가로 바.
- **"다음 unlock까지 N coin" 텍스트는 long-press 시에만 노출** (FOMO 방지).

근거:
- **meta-progression-strategist**: 3-stage 구조가 매주 새 안건 생성 (retention engine).
- **difficulty-balancer**: 누적 coin 임계값 = retention 곡선 ε 지점.
- **dark-pattern-critic**: 남은 거리 노출은 FOMO — long-press 룰로 방어.
- **mobile-ux-pragmatist**: sparkle 6p / 알림 모달 금지.
- **narrative-thematist**: Special unlock 시 0.8초 컷씬으로 *사옥의 회복* 시각화.

---

## 2. Juice 카탈로그 매트릭스 (정확한 수치 요약)

| 이벤트 | hit-stop | shake | particle | flash | SFX | haptic | freeze |
|---|---|---|---|---|---|---|---|
| Normal kill | 4f (66ms) | 6px | 8p | — | 1+2 | — | — |
| Crit kill | 6f (100ms) | 9px | 12p | 1f white | 1+2+3 | 50ms | — |
| Combo 5+ | — | — | +ring 1개 | — | 4 ("팡!") | [30,20,30] | — |
| PowerUp pickup | — | — | sparkle 6p | 1f color | 5 | — | — |
| Boss kill | 8f (133ms) | 12→6px decay | 24p | 2f gold | 1-4 full | [100,40,100] | 600ms |
| Wave clear | — | — | confetti 16p | — | 6 | — | 300ms |
| Hit (피격) | 2f | 4px | — | 1f red | 7 | 100ms | — |

---

## 3. Meta 카드 15장 명세

```
[Base 12]
1. Damage T1 (양손 회수)         +1   → 합판 벽재
2. Damage T2 (의자 휘두르기)     +2   → 콘크리트 벽재
3. Damage T3 (정수기통 던지기)   +3   → 방탄유리 벽재
4. Crit% T1 (정확한 한 방)       +5%  → 형광등 회의실
5. Crit% T2 (빈틈을 노린 일격)   +10% → 스포트 회의실
6. Crit% T3 (카운터 펀치)        +15% → 무대조명 회의실
7. Duration T1 (점심시간 연장)   +0.5s → 정수기 3통
8. Duration T2 (야근 거부권)     +1s   → 정수기 6통
9. Duration T3 (휴가 일수 추가)  +1.5s → 자동급수 정수기
10. Coin T1 (잔돈 모으기)        +10% → 흑백 복합기
11. Coin T2 (회식비 절약)        +20% → 컬러 복합기
12. Coin T3 (성과급 협상)        +30% → A3 컬러 복합기

[Special 3]
13. 자기장 ID카드 (Magnet Range)              +20px         → 휴게실 자판기
14. 늘어지는 회의 (Combo Decay Resistance)    +0.5s         → 벽시계 → 모래시계
15. 사직서 한 방 (Critical Multiplier)        ×2 → ×2.5     → 사장실 책상이 비어 있음
```

---

## 4. ADR 결정 요약

| ADR | 결정 | 사유 1줄 |
|---|---|---|
| **ADR-0002** (가변 보상 Layer 2 범위) | **Resolved → Option B** | 가변 빈도 챕터당 0.5회 = PGSI 임계 미달, 카드 결정론으로 빌드 자율성 보장. |
| **ADR-0003** (Daily Streak 강도) | **Resolved → Option B** | streak이 *접근 동기*로만 작동, *상실 회피* 0 — WHO 행동중독 분류 거리 최대. |
| **ADR-0004** (좀비 추상화 다이얼) | **Resolved → Option B 유지** | 50% 마스크 = *역할의 잔여물*로서의 윤리적 절충점, 손맛+가독성 보존. |

### 신규 ADR 권고 (Phase A-2에서 박제)

| ADR | 주제 | 잠정 결정 |
|---|---|---|
| **ADR-0005** (신규) | Meta 카드 unlock 임계의 노출 방식 (FOMO 방지) | 진행 표시는 상단 6px 바만 / 남은 거리 숫자는 long-press 시에만 노출 |
| **ADR-0006** (신규) | Freeze frame 600ms의 알림 충돌 | 정지 중 1px scale oscillation으로 라이브 신호 유지 |
| **ADR-0007** (신규 권고) | Special 카드 10000 coin 임계 조정 | 출시 1주 데이터 검증 후 5000~10000 사이 조정 가능 |
| **ADR-0008** (신규 권고) | Power-up drop rate 누적 방식 (덧셈 vs 곱셈) | 곱셈 누적만 허용, 덧셈 누적 금지 (Tier 3 최대 6.5%) — Resolved |

---

## 5. 합의도 점수

### 산출 방식

- 7명 페르소나 × 7개 시드 질문 = 49개 입장 셀
- 각 셀 가중치: 강한 입장 페르소나(주관자) = 2.0, 일반 = 1.0, 양보 = 0.5
- 합의 = 채택안과 동일 방향 입장의 가중합 / 전체 가중합

### 결과

| 영역 | 합의도 | 비고 |
|---|---|---|
| Q1 Meta tree 15장 | 0.92 | 메타+밸런서+서사+UX 일관 |
| Q2 Daily Streak (ADR-0003) | 0.95 | 7명 모두 Option B 찬성 |
| Q3 가변 보상 (ADR-0002) | 0.91 | 7명 모두 Option B 찬성 |
| Q4 좀비 추상화 (ADR-0004) | 0.94 | 7명 모두 Option B 유지 찬성 |
| Q5 Juice 카탈로그 | 0.82 | Boss haptic 290ms→240ms 절충 / freeze 알림 충돌 → ADR-0006 박제 |
| Q6 Power-up drop | 0.78 | "최대 15%" 표현 ↔ 곱셈 누적 6.5% 절충 → ADR-0008 박제 |
| Q7 카드 unlock 페이스 | 0.84 | 10000 coin 임계 → ADR-0007 박제 |
| **종합** | **0.87** | 목표 0.85 초과 달성 |

---

## 6. 잔여 미해결 & ADR Open 상태

| 항목 | 상태 | 향후 처리 |
|---|---|---|
| ADR-0002 | **Resolved** (Option B) | draft → accepted 이동 |
| ADR-0003 | **Resolved** (Option B) | draft → accepted 이동 |
| ADR-0004 | **Resolved** (Option B 유지) | draft → accepted 이동 |
| ADR-0005 (신규) | **Open → 잠정 결정 박제** | Phase A-3 PWA UX 토론에서 재검증 |
| ADR-0006 (신규) | **Open → 잠정 결정 박제** | Phase C-6 Phaser Adapter 구현 시점에 검증 |
| ADR-0007 (신규) | **Open** | 출시 1주 데이터 측정 후 결정 |
| ADR-0008 (신규) | **Resolved** (곱셈 누적만) | draft 작성 후 accepted |

---

## 7. 다음 단계 (Phase A-3 진입 신호)

- Phase A-3 = PWA + 모바일 UX 토론. 본 Consensus의 *60fps 적응형 다운그레이드*, *600ms freeze 알림 충돌*, *long-press FOMO 방지*는 모두 PWA 토론에서 검증.
- Phase A-8 Game Design Bible에는 본 문서의 Juice 매트릭스 + Meta 15장 명세가 그대로 포함.
- Phase A-9에서 ADR-0005/0006/0007/0008을 정식 박제.
