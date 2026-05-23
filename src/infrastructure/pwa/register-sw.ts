// register-sw — vite-plugin-pwa의 virtual:pwa-register 모듈 래퍼.
//
// 타입 alias는 함수 본문 밖으로 추출 — esbuild가 `typeof import("...",)`의 trailing comma를
// 파싱 못하는 이슈가 있어 함수 안에서 직접 쓰면 빌드/테스트가 깨진다.
//
// autoUpdate 모드(vite.config.ts)에서 새 SW 발견 시 자동으로 reloadPage 호출 가능.
// dev 환경(import.meta.env.DEV=true)에서는 SW 등록을 skip한다 — vite-plugin-pwa의
// devOptions.enabled: false 설정과 정책 일치 (개발 중 캐시 간섭 방지).
//
// 등록 실패는 게임 동작에 영향을 주지 않는다 (offline 미지원으로 graceful degrade).

type PwaRegisterModule = typeof import("virtual:pwa-register");

/**
 * Dynamic import 함수. 기본 구현은 vite build에서만 resolve되는 virtual module을 import한다.
 * 테스트에서는 fake importer를 주입하여 success 경로를 검증한다.
 */
export type PwaModuleImporter = () => Promise<PwaRegisterModule>;

const defaultImporter: PwaModuleImporter = () => {
  // @vite-ignore: vite-plugin-pwa의 virtual module은 production build에서만 resolve.
  const moduleId = "virtual:pwa-register";
  return import(/* @vite-ignore */ moduleId) as Promise<PwaRegisterModule>;
};

export interface RegisterSWHandlers {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
}

export interface RegisterSWOptions {
  /**
   * 명시적 dev 플래그. 미지정 시 `import.meta.env.DEV`를 사용한다.
   * 테스트에서 vitest stubEnv 한계를 우회하려면 명시 주입한다.
   */
  isDev?: boolean;
  /**
   * 명시적 ServiceWorker 지원 여부. 미지정 시 navigator를 확인한다.
   */
  hasServiceWorker?: boolean;
  /**
   * 동적 import 어댑터. 테스트에서 virtual module을 fake로 대체할 때 주입한다.
   * 미지정 시 실제 vite-plugin-pwa virtual module을 시도한다.
   */
  importer?: PwaModuleImporter;
}

export async function registerServiceWorker(
  handlers: RegisterSWHandlers = {},
  options: RegisterSWOptions = {},
): Promise<void> {
  const isDev = options.isDev ?? import.meta.env.DEV;
  if (isDev) {
    // 개발 모드는 의도적 skip (vite-plugin-pwa devOptions.enabled=false와 일치).
    return;
  }
  const hasSW =
    options.hasServiceWorker ?? (typeof navigator !== "undefined" && "serviceWorker" in navigator);
  if (!hasSW) {
    // SSR / 구형 브라우저: SW 미지원 → no-op.
    return;
  }
  const importer = options.importer ?? defaultImporter;
  try {
    const mod = await importer();
    mod.registerSW({
      immediate: true,
      onNeedRefresh() {
        handlers.onNeedRefresh?.();
      },
      onOfflineReady() {
        handlers.onOfflineReady?.();
      },
      onRegisteredSW(_swScriptUrl, registration) {
        handlers.onRegistered?.(registration);
      },
      onRegisterError(error) {
        handlers.onRegisterError?.(error);
      },
    });
  } catch (error) {
    // virtual module 미존재 또는 등록 자체 실패. graceful no-op.
    handlers.onRegisterError?.(error);
  }
}
