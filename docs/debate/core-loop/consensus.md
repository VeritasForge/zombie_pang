# 좀비팡 Core Loop 토론 — Consensus (Phase A-1)

> 작성: 메디에이터 / 단계: Phase A-1 종료
> 입력: 7명 페르소나 × 1라운드 = 7개 입장 문서 (round-1-*.md)
> 결정 방식: 가중 융합 + 자기수정 수렴 신호
> 합의도 점수: **0.86 (86%)** — 잔여 1건은 ADR Open으로 박제 (Q5 dark-pattern-critic 부분 반대)

---

## 1. 5개 시드 질문 — 최종 합의안

### Q1. 단위: 한 세션 = 한 챕터 = 10층 = 60초

**채택**: 1 게임 세션 = 1 챕터 = 10 층 = **60초** (보스 5초 포함, 상한 envelope 68초).

근거 (다각도):

- **compulsion-architect**: 도파민 5단 구조(anticipation→effort→resolution→variable reward→next anticipation)가 60초에 정확히 들어간다. 작은 결정론 사이클 10개 + 큰 가변 보상 1개의 비율이 강박이 아닌 flow를 만든다.
- **game-feel-juicer**: 60초가 *minimum viable juice envelope*. 0.4초 손맛 루프 × 10층 + 챕터 종료 카타르시스 5~10초 = 85/15 황금 레이시오.
- **difficulty-balancer**: 챕터 클리어 확률 ~85%를 위해 60~68초 *유연한 envelope* 권고. 챕터 내 J-curve (1~6층 ~99% / 7~9층 ~96% / 10층 보스 ~94%) → 곱하면 ~85%.
- **meta-progression-strategist**: 한 세션 = 한 *progression beat*. 5번의 의미 있는 선택 = 한 풀런이라는 단순 멘탈 모델.
- **mobile-ux-pragmatist**: 모바일 평균 세션 1분 11초 + 엘리베이터·줄서기 microsession 통계 = 60초가 황금 envelope.
- **narrative-thematist**: 챕터 = 번아웃의 5막 구조. 1~5챕터를 *신입부서 / 영업본부 / R&D / 임원실 / CEO 집무실 + 옥상*에 매핑.
- **dark-pattern-critic**: 60초 강제 압박은 *야근의 정의*가 될 수 있다는 우려. ADR Open 권고 (사용자가 챕터 중간 종료 시 fail이 아니라 *조기 퇴근*으로 리프레임되도록 처리 — 합의안에 반영).

**보강 결정**: 챕터 중 사용자 사망 = 챕터 fail. 단 *fail 직후 정시 퇴근 옵션 노출* → "오늘은 여기까지" 톤으로 리프레임.

---

### Q2. Layer 1/2 transition: 챕터 종료 → 정시 퇴근 화면 → 카드 1장 → 다음 챕터

**채택**: 챕터 종료 후 0.6초 freeze frame → 정시 퇴근 모달 + Layer 2 카드 3장 fan-out → **3장 중 1장 선택** → 다음 챕터 시작.

근거:

- **compulsion-architect**: Layer 1 안에 가변 보상을 섞으면 plays-to-extinction 곡선 발생. 챕터 단위로 *에피소드 컷*을 명확히 끊고 그 끝에서만 가변 허용. 카드 1장 / 3장 중 선택은 의사결정 깊이의 최저 하한.
- **game-feel-juicer**: transition 자체가 reward feel의 80%. 보스 처치 → 0.6초 freeze → desaturate → 사옥 외관 줌아웃 → 한 층 색 채워짐 → 1.2초 후 카드 fan-out (0.15초 stagger).
- **meta-progression-strategist**: 카드 = 이중 매핑. 수치적(stat boost) + 세계관적(11~20층 인테리어 변화). 메타 진행이 *숫자 인플레*가 아닌 *공간의 회복*으로 가시화.
- **mobile-ux-pragmatist**: 카드 3장 = 화면 하단 60% 영역, 가로 배치, 각 카드 ~110px (Fitts's Law 안). 카드 자세히 보기 = tap, 선택 = long-press로 실수 방지.
- **narrative-thematist**: 카드 = *EMP-0427이 동료를 위해 남기는 작은 친절*. "정수기를 켜둔다" "복합기 토너를 갈아둔다" 등 사무 행위로 통일.
- **dark-pattern-critic**: 카드 선택 = 매몰비용 트리거 우려. 보강 결정 — 카드 선택 직후에도 "정시 퇴근" 동일 가중치 제공, 선택한 카드는 *예치 자산*으로 보존.

**보강 결정**: 카드 선택 후에도 다음 챕터 시작 전 *마지막 "정시 퇴근"* 옵션 노출. 카드는 다음 런 시작 시 starting deck에 포함 가능 (영구 손실 없음).

---

### Q3. CEO 보스: 챕터 마지막 5초 = 보스 페이즈, HP 게이지 표시

**채택**: 각 챕터의 **마지막 5초 = CEO 보스 페이즈**. HP 게이지 = 화면 상단 1/6 영역 + 보스 sprite 위 floating 2중 표시. 보스 처치 후 0.6초 freeze frame.

근거:

- **compulsion-architect**: 9층까지 누적 텐션 → 10층 진입 = 해소. *build → release* 도파민 구조. 단 보스 처치 = 챕터 종료 = 정시 퇴근의 *3중 결합*은 0.6초 분리 필수.
- **game-feel-juicer**: 5초를 3-phase로 분할 — telegraph(0~1초, 셰이크 8px) / engagement(1~4초, HP 3등분 + 콤보 SFX) / climax(4~5초, 슬로우모션 0.3배속).
- **difficulty-balancer**: 5초 *확정*이 아닌 "평균 5초, 상한 8초"의 유연 envelope. 챕터 시간 60~68초가 *경직된 게이트*가 아닌 *유연한 envelope*.
- **meta-progression-strategist**: 보스 = 메타 unlock 게이트키퍼. 매 CEO 처치 = 카드 풀에 1티어 추가 (10층→티어1, 20층→티어2, …, 50층→엔딩 + starting deck 선택권).
- **mobile-ux-pragmatist**: 보스 페이즈 진입 시 진동 *짧은 펄스 1회*. 5초 안 다중 진동은 손 떨림과 구분 안 됨. screen shake 진폭 6→4px로 낮춰 HP 게이지 가독성 확보.
- **narrative-thematist**: CEO마다 고유 대사 1줄. 10층 "성과는 어디 있나?" → 50층 "이번 분기 KPI…". 처치 = 그 대사의 종결 = 유해한 명령 종결.
- **dark-pattern-critic**: 카운트다운 압박 텍스트 ("남은 시간 5초!") 금지. 보스 자체 위협만으로 충분.

**보강 결정**: 보스전 시간 = *5~8초 유연 envelope*, HP 게이지 페이즈 3등분 색상 변화.

---

### Q4. 카드 트리: 단일 스탯 / deck 5장 / 3장 중 1장 / 시너지 콤보는 v2

**채택**: MVP v1 = **단일 스탯 부스트 카드 5종 × 3티어 = 15장 풀**. 매 챕터 종료 시 *3장 중 1장 선택*. **시너지 콤보는 v2로 연기**.

근거:

- **compulsion-architect**: 시너지 콤보 = 60초 페이싱 깨먹는 의사결정 비용. 카드 카테고리 색감만 다양화 → *지각된 다양성*만으로 충분.
- **game-feel-juicer**: 의사결정 깊이를 *연출 깊이*로 보상. 카드 등장 시 종이 펄럭 SFX + Y축 12도 회전 + "결재" 도장 SFX.
- **difficulty-balancer**: 카드 5종 × 3티어 = 15장 풀이 50층 끝까지 변별력 유지. 챕터 진행에 따라 티어 unlock 시 *체감 곡선 = 수치 곡선*.
- **meta-progression-strategist**: 단일 스탯도 빌드 다양성 충분. 5장 × 3 = 243개 가능 빌드 (실질 변별력 ~40개). 카드 카테고리(공격/방어/콤보/특수/지원) 미리 색 분류 → v2 시너지 추가 무비용.
- **mobile-ux-pragmatist**: 시너지 콤보 카드의 텍스트 밀도가 portrait 가독성 한계 초과. *단일 스탯이 모바일에 기능적으로 옳다*.
- **narrative-thematist**: 카드명 = "잔업 종료 보고서 작성" / "회의실 예약 취소" / "복도 비상등 점등". *야근 중 작은 저항* 톤 통일.
- **dark-pattern-critic**: 카드 unlock = *한 런 안에서만 누적*, 런 끝나면 starting deck로 리셋. 영구 메타가 가벼울수록 *그만두기*도 가볍다 (Hades 패턴).

**보강 결정**: 카드 풀 15장 = 5 카테고리 × 3 티어. 영구 메타 = starting deck 1장 선택권만, 카드 자체는 런마다 리셋.

---

### Q5. 정시 퇴근 버튼 위치: 챕터 종료 직후 강조 + 메뉴 안 동등 접근

**채택 (수정)**: 권장 결정 "챕터 종료 직후에만 노출"에서 **수정 채택**.

- **챕터 종료 직후 = 메인 강조 노출** (자동 모달, 타이머 dismiss 없음)
- **게임 중 일시정지 메뉴 = "퇴근하기" 동등 가중치 버튼** (회색 텍스트 아님, 일반 버튼)
- **챕터 시작 직전 = "오늘 그만하기" 옵션** (다음 챕터 들어가기 전 마지막 안전판)
- **5층마다 노출 = 채택 안 함** (flow zone 침범)
- **항상 노출 = 채택 안 함** (portrait 화면 부동산 낭비)

근거:

- **compulsion-architect**: 챕터 끝에만 노출 (graceful exit 강조 ≠ 윤리적 — 강조하면 "퇴근 안 하면 손해"의 dark pattern). → **부분 채택**. 메뉴 동등 가중치 추가로 강박 트리거 회피.
- **game-feel-juicer**: 항상 노출 = UI 노이즈로 손맛 죽임. 챕터 끝 2.0초 ease-out fade-in + 책상 정리 SFX + 사무실 불 꺼지는 트랜지션.
- **difficulty-balancer**: 5층마다 = flow zone 침범. 챕터 끝 3택(퇴근/계속/오늘 그만)은 *동일 시각 가중치* — default highlight 없음.
- **meta-progression-strategist**: 메타 기록은 *퇴근해도 보존*. 진행 손실 페널티 = 강박 트리거.
- **mobile-ux-pragmatist**: 챕터 끝 모달 = 타이머 자동 dismiss 없음 (시간 압박 = dark pattern). 백그라운드 진입 시 자동 일시정지 + 30분 내 resume.
- **narrative-thematist**: 챕터 끝 화면 = *새벽 5시 사무실의 정적*. 자막: **"오늘은 여기까지 해도 충분합니다."**
- **dark-pattern-critic**: **부분 반대 → ADR 박제 권고**. (1) 챕터 종료 = 도파민 최고점에 퇴근은 *심리적으로 가장 어려운 선택*. (2) menu 안 *비강조* 텍스트 링크 = 숨김 경계. (3) 5층마다 노출의 retention 효과 실증 미상.

**보강 결정**: 본 결정은 *측정 후 수정 가능한 결정*. MVP 출시 후 *퇴근 버튼 클릭 위치 분포* 데이터로 재검증. **ADR-CL-0001** 박제.

---

## 2. 합의도 점수

| 항목 | 점수 | 근거 |
|---|---|---|
| Q1 단위 | 0.92 | 7명 모두 60초/10층/한 챕터 동의. dark-pattern-critic의 "60초 강제 압박" 우려만 보강 결정으로 흡수 |
| Q2 transition | 0.90 | 카드 1장 / 3장 중 선택 만장일치. 카드 보존 = 매몰비용 회피만 보강 |
| Q3 CEO 보스 | 0.88 | 5초 보스 페이즈 합의. difficulty-balancer의 "5~8초 유연 envelope" 보강 |
| Q4 카드 트리 | 0.91 | 단일 스탯, deck 5장, 시너지 v2 만장일치. 영구 메타 가벼움 (Hades 패턴) 보강 |
| Q5 정시 퇴근 위치 | 0.70 | dark-pattern-critic 부분 반대 — *수정 채택*으로 흡수했으나 ADR Open 박제 |
| **종합** | **0.86** | 목표 0.85 초과 달성. 잔여 불일치 1건은 ADR로 박제 |

---

## 3. 잔여 불일치 — ADR 박제 권고

### ADR-CL-0001 (Open): 정시 퇴근 버튼의 최적 위치

- **결정 후보 A**: 챕터 종료 직후 + 메뉴 안 동등 가중치 (본 합의안)
- **결정 후보 B**: 항상 노출 (dark-pattern-critic 원안)
- **결정 후보 C**: 5층마다 + 챕터 종료 (절충안)
- **상태**: Open
- **재검증 트리거**: MVP 출시 후 30일, *퇴근 버튼 클릭 위치 분포 + 세션 길이 중간값* 데이터로 후보 B/C 재검토

### (선택) ADR-CL-0002 (Proposed): 챕터 fail 시 graceful exit 톤

- **이슈**: 챕터 중 사망 시 *fail 모달*이 아닌 *조기 퇴근 모달*로 리프레임. dark-pattern-critic + narrative-thematist 합동 제안.
- **상태**: Proposed (본 합의안에 보강 결정으로 반영, 별도 ADR 명시 권고)

---

## 4. 다음 단계 (Phase A-2 입력)

본 Core Loop 합의안은 Phase A-2 (Meta + Juice 토론)로 전달:

- **Layer 2 카드 시스템 v1 구체화**: 15장 카드 풀 (5 카테고리 × 3 티어) 디자인 — meta-progression-strategist + narrative-thematist 주도
- **0.4초 손맛 루프 ↔ 60초 챕터 envelope의 juice 예산 분배**: game-feel-juicer 주도
- **챕터 종료 정시 퇴근 화면 톤**: "오늘은 여기까지 해도 충분합니다" 문구 + 새벽 5시 사옥 정적 비주얼 — narrative-thematist 주도

종료.
