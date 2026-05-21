// PreloadScene — 로고 + PUNCH IN 버튼 (첫 user gesture로 AudioContext.resume()).
// Bible §1 / docs/conventions/phaser.md §2.

import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.preload });
  }

  create(): void {
    if (typeof window !== "undefined") {
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
      (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.preload;
    }

    const cx = VIEWPORT.width / 2;
    const cy = VIEWPORT.height / 2;

    // 배경
    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);

    // 로고 텍스트
    const logo = this.add.text(cx, cy - px(100), "OFF-CLOCK PANG", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(36),
      color: COLOR_HEX.neonPink,
      fontStyle: "bold",
      align: "center",
    });
    logo.setOrigin(0.5, 0.5);
    logo.setShadow(px(2), px(2), "#000000", px(4), true, true);

    // 부제
    const subtitle = this.add.text(cx, cy - px(40), "좀비팡", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(20),
      color: COLOR_HEX.limeGreen,
      align: "center",
    });
    subtitle.setOrigin(0.5, 0.5);

    // PUNCH IN 버튼
    const btnW = px(200);
    const btnH = px(64);
    const btnTop = cy + px(40);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.neonPink, 1);
    btnBg.fillRoundedRect(cx - btnW / 2, btnTop, btnW, btnH, px(12));
    btnBg.lineStyle(px(2), COLORS.limeGreen, 1);
    btnBg.strokeRoundedRect(cx - btnW / 2, btnTop, btnW, btnH, px(12));

    const btnText = this.add.text(cx, btnTop + btnH / 2, "PUNCH IN", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(22),
      color: COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    btnText.setOrigin(0.5, 0.5);

    const hitArea = this.add.zone(cx, btnTop + btnH / 2, btnW, btnH);
    // Zone setInteractive — InputConfig object 없이 호출 시 Zone 자체 width/height 기반
    // hit area 자동 생성. InputConfig form은 texture-bound 자동 시도로 silent fail 위험.
    hitArea.setInteractive();
    if (hitArea.input) hitArea.input.cursor = "pointer";

    hitArea.on("pointerdown", () => {
      const container = getContainer(this);
      // 사용자 gesture → AudioContext resume.
      void container.ports.audio.resume().then(() => {
        container.audioManager.play("punch_in");
        this.scene.start(SCENE_KEYS.mainMenu);
      });
    });

    // 안내 텍스트
    const hint = this.add.text(cx, cy + px(140), "(탭하여 시작)", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(12),
      color: COLOR_HEX.textPrimary,
      align: "center",
    });
    hint.setOrigin(0.5, 0.5);
    hint.setAlpha(0.6);
  }
}
