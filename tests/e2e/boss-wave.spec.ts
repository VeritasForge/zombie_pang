// 좀비팡 e2e — CEO 보스 거동 강화 시나리오 E1~E5.
// spec: docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md §9.4
//
// 각 시나리오는 __zp_test__ 훅으로 보스 wave에 즉시 진입한 뒤, __zp_state polling으로
// 보스 좌표/HP/격노/미니언 도주 카운터를 검증한다. 실제 wave 1~9 진행을 거치지 않기 때문에
// E2E 시간이 60s envelope 안에 충분히 들어간다(E5는 envelope 자체를 검증).

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
  readonly bossWaveActive: boolean;
  readonly bossMinionIds: string[];
  readonly bossHp: number | null;
  readonly bossMaxHp: number | null;
  readonly bossRageLevel: 0 | 1 | 2 | null;
  readonly sceneActive: boolean;
  readonly activeScene: string;
};
type ZpTestHooks = {
  startBossWave(chapter: number): void;
  setBossHp(hp: number): void;
  forceMinionTimeout(): void;
  autoTapBoss(): void;
};
type ZpWindow = Window & {
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_state?: ZpState;
  // biome-ignore lint/style/useNamingConvention: window snapshot key matches game-scene publishE2eState.
  __zp_scene?: string;
  // biome-ignore lint/style/useNamingConvention: e2e test hook 네임스페이스.
  __zp_test__?: ZpTestHooks;
};

/**
 * PUNCH IN(PreloadScene) → START(MainMenuScene) → GameScene 진입.
 * game-flow.spec.ts의 bootIntoGameScene 패턴 단순 재구현 — 본 spec만의 의존을 줄이기 위해 인라인.
 */
async function bootIntoGameScene(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas missing");
  const scale = await page.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    return {
      gameW: c.width,
      gameH: c.height,
      dpr: Math.min(window.devicePixelRatio || 1, 3),
    };
  });
  const pxBuf = (n: number): number => Math.round(n * scale.dpr);
  const punchInGameX = scale.gameW / 2;
  const punchInGameY = scale.gameH / 2 + pxBuf(40) + pxBuf(64) / 2;
  const punchInPage = {
    x: box.x + (punchInGameX / scale.gameW) * box.width,
    y: box.y + (punchInGameY / scale.gameH) * box.height,
  };
  const startPage = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "PreloadScene", undefined, {
    timeout: 15_000,
  });
  // PreloadScene → MainMenuScene
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => (window as ZpWindow).__zp_scene);
    if (s === "MainMenuScene") break;
    await page.mouse.click(punchInPage.x, punchInPage.y);
    await page.waitForTimeout(900);
  }
  // MainMenuScene → GameScene
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => (window as ZpWindow).__zp_scene);
    if (s === "GameScene") break;
    await page.mouse.click(startPage.x, startPage.y);
    await page.waitForTimeout(900);
  }
  await page.waitForFunction(() => (window as ZpWindow).__zp_scene === "GameScene", undefined, {
    timeout: 5_000,
  });
  // exposeTestHooks가 create() 끝에서 호출됨을 polling.
  await page.waitForFunction(() => (window as ZpWindow).__zp_test__ !== undefined, undefined, {
    timeout: 5_000,
  });
}

/**
 * GameScene 진입 후 보스 wave 즉시 트리거. __zp_state.bossWaveActive=true 폴링까지 완료.
 */
async function enterBossWave(page: Page, chapter: number): Promise<void> {
  await bootIntoGameScene(page);
  await page.evaluate((ch) => (window as ZpWindow).__zp_test__?.startBossWave(ch), chapter);
  await page.waitForFunction(
    () => (window as ZpWindow).__zp_state?.bossWaveActive === true,
    undefined,
    { timeout: 5_000 },
  );
}

test.describe("CEO 보스 거동 강화 — E1~E5", () => {
  test("E1: Ch1 보스 5초 위치 추적 — x 표준편차 > 30px (Lissajous 8자 이동 검증)", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await enterBossWave(page, 1);

    // 5초간 ~170ms 주기로 CEO x 좌표 샘플링 (총 ~30개).
    const samples: number[] = [];
    for (let i = 0; i < 30; i++) {
      const x = await page.evaluate(() => {
        const state = (window as ZpWindow).__zp_state;
        if (!state) return null;
        const ceo = state.zombies.find((z) => z.type === "ceo");
        return ceo?.x ?? null;
      });
      if (typeof x === "number") samples.push(x);
      await page.waitForTimeout(170);
    }
    expect(samples.length).toBeGreaterThan(20);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    // R 최소값(Ch1=100) × dpr(>=1) 기준 표준편차 하한 30px은 정적/거의-정적 거동을 차단.
    expect(stdDev).toBeGreaterThan(30);
  });

  test("E2: Ch3 보스 등장 직후 화면 객체 5개 (CEO + 신입3 + 과장1)", async ({ page }) => {
    test.setTimeout(60_000);
    await enterBossWave(page, 3);
    // spawnBoss는 한 frame 내에 5개를 모두 push한다 — 50ms 안정화 대기.
    await page.waitForTimeout(50);
    const snapshot = await page.evaluate(() => (window as ZpWindow).__zp_state ?? null);
    expect(snapshot).toBeTruthy();
    if (!snapshot) throw new Error("snapshot missing");
    expect(snapshot.bossWaveActive).toBe(true);
    expect(snapshot.zombies.length).toBe(5);
    // 명시적 카운팅 — Record<string, number> 인덱스 시그니처는 TS strict + Biome useLiteralKeys
    // 충돌을 일으키므로 명명된 변수로 변환.
    let ceo = 0;
    let intern = 0;
    let middle = 0;
    for (const z of snapshot.zombies) {
      if (z.type === "ceo") ceo += 1;
      else if (z.type === "intern") intern += 1;
      else if (z.type === "middle") middle += 1;
    }
    expect(ceo).toBe(1);
    expect(intern).toBe(3);
    expect(middle).toBe(1);
  });

  test("E3: Ch5 보스 HP 67%/33% 도달 → 격노 단계 1/2 (rage SSOT)", async ({ page }) => {
    test.setTimeout(60_000);
    await enterBossWave(page, 5);

    const maxHp = await page.evaluate(() => (window as ZpWindow).__zp_state?.bossMaxHp ?? null);
    expect(maxHp).toBe(38); // Bible §3: Ch5 boss HP 38

    // rage 1단 (≤67%) — Ch5 max=38 → setHp(25): 25/38 ≈ 0.658 ≤ 0.67.
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.setBossHp(25));
    await page.waitForFunction(() => (window as ZpWindow).__zp_state?.bossHp === 25, undefined, {
      timeout: 2_000,
    });
    const stage1 = await page.evaluate(() => (window as ZpWindow).__zp_state ?? null);
    expect(stage1?.bossHp).toBe(25);
    expect(stage1?.bossRageLevel).toBe(1);

    // rage 2단 (≤33%) — setHp(12): 12/38 ≈ 0.316 ≤ 0.33.
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.setBossHp(12));
    await page.waitForFunction(() => (window as ZpWindow).__zp_state?.bossHp === 12, undefined, {
      timeout: 2_000,
    });
    const stage2 = await page.evaluate(() => (window as ZpWindow).__zp_state ?? null);
    expect(stage2?.bossHp).toBe(12);
    expect(stage2?.bossRageLevel).toBe(2);
  });

  test("E4: Ch3 보스 wave 미니언 도주 강제 → fled 카운터 무변화 (D5 γ 격리 회귀)", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await enterBossWave(page, 3);

    const before = await page.evaluate(() => {
      const s = (window as ZpWindow).__zp_state;
      return { fled: s?.fled ?? 0, minionCount: s?.bossMinionIds.length ?? 0 };
    });
    expect(before.minionCount).toBe(4); // Ch3: 신입3 + 과장1

    // 모든 미니언을 한 frame 내에 lifespan 초과로 만들어 다음 update() tick에 일괄 도주 시도.
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.forceMinionTimeout());
    // 다음 frame들이 도주 처리하기에 충분한 대기 시간.
    await page.waitForFunction(
      () => (window as ZpWindow).__zp_state?.bossMinionIds.length === 0,
      undefined,
      { timeout: 3_000 },
    );

    const after = await page.evaluate(() => {
      const s = (window as ZpWindow).__zp_state;
      return { fled: s?.fled ?? -1, bossWaveActive: s?.bossWaveActive ?? false };
    });
    // D5 γ 격리: boss wave 중 미니언 도주는 fled 카운트 안 함. boss wave는 계속 active.
    expect(after.fled).toBe(before.fled);
    expect(after.bossWaveActive).toBe(true);
  });

  test("E5: Ch5 보스 wave 시작 ~ CEO 처치 ≤ 60000ms (envelope 회귀)", async ({ page }) => {
    test.setTimeout(90_000);
    await enterBossWave(page, 5);
    const start = Date.now();
    await page.evaluate(() => (window as ZpWindow).__zp_test__?.autoTapBoss());
    // autoTapBoss → onBossKilled (isPaused=true, bossWaveActive=false 즉시 set) → 900ms 후
    // endChapter() → scene.start(GameOverScene). GameScene이 paused면 publishE2eState가 호출 안
    // 되므로 __zp_state.bossWaveActive를 polling할 수 없다. 대신 __zp_scene 전이를 기준으로
    // envelope를 측정한다.
    await page.waitForFunction(
      () => (window as ZpWindow).__zp_scene === "GameOverScene",
      undefined,
      { timeout: 60_000 },
    );
    const elapsed = Date.now() - start;
    // Bible §1 챕터 envelope 60s 회귀 가드. autoTapBoss는 즉시 수렴해야 한다.
    expect(elapsed).toBeLessThanOrEqual(60_000);
  });
});
