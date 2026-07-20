// 좀비팡 e2e — 웨이브 클리커 리팩터 이후 실제 게임 흐름 검증.
//
// window.__zp_state / window.__zp_scene polling 기반 시나리오는
// GameScene이 매 프레임 갱신하는 state snapshot을 사용한다 (src/adapters/phaser/scenes/game-scene.ts).
// window.__zp_test__ 훅(setFloor / forceZombieTimeout / dropPickup)은 dev 빌드 또는
// VITE_ZP_E2E=1(playwright.config.ts webServer가 주입)에서만 노출된다.
// 좌표 변환: 게임 좌표(backing buffer) → canvas CSS px → 페이지 px.

import { type Page, expect, test } from "@playwright/test";

type ZpZombie = {
  readonly id: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
};
type ZpPickup = {
  readonly type: string;
  readonly x: number;
  readonly y: number;
};
type ZpState = {
  readonly floor: number;
  readonly quota: number;
  readonly killed: number;
  readonly score: number;
  readonly fled: number;
  readonly fledLimit: number;
  readonly comboCount: number;
  readonly isPaused: boolean;
  readonly zombies: ZpZombie[];
  readonly pickups: ZpPickup[];
  readonly activeEffects: string[];
  readonly sceneActive: boolean;
  readonly activeScene: string;
};
type ZpTestHooks = {
  readonly setFloor: (floor: number) => void;
  readonly forceZombieTimeout: () => void;
  readonly dropPickup: (type: "bomb" | "freeze" | "magnet") => void;
};
type ZpWindow = Window & {
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_state?: ZpState;
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_scene?: string;
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-over-scene create().
  __zp_gameover_reason?: string;
  // biome-ignore lint/style/useNamingConvention: e2e test hook 네임스페이스 (game-scene exposeTestHooks).
  __zp_test__?: ZpTestHooks;
};

/**
 * 화면 중앙 click이 PUNCH IN 버튼을 매번 적중한다고 보장할 수 없으므로
 * scene 전환을 polling으로 감지하면서 재시도하는 헬퍼.
 * @param page Playwright page
 * @param targetScene 도달하려는 scene key
 * @param maxAttempts click 재시도 횟수
 */
async function clickUntilScene(
  page: Page,
  x: number,
  y: number,
  targetScene: string,
  maxAttempts = 8,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const current = await page.evaluate(() => (window as ZpWindow).__zp_scene);
    if (current === targetScene) return;
    await page.mouse.click(x, y);
    await page.waitForTimeout(900);
  }
  const final = await page.evaluate(() => (window as ZpWindow).__zp_scene);
  if (final !== targetScene) {
    throw new Error(`scene polling failed — wanted ${targetScene}, got ${final}`);
  }
}

/**
 * canvas backing buffer 좌표 → 페이지 px 좌표.
 */
async function gameToPagePoint(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  gameX: number,
  gameY: number,
): Promise<{ x: number; y: number }> {
  const scale = await page.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    return { gameW: c.width, gameH: c.height };
  });
  return {
    x: box.x + (gameX / scale.gameW) * box.width,
    y: box.y + (gameY / scale.gameH) * box.height,
  };
}

/**
 * PUNCH IN → MainMenu START 까지 진행. 정확한 버튼 위치를 backing buffer 좌표로 계산해서 클릭.
 *   PUNCH IN 버튼: x=VIEWPORT.width/2, y=VIEWPORT.height/2 + px(40) + px(64)/2
 *   START 버튼:    x=VIEWPORT.width/2, y=VIEWPORT.height/2
 */
async function bootIntoGameScene(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
): Promise<void> {
  const scale = await page.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    return {
      gameW: c.width,
      gameH: c.height,
      dpr: Math.min(window.devicePixelRatio || 1, 3),
    };
  });
  const pxBuf = (n: number) => Math.round(n * scale.dpr);
  // PUNCH IN 버튼 backing buffer 좌표.
  const punchInGameX = scale.gameW / 2;
  const punchInGameY = scale.gameH / 2 + pxBuf(40) + pxBuf(64) / 2;
  const punchInPage = {
    x: box.x + (punchInGameX / scale.gameW) * box.width,
    y: box.y + (punchInGameY / scale.gameH) * box.height,
  };
  // START 버튼은 viewport 중앙.
  const startPage = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };

  // PreloadScene → MainMenuScene
  await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "PreloadScene", {
    timeout: 15_000,
  });
  await clickUntilScene(page, punchInPage.x, punchInPage.y, "MainMenuScene");
  // MainMenuScene → GameScene
  await clickUntilScene(page, startPage.x, startPage.y, "GameScene");
}

function trackFatalErrors(page: Page): string[] {
  const fatalErrors: string[] = [];
  page.on("pageerror", (e) => {
    if (!/vibrate|AudioContext|gesture/i.test(e.message)) fatalErrors.push(e.message);
  });
  return fatalErrors;
}

async function bootCanvas(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas missing");
  return box;
}

test.describe("좀비팡 게임 flow", () => {
  test("시나리오 A: 층 상승 — quota만큼 좀비 처치 → floor 2 이상 도달", async ({ page }) => {
    test.setTimeout(60_000);
    const fatalErrors = trackFatalErrors(page);
    const box = await bootCanvas(page);
    await bootIntoGameScene(page, box);

    const endAt = Date.now() + 45_000;
    for (;;) {
      if (Date.now() >= endAt) break;
      const state = (await page.evaluate(
        () => (window as ZpWindow).__zp_state ?? null,
      )) as ZpState | null;
      if (!state) {
        await page.waitForTimeout(120);
        continue;
      }
      if (state.floor >= 2) break;
      const scene = await page.evaluate(() => (window as ZpWindow).__zp_scene);
      if (scene !== "GameScene") break; // 예상외 GameOver 전이 시 조기 탈출(무한 대기 방지).
      const target = state.zombies[0];
      if (target) {
        const point = await gameToPagePoint(page, box, target.x, target.y);
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(120);
      } else {
        await page.waitForTimeout(150);
      }
    }

    const finalState = (await page.evaluate(
      () => (window as ZpWindow).__zp_state ?? null,
    )) as ZpState | null;
    expect(finalState?.floor ?? 0).toBeGreaterThanOrEqual(2);
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 B: 층 실패(도주) — fled ≥ fledLimit → GameOverScene 전환", async ({ page }) => {
    test.setTimeout(60_000);
    const fatalErrors = trackFatalErrors(page);
    const box = await bootCanvas(page);
    await bootIntoGameScene(page, box);

    // 스폰된 좀비를 강제 timeout시켜 도주 누적 (setFloor 없이 자연 스폰된 좀비로 유도).
    for (let i = 0; i < 30; i += 1) {
      const scene = await page.evaluate(() => (window as ZpWindow).__zp_scene);
      if (scene === "GameOverScene") break;
      await page.evaluate(() => (window as ZpWindow).__zp_test__?.forceZombieTimeout());
      await page.waitForTimeout(500);
    }

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameOverScene", {
      timeout: 5_000,
    });
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 C: 정시 퇴근 — HUD 버튼 탭 → GameOverScene 전환", async ({ page }) => {
    test.setTimeout(30_000);
    const fatalErrors = trackFatalErrors(page);
    const box = await bootCanvas(page);
    await bootIntoGameScene(page, box);

    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameH: c.height, gameW: c.width, dpr: Math.min(window.devicePixelRatio || 1, 3) };
    });
    const pxBuf = (n: number) => Math.round(n * scale.dpr);
    // HUD exitBtnZone 시각 중심 = (VIEWPORT.width - px(40), px(50)).
    const exitGameX = scale.gameW - pxBuf(40);
    const exitGameY = pxBuf(50);
    const exitPoint = await gameToPagePoint(page, box, exitGameX, exitGameY);

    await page.waitForTimeout(500);
    await page.mouse.click(exitPoint.x, exitPoint.y);

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameOverScene", {
      timeout: 5_000,
    });
    // HUD exitBtnZone 경로는 항상 reason "early_exit"로 전이해야 함 — fled_limit/clear와 구분.
    expect(await page.evaluate(() => (window as ZpWindow).__zp_gameover_reason)).toBe("early_exit");
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 D: 파워업 발동 — 폭탄 처치 + 빙결 effect 활성화", async ({ page }) => {
    test.setTimeout(45_000);
    const fatalErrors = trackFatalErrors(page);
    const box = await bootCanvas(page);
    await bootIntoGameScene(page, box);

    // 폭탄 처치 감소를 관측하려면 대상 좀비가 최소 1마리 필요.
    await page.waitForFunction(
      () => {
        const s = (window as ZpWindow).__zp_state;
        return s !== undefined && s.zombies.length > 0;
      },
      { timeout: 10_000 },
    );

    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameW: c.width, gameH: c.height };
    });
    // dropPickup 훅은 화면 중앙(VIEWPORT.width/2, VIEWPORT.height/2)에 pickup을 생성한다.
    const centerPoint = await gameToPagePoint(page, box, scale.gameW / 2, scale.gameH / 2);

    const zombiesBefore = (await page.evaluate(
      () => (window as ZpWindow).__zp_state?.zombies.length ?? 0,
    )) as number;
    expect(zombiesBefore).toBeGreaterThan(0);

    // 폭탄 드랍 → pickups에 등록 확인 → 탭.
    // 폭탄은 탭 시점의 화면 전체 좀비를 예외 없이 전부 처치하므로 (apply-powerup.ts kind:"bomb"),
    // "zombies.length가 줄었다"처럼 느슨한 검증은 안 된다 — 화면 중앙 근처 좀비가 폭탄이 아니라
    // 일반 1탭으로 죽어도(1마리 감소) 우연히 같은 조건을 통과해 false-pass할 수 있기 때문.
    // 결정론적으로 "전멸 + pickup 소모"를 함께 확인한다.
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.dropPickup("bomb"));
    await page.waitForFunction(
      () => (window as ZpWindow).__zp_state?.pickups.some((p) => p.type === "bomb") ?? false,
      { timeout: 3_000 },
    );
    await page.mouse.click(centerPoint.x, centerPoint.y);
    await page.waitForFunction(
      () => {
        const s = (window as ZpWindow).__zp_state;
        return (
          s !== undefined && s.zombies.length === 0 && !s.pickups.some((p) => p.type === "bomb")
        );
      },
      { timeout: 3_000 },
    );

    // 빙결 드랍 → 탭 → activeEffects에 freeze 포함.
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.dropPickup("freeze"));
    await page.waitForFunction(
      () => (window as ZpWindow).__zp_state?.pickups.some((p) => p.type === "freeze") ?? false,
      { timeout: 3_000 },
    );
    await page.mouse.click(centerPoint.x, centerPoint.y);
    await page.waitForFunction(
      () => (window as ZpWindow).__zp_state?.activeEffects.includes("freeze") ?? false,
      { timeout: 3_000 },
    );

    expect(fatalErrors).toEqual([]);
  });
});
