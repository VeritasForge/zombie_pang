import { describe, expect, it, vi } from "vitest";
import { type PwaModuleImporter, registerServiceWorker } from "./register-sw";

// register-sw 테스트.
// 글로벌 CLAUDE.md TDD 3 카테고리 규칙: [Happy] / [Boundary] / [Error] 각 ≥ 1.
//
// 환경 변수와 navigator는 옵션 파라미터로 명시 주입, virtual module은 importer 옵션으로 대체.

function makeFakeImporter(registerSW: ReturnType<typeof vi.fn>): PwaModuleImporter {
  return async () =>
    ({
      registerSW: registerSW as unknown as typeof import("virtual:pwa-register").registerSW,
    }) as typeof import("virtual:pwa-register");
}

describe("registerServiceWorker", () => {
  it("[Happy] no-ops in dev mode without throwing", async () => {
    const handlers = {
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    };
    await expect(registerServiceWorker(handlers, { isDev: true })).resolves.toBeUndefined();
    expect(handlers.onRegistered).not.toHaveBeenCalled();
    expect(handlers.onRegisterError).not.toHaveBeenCalled();
  });

  it("[Happy] invokes registerSW from virtual module with handler bridge", async () => {
    let capturedOpts: Parameters<typeof import("virtual:pwa-register").registerSW>[0];
    const registerSWFake = vi.fn((opts: typeof capturedOpts) => {
      capturedOpts = opts;
      return vi.fn() as () => Promise<void>;
    });
    const handlers = {
      onNeedRefresh: vi.fn(),
      onOfflineReady: vi.fn(),
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    };

    await registerServiceWorker(handlers, {
      isDev: false,
      hasServiceWorker: true,
      importer: makeFakeImporter(registerSWFake),
    });

    expect(registerSWFake).toHaveBeenCalledTimes(1);
    expect(capturedOpts?.immediate).toBe(true);
    // 콜백 brigde 검증
    capturedOpts?.onNeedRefresh?.();
    capturedOpts?.onOfflineReady?.();
    capturedOpts?.onRegisteredSW?.("sw.js", undefined);
    capturedOpts?.onRegisterError?.(new Error("boom"));
    expect(handlers.onNeedRefresh).toHaveBeenCalledTimes(1);
    expect(handlers.onOfflineReady).toHaveBeenCalledTimes(1);
    expect(handlers.onRegistered).toHaveBeenCalledWith(undefined);
    expect(handlers.onRegisterError).toHaveBeenCalledWith(new Error("boom"));
  });

  it("[Happy] tolerates missing handlers (undefined bridge calls)", async () => {
    let capturedOpts: Parameters<typeof import("virtual:pwa-register").registerSW>[0];
    const registerSWFake = vi.fn((opts: typeof capturedOpts) => {
      capturedOpts = opts;
      return vi.fn() as () => Promise<void>;
    });

    await registerServiceWorker(
      {},
      {
        isDev: false,
        hasServiceWorker: true,
        importer: makeFakeImporter(registerSWFake),
      },
    );
    // 핸들러 미지정이어도 콜백 호출이 throw하지 않아야 한다.
    expect(() => {
      capturedOpts?.onNeedRefresh?.();
      capturedOpts?.onOfflineReady?.();
      capturedOpts?.onRegisteredSW?.("sw.js", undefined);
      capturedOpts?.onRegisterError?.(new Error("x"));
    }).not.toThrow();
  });

  it("[Boundary] no-ops when navigator.serviceWorker is unavailable", async () => {
    const registerSWFake = vi.fn();
    const handlers = {
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    };
    await registerServiceWorker(handlers, {
      isDev: false,
      hasServiceWorker: false,
      importer: makeFakeImporter(registerSWFake),
    });
    expect(registerSWFake).not.toHaveBeenCalled();
    expect(handlers.onRegistered).not.toHaveBeenCalled();
    expect(handlers.onRegisterError).not.toHaveBeenCalled();
  });

  it("[Error] surfaces importer failure via onRegisterError", async () => {
    const handlers = {
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    };
    const failingImporter: PwaModuleImporter = async () => {
      throw new Error("virtual module not found");
    };
    await registerServiceWorker(handlers, {
      isDev: false,
      hasServiceWorker: true,
      importer: failingImporter,
    });
    expect(handlers.onRegisterError).toHaveBeenCalledTimes(1);
    expect(handlers.onRegisterError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it("[Error] tolerates missing onRegisterError handler on importer failure", async () => {
    const failingImporter: PwaModuleImporter = async () => {
      throw new Error("kaboom");
    };
    // onRegisterError 미지정 — 그래도 throw 없이 graceful return.
    await expect(
      registerServiceWorker(
        {},
        { isDev: false, hasServiceWorker: true, importer: failingImporter },
      ),
    ).resolves.toBeUndefined();
  });
});
