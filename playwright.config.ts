import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  timeout: 90 * 1000,
  webServer: {
    // VITE_ZP_E2E=1 — build 시점에 production bundle로 inline되어 __zp_test__ 훅 노출 게이트를
    // 통과시킨다. e2e 외 일반 preview/배포에서는 unset → 훅 미노출 (cheat 차단).
    command: "VITE_ZP_E2E=1 pnpm build && pnpm preview --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
    timeout: 180 * 1000,
  },
});
