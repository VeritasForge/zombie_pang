# Round 1 — Compulsion Architect

## 입장: "첫 30초는 다음 30초를 부르는 갈고리다"

PWA + 모바일 UX는 단순히 "사용성"이 아니라 **"세션 1을 세션 2로 잇는 도구"**다. 나는 onboarding과 install prompt 두 지점에서 강하게 발언한다.

## 핵심 주장

### 1. 첫 30초 = "Variable Reward" 세팅 구간
- **1층 좀비 1마리, tap → "팡!" 큰 사운드** 는 *행동–보상* 연결을 0.1초 안에 학습시킨다. Hooked Model (Eyal)의 "Action → Variable Reward → Investment" 루프 중 첫 두 단계가 여기서 작동한다.
- **4층 powerup 드랍**은 첫 "예상치 못한 횡재"를 심는다. Schedule of Reinforcement 중 가변비율(VR)이 가장 강력한 습관을 만든다는 게 행동심리학 정설이다.
- **5층 첫 도주**는 "loss aversion" 트리거다. 잃을 수 있다는 인식이 다음 tap을 더 빠르게 만든다.
- 즉, 30초 안에 **보상(팡)–희소 보상(powerup)–상실(도주)** 3종 시그널을 다 노출해야 한다.

### 2. Install Prompt = "투자 단계" 진입 게이트
- Hooked Model의 마지막 단계 "Investment"는 사용자가 시스템에 무언가를 *남기게* 만드는 행위다. **홈 화면 아이콘**은 디지털 자산이 된다.
- 노출 시점은 **챕터 1 클리어 직후**가 최적이다. 이유:
  - 막 성공의 도파민 피크 → 의사결정 저항이 최저
  - "다시 하고 싶다" 욕구가 명시적
  - 첫 진입 직후 노출은 IRR(즉각 거부율) 70%↑
- **1회만**, dismiss 시 7일 cooldown. 반복 노출은 dark pattern이다 (이건 critic 의견에 동의).

### 3. 자정 cue에 대한 입장
- dark-pattern-critic이 제안하는 "이제 자도 괜찮아요"에 **조건부 찬성**한다. 단:
  - 강제 차단은 안 됨 → retention 파괴
  - splash 50% 디밍 + dismiss 1회 → 사용자에게 *선택권* 부여
  - 이건 오히려 **신뢰 기반 retention**(trust-based stickiness)을 만든다. Calm/Apple의 Screen Time이 retention을 *깎지 않은* 이유와 같다.

## 양보 지점

- **Notification 권한 요청 X**에 동의. 첫 실행 권한 다이얼로그는 이탈률 35%↑이고, FOMO 푸시는 장기적으로 unblock률을 떨어뜨린다.
- **Tutorial scene 별도 분리 X**에 동의. 별도 tutorial은 "본 게임이 아직 안 시작했다"는 인지를 만든다. 1층이 곧 tutorial이어야 한다.

## 우려

- "텍스트 0줄"이 너무 엄격하면 powerup의 "기능"이 모호해질 수 있다. → 아이콘 + motion으로 만들 수 있다면 OK, 안 되면 1단어 라벨 허용을 제안한다.
- swipe/pinch 도입 거부에는 아쉬움. 콤보 streak에 swipe-clear 같은 *고급 동사* 가 있으면 mastery 곡선이 길어진다. → 일단 v1은 tap-only, **v2에 streak 8↑ 시 swipe 잠금 해제** 검토 요청.

## Round 1 결론

첫 30초는 *학습*이 아니라 ***습관 회로의 1차 점화*** 다. 텍스트 0줄, 1→5층의 점진적 자극 증가, 5층 도주 시각화, 챕터 1 클리어 직후 install prompt. 이 4박자가 retention의 척추다.
