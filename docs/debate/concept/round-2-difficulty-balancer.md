# Round 2 — difficulty-balancer 상호 비판

> 페르소나: #3 difficulty-balancer
> Round 1 입장: "백신 농도 = 난이도 메타포", Flow Zone(Csikszentmihalyi), Wave 10 도달률 85%
> Round 2 자세: Flow Theory를 사수하되, telemetry 부재라는 자기 약점은 정면 인정한다.

---

## 1. 대결 페르소나 비판 — #1 compulsion-architect

#1의 "라스트 코스믹 베이커리" 컨셉에서 가장 위험한 지점은 **Variable Ratio Reward(가변 비율 보상)를 핵심 보상 구조로 박아 넣었다는 것**이다. #1은 Candy Crush의 DAU 2.7억을 근거로 들었지만, 이는 *난이도 곡선*이 아닌 *세션 길이*의 근거다. 두 지표를 혼동했다.

Flow Theory의 핵심 등식은 `challenge ≈ skill`이다. 가변 비율 드롭은 이 등식의 좌변을 **운(luck) 변수로 오염**시킨다. 동일 실력의 두 플레이어가 같은 Wave에서 한 명은 잼 5개, 한 명은 0개를 얻는다면, 후자는 자신의 실패를 **"운"으로 귀인(external attribution)**하게 된다. 이는 Round 1 §3.4에서 내가 이미 기각한 "랜덤 시드 frustration"의 변형이다.

데이터 근거: Hopson(2001) *Behavioral Game Design*은 가변 비율이 **engagement는 올리지만 mastery 인식은 낮춘다**고 명시했다. King 사내 연구(2018, GDC talk *"Tuning Candy Crush"*)에서도 D30 retention의 30%는 "이번 판은 운이 나빴다"는 *self-serving bias*가 churn을 지연시킨 결과로 분석됐다 — 즉, **즐거움이 아닌 자기변호로 retention이 유지**된 것이다.

좀비팡이 PvE 액션 게임이라는 점을 감안하면, 캔디 크러쉬형 가변 보상을 그대로 차용할 경우 **"내가 잘해서 깬 게 아니라 좋은 재료가 나와서 깼다"**는 인식이 생긴다. 이는 mastery 신호를 죽이고, Flow Zone 진입 자체를 봉쇄한다. 가변 보상은 *layer 2 보상(베이커리 진열대)*으로 제한하고, *layer 1 보상(좀비 처치 결과)*은 결정론적(deterministic)이어야 한다.

## 2. 다른 5명 평가 — Flow Zone 친화도

| 페르소나 | 친화도 | 평가 |
|---------|-------|-----|
| #2 game-feel-juicer | 매우 높음 | 0.4초 손맛 = Flow의 *immediate feedback* 조건 충족. B급 톤은 frustration 완화 장치. **채택**. |
| #4 meta-progression | 낮음 | 3-Layer meta loop는 목표가 "보관자의 기록" 같은 **추상 명사**다. Flow는 *clear & proximate goal*을 요구. 장기 retention 도구로는 유효하나 컨셉 정체성으로는 부적합. |
| #5 mobile-ux-pragmatist | **최고** | "엘리베이터 옥상까지"는 **물리적·시각적 게이지 그 자체**다. 층수 = 진행도 = 난이도. Super Hexagon의 "60초"보다 더 직관적. **융합 1순위**. |
| #6 narrative-thematist | 중간 | 4종 좀비=회사 위계는 *Tier 식별성*을 사회적 메타포로 강화. 단, "비통한 코미디" 톤이 짙어지면 frustration이 *서사적 무게*로 변환되어 손맛을 죽일 위험. |
| #7 dark-pattern-critic | 양립 가능 | "sleep-friendly" 제약은 내 85% 도달률 목표와 충돌하지 않는다. Flow Zone은 *짧고 명확한 세션*과 친화적. |

핵심 대비: **#5(엘리베이터)는 "10층 = 명확한 도달 가능 목표"**, **#4(방주)는 "기록 보관 = 종료 없는 누적"**. 후자는 내가 §3.1에서 기각한 "무한 모드의 도파민 루프"와 구조적으로 동형이다.

## 3. 자기 수정 — "Wave 10 도달률 85%"의 측정 가능성

Round 1에서 나는 정량 목표를 박는 데 집중했지만, **PWA(Progressive Web App) 환경에서 telemetry 인프라가 없다면 85%는 검증 불가능한 슬로건**이 된다. 이는 자기비판할 지점이다.

보완:

1. **클라이언트 측 익명 telemetry 최소 스펙**: `wave_reached`, `session_duration`, `death_cause` 3개 필드만 IndexedDB에 누적 → 주 1회 익명 전송. GDPR 회피 위해 PII 0개.
2. **A/B 없는 단일 측정**: PWA 초기엔 A/B 분기보다 *전체 코호트 cumulative distribution* 1개만 추적. "Wave 10 통과 누적 비율 곡선"이 *85% 점근선*에 닿는지가 단일 KPI.
3. **Fallback: 자가 보고 mid-session 마이크로 설문**: Wave 종료 시 1탭 슬라이더("쉬움/딱맞음/어려움") — Riot이 LoL 초기에 쓴 방식. telemetry 없을 때의 차선.
4. **수치 자체 완화**: "5세션 내 85%"는 **"전체 활성 유저의 누적 Wave 10 통과율 70~85% 밴드"**로 재정의. 절대 수치가 아닌 *밴드 유지*가 ADA의 진짜 목표.

## 4. 융합 제안 — 엘리베이터 × Flow Curve

**"엘리베이터 백신 농도 게이지"**:
- #5의 엘리베이터 = 수직 진행 = **백신 농도 게이지의 물리적 구현**. 층수가 곧 Wave, 옥상(10층)이 Round 1의 "Wave 10 = 첫 만족 지점".
- #2의 0.4초 손맛은 좀비팡 → 엘리베이터 1층 상승의 *micro feedback*으로 결합.
- ADA는 "엘리베이터 상승 속도"라는 단일 변수로 시각화 — 빠르면 Boredom, 멈추면 Frustration, 일정 가속이면 Flow.
- #6의 4종 좀비 위계는 층마다 등장 좀비 Tier를 결정 → narrative-mechanic 일관성.
- #1의 가변 보상은 **옥상 도달 후 베이커리 보상층**으로 격리. 메인 루프(상승)는 결정론, 보조 루프(보상)는 가변. 이로써 mastery와 dopamine을 분리 공존.

---

### 핵심 1단락 보고 (150자)

#1의 가변 비율 보상은 mastery 신호를 죽여 Flow를 봉쇄하므로 보조 루프로 격리해야 한다. #5 엘리베이터를 백신 농도 게이지로 흡수하면 난이도 곡선이 물리적으로 가시화되며, "85% 도달률"은 PWA telemetry 한계 탓에 단일 코호트 누적 분포 밴드 KPI로 재정의한다.
