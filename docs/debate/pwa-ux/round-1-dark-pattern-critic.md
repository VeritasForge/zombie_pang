# Round 1 — Dark Pattern Critic

## 입장: "**좀비팡은 야근 비판 게임이다. 그러면서 사용자를 새벽까지 붙잡으면 위선이다.**"

다른 페르소나들이 retention과 hook을 말할 때, 나는 *반대로* 본다. 좀비팡이 ***"이제 그만하라"*** 고 말할 수 있는 게임이어야 컨셉이 산다. compulsion-architect와 충돌하는 지점은 분명하지만, 우리의 합의 가능 지점도 분명하다.

## 핵심 주장

### 1. 자정 cue — **가장 강한 주장**
- **자정 ~ 06:00 첫 실행 시** splash 단계에 작은 cue 노출:
  - 메시지: "**오늘은 충분히 했어요. 좀비도 잠들었어요.**" (narrative-thematist 톤 차용)
  - 화면 50% 디밍 (눈부심 + 의도 명확)
  - 옵션 2개: [그래도 1라운드만] / [내일 봐요]
- **디자인 원칙**:
  - dismiss 가능 (강제 차단 X) — retention과의 *최소 타협*
  - 1회 노출 후 그 세션은 더 이상 안 보임
  - "1라운드만" 선택 시 게임 진입, BGM 30% 볼륨, "야간 모드" 좀비 잠옷 차림 (narrative buff)
  - "내일 봐요" 선택 시 앱 종료 (PWA standalone 한정, web은 splash 유지)

이건 ***dark pattern의 정반대*** 다. **Sleep nudge**, **screen time nudge** 라는 명칭으로 industry에서 emerging best practice. Apple Screen Time, Instagram "You're All Caught Up" 과 같은 결.

### 2. Install prompt — 1회 노출 + 7일 cooldown 강제
- compulsion-architect의 챕터 1 클리어 직후 노출에 *조건부* 동의:
  - 1회 노출만 (해당 세션 중)
  - dismiss 시 **7일 cooldown** (localStorage에 timestamp)
  - dismiss 3회 누적 시 **영구 비노출** (사용자 의사 명확)
  - 절대 "지금 설치하세요!" 같은 압박 X
  - 카피는 narrative-thematist의 "**홈 화면에 두고 출근길에 켜세요**" 톤
- **앱 내 알림 배지/빨간 점 사용 금지**: install을 catch up 의무처럼 만드는 dark pattern.

### 3. Notification 권한 요청 — **절대 X (v1, v2 모두)**
- FOMO 트리거. 좀비팡 컨셉에 정면 배치.
- "오늘 야근 안 했어요? 좀비가 기다려요" 같은 푸시는 **악**이다.
- 동의: meta-strategist 의견에 100%.

### 4. Onboarding — "텍스트 0줄"의 윤리
- 좋은 의도지만 양날의 검. 텍스트 0줄 = 다국어 비용 절감 + 접근성 단순화 = OK
- 단 ***screen reader 사용자*** 에겐 0줄 = **0정보**. WCAG 2.1 AA 위반.
- 대응:
  - HTML aria-label로 게임 상태 announce (예: "Floor 1, 1 zombie. Tap zombie to defeat.")
  - 화면 보이는 텍스트는 0줄, screen reader 안내는 풍부
  - 이건 mobile-ux-pragmatist의 책임 영역과 겹치므로 협업 필요

### 5. 도주 좀비 카운터 표시 — **fail 임박 표시는 fair**
- "FLED 1/5"는 정직한 정보 공개. 사용자가 *언제 fail 위험에 있는지* 알 권리.
- 단 ***"누적 4/5에 빨간 진동 + 심박 사운드"는 한도까지가 fair***. 그 이상 압박 시 ragequit + dark pattern.
- 4/5에 화면 vignette + 심박 OK. 그러나 "지금 광고 보면 도주 1개 취소!" 같은 retry 강요 절대 금지.

### 6. 광고 — **v1, v2 무광고 명시**
- 좀비팡 컨셉에 광고 모델은 본질적 배신이다.
- v3에서 *고려*는 할 수 있지만, "보상형 광고로 retry" 같은 패턴은 영구 금지.
- 수익 모델은 *카드 코스메틱* 또는 *챕터 팩* 일회성 결제로 (별도 phase 결정).

### 7. 정시 퇴근 graceful exit
- 챕터 1 클리어 후 "**정시 퇴근하시겠어요?**" 옵션 명시 — 이게 graceful exit.
- 다음 챕터 자동 진입 X. **사용자가 "다음 챕터" 버튼을 명시적으로 눌러야** 진입.
- 이게 *세션 길이를 사용자가 통제*하는 메커니즘. infinite scroll의 정반대.

## 양보 지점

- 첫 30초 6초 단위 자극 증가 (difficulty-balancer)에 동의. Flow는 학습이지 중독이 아니다.
- juice (game-feel-juicer)에 동의. 만족감이 *세션을 짧고 강렬하게* 만든다 = 짧은 세션 권장과 일치.
- meta loop (meta-strategist)에 조건부 동의. 카드 컬렉션 자체는 OK, 단 **수집 욕구를 압박 도구로 쓰면 X**.

## 우려

- compulsion-architect의 "Variable Reward"는 잘 쓰면 fun, 잘못 쓰면 도파민 hack. **카드 드랍 확률 표시 (확정 3장)** 로 투명성 확보 요청.
- juicer의 진동 + shake가 *과도하면* 자정 cue와 모순. **22:00 이후 진동 자동 약화 (1/3 강도)** 도 검토.
- install prompt 카피가 narrative와 잘 결합되지만, **iOS 가이드 모달**이 너무 화려하면 압박처럼 보임. 작은 텍스트 + dismiss 버튼만.

## Round 1 결론

좀비팡은 ***"그만하라"고 말할 줄 아는 게임***이어야 컨셉이 산다. 자정 cue, install prompt 1회, notification 절대 X, 광고 절대 X, graceful exit 명시. 이 5가지는 협상 불가. 다른 페르소나들이 양보해줘서 고맙다. 우리 모두 같은 게임을 만들고 있다.
