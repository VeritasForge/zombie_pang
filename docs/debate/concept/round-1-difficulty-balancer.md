# Round 1 — difficulty-balancer 독립 제안

> 페르소나: #3 difficulty-balancer
> 핵심 가치: Adaptive spawn, 85% 성공곡선, Flow Theory(Csikszentmihalyi), frustration vs boredom 균형
> 대결 대상: #1 compulsion-architect — "도파민 자극"이 아닌 "도전의 진정성"을 요구

---

## 1. 제안

**좀비팡 컨셉은 "Flow Curve를 가시화한 좀비 생존 게임"으로 정의한다.**

구체 컨셉 명제:

1. **세계관 — "백신 농도"라는 단일 난이도 메타포**
   - 플레이어는 백신 농도를 점진적으로 올려야 하는 면역학자다.
   - 좀비의 강함은 "변이 단계(Mutation Tier)"로 narrative하게 정당화된다. Tier 1(부패형) → Tier 5(적응형)까지 단계별로 등장.
   - 변이 단계는 시각/사운드 디자인으로 즉시 식별 가능해야 한다(Tetris의 블록 색이 즉시 식별되듯).

2. **코어 루프 — "Wave 단위 Flow Zone 측정"**
   - 한 Wave는 60~90초. Wave 종료 시점에 플레이어의 HP·탄약·처치율을 시스템이 측정.
   - 측정 결과를 3개 zone으로 분류: `Boredom(>95% 잔존)` / `Flow(70~95%)` / `Frustration(<70%, 또는 사망)`.
   - 다음 Wave의 spawn rate·변이 비율을 **Adaptive Difficulty Adjustment(ADA)** 알고리즘이 미세 조정한다.

3. **승리 조건 — "Wave 10 클리어 = 85% 플레이어 도달"**
   - Tetris의 "끝없는 낙하"가 아닌, Super Hexagon의 "60초 = 완주"처럼 명확한 단기 목표(Wave 10)를 둔다.
   - 통계적 목표: 신규 플레이어 5세션 내 Wave 10 도달률 85%, Wave 15 도달률 40%, Wave 20 클리어 5% 이하.
   - 이는 **컨셉 단계에서부터 "도달 가능성 곡선"을 게임의 정체성으로 박아 넣는다**는 뜻이다.

4. **Narrative-Mechanic 일관성**
   - 좀비가 "변이"하는 이유 = 플레이어가 백신을 주입할수록 면역 회피 진화가 일어남.
   - 즉, **플레이어의 성공이 곧 난이도 상승의 서사적 원인**이 된다. 이는 frustration을 "내 책임"으로 받아들이게 만든다 — flow 이론의 "통제감(sense of control)" 충족.

---

## 2. 근거

### 2.1 Flow Theory 적용 근거
Csikszentmihalyi의 Flow Theory는 **도전(challenge)과 기술(skill)이 균형을 이룰 때** 몰입이 발생한다고 정의한다. 좀비팡이 단순한 "더 강한 좀비가 나옴" 구조라면 플레이어 기술 성장 곡선과 도전 곡선이 어긋날 가능성이 크다. Adaptive Spawn은 이 어긋남을 실시간 보정하는 유일한 검증된 방법이다(Left 4 Dead의 AI Director가 대표 사례).

### 2.2 "85% 성공곡선"의 정량적 근거
- Nintendo의 내부 디자인 가이드라인(Miyamoto 인터뷰): "처음 만나는 플레이어가 첫 스테이지를 80~90% 클리어해야 다음 도전 의지가 유지된다."
- Riot Games의 매치메이킹 연구: 승률이 50%에서 벗어나 30% 이하로 떨어지면 retention이 급감.
- 좀비팡은 PvE이므로 "Wave 10 = 첫 만족 지점"을 85% 도달 가능하게 설계해야 churn rate를 낮춘다.

### 2.3 컨셉으로 difficulty를 박는 이유
난이도를 "후반 튜닝"으로 미루면 컨셉 자체가 도파민 의존형으로 흘러간다(#1 compulsion-architect의 위험). 컨셉 단계에서 "백신 농도 = 난이도 메타포"를 박아두면, 이후 모든 시스템(상점, 무기, UI)이 이 곡선을 보강하는 방향으로만 설계된다.

### 2.4 모범 사례 매핑

| 게임 | 적용 원칙 | 좀비팡 차용점 |
|------|----------|---------------|
| Tetris | 속도 = 난이도, 단일 변수 | Wave 번호 = 백신 농도 단일 변수 |
| Super Hexagon | 60초 단기 목표, 즉사 | Wave 10 단기 목표, 명확한 실패 |
| Threes! | 단순 규칙, 깊은 의사결정 | 좀비 변이 단계는 단순, 대응 전략은 깊음 |
| Left 4 Dead | AI Director Adaptive Spawn | Wave 종료 시점 ADA 측정 |

---

## 3. 대안 기각 이유

### 3.1 "끝없는 무한 Wave 모드" 기각
- 무한 모드는 플레이어가 "오늘은 어디까지 갈 수 있을까"라는 도파민 루프에 종속된다. 이는 #1 compulsion-architect의 영역이며, flow 이탈을 측정할 명확한 종점이 없다.
- 무한성은 retention을 단기로 끌어올리지만, "성취감의 정점"을 제공하지 못해 14일 이후 retention이 급락한다(Supercell 내부 분석 트렌드).

### 3.2 "플레이어 레벨 = 난이도" 단순 비례 기각
- RPG식 레벨 비례는 grinding을 강요하고, flow zone 측정을 불가능하게 만든다(플레이어가 약해서 진 건지, 시간을 덜 투자해서 진 건지 구분 불가).
- 좀비팡은 **세션 내 실력**만으로 진행되어야 boredom/frustration 측정이 깨끗하다.

### 3.3 "스토리 모드 중심" 기각
- 스토리 강조는 "다음 컷씬 보기 위한 진행"이 동기가 되어 도전감을 희석한다.
- 본 제안의 narrative는 "변이 = 백신 부작용" 한 줄로 압축되며, 그 외 스토리는 환경 디자인(포스터, 음성 로그)으로만 전달.

### 3.4 "랜덤 시드 기반 난이도" 기각
- 순수 랜덤은 운에 의한 frustration(억울함)을 만든다. ADA(Adaptive Difficulty Adjustment)가 측정한 플레이어 상태를 기반으로 한 **유사 랜덤(weighted random)**만 허용.
- 순수 랜덤 시드는 "내가 잘못했다"가 아닌 "운이 나빴다"로 귀인(attribution)을 외부화시킨다. 이는 통제감(sense of control)을 파괴해 Flow zone 진입 자체를 불가능하게 만든다.

### 3.5 "캐릭터 수집/가챠 기반 progression" 기각
- 가챠형 progression은 난이도가 아닌 **소유량**으로 클리어를 결정짓는다. 이는 #1 compulsion-architect가 선호할 구조이나, flow 이론에서 요구하는 "기술 성장 = 도전 극복" 등식을 깨뜨린다.
- 좀비팡은 동일 캐릭터·동일 시작 조건에서 **플레이어 의사결정의 질**만으로 Wave 10을 돌파할 수 있어야 한다. 이것이 Tetris/Threes!가 30년 넘게 retention을 유지한 본질이다.

### 3.6 종합: "도전의 진정성" 확보
위 5개 대안은 모두 "난이도를 우회하는 장치"이다. 좀비팡이 차별화되려면 컨셉 라운드 1에서부터 **"우회 불가능한 도전 곡선"**을 명시해야 한다. 이는 #1 compulsion-architect의 도파민 루프 제안과 직접 충돌할 항목이며, Round 2 토론에서 우선 사수해야 할 지점이다.
