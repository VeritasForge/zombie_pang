# ADR 0006: 게임 디자인 원칙 — B급 코믹 호러 + Layer 1/2 결정론·가변 분리 + Ethics-aware 안티패턴 10개 회피

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: Phase A 컨센서스 (0.847) + Bible §1/§3/§7

---

## Context

좀비팡은 출시 가능한 MVP인 동시에 **윤리적으로 정당화 가능한 게임**이어야 합니다. 좀비팡의 컨셉 자체가 *번아웃이 물질화된 직장 풍자*이므로, 게임이 정작 플레이어를 번아웃시키면 컨셉이 무너집니다.

### 좀비팡이 명시적으로 회피하는 5가지

1. *Infinite retention* (Candy Crush의 무한 레벨)
2. *Streak 페널티* (Snapchat / Duolingo 끊기 페널티)
3. *FOMO 트리거* (Push notification, 한정 시간 이벤트)
4. *가챠 카드* (확률 가변 = 슬롯머신화)
5. *카운트다운 압박 텍스트* ("남은 시간 5초!")

### 좀비팡이 명시적으로 채택하는 5가지

1. **게임은 *끝난다*** — 무한 retention 추구하지 않음 (5챕터 50층 완주 = 엔딩 = 끝)
2. **매 챕터 종료 시 *정시 퇴근* 버튼 = *계속하기*와 동등 가중치**
3. **상승 보너스만, 페널티는 0** (Daily Streak 끊겨도 도장은 흐려질 뿐)
4. **가챠 가변은 카드 외부에만** (Layer 2 한정 — 인테리어 재건 순서, 골드 폭증 ×5 1~3%)
5. **Notification·광고·FOMO 트리거 0**

---

## Decision

### 결정 1: B급 코믹 호러 톤

- **네온 핑크 (`#FF2D87`) / 라임 그린 (`#C5E90B`)** + **비통한 코미디 (melancholic slapstick)**
- *Plants vs Zombies와 Inside 사이, Mike Judge의 Office Space에 더 가까운 자리*
- 좀비 추상화 50% — 인간 실루엣 + 표정 없는 마스크 (ADR-0004 Resolved)
  - 25%: 폭력 정상화 임계 초과
  - 50%: 채택 — *동료의 퇴근*이라는 메시지 유지
  - 100%: 대상 정체성 소거 → 모두에 폭력 가능

### 결정 2: Layer 1 (결정론) vs Layer 2 (가변) 분리

| 영역 | Layer 1 | Layer 2 |
|------|---------|---------|
| 좀비 처치 | 결정론 | — |
| 콤보 / Crit | 결정론 | — |
| Power-up drop rate | 결정론 (Coin Tier 곱셈만) | — |
| 챕터 카드 3장 추첨 | 결정론 균등 | — |
| 사옥 인테리어 재건 순서 | — | 가변 |
| 골드 폭증 ×5 (1~3% 확률) | — | 가변 |

**핵심**: 가변 보상(슬롯머신적 즐거움)은 **카드 외부에만** 둡니다. 카드 자체의 발생 확률은 결정론. 챕터 클리어 = 1회 추첨 = 3장 fan-out (가챠 X).

### 결정 3: Ethics-aware 안티패턴 10개 회피 (Bible §7 박제)

| # | 회피 항목 | 사유 |
|---|----------|------|
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

### 결정 4: MVP Tentative Default (ADR Open 11건)

Phase A에서 결정 못 한 ADR 11건은 MVP에서 **Tentative Default** 적용 후 출시 30일 후 데이터 재검증.

| ADR | Open 항목 | Tentative Default |
|-----|-----------|-------------------|
| ADR-0001 (좀비팡) | Ads Integration | 광고 0개 (MVP 미적용) |
| ADR-0005 | Meta Card Unlock FOMO | 누적 coin 게이트만 (시간 게이트 없음) |
| ADR-0006 | Freeze Frame 600ms Live Signal | 600ms 채택 |
| ADR-0007 | Special Card 10000 Coin 임계 | 10000 채택 (출시 후 5000~10000 조정 가능) |
| ADR-0008 | Power-up Drop Rate 누적 | 곱셈만 (덧셈 금지, Resolved) |
| ADR-0009 | Card Drop Probability | 결정론 균등 |
| ADR-0010 | Floor Narrative | 5챕터 톤 (Bible §2) |
| ADR-0011 | Install Prompt Reactivation | 챕터 1 클리어 후 1회 + 7일 cooldown + 3회 영구 비노출 |
| ADR-0012 | Midnight Cue | 00:00~06:00 첫 실행 시 세션 1회 |
| ADR-CL-0001 | 정시 퇴근 버튼 위치 | 3택 중 가운데 (default highlight 없음) |
| ADR-CL-0002 | 챕터 fail graceful exit 톤 | *"오늘은 여기까지 해도 충분합니다."* |

### 결정 5: 산출물 인용

좀비팡 디자인 결정은 Phase A 산출물을 SSOT로 인용합니다.

- **Bible**: `docs/game-design/bible.md` (4066 단어, 9 섹션)
- **ADR draft 15건**: `docs/adr/draft/ADR-0001~0013-*.md`, `ADR-CL-0001~CL-0002`
- **Consensus 4건**: `docs/debate/{concept, core-loop, meta-juice, pwa-ux}/consensus.md` (합의도 0.786 / 0.86 / 0.87 / 0.87)
- **Research 3건**: `docs/research/{phaser-vite-stack, pwa-mobile, addictive-loop}.md`

---

## Alternatives

| 대안 | 거부 이유 |
|------|----------|
| **무한 retention 게임** (Candy Crush 모방) | 좀비팡 컨셉(번아웃 풍자) 정면 충돌 |
| **가챠 카드 (확률 가변)** | 슬롯머신화 + plays-to-extinction. Bible §7 안티패턴 #4 |
| **Streak 끊김 페널티** (Duolingo 모방) | 상실 회피 = 행동 중독. Bible §7 안티패턴 #1 |
| **Push notification 사용** | FOMO 트리거. Bible §7 안티패턴 #2 |
| **카운트다운 압박 텍스트** ("남은 5초!") | dark pattern. Bible §3 (보스 위협만 사용) |
| **좀비 추상화 25% (사실적)** | 폭력 정상화 임계 초과 |
| **좀비 추상화 100% (도형)** | 대상 정체성 소거 → 모두에 폭력 가능 메시지 위험 |

---

## Consequences

### 긍정적

1. **윤리적 정당성** — 컨셉(번아웃 풍자)과 게임 시스템 일관
2. **출시 후 비판 회피** — Notification 0, 광고 0, 가챠 0
3. **결정론 강제로 TDD 효율** — 카드 추첨, drop rate 모두 property-based test 가능
4. **5챕터 완주 가능** — 무한 retention 아니므로 *"게임이 끝났다"*는 사용자 만족 가능

### 부정적

1. **DAU/Retention 메트릭 낮음** — 무한 retention 게임 대비 짧은 lifecycle (의도)
2. **Monetization 약함** — 광고 0, 가챠 0이라 MVP 수익 모델 한정 (출시 30일 후 재검증)
3. **신규 기여자 학습** — Ethics 10 안티패턴을 사전 학습 필요 (본 ADR로 박제)

---

## 12살 비유

> 좀비팡을 만드는 일은 **점심도시락**을 잘 마무리되게 만드는 것과 같습니다.
>
> - **무한 retention 게임** = *영원히 끝나지 않는 뷔페* (먹다가 지치게 만듦)
> - **좀비팡** = *정해진 양의 도시락* (5챕터 다 먹으면 *맛있었어요*, 끝)
>
> *Streak 페널티* = "오늘 도시락 안 먹으면 *내일도시락 가위표*" 같은 협박.
> *좀비팡 Daily Streak* = "오늘 출근하면 *+20% 코인*". 안 와도 가위표 없음.
>
> *가챠* = 도시락 뚜껑을 열어야 *무슨 반찬인지* 알 수 있는 도시락 (확률 가변).
> *좀비팡 카드* = 메뉴판이 *고정*되어 있고, 챕터 클리어 시 3개 보여주고 1개 고름 (결정론).
>
> 핵심: 좀비팡은 **"플레이어가 원해서 켜는 게임"** 이지, **"streak이 끊길까봐 켜는 게임"** 이 아닙니다.

---

## References

- 본 프로젝트 SSOT: `docs/game-design/bible.md` §1 (컨셉), §3 (Core Loop), §7 (Ethics)
- Phase A consensus 4건: `docs/debate/*/consensus.md`
- Phase A research: `docs/research/addictive-loop.md` (중독성 모바일 게임 + 안티패턴 조사)
- ADR draft 15건: `docs/adr/draft/`
- WHO ICD-11 — Burnout as Occupational Phenomenon (2019)
- Mike Hoye — [Citation Needed: Notifications](https://exple.tive.org/blarg/2017/03/01/citation-needed-notifications/)
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code`
