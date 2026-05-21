# PWA + 모바일(iOS Safari) 리서치 (Phase A-5)

> **목적**: 좀비팡 게임을 PWA로 셋업하기 위해 `vite-plugin-pwa` + Workbox 조합과 iOS Safari 한계, 모바일 UX(safe-area, 접근성), Lighthouse 90+ 기준을 정리한다.
> **범위**: 코드 셋업 단(C-7 Infrastructure) 진입 직전 의사결정을 위한 근거 문서.

---

## 1. vite-plugin-pwa 옵션 완전 가이드

### 1.1 registerType — autoUpdate vs prompt

| 옵션 | 동작 | 추천 시나리오 |
|------|------|--------------|
| `autoUpdate` (좀비팡 선택) | 새 SW(Service Worker) 감지 시 자동으로 `skipWaiting + clientsClaim` 후 페이지 새로고침. 사용자 개입 0 | 폼 입력이 없는 게임/콘텐츠 사이트 |
| `prompt` (기본값) | `onNeedRefresh` 콜백 → 사용자에게 "업데이트하시겠습니까?" 모달 표시 후 수락 시 reload | 폼/에디터처럼 데이터 손실 위험이 있는 앱 |

좀비팡은 세션 도중 폼 입력이 없고, 신선한 밸런스 패치를 즉시 반영해야 하므로 **`autoUpdate`** 채택. 단, 게임 플레이 중에 강제 reload가 일어나면 UX가 깨질 수 있으니 `registerSW({ immediate: true })` 호출은 `idle` 시점 또는 메인 메뉴 진입 시점에만 트리거하도록 가드한다.

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  plugins: [VitePWA({ registerType: 'autoUpdate', devOptions: { enabled: true } })]
})
```

출처: [Vite PWA — Auto Update](https://vite-pwa-org.netlify.app/guide/auto-update.html), [Prompt for new content](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html)

### 1.2 strategies — generateSW vs injectManifest

| 전략 | 특징 | 좀비팡 적합도 |
|------|------|---------------|
| `generateSW` (기본) | 플러그인이 SW 코드 자동 생성. Workbox 옵션을 선언적으로 작성 | ✅ MVP에 최적. 코드 작성 0 |
| `injectManifest` | 직접 SW 작성. `precacheAndRoute(self.__WB_MANIFEST)` 만 필수 | 푸시 알림, 백그라운드 동기화 등 고급 기능 필요 시 |

좀비팡은 단순 캐싱만 필요하므로 **`generateSW`** 채택. 향후 push notification(iOS 16.4+ 한정)이 필요해지면 `injectManifest`로 전환한다.

출처: [Vite PWA — injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest.html)

### 1.3 workbox 옵션 (generateSW 기준)

```ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,json,mp3,ogg}'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB (게임 atlas 대비)
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|webp|svg)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'zp-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }
        }
      },
      {
        urlPattern: /\.(?:mp3|ogg)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'zp-audio',
          rangeRequests: true,
          cacheableResponse: { statuses: [0, 200, 206] }
        }
      }
    ]
  }
})
```

핵심 포인트:
- `globPatterns`: 빌드 산출물 중 precache 대상. 좀비팡 자산(atlas PNG, 효과음 mp3/ogg)을 모두 포함
- `maximumFileSizeToCacheInBytes`: 기본값(약 2MB)을 넘는 atlas가 있으면 빌드 경고 → 0.20.2 이상부터 에러로 격상되므로 **명시적으로 5MB**로 올린다
- `rangeRequests: true`: 오디오 스트리밍에서 `206 Partial Content` 응답 캐싱 허용 (iOS 미디어 요청 대응)

출처: [Vite PWA — Workbox Getting Started](https://vite-pwa-org.netlify.app/workbox/), [Issue #626 runtimeCaching](https://github.com/vite-pwa/vite-plugin-pwa/issues/626)

### 1.4 manifest 설정

```ts
manifest: {
  name: '좀비팡 Zombie Pang',
  short_name: '좀비팡',
  description: '60초 한 판, 좀비를 터트려라',
  theme_color: '#0a0a0a',
  background_color: '#0a0a0a',
  display: 'standalone',       // iOS standalone 모드
  orientation: 'portrait',     // 세로 고정
  start_url: '/',
  scope: '/',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
  ]
}
```

- `display: 'standalone'`: 주소창 없는 풀스크린 모드. iOS는 manifest 표준을 부분 지원하므로 별도로 `<meta name="apple-mobile-web-app-capable" content="yes">` 도 병행
- `purpose: 'maskable'`: Android adaptive icon(원형/사각형 마스크) 대응. 안전 영역 80% 비율을 지키는 SVG 권장
- `theme_color`: HTML `<meta name="theme-color">` 와 반드시 일치 (Lighthouse 검사 항목)

출처: [Vite PWA — Minimum Requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements)

---

## 2. Workbox 캐시 전략

### 2.1 Precache vs Runtime Cache

- **Precache**: 빌드 시점에 `__WB_MANIFEST` 로 주입. SW install 단계에서 일괄 다운로드. 버전 해시 기반이라 변경 시 자동 갱신
- **Runtime Cache**: 런타임 fetch 가로채서 전략에 따라 캐시. CDN 자산, API 응답에 적합

좀비팡은 빌드 산출물(JS/CSS/스프라이트)은 precache, 외부 폰트/리더보드 API는 runtimeCaching으로 처리.

### 2.2 전략 매트릭스 (게임 자산 매핑)

| 자산 유형 | 추천 전략 | 이유 |
|----------|-----------|------|
| JS 번들 / index.html | **Precache** (자동) | 버전드 해시. 오프라인 부팅 필수 |
| 이미지 atlas (PNG/WebP) | **CacheFirst** | 거의 변하지 않음. 네트워크 호출 최소화 |
| 오디오 (mp3/ogg) | **CacheFirst** + rangeRequests | 동일. 단 `206` 응답 허용 필요 |
| 밸런스 JSON (원격 hot-fix) | **StaleWhileRevalidate** | 빠른 응답 + 백그라운드 갱신 |
| 리더보드 API | **NetworkFirst** | 항상 최신, 오프라인 시 fallback |
| 광고/분석 핑 | **NetworkOnly** | 캐시하면 안 됨 |

### 2.3 Expiration 정책

```ts
expiration: {
  maxEntries: 60,                    // 캐시 항목 수 상한
  maxAgeSeconds: 30 * 24 * 60 * 60,  // 30일
  purgeOnQuotaError: true            // iOS 50MB 쿼터 초과 시 자동 정리
}
```

iOS는 **7일 미사용 시 캐시 자동 만료** + **총 50MB 쿼터**라는 강한 제약이 있다. `purgeOnQuotaError: true`로 LRU 정리를 활성화해야 SW가 깨지지 않는다.

### 2.4 skipWaiting + clientsClaim

- `skipWaiting()`: 새 SW가 `waiting` 단계를 건너뛰고 즉시 활성화
- `clientsClaim()`: 활성화 즉시 열린 모든 탭의 컨트롤을 새 SW가 가져감
- 두 옵션 함께 켜야 `autoUpdate` 가 의도대로 동작. 단 게임 도중 reload 위험은 위에서 언급한 idle 가드로 완화

출처: [Workbox — Caching strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies), [Workbox — Runtime caching](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime)

---

## 3. iOS Safari 한계 (게임 PWA 관점)

### 3.1 Web Audio Context — 첫 user gesture 필수

iOS Safari는 `AudioContext`를 자동 재생 정책에 따라 `suspended` 상태로 생성한다. 반드시 첫 사용자 입력(touch/click) 핸들러 안에서 `resume()` 호출.

```ts
const ctx = new AudioContext()
const unlock = () => {
  if (ctx.state === 'suspended') ctx.resume()
  document.removeEventListener('touchend', unlock)
}
document.addEventListener('touchend', unlock, { once: true })
```

**추가 함정**:
- 디바이스 무음/진동 모드에서는 Web Audio 자체가 음소거됨 → HTMLAudioElement 라우팅 fallback 고려
- iOS 26 PWA에서 SW로 audio 재생 시 화면 잠금 시 음원 중단 버그가 보고됨 (2026년 기준 미해결)

출처: [MagicBell — PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [Matt Montag — Unlock Web Audio](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)

### 3.2 Vibration API — 사실상 미지원

iOS Safari는 `navigator.vibrate`를 공식 미지원. iOS 18에서 일시적으로 노출됐다가 18.4에서 user gesture 요구로 회귀했다. 반드시 feature detection 후 호출.

```ts
function haptic(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
  // iOS fallback 없음 — 시각/오디오 큐로 보완
}
```

출처: [LambdaTest — Vibration API Browser Compat](https://www.lambdatest.com/web-technologies/vibration-safari), [ios-vibrator-pro-max OSS](https://github.com/samdenty/ios-vibrator-pro-max)

### 3.3 Install Prompt — 자동 미노출

Chrome의 `beforeinstallprompt` 가 iOS에는 없다. **사용자에게 수동 안내**가 필수:

> 하단 공유 버튼 → "홈 화면에 추가" 탭

iOS Safari 감지 + `display-mode: standalone` 체크 후 안내 토스트를 띄운다.

```ts
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
if (isIOS && !isStandalone) showAddToHomeScreenGuide()
```

### 3.4 Apple 전용 메타 태그

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="좀비팡">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
```

`black-translucent`는 상태바 영역을 콘텐츠가 덮을 수 있게 해주며, 노치 디자인과 잘 어울린다. 단 `viewport-fit=cover`와 safe-area padding을 반드시 동반해야 한다.

출처: [Apple — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

### 3.5 localStorage / ITP 제약

iOS Safari ITP(Intelligent Tracking Prevention): **7일간 사이트 미방문 시 localStorage/IndexedDB 데이터 삭제**. 좀비팡의 메타 진행도(코인, 도전과제)는 손실 위험.

**대응**:
- 메타 데이터 백업 export/import 기능 (사용자가 코드 복사)
- 향후 익명 계정 + Firebase/Supabase 동기화 고려 (Phase D 이후)
- 매 로그인 시 lastSeen 갱신은 ITP 갱신에 도움이 안 됨 → 사용자 명시 동의 필요

### 3.6 Service Worker scope 제한

- SW 파일이 위치한 경로 하위로만 scope 적용. `/sw.js`는 전체 사이트 가능
- iOS는 standalone PWA가 SW를 별도 컨텍스트로 실행하기 때문에 Safari 탭과 캐시가 분리됨

---

## 4. viewport / safe-area / notch

### 4.1 viewport-fit=cover

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
```

`viewport-fit=cover` 없이는 `env(safe-area-inset-*)` 가 모두 0으로 평가되어 letterbox(검은 띠)가 생긴다.

### 4.2 safe-area CSS

```css
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
}
#game-root {
  padding-top: max(0px, var(--sat));
  padding-bottom: max(0px, var(--sab));
}
.bottom-controls {
  /* 홈 인디케이터(34pt) 회피 */
  bottom: max(8px, env(safe-area-inset-bottom));
}
```

### 4.3 Phaser canvas resize 패턴

```ts
const config: Phaser.Types.Core.GameConfig = {
  scale: {
    mode: Phaser.Scale.FIT,            // 비율 유지 letterbox
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-root',
    width: 720,
    height: 1280                       // 9:16 세로
  }
}

scene.scale.on('resize', (gameSize) => {
  // UI 재배치 (점수판, 일시정지 버튼 등)
})
scene.scale.on('orientationchange', (o) => {
  if (o === Phaser.Scale.LANDSCAPE) showRotatePrompt()
})
```

`FIT` 모드는 안전하지만 노치/홈바 영역까지 캔버스가 침범할 수 있다. `parent` DOM에 safe-area padding을 주고 그 안에서 Phaser가 FIT 하도록 설계한다.

출처: [Phaser — Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager), [CSS-Tricks — The Notch and CSS](https://css-tricks.com/the-notch-and-css/)

---

## 5. 접근성 (모바일)

### 5.1 prefers-reduced-motion

흔들기/플래시/카메라 셰이크 같은 "juice"는 전정장애·편두통 유발 가능. 시스템 설정 존중.

```css
@media (prefers-reduced-motion: reduce) {
  .juice-shake { animation: none !important; }
}
```

Phaser 측에서는 다음과 같이 분기.

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!reduceMotion) cameras.main.shake(120, 0.01)
```

### 5.2 prefers-color-scheme

좀비팡은 다크 톤 단일 테마지만, manifest `theme_color` 와 라이트/다크 분기 (`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">`)를 두어 PWA 표시줄 색을 맞춘다.

### 5.3 색약 대응

- 좀비/플레이어/파워업 구분을 색상에만 의존하지 않기 — 형태/아이콘/패턴 병행
- 적/아군 구분은 최소 색상 명도 대비 4.5:1 이상
- WCAG 1.4.1 (Use of Color): 정보 전달의 유일 수단으로 색 사용 금지

### 5.4 Tap target ≥ 44pt

Apple HIG / WCAG 2.5.5: **터치 타깃 최소 44×44pt** (Android는 48dp). 좀비팡의 모든 버튼은 시각 크기와 무관하게 hit-area를 44pt 이상으로 확장.

```ts
button.setInteractive(new Phaser.Geom.Rectangle(-22, -22, 44, 44), Phaser.Geom.Rectangle.Contains)
```

### 5.5 Screen reader (VoiceOver) 호환

게임 캔버스는 SR 친화적이지 않음. **HUD/메뉴는 DOM 레이어로 분리**하고 `aria-label`, `role="button"`을 부여. 메인 메뉴/설정/도움말 화면은 반드시 DOM 기반으로 구현.

출처: [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [LogRocket — Accessible Touch Targets](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)

---

## 6. Lighthouse PWA 점수 90+ 체크리스트

| 항목 | 요구 | 좀비팡 상태 |
|------|------|------------|
| **Installable** | manifest + SW + HTTPS | ✅ vite-plugin-pwa 자동 |
| `manifest.name` / `short_name` | 모두 존재 | ✅ |
| `manifest.icons` | 192x192 + 512x512 PNG 필수 | ✅ + maskable SVG |
| `manifest.start_url` | 유효 경로 | ✅ `/` |
| `manifest.display` | `standalone` 또는 `fullscreen` | ✅ `standalone` |
| `theme_color` 일치 | `<meta>` ↔ manifest | ✅ |
| Service Worker | registered + fetch 핸들러 | ✅ generateSW |
| HTTPS | 프로덕션 필수 (localhost 예외) | 배포 시 확보 (Netlify/Cloudflare Pages) |
| `apple-touch-icon` | 180x180 권장 | ✅ |
| viewport meta | `width=device-width` 포함 | ✅ |
| Maskable icon | Android adaptive 대응 | ✅ |
| Offline fallback | SW가 `/` 응답 가능 | ✅ precache |
| `<title>`, description | 존재 | ✅ |

**검증 명령**:
```bash
pnpm build && pnpm preview &
npx lighthouse http://localhost:4173 --preset=desktop --view
npx lighthouse http://localhost:4173 --emulated-form-factor=mobile --view
```

출처: [Chrome — Installable Manifest](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest), [DigitalApplied — PWA 2026 Guide](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide)

---

## 7. 결론

좀비팡 PWA 셋업은 `vite-plugin-pwa(generateSW + autoUpdate)` 를 기본축으로 잡고, 게임 자산은 `CacheFirst + expiration`, 원격 데이터는 `StaleWhileRevalidate`로 분리한다. iOS Safari는 Vibration/Install prompt가 막혀 있고 ITP로 메타 데이터가 7일에 휘발될 수 있으므로 **시각·오디오 큐와 백업 export**로 보완해야 한다. Safe-area는 `viewport-fit=cover` + `env()` 필수이며, 접근성은 `prefers-reduced-motion`/44pt tap target/DOM HUD 분리로 챙긴다. Lighthouse 90+는 manifest 필드 + maskable icon + HTTPS만 갖추면 자동 달성된다.
