# 좀비팡 Core Loop 통합 — 60초 envelope × 5챕터

> **Phase A-7 Brainstorm 산출물** — Core Loop, 챕터 구조, transition, CEO 보스 페이싱
> 입력: docs/debate/core-loop/consensus.md (합의도 0.86)
> 출처: Phase A-1 7명 페르소나 × 1라운드 토론

---

## 단위 — 1세션 = 1챕터 = 10층 = 60초

좀비팡의 Core Loop는 **1 게임 세션 = 1 챕터 = 10 층 = 60초 envelope** 단일 단위로 통일된다. 보스 5초 페이즈를 포함하며, 상한은 68초까지 허용한다.

이 60초가 단일 황금 envelope인 이유는 *7명 페르소나가 서로 다른 도메인에서 같은 답에 도달*했기 때문이다:

- **compulsion-architect**: 도파민 5단 구조(anticipation→effort→resolution→variable reward→next anticipation)가 60초에 정확히 들어간다. 작은 결정론 사이클 10개 + 큰 가변 보상 1개의 비율이 강박이 아닌 flow를 만든다.
- **game-feel-juicer**: 60초가 *minimum viable juice envelope*. 0.4초 손맛 루프 × 10층 + 챕터 종료 카타르시스 5~10초 = 85/15 황금 레이시오.
- **difficulty-balancer**: 챕터 클리어 확률 ~85%를 위해 60~68초 *유연한 envelope* 권고. 챕터 내 J-curve (1~6층 ~99% / 7~9층 ~96% / 10층 보스 ~94%) → 곱하면 ~85%.
- **mobile-ux-pragmatist**: 모바일 평균 세션 1분 11초 + 엘리베이터·줄서기 microsession 통계 = 60초가 황금 envelope.
- **narrative-thematist**: 챕터 = 번아웃의 5막 구조.

사용자에게 이것이 의미있는 이유는, **엘리베이터를 기다리는 짧은 시간, 지하철 한 정거장, 점심 줄을 서는 1분**에 한 챕터가 정확히 들어맞기 때문이다. "한 판만 더"가 강박이 아닌 **"한 판이면 끝"**이라는 약속이 된다.

---

## 60초 라운드 시퀀스 — 9층 빌드업 + 5초 보스 + 0.6초 freeze

```
T+0~3s   | 1F  | 좀비 1마리 (basic)        | 학습: tap = 팡
T+3~9s   | 2~3F | 좀비 2~3마리              | 콤보 ×1.5 발동
T+9~14s  | 4F  | 좀비 4 + powerup 드랍      | variable reward 학습
T+14~20s | 5F  | 좀비 5 (+fast 1)          | 첫 도주 + FLED 카운터
T+20~27s | 6~7F | 좀비 6~7 (혼합)          | Flow 진입
T+27~37s | 8~9F | 좀비 8~9 (+tank 1)       | 난이도 peak
T+50~55s | 9F end | "BOSS APPROACHING" cue | 화면 떨림 + 저음
T+55~60s | 10F | CEO 좀비 단일 등장 (5tap) | climax
T+60     | 처치 | 0.6s freeze frame         | 카타르시스
T+60.6~  | 카드 fan-out → 1장 선택 → 다음 챕터 or 정시 퇴근
```

좀비 스폰 rate는 시작 1000ms에서 wave 10(=10층=챕터 끝) 300ms까지 가속한다. zombie lifespan은 2000ms에서 1200ms로 줄어든다. 결과는 **6초 단위 자극 +1**이라는 difficulty-balancer 곡선과 일치한다.

---

## 5챕터 = 5막 — 번아웃의 수직 서사

| 챕터 | 층 | 막 | 누적 DPS | 보스 HP | 예상 클리어율 |
|---|---|---|---|---|---|
| 1 | 1F~10F | 신입부서 | ×1.00 | 1.00× | ~92% |
| 2 | 11F~20F | 영업본부 | ×1.85 | 1.50× | ~90% |
| 3 | 21F~30F | R&D | ×3.10 | 2.25× | ~88% |
| 4 | 31F~40F | 임원실 | ×4.20 | 3.10× | ~87% |
| 5 | 41F~50F | CEO 집무실+옥상 | ×5.36 | 3.84× | ~88% |

5번 곱하면 풀런 클리어 확률 ~85%, difficulty-balancer가 목표한 Flow Zone에 정확히 들어맞는다.

각 막은 **인테리어 비주얼 → narrative 톤 → 좀비 변형 → 카드 메타포**가 일관되게 진행된다. 예를 들어 챕터 3 R&D의 좀비는 카페인 컵을 들고 있고, 카드 보상은 "정수기통 던지기"(Damage T3)와 "회의실 조명 변경"(Crit% Tier별)이 등장한다.

---

## Layer 1 / Layer 2 transition — 챕터 종료 시퀀스

챕터 종료 후 0.6초 freeze frame → 정시 퇴근 모달 + Layer 2 카드 3장 fan-out → **3장 중 1장 선택** → 다음 챕터 시작이다.

```
T+60      | CEO 처치 충돌
T+60.0~0.6 | freeze frame (desaturate 80% + vignette 12%)
T+60.6    | 사옥 외관 줌아웃 + 한 층 색 채워짐
T+61.8    | 카드 3장 fan-out (0.15초 stagger)
T+62.5    | "PUNCH OUT! 17:30" cutscene 1s
T+63.5    | retrospective 1줄 (사용 메커닉 요약)
T+64.5    | install prompt (챕터 1만, 1회) [Android beforeinstallprompt / iOS 가이드 모달]
T+65.5    | 3택: [다음 챕터] / [카드 자세히] / [정시 퇴근 — 오늘 끝]
```

게임 핵심 결정은 **카드는 결정론 풀에서 균등 추첨**된다는 것이다 (ADR-0002 Resolved → Option B). 가챠 가변은 plays-to-extinction 곡선을 생성한다 — Layer 1 안에 가변 보상을 섞으면 사용자가 *멈추지 못한다*. 가변 보상은 **인테리어 재건 순서**와 **매 처치 1~3% 확률로 골드 폭증 ×5배**에만 한정된다.

카드는 *영구 손실 없음* — 한 런 안에서만 누적되고 런 끝나면 starting deck로 리셋된다. Hades 패턴 — 영구 메타가 가벼울수록 *그만두기*도 가볍다.

---

## CEO 보스 — 5초 페이즈의 3단 분할

각 챕터의 마지막 5초가 CEO 보스 페이즈다. HP 게이지는 화면 상단 1/6 영역 + 보스 sprite 위 floating 2중으로 표시된다. 5초는 다음 3-phase로 분할된다:

| Phase | 시간 | 연출 |
|---|---|---|
| Telegraph | 0~1s | 셰이크 8px, "BOSS APPROACHING" 저음 cue |
| Engagement | 1~4s | HP 3등분 색상 변화 (녹 → 황 → 적), 콤보 SFX |
| Climax | 4~5s | 슬로우모션 0.3배속, 마지막 tap에서 0.6초 freeze |

HP 게이지의 페이즈 3등분 색상 변화는 *진행감*을 시각화한다. 5초 안에 5tap을 해야 하므로 콤보 SFX가 *결재 도장 쾅* 톤으로 누적된다.

**카운트다운 압박 텍스트("남은 시간 5초!")는 금지**된다. 보스 자체의 위협만으로 충분하다 — dark-pattern-critic의 우려가 반영된 결과다. 시간 압박을 *명시 텍스트*로 강조하면 야근의 정의가 되어버린다.

CEO마다 고유 대사 1줄이 있다: 10층 *"성과는 어디 있나?"* → 20층 *"회의는 끝나지 않았다"* → 30층 *"우리는 가족이지 않은가"* → 40층 *"이 정도면 다행이다"* → 50층 *"이번 분기 KPI…"*. 처치 = 그 대사의 종결 = 유해한 명령의 종결이다.

---

## Fail / Success — 좀비 도주 5마리 누적 = 챕터 fail

챕터 fail 조건은 단 하나: **좀비 도주 5마리 누적**. 5층에서 첫 도주가 가능해지고, FLED 카운터(*1 / 5*)가 등장한다. 5마리 누적되면 챕터 fail.

단 *fail 모달이 아니라 조기 퇴근 모달*로 리프레임된다 (ADR-CL-0002 Proposed). 자막은 *"오늘은 여기까지 해도 충분합니다."* 새벽 5시 사무실의 정적 비주얼 + 책상 정리 SFX + 사무실 불 꺼지는 트랜지션. dark-pattern-critic + narrative-thematist의 합동 결정이다.

Success도 마찬가지다. 챕터 종료 시 *항상* 3택이 동등 가중치로 제공된다: **계속 / 카드 자세히 / 정시 퇴근**. 챕터 끝 도파민 최고점에 퇴근이 *심리적으로 가장 어려운 선택*이라는 dark-pattern-critic의 지적이 있었기에, 일시정지 메뉴에도 "퇴근하기"가 동등 가중치로 노출된다. *"플레이어가 원해서 켜는지, streak이 끊길까봐 켜는지 구분 불가능하면 후자로 간주하여 폐기"* — 좀비팡의 윤리 원칙이다.
