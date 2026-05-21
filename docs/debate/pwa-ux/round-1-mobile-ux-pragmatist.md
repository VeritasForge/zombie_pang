# Round 1 — Mobile UX Pragmatist (강한 입장)

## 입장: "이론은 됐고, **실제 손가락으로 지하철에서 돌려본 적 있냐**"

다른 페르소나들이 Flow니 Hook이니 떠드는 동안 나는 한 가지 질문만 던진다. **"이걸 출근길 9호선 만원 지하철에서 한 손으로 돌릴 수 있나?"** 답이 No면 다 다시 짜야 한다. 그리고 *지금 제안*들 중 절반은 No다.

## 강한 발언

### 1. Portrait 강제 = 절대원칙
- 390×844 (iPhone 12~15 기준), 360×800 (Android 중위) 양쪽에서 동시 작동해야 함.
- landscape 회전 시 "회전을 풀어주세요" 오버레이. CSS `screen.orientation.lock('portrait')` 시도하고 실패 fallback (iOS Safari는 lock 미지원 — typeof check 필수).
- Phaser 3 `Scale.FIT` + 9:19.5 ~ 9:20 anchor. 좀비는 viewport 비율 무관 *상대 좌표*로.

### 2. Thumb Zone — 좀비 위치는 **하단 60%에 집중**
- Steven Hoober의 *thumb reach map* (2013) 데이터: 한 손 portrait에서 *easy* 영역은 화면 하단 60%, *natural* 영역은 정중앙. 상단 20%는 *hard*.
- → **좀비 스폰은 하단 60%에 가중치 70%, 중앙 30%, 상단 10%**.
- 상단 10%는 "도주하는 좀비"가 빠져나가는 zone으로만 사용. **plays target은 상단에 두지 않는다**.
- 상단 safe-area에는 HUD(스코어, 층수, FLED 카운터)만 배치.

### 3. Tap target ≥ 44pt (Apple HIG) / 48dp (Material)
- visible 64×64에 hit box 80×80. 동의.
- 단 좀비끼리 *겹치면* hit box 충돌 — 인접 좀비 최소 거리 **96px** 강제. spatial hash로 spawn 시 거리 체크.
- 빠른 좀비(fast)는 hit box 90×90으로 더 관대하게. 작은 화면에서 빠르게 움직이면 못 맞춤.

### 4. Safe Area 대응 — env() 필수
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```
- viewport meta: `viewport-fit=cover, user-scalable=no, maximum-scale=1`
- iOS notch (44pt), Dynamic Island (54pt), home indicator (34pt) 자동 회피.
- Phaser canvas는 safe-area inside 영역에만 게임 좌표 매핑. canvas 자체는 전체 viewport.

### 5. iOS Safari 한계 — **여기가 가장 문제다**

| 기능 | iOS Safari | 대응 |
|---|---|---|
| Vibration API | **없음** | `typeof navigator.vibrate === 'function'` check, no-op |
| Install prompt | **beforeinstallprompt 미지원** | meta tag + 사용자 가이드 모달 1회 ("공유 → 홈 화면 추가") |
| AudioContext | 첫 user gesture 필요 | 첫 tap에 `audioContext.resume()` 호출 |
| Orientation lock | **미지원** | overlay 안내로 대체 |
| Fullscreen API | iPhone 미지원 (iPad만) | standalone PWA로 우회 |
| Push notification | iOS 16.4+ 만 (PWA 한정) | v1에서 사용 안 함 |
| Wake Lock | 미지원 | 짧은 세션이라 불필요 |
| Service Worker 캐시 | 50MB 한계 (도메인당) | 자산 < 3MB 강제 |

### 6. 첫 로딩 < 3MB는 **타협 불가**
- 3G 환경 (지하철 통신 끊김) 전제. 4G 평균 다운로드 3~5Mbps → 3MB = 5~8초.
- precache 우선순위:
  1. core JS (Phaser + 게임 코드, gzip 후 800KB↓)
  2. UI 스프라이트 atlas (200KB↓)
  3. 좀비 4종 + boss 스프라이트 (400KB↓)
  4. SFX 5개 (mp3 64kbps, 합쳐서 300KB↓)
  5. BGM은 ***lazy load*** (precache 제외)
- 총 ~1.7MB 목표. 여유분 1.3MB는 보스 효과 + 카드 아이콘용.

### 7. PWA Manifest 필수 항목
```json
{
  "name": "Off-Clock Pang",
  "short_name": "OFFPANG",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0f",
  "theme_color": "#0a0a0f",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
            { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
            { "src": "/icon-maskable.png", "sizes": "512x512", "purpose": "maskable" }]
}
```

## 양보 지점

- 텍스트 0줄 onboarding에 동의 — 텍스트는 i18n 폭탄이다. 안 쓰는 게 mobile-first.
- swipe/pinch 거부에 동의 — 장갑 낀 손, 만원 지하철, 한 손이면 tap만 가능.

## 우려

- juicer의 particle 폭발 + shake 동시 발생: 저사양 기기 (안드로이드 4년 이상)에서 framedrop. **particle pool 30개 한계, shake 1개 큐** 강제 필요.
- splash 1.3초: 너무 길다. precache 끝나면 즉시 진입 가능해야 함. **로고 0.5s + Press Start (사용자 tap 대기)** 가 옳다. 자동 진입 X — AudioContext resume이 첫 tap에 묶여있기 때문.

## Round 1 결론

**모바일은 이론이 아니라 손가락의 영역이다.** Portrait 강제, thumb zone 하단 60%, hit box 80×80 + 좀비 간 96px, safe-area env(), 자산 <3MB, iOS Safari 한계를 *기본값으로 가정*. 이걸 안 지키면 다른 모든 결정이 무의미하다.
