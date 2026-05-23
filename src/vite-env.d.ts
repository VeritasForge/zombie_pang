/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /**
   * Playwright E2E 환경에서만 `"1"`로 주입되는 flag. production build를 preview server로
   * serve하는 e2e 환경(playwright.config.ts webServer)에서도 __zp_test__ 훅을 노출하기 위해
   * 사용. 일반 `pnpm preview` 또는 사용자 브라우저에서는 미정의 → 훅 미노출.
   * 절대 외부에 노출되어선 안 되며, build 환경변수 주입 외 경로로 set 금지.
   */
  readonly VITE_ZP_E2E?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
