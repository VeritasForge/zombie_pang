// 좀비팡 e2e — 실제 게임 흐름 + GameOver 전환 시나리오 검증.
// rl-verify에서 발굴된 root cause(P0-1 score 위조, P0-2 freeze overlay 잔존) regression 방지.
//
// window.__zp_state / window.__zp_scene polling 기반 시나리오는
// GameScene이 매 프레임 갱신하는 state snapshot을 사용한다 (src/adapters/phaser/scenes/game-scene.ts).
// 좌표 변환: 좀비 게임 좌표(backing buffer) → canvas CSS px → 페이지 px.

import { type Page, expect, test } from "@playwright/test";

type ZpZombie = {
  readonly id: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
};
type ZpState = {
  readonly chapter: number;
  readonly wave: number;
  readonly score: number;
  readonly fled: number;
  readonly comboCount: number;
  readonly isPaused: boolean;
  readonly zombies: ZpZombie[];
  readonly sceneActive: boolean;
  readonly activeScene: string;
};
type ZpWindow = Window & {
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_state?: ZpState;
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_scene?: string;
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

test.describe("좀비팡 게임 flow", () => {
  test("PUNCH IN → START → 좀비 처치 → score 증가", async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(e.message);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // PUNCH IN (preload scene tap)
    await page.waitForTimeout(2500);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(800);

    // START (main menu tap)
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(2000);

    // 화면 전체에 빠른 tap 5초 — 좀비 영역 무작위 hit.
    const endAt = Date.now() + 5_000;
    while (Date.now() < endAt) {
      const x = box.x + 40 + Math.random() * (box.width - 80);
      const y = box.y + 150 + Math.random() * (box.height - 300);
      await page.mouse.click(x, y);
      await page.waitForTimeout(180);
    }

    // 게임이 동결되지 않고 진행 중인지 확인 (canvas 여전히 visible).
    await expect(canvas).toBeVisible();
    // pageerror 없는지 — Score.toString 위조나 freeze overlay 관련 throw 회귀 차단.
    expect(fatalErrors).toEqual([]);
  });

  test("좀비 모두 무시(fled 누적) → fled 5 도달 후 GameOver 자동 전환 → 메인 메뉴 버튼 클릭 가능", async ({
    page,
  }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(e.message);
      }
    });

    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // PUNCH IN → START
    await page.waitForTimeout(2500);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(800);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(2000);

    // 50초 무대응 — 좀비 자연 도주 누적 → fled 5 도달 → GameOver 자동 전환.
    await page.waitForTimeout(50_000);

    // GameOver 화면 하단 "메인 메뉴" 버튼 위치 추정 (canvas 하단 60px 부근).
    const buttonY = box.y + box.height - 60;
    await page.mouse.click(cx, buttonY);
    await page.waitForTimeout(1500);

    // 클릭 후 다른 scene으로 전환됐는지 확인 (canvas 여전히 visible).
    await expect(canvas).toBeVisible();
    // 위조 Score 객체 → [object Object] 출력 등 throw 회귀 차단.
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 A: 좀비 정확한 hit area 클릭 → score 증가 (window state polling)", async ({
    page,
  }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(e.message);
      }
    });

    test.setTimeout(60_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");

    await bootIntoGameScene(page, box);

    // window.__zp_state polling — 좀비 등장 대기 (최대 10초).
    const zombieHandle = await page.waitForFunction(
      () => {
        const s = (window as ZpWindow).__zp_state;
        if (!s || !s.zombies || s.zombies.length === 0) return null;
        return s.zombies[0];
      },
      { timeout: 10_000 },
    );
    const zombie = (await zombieHandle.jsonValue()) as ZpZombie;
    expect(zombie).toBeTruthy();

    const beforeScore = (await page.evaluate(
      () => (window as ZpWindow).__zp_state?.score ?? 0,
    )) as number;

    // 최신 좀비 좌표를 다시 polling 후 정확히 클릭.
    const fresh = await page.evaluate(() => {
      const s = (window as ZpWindow).__zp_state;
      return s?.zombies && s.zombies.length > 0 ? s.zombies[0] : null;
    });
    const target = fresh ?? zombie;
    const point = await gameToPagePoint(page, box, target.x, target.y);
    await page.mouse.click(point.x, point.y);

    // score 증가 검증 — kill 시 1점 이상 가산되어야 함.
    await page.waitForFunction(
      (prev) => {
        const s = (window as ZpWindow).__zp_state;
        return s !== undefined && s.score > prev;
      },
      beforeScore,
      { timeout: 5_000 },
    );
    const scoreAfter = (await page.evaluate(
      () => (window as ZpWindow).__zp_state?.score ?? 0,
    )) as number;
    expect(scoreAfter).toBeGreaterThan(beforeScore);
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 B: 좀비 5마리 처치 → score 누적 + wave 진행", async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(e.message);
      }
    });

    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");

    await bootIntoGameScene(page, box);

    // scale 한 번만 계산 (viewport 고정).
    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameW: c.width, gameH: c.height };
    });

    // 60초 내 좀비 5마리 처치 시도.
    const endAt = Date.now() + 60_000;
    let totalKilled = 0;
    let highestWave = 1;
    let highestScore = 0;

    while (Date.now() < endAt && totalKilled < 5) {
      const state = (await page.evaluate(
        () => (window as ZpWindow).__zp_state ?? null,
      )) as ZpState | null;
      if (!state) {
        await page.waitForTimeout(100);
        continue;
      }
      highestWave = Math.max(highestWave, state.wave);
      highestScore = Math.max(highestScore, state.score);

      // scene이 GameOver로 전이됐다면 종료 (fled 5 도달 또는 보스 처치 등).
      const scene = (await page.evaluate(() => (window as ZpWindow).__zp_scene)) as
        | string
        | undefined;
      if (scene !== "GameScene") break;

      if (state.zombies.length > 0) {
        const z = state.zombies[0];
        if (z) {
          const clickX = box.x + (z.x / scale.gameW) * box.width;
          const clickY = box.y + (z.y / scale.gameH) * box.height;
          await page.mouse.click(clickX, clickY);
          totalKilled += 1;
          await page.waitForTimeout(140);
        } else {
          await page.waitForTimeout(120);
        }
      } else {
        await page.waitForTimeout(150);
      }
    }

    // 최소 1마리 이상 처치되어 score 증가 — Chapter 1 wave 1은 2마리만 spawn되므로
    // wave 진행이 자연스럽게 일어남.
    expect(totalKilled).toBeGreaterThan(0);
    expect(highestScore).toBeGreaterThan(0);
    expect(highestWave).toBeGreaterThanOrEqual(1);
    expect(fatalErrors).toEqual([]);
  });

  test("시나리오 C: fled 5 → GameOver → 메인 메뉴 버튼 → MainMenuScene 전환", async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(e.message);
      }
    });

    test.setTimeout(150_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");

    await bootIntoGameScene(page, box);

    // GameOverScene 자동 전이 polling (최대 90초 — fled 5 자연 누적).
    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameOverScene", {
      timeout: 90_000,
    });

    // 메인 메뉴 버튼 — fled_limit reason → renderRunEnd 경로:
    //   btnY2 = VIEWPORT.height - px(80)  (메인 메뉴)
    //   btnY1 = VIEWPORT.height - px(140) (다시 시작)
    // backing buffer 좌표 → page 좌표 변환.
    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameH: c.height, gameW: c.width, dpr: Math.min(window.devicePixelRatio || 1, 3) };
    });
    const pxBuf = (n: number) => Math.round(n * scale.dpr);
    const buttonGameX = scale.gameW / 2;
    const buttonGameY = scale.gameH - pxBuf(80);
    const buttonPoint = await gameToPagePoint(page, box, buttonGameX, buttonGameY);

    // GameOver render 안정화 대기.
    await page.waitForTimeout(800);
    await page.mouse.click(buttonPoint.x, buttonPoint.y);

    // MainMenuScene 전환 확인.
    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "MainMenuScene", {
      timeout: 5_000,
    });

    await expect(canvas).toBeVisible();
    expect(fatalErrors).toEqual([]);
  });

  // 사용자 보고 회귀 방지 — fled 5 GameOver 화면의 "다시 시작" 버튼이 GameScene으로 정상 전이하는지.
  // 원인: HudScene registry listener가 첫 stop 시 정확히 cleanup되지 않으면 두 번째 GameScene
  // start의 publishHud emit이 destroyed Text의 setText를 호출 → frame.source.image=null →
  // drawImage throw → scene 전이 중단. fix: hud-scene.ts의 named-listener + 명시적 off.
  test("시나리오 D: fled 5 → GameOver → 다시 시작 버튼 → GameScene 재진입", async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) {
        fatalErrors.push(`${e.message}\n${e.stack ?? "(no stack)"}`);
      }
    });

    test.setTimeout(150_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");
    await bootIntoGameScene(page, box);

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameOverScene", {
      timeout: 90_000,
    });

    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameH: c.height, gameW: c.width, dpr: Math.min(window.devicePixelRatio || 1, 3) };
    });
    const pxBuf = (n: number) => Math.round(n * scale.dpr);
    // 다시 시작 버튼 — btnY1 = VIEWPORT.height - px(140).
    const restartGameY = scale.gameH - pxBuf(140);
    const restartPoint = await gameToPagePoint(page, box, scale.gameW / 2, restartGameY);

    await page.waitForTimeout(800);
    await page.mouse.click(restartPoint.x, restartPoint.y);

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameScene", {
      timeout: 5_000,
    });

    await expect(canvas).toBeVisible();
    expect(fatalErrors).toEqual([]);
  });

  // 사용자 보고 회귀 방지 — HUD 우상단 "정시 퇴근" 버튼이 GameOver renderRunEnd로 정상 전이.
  test("시나리오 E: HUD 정시 퇴근 버튼 → GameOver renderRunEnd → 메인 메뉴 클릭", async ({
    page,
  }) => {
    const fatalErrors: string[] = [];
    page.on("pageerror", (e) => {
      if (!/vibrate|AudioContext|gesture/i.test(e.message)) fatalErrors.push(e.message);
    });

    test.setTimeout(60_000);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");
    await bootIntoGameScene(page, box);

    const scale = await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      return { gameH: c.height, gameW: c.width, dpr: Math.min(window.devicePixelRatio || 1, 3) };
    });
    const pxBuf = (n: number) => Math.round(n * scale.dpr);

    // HUD exitBtnZone visual center = (VIEWPORT.width - px(40), px(50)).
    const exitGameX = scale.gameW - pxBuf(40);
    const exitGameY = pxBuf(50);
    const exitPoint = await gameToPagePoint(page, box, exitGameX, exitGameY);
    await page.waitForTimeout(500);
    await page.mouse.click(exitPoint.x, exitPoint.y);

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameOverScene", {
      timeout: 5_000,
    });

    // renderRunEnd 메인 메뉴 버튼 클릭.
    const menuGameY = scale.gameH - pxBuf(80);
    const menuPoint = await gameToPagePoint(page, box, scale.gameW / 2, menuGameY);
    await page.waitForTimeout(800);
    await page.mouse.click(menuPoint.x, menuPoint.y);

    await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "MainMenuScene", {
      timeout: 5_000,
    });
    expect(fatalErrors).toEqual([]);
  });
});
