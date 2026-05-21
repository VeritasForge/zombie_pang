# 좀비팡 PWA + 모바일 UX 통합 — 한 손 portrait의 첫 30초

> **Phase A-7 Brainstorm 산출물** — PWA, 모바일 UX, onboarding, 접근성, iOS 대응
> 입력: docs/debate/pwa-ux/consensus.md (합의도 0.87)
> 출처: Phase A-3 7명 페르소나 × 1라운드 토론

---

## 한 손 portrait, tap-only

좀비팡은 **portrait 강제**, **tap-only**다. 390×844 viewport(iPhone 13 기준)로 설계된다. swipe도 pinch도 없다.

이 단순함이 사용자에게 의미있는 이유는, **장갑 낀 손, 만원 지하철, 한 손 사용성**을 우선시하기 때문이다. *한 손 30초 세션*이 좀비팡의 약속이다. Threes나 Flappy Bird처럼 *단일 동사로 깊이를 만든다* — mastery는 swipe가 아니라 *카드 조합 깊이*로 확보된다.

### Tap target 설계

- **hit box 80×80** (visible 64×64) — Apple HIG 44pt, Material 48dp를 모두 초과
- fast 좀비는 hit box 90×90 (더 관대)
- **좀비 간 최소 거리 96px** 강제 (hit box 충돌 회피)
- **Thumb Zone 분포**: 좀비 스폰 가중치 = 하단 60% (70%) + 중앙 (20%) + 상단 (10%, 도주 전용)

상단 safe-area에는 HUD만 배치된다 (스코어, 층, FLED, 시계). 좀비는 thumb이 자연스럽게 닿는 하단 60% 영역에 70% 가중치로 스폰된다.

---

## 첫 30초 onboarding — 텍스트 0줄

좀비팡은 **별도 tutorial scene 없이** 1F가 곧 tutorial이다. 텍스트는 화면에 0줄이고, screen reader용 aria-label만 풍부하게 제공된다.

### 30초 학습 곡선

| 구간 | 시간 | 좀비 수 | 신규 메커닉 | Juice cue |
|---|---|---|---|---|
| 1F | 0~3s | 1 (basic) | tap | 첫 "팡!" 6중주 |
| 2~3F | 3~9s | 2~3 | 콤보 ×1.5 | 콤보 숫자 솟구침, 카메라 미세 줌 |
| 4F | 9~14s | 4 | powerup "커피 자판기" | 자석 hover + 끌어당김 사전 모션 0.3s |
| 5F | 14~20s | 5 (+fast 1) | 첫 도주 가능 | 도주 좀비 fade-out + FLED 1/5 카운터 |
| 6~7F | 20~27s | 6~7 (혼합) | 좀비 2종 혼합 | 컬러+형태 동시 시그널 |
| 8F | 27~30s | 8 (+tank 1) | tank 2tap | 첫 tap에 visible crack 시각화 |

**모든 cue는 motion + sound + 숫자의 3중 표현**이다. *어떻게 플레이하는지*를 텍스트로 설명하지 않고, *플레이하면서 알게 되도록* 설계되었다. 6초 단위로 자극이 +1씩 증가한다 — difficulty-balancer의 곡선.

이 결정이 사용자에게 의미있는 이유는, **국제화 비용 0**과 **저학력·시각 장애·다국어 사용자 진입 장벽 0**이라는 두 효과를 동시에 내기 때문이다. 텍스트 0줄은 *글로벌 출시의 가장 단순한 길*이다.

---

## PWA 자산 — < 3MB, 오프라인 전 기능

### Precache 우선순위 (vite-plugin-pwa + Workbox)

| # | 자산 | 크기 |
|---|---|---|
| 1 | core JS (Phaser + 게임 코드) | gzip ≤ 800KB |
| 2 | UI atlas | ≤ 200KB |
| 3 | 좀비 4종 + boss 스프라이트 | ≤ 400KB |
| 4 | SFX 5개 (mp3 64kbps) | ≤ 300KB |
| 5 | BGM | **lazy load** (precache 제외) |

**첫 로딩 < 3MB**, 3G 환경에서 5~8초 목표. localStorage / IndexedDB에 카드 deck + 진행도가 영구 저장된다. **전 기능 오프라인 작동** — 우상단 작은 dot(회색 = online, 황색 = offline)만 표시되고 게임 진행에 영향 없음.

### "PUNCH IN" 진입

```
0.0s | Service Worker activate (precached)
0.0s | Splash: "OFF-CLOCK PANG" fade-in (형광등 깜빡임 1회)
0.5s | "PUNCH IN" 버튼 visible (pulse 1Hz)
T+0  | User tap PUNCH IN
     | → AudioContext.resume() (iOS Safari unlock)
     | → Floor 1 fade-in
```

PUNCH IN tap이 두 가지를 동시에 한다 — AudioContext unlock(iOS Safari 첫 user gesture 필수)과 게임 시작. *출근 도장*이라는 메타포가 *기술 제약*과 일치한다.

---

## Install prompt — 챕터 1 클리어 후, 1회만

```
챕터 1 클리어 → "PUNCH OUT!" 17:30 cutscene 1s
  → 카드 3장 fan-out, 1장 선택
  → retrospective 1줄
  → install prompt (Android beforeinstallprompt / iOS 가이드 모달)
  → "다음 챕터" or "정시 퇴근 (오늘 끝)"
```

### 규칙

- **1회 노출** (해당 세션 중)
- dismiss 시 **7일 cooldown** (localStorage timestamp)
- dismiss **3회 누적 시 영구 비노출**
- 카피: *"홈 화면에 두고 출근길에 켜세요"* (narrative + 기능)
- 압박 카피 금지, 배지/빨간 점 금지

iOS Safari는 `beforeinstallprompt` 이벤트를 지원하지 않기 때문에 가이드 모달로 대체된다: *"[공유] → [홈 화면에 추가]"*. 한 번의 컴팩트한 일러스트 + 화살표만으로 충분하다.

이 결정이 의미있는 이유는, **사용자가 게임의 가치를 한 번 확인한 후에야 설치를 권하기** 때문이다. 첫 진입에서 install을 누르라고 하면 *무엇을 설치하는지 모르는 상태에서의 강요*가 된다. 챕터 1을 끝낸 후라면 *판단할 정보*가 있다.

---

## 자정 cue — "오늘은 충분히 했어요"

```
조건: 00:00 ~ 06:00 첫 실행 (해당 세션 1회)
노출: splash 단계
메시지: "오늘은 충분히 했어요. 좀비도 잠들었어요."
화면: 50% 디밍 + 형광등 절전 모드 미감
BGM: 30% 볼륨, "야간 모드" 좀비 잠옷 코스메틱
옵션: [그래도 1라운드만] / [내일 봐요]
```

dismiss 1회로 그 세션 종료, *강요 없음*, 다음 노출은 다음 자정 시간대다. **22시 이후 진동은 자동 1/3 강도**로 줄어든다.

dark-pattern-critic + narrative-thematist의 협업 결정이다. 자정 cue는 사용자를 *추궁*하지 않고 *안부를 묻는다*. 사용자가 "그래도 1라운드만"을 누르면 그 선택은 존중된다 — 단지 게임이 *조용해질 뿐*이다.

---

## 권한 정책 — Notification 영구 비사용

좀비팡은 **Notification 권한을 절대 요청하지 않는다** (v1, v2, v3 모두). 첫 진입 시 권한 다이얼로그 일체 없음 — 이탈률 +35%를 회피하기 위한 결정이다.

푸시 알림이 없는 이유는 더 깊다. *FOMO 트리거가 좀비팡 컨셉과 정면 배치*되기 때문이다. *"좀비들이 당신을 기다리고 있어요!"* 같은 알림은 좀비팡이 거부하는 모든 것이다.

광고도 없다 (ADR-0001 Open이지만 MVP는 광고 없음 가정). Wake Lock도 사용 안 함 — 60초 세션이라 화면 꺼짐 우려가 없다.

---

## 접근성 — WCAG 2.1 AA

| # | 항목 | 기준 | 좀비팡 구현 |
|---|---|---|---|
| 1 | Color contrast | ≥ 4.5:1 | dark bg #0a0a0f vs 형광 좀비 ≥ 7:1 |
| 2 | Tap target | ≥ 44×44pt | hit box 80×80 |
| 3 | prefers-reduced-motion | shake/particle 감쇠 | 50% 감쇠 (제거 X) |
| 4 | prefers-color-scheme | dark 모드 지원 | 항상 dark (강제) |
| 5 | 색약 친화 | 색 + 형태/패턴 | 좀비 4종 색+실루엣 동시 시그널 |
| 6 | Screen reader | aria-live, aria-label | "Floor N, fled X of 5" announce |
| 7 | Caption / 청각 대체 | 시각 cue | 도주 vignette, 콤보 텍스트 솟구침 |
| 8 | forced-colors mode | high contrast | 좀비 1px black outline |

**dark mode 강제**가 핵심이다. eye strain 회피와 형광 좀비 미감의 동시 달성. *prefers-color-scheme* 사용자 설정과 무관하게 항상 dark다.

**색약 친화**가 좀비 4종 디자인에 직접 반영되어 있다. 색만 다른 게 아니라 *실루엣*도 다르다 — basic(작은 원), fast(가는 원), tank(큰 사각형), boss(거대 원 + 후광).

---

## iOS Safari 한계 대응

| # | 기능 | iOS Safari | 좀비팡 대응 |
|---|---|---|---|
| 1 | Vibration API | 미지원 | `typeof navigator.vibrate === 'function'` check, no-op fallback |
| 2 | beforeinstallprompt | 미지원 | meta tag + 가이드 모달 ("[공유] → [홈 화면에 추가]") |
| 3 | AudioContext | 첫 user gesture 필수 | PUNCH IN tap에서 `resume()` |
| 4 | Screen Orientation Lock | 미지원 | try-catch + 실패 시 landscape overlay |
| 5 | Fullscreen API | 미지원 | PWA standalone `display: "standalone"` 로 우회 |
| 6 | Web Push | iOS 16.4+ | **v1 미사용** (FOMO 회피 정책) |
| 7 | Service Worker cache | 50MB / 도메인 | 자산 < 3MB 강제, BGM lazy load |
| 8 | viewport-fit=cover + env() | iOS 11+ 지원 | safe-area-inset-{top,bottom,left,right} padding |

### viewport / safe-area 설정

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

iOS notch (44pt), Dynamic Island (54pt), home indicator (34pt)가 자동 회피된다. Phaser canvas는 viewport 전체에 그리되, 게임 좌표는 safe-area inside에 매핑된다. HUD는 safe-area inset 안에 배치된다.

좀비팡의 PWA 설계는 *기술 제약 대응*에 그치지 않고 *기술 제약이 게임 톤과 일치하도록* 설계되었다. 예를 들어 PUNCH IN tap이 AudioContext.resume()을 트리거한다는 사실은 *기술적으로 필요한 동작*이지만 동시에 *출근 도장*이라는 narrative와 정확히 일치한다.
