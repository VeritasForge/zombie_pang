# 좀비팡 Addictive Loop & Dark Pattern 안티패턴 리서치

> **Phase A-6 Research Output** — "50층 좀비 사옥 야근 끝내고 퇴근" 컨셉의 한 손 30~60초 라운드 모바일 게임을 위해, 중독성 있는 모바일 게임의 핵심 메커니즘과 윤리적으로 회피해야 할 dark pattern을 정리한 문서.

---

## 1. Compulsion Loop 이론 (Trigger → Action → Reward → Investment)

### 1.1 Nir Eyal의 Hooked Model

Nir Eyal이 2014년 저서 *Hooked: How to Build Habit-Forming Products*에서 제안한 4단계 루프는 현대 모바일 게임 디자인의 사실상 표준 프레임워크가 되었다. 구성은 다음과 같다.

1. **Trigger (촉발)**: 외부 트리거(푸시 알림, 홈 화면 아이콘)와 내부 트리거(지루함, 불안 같은 감정)가 진입점을 만든다.
2. **Action (행동)**: 보상을 기대하면서 수행하는 가장 단순한 행동. 좀비팡의 "탭 한 번으로 좀비를 친다"가 여기에 해당한다.
3. **Variable Reward (가변 보상)**: 정확히 어떤 보상이 언제 나올지 모르는 불확실성이 도파민 회로를 자극.
4. **Investment (투자)**: 사용자가 시간/노력/데이터를 투입함으로써 다음 사이클을 더 매력적으로 만든다 (Daily streak, 캐릭터 성장 등).

좀비팡은 이 4단계 중 1~3은 적극 채택하되, **Investment 단계에서 "잃을 까봐 무서워서 돌아오는"이 아니라 "다시 만나서 반가운" 투자가 되도록 설계**되어야 한다 (자세한 매핑 표는 6장 참조).

- 출처: [Hook Model | ProductPlan](https://www.productplan.com/glossary/hook-model)
- 비판적 시각: [An Incomplete Loop: A Review of Nir Eyal's Hooked](https://www.thebehavioralscientist.com/articles/an-incomplete-loop-a-review-of-nir-eyals-hooked)

### 1.2 Variable Ratio Reinforcement (Skinner) & 도파민 anticipation

B.F. Skinner의 조작적 조건화 연구에서 가장 강력한 강화 스케줄로 밝혀진 것이 **Variable Ratio Schedule** — 보상이 예측 불가능한 횟수의 행동 뒤에 무작위로 주어지는 패턴이다. 슬롯머신, 가챠, "다음 한 판만 더"의 원리가 모두 여기에 뿌리를 둔다.

신경과학 연구는 **도파민이 보상 자체보다 보상의 anticipation(기대) 단계에서 더 강하게 분비된다**는 점을 밝혀냈다. 즉 "다음 라운드에서 어떤 파워업이 등장할까?"라는 기대 자체가 보상의 본체이다.

좀비팡 적용: **Layer 2 가변 요소(파워업 풀, 미니보스 등장 타이밍)에 한정해서 variable ratio를 적용**하고, Layer 1(좀비 스폰 패턴, 점수 계산)은 결정론으로 둠으로써 "운빨 가챠 슬롯머신"이 아닌 "스킬+가변성"의 건강한 긴장감을 유지한다.

- 출처: [Schedules of Reinforcement (B.F. Skinner Foundation)](https://www.bfskinner.org/wp-content/uploads/2015/05/Schedules_of_Reinforcement_PDF.pdf)
- 출처: [Skinner Box Mechanics and Variable Reward Systems in Digital Products](https://medium.com/design-bootcamp/product-design-and-psychology-the-mechanism-of-skinner-box-techniques-in-video-game-design-5b7315e2d7b4)

### 1.3 Csikszentmihalyi의 Flow Theory

Mihaly Csikszentmihalyi의 Flow Theory는 **"도전(challenge)과 능력(skill)이 균형을 이루는 좁은 통로"** 안에 머무를 때 몰입 상태가 발생한다고 본다. 도전이 능력보다 높으면 불안, 낮으면 지루함이 발생한다.

좀비팡의 적용:
- **Wave가 진행될수록 좀비 스폰 속도와 HP가 조금씩 증가**하는 stair-step difficulty curve.
- 즉시 피드백(콤보 숫자, 화면 흔들림, 점수 가산)으로 "내가 잘하고 있다"는 자각을 매 순간 제공.
- 30~60초 라운드 자체가 한 번의 flow cycle을 완결시키는 구조 — 한 라운드 안에서 도입/긴장/클라이맥스/완결이 마이크로 단위로 모두 일어남.

- 출처: [The relationship between the skill-challenge balance, game expertise, flow and the urge to keep playing complex mobile games (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8943660/)
- 출처: [Flow Theory: S-Tier Designer's Guide — Yu-kai Chou](https://yukaichou.com/gamification-analysis/flow-theory-complete-guide-csikszentmihalyi-optimal-experience/)

---

## 2. 30~60초 마이크로 루프 사례 (모바일 인기 게임)

### 2.1 Candy Crush — 짧은 보드 + 별 3개 + Lives 시스템

Candy Crush의 한 보드는 평균 30~90초이며, 클리어 시 점수에 따라 별 1~3개가 부여된다. 별 3개는 의도적으로 어렵게 설계되어 **재도전 동기**를 만들어낸다. 핵심 dark side는 **lives 시스템** — 5번 실패하면 30분씩 회복 대기, 친구 요청 또는 결제로 즉시 회복.

좀비팡이 배울 점: 별 3개 같은 **선택적 성취 목표** 구조.
좀비팡이 버릴 점: lives gate 같은 **시간 인질 메커니즘**은 완전히 폐기.

- 출처: [Candy Crush Saga: Formula of Addiction](https://medium.com/@gameproducer/candy-crush-saga-formula-of-addiction-2b35f49261d0)
- 출처: [Why Is Candy Crush So Addicting? Game Mechanics — Yu-kai Chou](https://yukaichou.com/gamification-study/game-mechanics-research-candy-crush-addicting/)

### 2.2 Subway Surfers / Temple Run — 죽음 → 즉시 재시작 → 코인 누적

Endless runner 장르의 핵심은 **"한 번의 실수로 죽고, 바로 다음 판"** 의 사이클이다. 죽음과 재시작 사이의 마찰을 거의 0초로 줄임으로써 "한 판만 더" 심리를 극대화. 누적된 코인은 캐릭터/보드/부스터 unlock에 사용된다.

좀비팡 적용: 라운드 종료(정시 퇴근 또는 사망) → 1탭 재시작 → 메타 통화 자동 누적. **단, 메타 통화는 "유리한 시작점"이 아니라 "다른 시작점"을 제공**해야 P2W 함정을 피한다.

- 출처: [Subway Surfers vs Temple Run: Which Endless Runner (2025)](https://www.subwaysrf.com/subway-surfers-vs-temple-run/)

### 2.3 Hot Streak Game Design

"연속 성공 보너스" 메커니즘. 좀비를 연달아 처치하면 콤보 카운터가 상승하고, 일정 임계값을 넘으면 화면 효과가 극적으로 강화된다. 실패하면 카운터 리셋. 좀비팡의 콤보/광폭화 시스템이 여기에 해당.

---

## 3. Meta Progression 패턴

### 3.1 Roguelite — Hades vs. Slay the Spire

- **Hades (Supergiant Games)**: 메타 통화를 모아서 영구적인 능력 강화를 구매하는 "heavy meta progression". 실패해도 다음 시도가 점점 쉬워지므로 진입 장벽이 낮음.
- **Slay the Spire**: 메타 progression이 매우 절제되어 있음. 새 카드/유물의 unlock 정도만 풀리고, 능력치 자체는 영구 강화되지 않음. 순수 스킬 기반.

좀비팡은 **Slay the Spire에 가까운 미니멀 meta progression**을 채택한다. 영구 능력치 강화 대신 **"새로운 파워업 풀의 잠금 해제"** 와 **"미니보스 스킨"** 같은 호기심 기반 unlock에 한정. 그래야 신규 유저와 누적 유저 사이의 격차가 벌어지지 않고 P2W 압력도 차단된다.

- 출처: [Roguelite Games With The Best Progression Systems — GameRant](https://gamerant.com/roguelite-games-with-best-progression-systems/)

### 3.2 Vampire Survivors — 시너지/덱빌딩

매 라운드 시작 시 무작위로 등장하는 파워업 중 선택하며 빌드를 쌓아간다. 특정 무기 + 패시브 조합이 진화(evolution)하면 전혀 다른 강력한 효과로 변신. **선택의 자유 × 무작위 등장 × 진화 비밀**의 3요소 시너지가 핵심.

좀비팡 Layer 2 가변 요소가 이 모델을 차용 — 결정론 점수 위에 가변 파워업이 얹혀서 "이번 판은 다르게 풀려볼까?"의 호기심을 매 라운드 자극.

- 출처: [Vampire Survivors Design Analysis | How Power Fantasy Creates Addictive Gameplay](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)

### 3.3 Idle/Clicker — Prestige System

Cookie Clicker 등은 "리셋하고 다시 시작 = 더 강한 곱셈 효과"를 주는 prestige 메커니즘으로 무한 루프를 만든다. 좀비팡은 이 모델을 **채택하지 않는다** — 무한 진행은 "퇴근하지 않는 야근"의 메타포가 되어 컨셉과 충돌한다.

---

## 4. Juice & Game Feel 베스트 프랙티스

### 4.1 Jan Willem Nijman "The Art of Screenshake"

Vlambeer의 공동 창업자 Jan Willem Nijman이 INDIGO Classes 2013에서 발표한 전설적 토크. 같은 게임을 시작점(아무 효과 없음) → 사운드 추가 → 적 HP 조정 → 더 큰 탄환 → 0.2초 hit-stop → screen shake → 파티클 → 후속 임팩트 사운드 순으로 단계별로 보여주며 **"어떻게 같은 코드가 전혀 다른 게임처럼 느껴지는가"** 를 시연했다. 좀비팡의 폴리시 단계 체크리스트의 원전.

- 출처: [Jan Willem Nijman - Vlambeer - "The art of screenshake" (YouTube)](https://www.youtube.com/watch?v=AJdEqssNZ-U)
- 출처: [The Art of Screenshake — Thoughts from a Game Design Student](https://victorweidar.wordpress.com/2016/10/06/the-art-of-screenshake/)

### 4.2 핵심 기법 조합 (Vlambeer Nuclear Throne / Downwell)

| 기법 | 설명 | 좀비팡 적용 |
|---|---|---|
| **Hit-stop (Hit pause)** | 강한 타격 시 0.05~0.2초 전체 프레임을 정지 | 미니보스 처치 시 0.15초 hit-stop |
| **Screen shake** | 카메라를 짧고 거칠게 흔들기 | 콤보 임계값 돌파 시 단계적으로 증폭 |
| **Particle burst** | 적 폭사 시 파티클 다발 | 좀비 처치 시 핏빛 픽셀 파티클 |
| **Hit lag / squash & stretch** | 캐릭터의 일순간 변형 | 플레이어 캐릭터 공격 모션 부풀림 |
| **Layered SFX** | 동시에 여러 사운드 레이어를 겹쳐 임팩트 강화 | 타격 SFX = 본체 + 잔향 + 무기 메탈음 |
| **Haptic feedback** | 진동으로 촉각 보상 | iOS Taptic Engine, Web Vibration API |

> 주의: 과도한 "juice"는 오히려 인지 부담과 시각 피로를 유발할 수 있다. Wayline의 비판처럼 **"juice가 콘텐츠 부재의 보철 도구로 전락하면 안 된다"**. 좀비팡은 콤보 임계값별로 강도를 단계적으로 증폭하는 식의 절제된 적용을 원칙으로 한다.

- 출처: [The "Juice" Problem: How Exaggerated Feedback is Harming Game Design — Wayline](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design)
- 출처: [Juice in Game Design: Making Your Games Feel Amazing — Blood Moon Interactive](https://www.bloodmooninteractive.com/articles/juice.html)

---

## 5. Dark Pattern 안티패턴 (페르소나 #7 입력 — 매우 중요)

### 5.1 WHO Gaming Disorder 분류 (2019, ICD-11)

WHO는 2019년 ICD-11에 **Gaming Disorder**를 정식 등재했다. 12개월 이상 다음 3가지 기준이 지속될 때 진단된다.

1. **Impaired control over gaming** (게임 통제력 상실)
2. **Increasing priority given to gaming over other activities** (다른 활동보다 게임 우선 격상)
3. **Continuation or escalation despite negative consequences** (부정적 결과에도 지속/확대)

좀비팡은 **이 3가지 요소를 적극적으로 유도하지 않는 설계 원칙**을 채택한다 — 특히 "Graceful exit (정시 퇴근)"는 통제력을 게임이 빼앗지 않겠다는 선언적 장치이다.

- 출처: [WHO — Gaming disorder (Q&A)](https://www.who.int/standards/classifications/frequently-asked-questions/gaming-disorder)
- 출처: [Gaming disorder in the ICD-11: the state of the game (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12640003/)

### 5.2 F2P 슬롯머신 메커니즘 (가챠)

2024년 3월 22일부터 **한국은 게임산업진흥법 개정안 시행으로 모든 유료 확률형 아이템의 확률 공시가 법적 의무**가 되었다. Nexon은 메이플스토리 확률 조작 건으로 116억 원의 과징금을 부과받았다. 일본은 "콤프 가챠" 만 금지하고 나머지는 자율 규제. 유럽은 더 강한 규제 흐름.

좀비팡은 **가챠/유료 확률형 아이템 자체를 도입하지 않는다**. 결정론 Layer 1 + 가변 Layer 2 구조는 "다음에 뽑힐 무기"가 아니라 "다음 라운드에서 만날 상황"의 가변성이며, 결제와 연결되지 않는다.

- 출처: [Compliance of mobile games with newly adopted loot box probability disclosure law in South Korea (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12583229/)

### 5.3 FOMO / Sunk Cost / Loss Aversion 자극

- **FOMO 자극**: 한정 시간 이벤트, 시즌 패스, "이번 주에만!" 배지 등. 플레이어의 휴가/근무 시간에도 로그인을 강제.
- **Sunk Cost fallacy 자극**: "지금 그만두면 진행도가 사라집니다" 같은 협박성 메시지.
- **Loss aversion 악용**: 일일 보상을 "획득"이 아니라 "잃지 않으려면 로그인"으로 프레이밍.
- **Streak 죄책감**: 99일 streak가 깨질 위기에서 플레이어를 정서적으로 인질화.

좀비팡의 streak는 **상승 보너스만 적용** — streak가 깨져도 페널티는 없다. 단지 다음 streak를 시작할 뿐이다.

- 출처: [Gaming the mind: Unmasking 'dark patterns' in video games — Policy Review](https://policyreview.info/articles/news/unmasking-dark-patterns-video-games/1739)
- 출처: [Dark Patterns in Video Games: Why Developers Use Them — Jason Grant Holt](https://medium.com/@jason.grant.holt/dark-patterns-in-video-games-why-developers-use-them-5c331f192e7d)

### 5.4 Dark UX 패턴 (게임 외 영역에서도 차용된 안티패턴)

- **Confirm Shaming**: "정말 떠나시겠어요? 게임은 당신의 유일한 즐거움이었는데..." 같은 죄책감 유도 메시지
- **Roach Motel**: 가입은 쉽지만 탈퇴는 매우 복잡
- **Forced Action**: 광고/리뷰 요청을 강제로 보게 함
- **Trick Questions**: "동의하지 않으려면 체크해제" 같은 이중 부정
- **Hidden Costs**: 무료 시도가 자동으로 결제로 전환

- 출처: [Dark pattern — Wikipedia](https://en.wikipedia.org/wiki/Dark_pattern)
- 출처: [7 Dark Patterns in UX Design: A Guide To Ethical Design](https://uxplaybook.org/articles/ux-dark-patterns-and-ethical-design)

### 5.5 좀비팡이 명시적으로 회피할 안티패턴 10가지

| # | 안티패턴 | 이유 |
|---|---|---|
| 1 | 가챠/유료 확률형 아이템 | 슬롯머신 심리, 법적 리스크 |
| 2 | Lives / Energy / Stamina gate | 시간 인질, "기다리거나 결제" 압박 |
| 3 | Pay-to-Win 영구 능력치 강화 | 신규 유저 진입장벽, 스킬 가치 훼손 |
| 4 | Streak 깨짐 페널티 | 죄책감 유도, 강박적 로그인 |
| 5 | 한정 시간 이벤트로 인한 강제 로그인 | FOMO 악용, 자율성 침해 |
| 6 | "지금 그만두면 진행도 손실" 협박 메시지 | Sunk cost fallacy 악용 |
| 7 | 광고/리뷰 강제 시청 | Forced action |
| 8 | 탈퇴/계정 삭제 경로 은닉 | Roach motel |
| 9 | 푸시 알림으로 죄책감/긴급성 유발 | "친구가 당신을 기다립니다" 류 |
| 10 | 무한 진행 / prestige 강박 루프 | "퇴근 못 하는 야근"과 컨셉 정면 충돌 |

---

## 6. 좀비팡 적용 매핑 표 (채택 ↔ 회피)

| 디자인 결정 | 채택한 압축성 패턴 (출처 장) | 회피한 dark pattern |
|---|---|---|
| 한 손 30~60초 라운드 | Flow micro-cycle (§1.3), Candy Crush 보드 길이 (§2.1) | Lives gate (§5.5-2) |
| 결정론 Layer 1 점수 계산 | 스킬 기반 성취감 (§3.1 Slay the Spire 모델) | 가챠 확률 조작 (§5.2) |
| 가변 Layer 2 (파워업, 미니보스) | Variable Ratio (§1.2) + Vampire Survivors 시너지 (§3.2) | 유료 확률형 아이템 (§5.5-1) |
| Daily streak — 상승 보너스만 | Investment 단계 (§1.1), Hot Streak (§2.3) | Streak 깨짐 페널티 (§5.5-4) |
| Graceful exit "정시 퇴근" | Mindful break (§7), Csikszentmihalyi의 완결 cycle (§1.3) | 무한 prestige 루프 (§5.5-10) |
| 콤보/Hit-stop/Screen shake 폴리시 | Vlambeer juice 4기법 (§4.2) | 과도한 juice의 인지 부담 (§4.2 주의) |
| 미니멀 meta progression | Slay the Spire (§3.1) — 풀 unlock만 | P2W 영구 강화 (§5.5-3) |
| 광고 0, IAP 0 (MVP) | — | 가챠, 한정시간 이벤트, Forced ad (§5.5) |

---

## 7. 윤리적 게임 디자인 사례 (좀비팡 윤리관의 레퍼런스)

### 7.1 의식적 끊기 cue

- **Fortnite / Roblox**: 부모 통제 + 휴식 알림 통합
- **YouTube "Remind me to take a break"**: 일정 시간 후 휴식 권장 팝업
- **Google Digital Wellbeing의 Mindful Nudge**: 강제가 아닌 권유 톤의 알림

좀비팡 적용: **Graceful exit "정시 퇴근"**은 단순한 종료 버튼이 아니라 **"오늘은 잘 일했어요"** 같은 긍정 톤의 메시지로 마무리. 라운드 종료 시 항상 "더 할까요?" 와 "정시 퇴근" 을 동등한 가중치로 제공.

- 출처: [Google's Digital Wellbeing — Mindful Nudge feature](https://dharab.com/googles-digital-wellbeing-app-to-get-a-mindful-nudge-feature/)
- 출처: [Designing for Digital Wellbeing — Bentley University](https://www.bentley.edu/centers/user-experience-center/designing-digital-wellbeing)

### 7.2 비판 정신의 계보 — Jonathan Blow, Frank Lantz

- **Jonathan Blow** (*Braid*, *The Witness* 제작자): "소셜 게임은 플레이어로부터 최대한 빼앗으면서 최소한만 돌려주려 한다 — 그래서 비윤리적이다"라고 직격. 게임 디자이너가 어떤 강화(reinforcement)를 플레이어에게 제공하는지 의식적으로 사고할 것을 촉구.
- **Frank Lantz** (NYU Game Center 디렉터, *Universal Paperclips* 디자이너): 클리커 게임의 메타-비평으로 "중독성 메커니즘에 의식적으로 노출시키는" 풍자적 게임을 만듦.

좀비팡은 두 사람의 비판 정신에 동의하며, **"플레이어가 게임을 끝낼 시점을 게임이 결정하지 않는다"** 를 핵심 원칙으로 삼는다.

- 출처: [Jonathan Blow interview: "social game designers' goal is to degrade the players' quality of life" — PC Gamer](https://www.pcgamer.com/jonathan-blow-interview-social-game-designers-goal-is-to-degrade-the-players-quality-of-life/)

### 7.3 Platform 통합

좀비팡은 **iOS Screen Time / Android Digital Wellbeing의 앱 시간 제한을 적극 존중**한다. 별도의 자체 시간 제한 기능을 무리하게 만들기보다, 플랫폼 표준 위에서 잘 동작하도록 한다. 푸시 알림은 **opt-in 기본값** 으로 설정하고, "다시 보지 않기" 옵션을 confirm-shame 없이 제공.

---

## 핵심 5개 Takeaway

1. **Variable Reward는 채택하되 가챠가 아닌 가변 파워업으로** — Layer 1 결정론 + Layer 2 가변성으로 스킬 보존
2. **Meta progression은 Slay the Spire식 미니멀하게** — 영구 능력 강화 없이 unlock만, P2W 차단
3. **Juice는 단계적으로 절제 적용** — Vlambeer 4기법(hit-stop/shake/particle/SFX layered)을 콤보 임계값에 따라
4. **Streak는 상승 보너스만, 페널티 없음** — FOMO/sunk cost/loss aversion 3대 dark pattern 동시 차단
5. **Graceful exit는 컨셉이자 윤리 선언** — "정시 퇴근"은 플레이어 자율성 존중의 핵심 메타포
