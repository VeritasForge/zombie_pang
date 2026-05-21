# ADR 0005: PWA 전략 — vite-plugin-pwa + Workbox + autoUpdate + iOS Safari 한계 매트릭스

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: Phase A-5 Research (`docs/research/pwa-mobile.md`) + Project Owner

---

## Context

좀비팡은 **PWA 단일 배포 + 첫 로딩 5초 + 오프라인 전 기능 + 모바일 portrait 강제** 요구사항을 가집니다.

### 제약

- **첫 로딩 자산 < 3MB** (Bible §6)
- **번들 < 1.5MB gzip** (Master Plan §1.1)
- **Service Worker cache 한도 (iOS)**: 50MB/도메인
- **iOS Safari**: Vibration / Install prompt / AudioContext / Orientation lock / standalone display 각각 별도 처리 필요
- **Notification 권한 영구 비요청** (Bible §6 + §7 안티패턴 #2)
- **외부 자산 0** — Phaser Graphics + Web Audio 합성음만

---

## Decision

### 5개 결정

1. **vite-plugin-pwa 0.20+** (Workbox 기반 PWA 자동 등록)
2. **registerType: `autoUpdate`** (사용자 promp 없이 새 SW 자동 적용)
3. **strategies: `generateSW`** (`injectManifest` 비채택, custom SW 불필요)
4. **precache 자산 < 3MB** (`globPatterns` 좁힘)
5. **iOS Safari 5개 핵심 graceful fallback** 강제

### vite.config.ts (요약)

```ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        cleanupOutdatedCaches: true,
        runtimeCaching: [], // 외부 fetch 0 (정적 PWA)
      },
      manifest: {
        name: '좀비팡',
        short_name: 'ZombiePang',
        description: '50층 좀비 사옥에서 야근을 끝내고 옥상까지 올라가 퇴근하라',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FF2D87',
        background_color: '#0a0a0f',
        start_url: '/',
        lang: 'ko',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
```

### Manifest 사양 (필수 필드)

| 필드 | 값 | 사유 |
|------|-----|------|
| `name` | "좀비팡" | App 설치 시 표시명 |
| `short_name` | "ZombiePang" | 홈 화면 아이콘 아래 (12자 이하) |
| `display` | `standalone` | 브라우저 chrome 제거, 게임 몰입 |
| `orientation` | `portrait` | 한 손 조작 강제 (Bible §6) |
| `theme_color` | `#FF2D87` (neon-pink) | iOS status bar tint |
| `background_color` | `#0a0a0f` | Splash screen 색 (Bible §8) |
| `start_url` | `/` | PWA 진입점 |
| `lang` | `ko` | (`<html lang="ko">`와 동기, Bible §6 접근성) |
| `icons` | 192, 512, maskable 512 | Android maskable + iOS apple-touch-icon |

### iOS Safari 한계 매트릭스 (5개 핵심)

| # | 항목 | iOS 한계 | 좀비팡 대응 |
|---|------|----------|------------|
| 1 | **Vibration API** | iOS Safari 미지원 (typeof undefined) | `typeof navigator.vibrate === 'function'` 가드 + no-op fallback (`infrastructure/haptic/vibration-api.ts`) |
| 2 | **beforeinstallprompt** | iOS Safari 미발생 (이벤트 없음) | meta tag (`apple-mobile-web-app-capable`) + 가이드 모달 ("[공유] → [홈 화면에 추가]") |
| 3 | **AudioContext autoplay** | iOS는 user gesture 후 `resume()` 필요 | `PUNCH IN` (메인 메뉴 → 게임 진입) 첫 tap에서 `audioCtx.resume()` 강제 호출 |
| 4 | **Orientation lock** | iOS Safari `screen.orientation.lock` 미지원 | try-catch + 실패 시 landscape overlay ("세로 모드로 회전해주세요") |
| 5 | **PWA standalone display** | safe-area-inset (notch) 미반영 시 잘림 | `viewport-fit=cover` + `env(safe-area-inset-*)` CSS 적용 |

```css
/* index.html / globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  background: #0a0a0f;
}
```

### Install prompt 정책 (Bible §6)

| 항목 | 값 |
|------|-----|
| 노출 시점 | 챕터 1 클리어 + 카드 선택 후 |
| 노출 빈도 | **1회** |
| Dismiss cooldown | 7일 |
| Dismiss 누적 영구 비노출 | 3회 |
| iOS | 가이드 모달 ("[공유] → [홈 화면에 추가]") |
| 카피 | *"홈 화면에 두고 출근길에 켜세요"* |
| 압박 카피 / 배지 / 빨간 점 | **금지** |

---

## Alternatives

| 대안 | 거부 이유 |
|------|----------|
| **vite-plugin-pwa 없이 custom SW** | Workbox 직접 구성, precache manifest 직접 생성 — 작성 비용 ~3일. 좀비팡 정적 PWA에 과함 |
| **registerType: prompt** | 사용자에게 "업데이트 가능" 토스트 표시. 좀비팡은 60초 세션이라 게임 흐름 방해. autoUpdate가 적합 |
| **strategies: injectManifest** | custom SW 직접 작성 가능. 좀비팡은 외부 fetch 0 (정적), runtime caching 불필요 — generateSW로 충분 |
| **runtimeCaching에 외부 폰트/CDN** | Bible §6 자산 0 정책 위반. 모든 자산은 빌드에 포함 (Pretendard 폰트 inline subset 또는 시스템 폰트만) |
| **WebAPK / TWA 별도 배포** | Android Play Store 등록 절차 필요. MVP는 PWA 단일 배포만 |
| **Wake Lock API 채택** | 60초 세션이라 불필요 (Bible §6 명시) |
| **Notification 권한 요청** | Bible §7 안티패턴 #2 위반. Ethics 박제 |

---

## Consequences

### 긍정적

1. **첫 로딩 < 3MB** — precache 자산 좁힘 + Phaser Graphics + Web Audio 합성음으로 달성
2. **오프라인 전 기능** — Service Worker precache + localStorage 메타로 인터넷 0에서 풀 게임 가능
3. **autoUpdate** — 사용자 promp 없이 새 SW 자동 적용 (게임 흐름 방해 0)
4. **iOS 호환** — 5개 graceful fallback으로 iOS Safari 정상 동작
5. **Ethics 박제** — Notification 미요청, Install prompt 1회만, 압박 카피 금지

### 부정적

1. **iOS Safari `beforeinstallprompt` 부재** — 가이드 모달 작성 추가 비용. 대신 1회만 노출이라 onboarding 부담 적음
2. **maximumFileSizeToCacheInBytes 3MB 제한** — 큰 자산 (예: BGM mp3) 정밀 precache 불가. BGM은 lazy load + IndexedDB 캐시로 우회 (v2)
3. **Service Worker 디버그** — Vite HMR + SW autoUpdate가 dev에서 충돌 가능. `pwa-plugin` `devOptions: { enabled: false }`로 dev 비활성, build에서만 활성

---

## 12살 비유

> PWA는 **점심도시락을 미리 싸두는** 일입니다.
>
> - **vite-plugin-pwa + Workbox** = 도시락 가방 (자동으로 음식 정리해줌)
> - **precache 자산 < 3MB** = 가방에 들어가는 음식 무게 한도
> - **autoUpdate** = 도시락 새 음식 들어오면 *자동으로 교체*. "교체할까요?" 안 물어봄
> - **iOS Safari 5 한계** = 친구 집 도시락 가방은 *조금 작아서* 진동기능/알람기능이 없음. 그래도 *밥은 꺼낼 수 있게* 만들어둠 (graceful fallback)
> - **Notification 영구 비요청** = 도시락 알람 *영원히 안 켬*. "출근할 시간이에요" 같은 알림은 좀비팡 컨셉과 정면 충돌

---

## References

- 본 프로젝트 SSOT: `docs/game-design/bible.md` §6 (PWA & Mobile UX)
- Phase A 조사: `docs/research/pwa-mobile.md`
- vite-plugin-pwa 공식: https://vite-pwa-org.netlify.app/
- Workbox: https://developer.chrome.com/docs/workbox/
- PWA Builder (iOS): https://www.pwabuilder.com/
- web.dev — [Installable PWA](https://web.dev/install-criteria/)
- 본 ADR과 충돌 시 우선순위: `Bible > ADR > Master Plan > Code`
