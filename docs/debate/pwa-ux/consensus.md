# Phase A-3 Consensus — PWA + 모바일 UX

**작성일**: 2026-05-17
**참여 페르소나 (7)**: compulsion-architect, game-feel-juicer, difficulty-balancer, meta-progression-strategist, mobile-ux-pragmatist, narrative-thematist, dark-pattern-critic
**의장**: Mediator
**합의도 점수**: **0.87** (목표 0.85 초과)

---

## 0. 의제 요약

좀비팡 (Off-Clock Pang) 의 PWA + 모바일 UX 9개 시드 질문에 대한 최종 합의.

전제 컨센서스 (A-0 / A-1) 유지:
- 50층 좀비 사옥, 1세션 = 1챕터 = 10층 = 60초 envelope
- 좀비 4종, Meta 카드 15장, 정시 퇴근 graceful exit
- Phaser 3 + TypeScript + Vite + vite-plugin-pwa
- Portrait 강제, 390×844 기준

---

## 1. 9개 시드 질문 — 최종 합의안

### Q1. 첫 30초 onboarding — 텍스트 0줄 가능?

**합의**: **YES, 텍스트 0줄 가능. 단 screen reader용 aria-label은 풍부하게**.

| 구간 | 시간 | 좀비 수 | 신규 메커닉 | Juice cue |
|---|---|---|---|---|
| 1F | 0~3s | 1 (basic) | tap | 첫 "팡!" 6중주 (shake + hit pause + particle + sound + haptic + popup) |
| 2~3F | 3~9s | 2~3 | 콤보 ×1.5 | 콤보 숫자 솟구침, 카메라 미세 줌 |
| 4F | 9~14s | 4 | powerup "커피 자판기" | 자석 hover + 끌어당김 사전 모션 0.3s |
| 5F | 14~20s | 5 (+fast 1) | 첫 도주 가능 | 도주 좀비 상단 fade-out + FLED 1/5 카운터 등장 |
| 6~7F | 20~27s | 6~7 (basic+fast) | 좀비 2종 혼합 | 컬러+형태 동시 시그널 |
| 8F | 27~30s | 8 (+tank 1) | tank 2tap | 첫 tap에 visible crack 시각화 |

**원칙**:
- 별도 Tutorial scene 없음 — 1F가 곧 tutorial
- 텍스트 0줄 (화면) / aria-label 풍부 (screen reader)
- 모든 cue는 motion + sound + 숫자
- 6초 단위 자극 +1 (difficulty-balancer 곡선)

### Q2. 한 손 portrait 조작 — swipe/pinch 도입?

**합의**: **NO. tap-only.**

- 단일 동사 (tap)로 깊이 만들기 (Threes / Flappy Bird 원칙)
- 장갑 낀 손, 만원 지하철, 한 손 사용성 우선
- **hit box 80×80**, visible 64×64 (관대한 적중)
- **좀비 간 최소 거리 96px** 강제 (hit box 충돌 회피)
- fast 좀비는 hit box 90×90 (더 관대)
- **Thumb Zone 분포**: 좀비 스폰 가중치 = 하단 60% (70%) + 중앙 (20%) + 상단 (10%, 도주 전용)
- 상단 safe-area에는 HUD만 (스코어, 층, FLED, 시계)
- v2에서도 swipe 도입 보류. mastery는 *카드 조합 깊이*로 확보.

### Q3. 오프라인 UX

**합의**:
- **첫 로딩 자산 < 3MB** (3G 환경 5~8초 목표)
- precache 우선순위 (vite-plugin-pwa + Workbox):
  1. core JS (Phaser + 게임 코드) — gzip 후 ≤ 800KB
  2. UI atlas — ≤ 200KB
  3. 좀비 4종 + boss 스프라이트 — ≤ 400KB
  4. SFX 5개 (mp3 64kbps) — ≤ 300KB
  5. **BGM은 lazy load** (precache 제외)
- **로딩 화면**: "OFF-CLOCK PANG" 로고 fade-in 0.5s → **"PUNCH IN"** 버튼 (사용자 tap 대기, AudioContext.resume 트리거)
- **오프라인 표시**: 우상단 작은 dot (회색 = online, 황색 = offline). 게임 진행에 영향 없음 (전 기능 오프라인 작동)
- localStorage / IndexedDB에 카드 deck + 진행도 영구 저장

### Q4. Install prompt UX — 언제 노출?

**합의**: **챕터 1 클리어 직후, 카드 3장 선택 후, 1회 노출.**

```
챕터 1 클리어 → "PUNCH OUT!" 17:30 cutscene 1s
  → 카드 3장 fan-out, 1장 선택
  → retrospective 1줄 (사용 메커닉 요약)
  → install prompt (Android beforeinstallprompt / iOS 가이드 모달)
  → "다음 챕터" or "정시 퇴근 (오늘 끝)"
```

**규칙**:
- 1회 노출 (해당 세션 중)
- dismiss 시 **7일 cooldown** (localStorage timestamp)
- dismiss **3회 누적 시 영구 비노출**
- 카피: "**홈 화면에 두고 출근길에 켜세요**" (narrative + 기능)
- iOS 가이드 모달 (Safari beforeinstallprompt 미지원): "[공유] → [홈 화면에 추가]"
- 압박 카피 금지, 배지/빨간 점 금지

### Q5. 접근성

**합의** (WCAG 2.1 AA + Apple HIG + Material 기준):

- **prefers-reduced-motion**: shake/freeze/particle 50% 감쇠 (제거 X)
- **prefers-color-scheme**: dark 강제 (eye strain + 형광 좀비 미감)
- **색약 친화**: 좀비 4종 = **색 + 형태** 동시 시그널 (basic/fast/tank/boss 실루엣 구분)
- **tap target ≥ 44pt** (Apple HIG) / **48dp** (Material)
- **screen reader**: aria-live region에 게임 상태 announce (예: "Floor 5, fled 1 of 5")
- **forced-colors / high contrast**: 좀비 outline 강제 1px black
- **자막**: SFX 시각화 (콤보 텍스트 솟구침, 도주 vignette) — 청각 의존 0

### Q6. iOS Safari 한계 대응

**합의**: 7번 매트릭스 참조. 핵심:
- Vibration API: `typeof navigator.vibrate === 'function'` check, no-op fallback
- Install: meta tag (`apple-mobile-web-app-capable`) + 가이드 모달
- AudioContext: 첫 user gesture (PUNCH IN tap) 에서 `resume()`
- Orientation lock: try-catch, 실패 시 overlay
- Fullscreen: standalone manifest (`display: "standalone"`) 로 우회
- Push: v1 미사용

### Q7. viewport-fit / safe-area

**합의**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1">
```
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  background: #0a0a0f;
}
```
- iOS notch (44pt), Dynamic Island (54pt), home indicator (34pt) 자동 회피
- Phaser canvas는 viewport 전체에 그리되, **게임 좌표는 safe-area inside** 매핑
- HUD (시계, 층 카운터, FLED, 스코어)는 safe-area inset 안에 배치

### Q8. 자정 야간 모드 cue

**합의** (dark-pattern-critic + narrative-thematist 협업):

- 발동: **00:00 ~ 06:00 첫 실행 시** (해당 세션 1회만)
- splash 단계 노출:
  - 메시지: "**오늘은 충분히 했어요. 좀비도 잠들었어요.**"
  - 화면 50% 디밍 + 형광등 절전 모드 미감
  - BGM 30% 볼륨, "야간 모드" 좀비 잠옷 코스메틱 (narrative buff)
- 옵션 2개:
  - [그래도 1라운드만] → 게임 진입
  - [내일 봐요] → standalone PWA 종료 (web은 splash 유지)
- dismiss 1회로 그 세션 종료, 강요 X, 다음 노출은 다음 자정 시간대
- **22:00 이후 진동 자동 1/3 강도** (juicer 양보)

### Q9. 첫 실행 시 권한

**합의**: **Notification 권한 절대 요청 X (v1, v2 모두).**

- 첫 진입 시 권한 다이얼로그 일체 없음 (이탈률 +35% 회피)
- install prompt만 (그것도 챕터 1 클리어 후)
- v3에서도 push notification 도입 보류 — FOMO 트리거가 좀비팡 컨셉과 정면 배치
- Wake Lock 사용 안 함 (60초 세션, 화면 꺼짐 우려 없음)

---

## 2. 첫 30초 User Journey 시퀀스 다이어그램

```
Time   | Event                                  | Juice                    | Cognition
=======================================================================================
0.0s   | Service Worker activate (precached)    | -                        | -
0.0s   | Splash: "OFF-CLOCK PANG" fade-in       | 형광등 깜빡임 1회         | "회사다"
0.5s   | "PUNCH IN" button visible              | pulse 1Hz                | "출근 도장"
T+0    | User tap PUNCH IN                      | click sfx                |
       | → AudioContext.resume()                | -                        |
       | → Floor 1 fade-in                      | LED 카운터 "1F" 점등      | "1층 시작"
T+1    | 좀비 1마리 (basic, 와이셔츠) 등장        | 좀비 walk-in 0.5s         | "적이다"
T+2    | User tap zombie                        | 6중주: hit pause 80ms +  | 학습:
       |                                        | shake 4px + particle    | "tap = 팡"
       |                                        | + 둠+팡 sfx + vibrate   |
       |                                        | + "+100" popup           |
T+3    | 다음 좀비 등장 위치로 카메라 1px 끌림     | 시선 유도 (juice 화살표)  |
T+4    | Floor 2: 좀비 2마리                     | LED "2F"                 |
T+6    | 콤보 ×1.5 발동                          | "×1.5" 솟구침 + 골드      | 학습:
       |                                        | tween                    | "연속 = 보너스"
T+9    | Floor 3 clear                          | LED "3F"                 |
T+9    | Floor 4: 4마리 + powerup 자판기 드랍     | 커피잔 + 자력선 아이콘    |
       |                                        | hover 1.2s 회전          | "뭐지?"
T+11   | 주변 좀비 자석으로 끌리는 사전 모션 0.3s  | -                        | 학습:
       | User tap powerup                       | 에스프레소 sfx + ping +  | "끌어당김"
       |                                        | 전 좀비 흡인 burst       |
T+14   | Floor 5: 5마리 (basic + fast 1)         | LED "5F"                 |
T+15   | fast 좀비 화면 가로질러 빠르게 이동       | 형태 차이로 식별         | "다른 종류"
T+17   | 사용자 1마리 놓침 → 좀비 위로 fade-out  | 빨간 vignette 약하게     | 학습:
       |                                        | + FLED 카운터 "1/5" 등장  | "놓치면 도주"
T+20   | Floor 6~7: 6~7마리                      | LED "6F→7F"              |
T+27   | Floor 8: 8마리 (+tank 1)                | tank 시각: 정장+서류가방  |
T+28   | tank 1tap → visible crack               | crack particle + dust    | 학습:
       | tank 2tap → 처치                        | 폭사                     | "2번 쳐야 함"
T+30   | Floor 8 clear                          | LED "8F", 8/10 진행도     | Flow 진입 완료
       |                                        | (전체 chapter)            |
=======================================================================================
T+30~50: Floor 9~10 전 (난이도 peak)
T+50: "BOSS APPROACHING" cue (화면 떨림 + 저음)
T+55: CEO 좀비 (황금 넥타이) 단일 등장
T+55~60: 5tap 처치 페이즈
T+60: "PUNCH OUT!" 17:30 cutscene 1s
       → 카드 3장 fan-out
       → 1장 선택
       → retrospective 1줄
       → install prompt (1회)
       → [다음 챕터] or [정시 퇴근]
```

### 핵심 5 단계 요약

1. **T+0~1**: PUNCH IN tap (AudioContext resume + 첫 좀비 등장)
2. **T+2**: 첫 "팡!" 6중주 — 행동–보상 회로 점화
3. **T+9~14**: 4F powerup 발견 + 발동 — variable reward 학습
4. **T+14~20**: 5F 첫 도주 + FLED 카운터 — loss aversion 트리거
5. **T+27~30**: 8F tank 등장 — Flow peak 진입, 챕터 클리어 준비

---

## 3. 접근성 체크리스트 (WCAG 2.1 AA)

| # | 항목 | 기준 | 좀비팡 구현 |
|---|---|---|---|
| 1 | **Color contrast** (text vs bg) | ≥ 4.5:1 | dark bg #0a0a0f vs 형광 좀비 ≥ 7:1 |
| 2 | **Tap target size** | ≥ 44×44pt (HIG) | hit box 80×80, visible 64×64 |
| 3 | **prefers-reduced-motion** | shake/particle 감쇠 | 50% 감쇠 (제거 X) |
| 4 | **prefers-color-scheme** | dark 모드 지원 | 항상 dark (강제) |
| 5 | **색약 친화** | 색 + 형태/패턴 | 좀비 4종 색+실루엣 동시 시그널 |
| 6 | **Screen reader** | aria-live, aria-label | "Floor N, fled X of 5" announce |
| 7 | **Caption / 청각 대체** | 시각 cue | 도주 vignette, 콤보 텍스트 솟구침 |
| 8 | **Focus indicator** | tab 가능 요소 outline | PUNCH IN / 카드 / install button 2px focus ring |
| 9 | **Keyboard navigation** | 게임 외 UI | 메뉴/카드 선택 키보드 가능 (Tab + Enter) |
| 10 | **forced-colors mode** | high contrast 모드 | 좀비 1px black outline |
| 11 | **Language attribute** | html lang | `<html lang="ko">` (v1 한국어) |
| 12 | **Error/fail 피드백** | 다중 모달 | fail 시 vignette + sfx + aria-live "Game over" |

**핵심 5개** (체크리스트에서 핵심):
1. tap target 80×80 hit box
2. prefers-reduced-motion 50% 감쇠
3. 색약: 색 + 형태 동시 시그널
4. screen reader aria-live 게임 상태 announce
5. dark mode 강제 + ≥ 4.5:1 contrast

---

## 4. iOS Safari 대응 매트릭스

| # | 기능 | iOS Safari 지원 | 좀비팡 대응 |
|---|---|---|---|
| 1 | **Vibration API** | ❌ 미지원 | `typeof navigator.vibrate === 'function'` check, no-op fallback. Android만 진동. |
| 2 | **beforeinstallprompt** | ❌ 미지원 | meta `apple-mobile-web-app-capable` + 가이드 모달 ("[공유] → [홈 화면에 추가]"). 1회만. |
| 3 | **AudioContext** | ⚠ 첫 user gesture 필수 | PUNCH IN tap에서 `audioContext.resume()`. preload 음원은 silent buffer로 unlock. |
| 4 | **Screen Orientation Lock** | ❌ 미지원 | try-catch `screen.orientation.lock('portrait')`. 실패 시 landscape overlay "세로로 돌려주세요". |
| 5 | **Fullscreen API (iPhone)** | ❌ 미지원 | PWA standalone `display: "standalone"` 로 우회. 홈 추가 후 주소창 없음. |
| 6 | **Web Push (PWA 한정)** | ⚠ iOS 16.4+ 만 | **v1 미사용** (FOMO 회피). 정책상 사용 안 함. |
| 7 | **Service Worker cache 용량** | ⚠ 50MB / 도메인 | 자산 < 3MB 강제. BGM lazy load. |
| 8 | **Wake Lock** | ❌ 미지원 | 60초 세션이라 불필요. 사용 안 함. |
| 9 | **viewport-fit=cover + env()** | ✅ 지원 (iOS 11+) | safe-area-inset-{top,bottom,left,right} padding. |
| 10 | **standalone PWA detection** | ✅ `navigator.standalone` | install 후 분기 로직에 사용. |
| 11 | **status bar style** | ✅ meta tag | `apple-mobile-web-app-status-bar-style=black-translucent`. |
| 12 | **CSS env() safe-area** | ✅ 지원 | notch / Dynamic Island / home indicator 자동 회피. |

**핵심 5개** (대응 매트릭스에서 핵심):
1. Vibration: typeof check + no-op
2. Install: meta tag + 가이드 모달 (beforeinstallprompt 미지원)
3. AudioContext: 첫 tap에서 resume()
4. Orientation: lock 시도 + 실패 시 overlay
5. PWA standalone display + safe-area env()

---

## 5. 페르소나별 합의도 점수

| 페르소나 | 만족도 | 핵심 만족 지점 | 잔여 우려 |
|---|---|---|---|
| compulsion-architect | 0.88 | install 챕터1 클리어 후, 30초 자극 곡선 | swipe v2 보류 (아쉬움) |
| game-feel-juicer | 0.92 | 6중주 juice, dark mode 강제, hit pause | 22시 진동 약화 (수긍) |
| difficulty-balancer | 0.90 | 6초 단위 +1, 5층 도주 5누적, tank crack | tank 인지 부하 (모니터링) |
| meta-progression-strategist | 0.85 | 챕터1 → 카드 → install 시퀀스 | install 7일 cooldown 충분성 |
| mobile-ux-pragmatist | 0.84 | thumb zone, env(), <3MB, iOS 매트릭스 | particle pool 30 한계 강제 필요 |
| narrative-thematist | 0.89 | PUNCH IN/OUT, 커피 자판기, 자정 cue 톤 | 층 텍스트 cue 1단어 허용 협상 |
| dark-pattern-critic | 0.85 | 자정 cue, install 7일, notification 영구 X, 무광고 | 카드 드랍 확률 투명성 명시 필요 |

**평균 합의도: 0.873** → 반올림 **0.87** (목표 0.85 초과 ✅)

---

## 6. 양보 매트릭스 (누가 무엇을 양보했는가)

| 양보 항목 | 양보 페르소나 | 수혜 페르소나 | 사유 |
|---|---|---|---|
| swipe/pinch 도입 보류 | compulsion-architect | mobile-ux-pragmatist | 한 손 portrait 우선 |
| particle pool 30 한계 | game-feel-juicer | mobile-ux-pragmatist | 저사양 60fps |
| 22시 이후 진동 1/3 | game-feel-juicer | dark-pattern-critic | 자정 cue 일관성 |
| 텍스트 0줄 (화면) | narrative-thematist | mobile-ux-pragmatist + dark-critic | i18n + a11y |
| 챕터1 클리어 후 install 1회만 | compulsion-architect | dark-pattern-critic | 비압박 원칙 |
| Notification 영구 비사용 | compulsion-architect | dark-pattern-critic + meta-strategist | FOMO 회피 |
| 자정 cue dismiss 가능 | dark-pattern-critic | compulsion-architect | retention과 최소 타협 |

---

## 7. 미결 항목 (ADR 후속 박제 필요)

1. **카드 드랍 확률 투명성**: 챕터 클리어 시 카드 3장 = 확정. 카드 *내 등급* 확률 표시 여부 → A-9 ADR
2. **수익 모델**: v3 카드 코스메틱 vs 챕터 팩 일회성 결제 → 별도 phase
3. **층별 narrative 텍스트 1단어 허용 (예: 7F "임원실")** → A-9 ADR
4. **dismiss 3회 후 영구 비노출의 사용자 재활성화 경로** → A-9 ADR
5. **자정 cue 시간대 사용자 커스터마이즈 (예: 야간 근무자)** → v2 검토

---

## 8. 최종 메시지

좀비팡은 ***"야근 끝내고 정시 퇴근"*** 알레고리를 PWA + 모바일 UX 전반에 일관되게 짜냈다. 6초 단위 Flow 곡선, 6중주 juice, 한 손 thumb zone, 챕터1 클리어 후 install 1회, 자정 cue, notification 영구 X, 광고 없음. 7명 페르소나가 0.87 합의도로 도달했다.

다음 단계: **Phase A-4 ~ A-6 Research** (Phaser+Vite+Vitest, PWA Workbox/iOS Safari, 중독성 모바일 게임 안티패턴) → **A-7 Brainstorm 통합** → **A-8 Game Design Bible**.

---

**최종 합의도: 0.87 / 1.00** (목표 0.85 초과 ✅)
