// HudScene — GameScene 위 overlay. Score/Combo/Floor/Quota/Fled + 정시 퇴근 버튼.

import Phaser from "phaser";
import { COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

type HudData = {
  readonly score: number;
  readonly comboCount: number;
  readonly comboMultiplier: number;
  readonly floor: number;
  readonly killed: number;
  readonly quota: number;
  readonly fled: number;
  readonly fledLimit: number;
};

const DEFAULT_HUD: HudData = {
  score: 0,
  comboCount: 0,
  comboMultiplier: 1,
  floor: 1,
  killed: 0,
  quota: 8,
  fled: 0,
  fledLimit: 5,
};

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private fledText!: Phaser.GameObjects.Text;
  private exitBtnZone!: Phaser.GameObjects.Zone;
  private hudListener: ((parent: unknown, value: HudData) => void) | undefined = undefined;

  constructor() {
    super({ key: SCENE_KEYS.hud });
  }

  create(): void {
    this.scoreText = this.add.text(px(16), px(12), "000000", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(22),
      color: COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    this.scoreText.setShadow(px(1), px(1), "#000000", px(2), true, true);

    this.comboText = this.add.text(VIEWPORT.width - px(16), px(12), "", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(18),
      color: COLOR_HEX.comboGold,
      fontStyle: "bold",
    });
    this.comboText.setOrigin(1, 0);

    this.floorText = this.add.text(VIEWPORT.width / 2, px(14), "1F  0/8", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    this.floorText.setOrigin(0.5, 0);

    this.fledText = this.add.text(px(16), VIEWPORT.height - px(30), "FLED 0/5", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });

    const exitText = this.add.text(VIEWPORT.width - px(16), px(44), "정시 퇴근", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(11),
      color: COLOR_HEX.neonPink,
    });
    exitText.setOrigin(1, 0);
    this.exitBtnZone = this.add.zone(VIEWPORT.width - px(40), px(50), px(80), px(24));
    this.exitBtnZone.setInteractive();
    if (this.exitBtnZone.input) this.exitBtnZone.input.cursor = "pointer";
    this.exitBtnZone.on("pointerdown", () => {
      if (this.registry.get("runEnding")) return;
      const hud = (this.registry.get("hud") as HudData | undefined) ?? DEFAULT_HUD;
      this.scene.stop(SCENE_KEYS.hud);
      this.scene.stop(SCENE_KEYS.game);
      this.scene.start(SCENE_KEYS.gameOver, {
        score: hud.score,
        floorsReached: Math.max(0, hud.floor - 1),
        reason: "early_exit",
      });
    });

    this.refresh(DEFAULT_HUD);
    this.hudListener = (_parent: unknown, value: HudData) => this.refresh(value);
    this.registry.events.on(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
  }

  private refresh(data: HudData): void {
    if (!this.scoreText?.active) return;
    this.scoreText.setText(Math.floor(data.score).toString().padStart(6, "0"));
    const cm = data.comboMultiplier;
    this.comboText.setText(
      cm > 1 ? `×${cm.toFixed(1).replace(/\.0$/, "")} (${data.comboCount})` : "",
    );
    this.floorText.setText(`${data.floor}F  ${data.killed}/${data.quota}`);
    this.fledText.setText(`FLED ${data.fled}/${data.fledLimit}`);
  }

  shutdown(): void {
    if (this.hudListener) {
      this.registry.events.off(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
      this.hudListener = undefined;
    }
  }
}
