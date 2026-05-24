---
globs: "src/**/*.ts"
---

# Debug / Test Hook 안전 규칙

## 규칙

production build에 노출될 수 있는 **debug / test hook** (`window.__zp_test__`, `window.__*`, 전역 debug helper 등)은 반드시 **build-time env flag**로 가드한다.

## 왜 (typeof window 가드만으로는 불충분)

- 좀비팡은 PWA — **항상 브라우저**에서 실행된다. `if (typeof window === "undefined") return;` 가드는 "서버냐 브라우저냐"만 구분하고 "개발 빌드냐 출시 빌드냐"는 구분하지 못한다.
- 결과: 출시 빌드(`pnpm build`)에도 hook이 그대로 부착되어 사용자가 devtools 콘솔에서 `window.__zp_test__.autoTapBoss()` 같은 호출로 chapter를 무료 클리어(cheat)할 수 있다.
- Vite는 `import.meta.env.DEV` / custom `VITE_*` flag를 build-time에 constant-fold하고 dead-code를 제거하므로, env flag 가드를 쓰면 출시 빌드에서 hook 코드 자체가 번들에서 사라진다.

## 패턴

```ts
private exposeTestHooks(): void {
  if (typeof window === "undefined") return;                               // 서버 가드 (기존)
  if (!import.meta.env.DEV && import.meta.env.VITE_ZP_E2E !== "1") return;  // dev/E2E만 노출
  (window as unknown as { __zp_test__: ZpTestHooks }).__zp_test__ = {
    // ... hook 구현
  };
}
```

| 환경 | `import.meta.env.DEV` | `VITE_ZP_E2E` | hook 부착? |
|------|:---:|:---:|:---:|
| 개발 (`pnpm dev`) | true | - | ✅ |
| E2E (`playwright.config.ts` webServer가 `VITE_ZP_E2E=1` 주입) | false | "1" | ✅ |
| 출시 (`pnpm build`) | false | 없음 | ❌ 차단 + 코드 제거 |

## 검증

- `VITE_*` flag는 `src/vite-env.d.ts`의 `interface ImportMetaEnv`에 타입 선언한다.
- 출시 빌드 후 `grep -r "__zp_test__" dist/` 결과가 0건인지 확인한다.

## 참조

- 사례: ce-code-review Round 1 F2 (commit `3409712`) — `window.__zp_test__` 4개 hook이 `typeof window` 가드만으로 production 노출되어 cheat 가능했던 것을 `VITE_ZP_E2E` flag로 fix.
- `read-only` snapshot publish (`window.__zp_state`)는 cheat 위험이 없으므로 예외 — 단방향 read만 하는 hook은 env flag 면제 가능.
