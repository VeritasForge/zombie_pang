// MainMenuScene — 메인 메뉴. START / BEST 표시.
// Bible §1, §4.

import { STORAGE_KEYS_RUN } from "@application/end-run";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.mainMenu });
  }

  create(): void {
    if (typeof window !== "undefined") {
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
      (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.mainMenu;
    }

    const container = getContainer(this);
    const cx = VIEWPORT.width / 2;
    const cy = VIEWPORT.height / 2;

    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);

    const title = this.add.text(cx, cy - px(220), "OFF-CLOCK PANG", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(32),
      color: COLOR_HEX.neonPink,
      fontStyle: "bold",
    });
    title.setOrigin(0.5, 0.5);
    title.setShadow(px(2), px(2), "#000000", px(4), true, true);

    const subtitle = this.add.text(cx, cy - px(180), "당신은 마지막 사원이다", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    subtitle.setOrigin(0.5, 0.5);

    // START 버튼
    const btnW = px(220);
    const btnH = px(72);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.neonPink, 1);
    btnBg.fillRoundedRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH, px(14));
    btnBg.lineStyle(px(2), COLORS.limeGreen, 1);
    btnBg.strokeRoundedRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH, px(14));

    const btnText = this.add.text(cx, cy, "START", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(26),
      color: COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    btnText.setOrigin(0.5, 0.5);

    const hitZone = this.add.zone(cx, cy, btnW, btnH);
    // Zone은 인자 없는 setInteractive()로 자체 width/height 기반 hit area 자동 생성.
    hitZone.setInteractive();
    if (hitZone.input) hitZone.input.cursor = "pointer";
    hitZone.on("pointerdown", () => {
      container.audioManager.play("menu_select");
      this.scene.start(SCENE_KEYS.game);
    });

    // BEST 표시
    const highScore = container.ports.saveStore.get<number>(STORAGE_KEYS_RUN.HIGH_SCORE) ?? 0;
    const bestText = this.add.text(
      cx,
      cy + px(80),
      `BEST: ${Math.floor(highScore).toString().padStart(6, "0")}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(16),
        color: COLOR_HEX.textPrimary,
      },
    );
    bestText.setOrigin(0.5, 0.5);
  }
}
