# Round 1 — Mobile UX Pragmatist

> 페르소나: 모바일 UX 실용주의자 (입력·가독·배터리·portrait 제약)
> 단계: Phase A-2 Meta + Juice 토론 / Round 1
> 입장 강도: 중강 (Juice 카탈로그 적용 한계 검증자)

---

## 핵심 주장

**Juice 카탈로그의 *지면 예산*은 portrait 360×800 (iPhone SE 기준)에서 결정된다.** screen shake 12px는 *상단 HP 게이지 가독성*과
*하단 정시퇴근 버튼 안정성*을 동시에 위협. haptic 다중 펄스는 *손 떨림*과 구분 안 됨. 매트릭스의 수치는 *데스크톱 기준이
아니라 모바일 기준*으로 다시 검증해야 한다.

## 시드 질문별 입장

### Q5. Juice 카탈로그 — 모바일 보강

#### Haptic 한계

- **단일 펄스 vs 패턴 펄스의 한계 = 200ms**. 그 이상은 손 떨림으로 인지.
- Boss kill의 `[80,30,80,30,80]` = 290ms 총 시간 → *한도 초과*. 보강안: **`[100,40,100]` (240ms)**로 축약.
- Combo 5+ `[30,20,30]` (80ms) = 안전 범위. 유지.
- Crit kill 50ms = 단일 펄스, 안전.
- Hit (피격) 100ms 단일 = 안전.

#### Screen Shake 한계

- 12px shake는 720p portrait 기준 *상단 60px HP 게이지가 흔들림*. 사용자가 "보스 HP가 얼마나 남았는지" 인지 못 함.
- 보강안: **shake 영역을 *플레이 영역 only*로 마스킹**. HP 게이지 영역은 shake 50% 감쇠 (6px).
- 또는 *카메라 shake* 대신 *플레이 컨테이너 shake*로 분리.

#### Particle 24 → 6 adaptive

- iPhone SE에서 입자 24개 동시 + screen shake = FPS 45~50 진동. 적응형 6개 강제 전환은 *FPS 50 미만 3프레임 연속*에서 트리거.
- 다운그레이드 신호는 *비가시*: 갑자기 입자가 사라지면 사용자가 인지. 30프레임에 걸쳐 alpha decay로 점진 축소.

#### Freeze frame 600ms

- 600ms 화면 정지는 *전화 옴 / 알림*과 헷갈릴 수 있음. 정지 중에도 *살짝 호흡 (1px scale oscillation)*으로 "라이브" 신호.

#### "팡!" 의성어

- portrait 360px 폭에서 글자 크기 *32~40px*. 굵은 sans-serif + stroke 3px이면 가독.
- 표시 위치 = *처치된 좀비 좌표 위 -40px*. 화면 중앙 고정 금지 (시선 분산).

### Q1. Meta Tree — 모바일 가독성

- 카드 텍스트 = *카드명 16px + 효과 12px + 인테리어 설명 11px* 3줄 한도.
- 카드 110px × 160px (portrait fan-out). 3장 = 가로 330px / 화면 360px = 여유 30px.
- Special 3장의 카드명도 모두 한국어 6자 이하: "자석 범위" / "콤보 유지" / "치명 강화".

### Q7. 카드 unlock UX

- "처음 보는 카드"는 *알림 배지*가 아닌 *카드 자체에 sparkle particle 6p* 1초간. 강제 모달 금지.
- 누적 coin 진행 표시 = *상단 6px 가로 바*. "다음 unlock까지 N coin" 텍스트는 *long-press 시에만 노출*.

### Q2. Daily Streak

- **Option B 찬성**. 단 streak UI는 *앱 첫 화면 카드 1개*로만 노출. 게임 진입 후 강조 금지.
- "오늘 출근 +20%" 배지 위치 = 메인 메뉴 우측 상단 24px × 24px.

### Q3. 가변 Layer 2 범위

- **Option B 찬성**. 카드 가챠 가변은 의사결정 인지 부담 → portrait UX에서 더 치명적.

### Q4. 좀비 추상화 다이얼

- **Option B 유지**. 50% 마스크의 *얼굴 영역 단일 색*은 portrait 가독성에 유리 (작은 sprite 12×12px에서 표정 표현 불가).

### Q6. Power-up drop

- **5% + 보스 30% 확정 찬성**. 단 drop 시 자석 라인 시각화는 *0.3초가 아니라 0.2초* — 모바일 portrait에서 0.3초는 시선 분산.
- Power-up 동시 활성 한도 2개 (difficulty-balancer 제안 동의). 3종 동시 = portrait 컨트롤 책임 분산 임계.

## 비대칭 양보

- Haptic 패턴 축약 (`[80,30,80,30,80]` → `[100,40,100]`)은 *데이터 검증 가능* 항목 — 1% A/B 트랙으로 둘 다 테스트 후 결정.
- Particle 24→6 다운그레이드 임계(FPS<50 3프레임)는 디바이스별 조정 가능.
