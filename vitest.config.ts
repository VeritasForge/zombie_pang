import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@domain": resolve(__dirname, "src/domain"),
      "@application": resolve(__dirname, "src/application"),
      "@adapters": resolve(__dirname, "src/adapters"),
      "@infrastructure": resolve(__dirname, "src/infrastructure"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    include: ["src/**/*.{test,prop.test}.ts", "tests/unit/**/*.test.ts"],
    exclude: ["node_modules", "dist", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.prop.test.ts",
        "src/main.ts",
        "src/adapters/phaser/**",
        "src/infrastructure/container.ts",
        // Port interface 파일은 런타임 코드가 없어 v8 coverage가 0%로 잘못 측정함.
        "src/domain/ports/**",
        // Type-only re-export (ZombieInstance) — 런타임 코드 없음.
        "src/application/zombie-instance.ts",
      ],
      thresholds: {
        // Phase별 커버리지 매트릭스 (Master Plan §1.2)
        "src/domain/**/*.ts": {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        "src/application/**/*.ts": {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        "src/adapters/persistence/**/*.ts": {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        "src/infrastructure/!(container).ts": {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
        "src/shared/**/*.ts": {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
});
