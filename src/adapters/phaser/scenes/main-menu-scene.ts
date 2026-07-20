// MainMenuScene — 메인 메뉴. START / BEST / STREAK 표시.
// Bible §1, §4.

import { STORAGE_KEYS_RUN } from "@application/end-run";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

// NOTE: start-run.ts의 Task 5 단순화로 STORAGE_KEYS.STREAK가 제거되었다. 이 scene의
// streak 표시 자체는 이번 Task 범위 밖이라 기존 localStorage 키를 그대로 로컬 상수로 유지한다.
const STREAK_STORAGE_KEY = "zombie-pang:v1:streak";

type StreakState = { readonly days: number };

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

    // STREAK 표시 (출근 도장)
    const streakRaw = container.ports.saveStore.get<StreakState>(STREAK_STORAGE_KEY);
    const days = streakRaw && typeof streakRaw.days === "number" ? streakRaw.days : 0;
    const streakText = this.add.text(cx, cy + px(110), `STREAK: ${days}/7`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    streakText.setOrigin(0.5, 0.5);

    // 출근 도장 7개 시각화
    const stampY = cy + px(145);
    const stampSize = px(16);
    const stampGap = px(6);
    const stampInset = px(3);
    const stampsTotalW = 7 * stampSize + 6 * stampGap;
    const stampStartX = cx - stampsTotalW / 2 + stampSize / 2;
    const g = this.add.graphics();
    for (let i = 0; i < 7; i += 1) {
      const x = stampStartX + i * (stampSize + stampGap);
      const filled = i < days;
      g.lineStyle(px(1), COLORS.maskWhite, filled ? 1 : 0.3);
      g.strokeRect(x - stampSize / 2, stampY - stampSize / 2, stampSize, stampSize);
      if (filled) {
        g.fillStyle(COLORS.limeGreen, 0.7);
        g.fillRect(
          x - stampSize / 2 + stampInset,
          stampY - stampSize / 2 + stampInset,
          stampSize - stampInset * 2,
          stampSize - stampInset * 2,
        );
      }
    }
  }
}
