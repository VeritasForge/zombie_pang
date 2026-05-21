// HudScene — Game scene 위에 overlay (parallel scene).
// Score, Combo, Floor, Fled, Earned Coin 표시. "정시 퇴근" 버튼 포함.

import Phaser from "phaser";
import { COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

type HudData = {
  readonly score: number;
  readonly comboCount: number;
  readonly comboMultiplier: number;
  readonly chapter: number;
  readonly floor: number;
  readonly fled: number;
  readonly fledLimit: number;
  readonly earnedCoin: number;
};

const DEFAULT_HUD: HudData = {
  score: 0,
  comboCount: 0,
  comboMultiplier: 1,
  chapter: 1,
  floor: 1,
  fled: 0,
  fledLimit: 5,
  earnedCoin: 0,
};

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private fledText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private exitBtnZone!: Phaser.GameObjects.Zone;
  // listener reference 보관 — game-level registry events는 scene이 stop되어도 자동 cleanup되지
  // 않으므로 명시적 off를 위해 reference가 필요하다. shutdown 직전 publishHud emit이
  // stale listener를 통해 destroyed Text에 setText 호출하면 frame.source.image=null에서
  // drawImage throw 발생.
  // exactOptionalPropertyTypes — undefined를 명시적으로 union에 포함.
  private hudListener: ((parent: unknown, value: HudData) => void) | undefined = undefined;

  create(): void {
    // 상단 — score / combo / floor
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

    this.floorText = this.add.text(VIEWPORT.width / 2, px(14), "1F / Ch.1", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    this.floorText.setOrigin(0.5, 0);

    // 하단 — fled / coin
    this.fledText = this.add.text(px(16), VIEWPORT.height - px(30), "FLED 0/5", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });

    this.coinText = this.add.text(VIEWPORT.width - px(16), VIEWPORT.height - px(30), "C 0", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });
    this.coinText.setOrigin(1, 0);

    // 정시 퇴근 버튼 (우상단 작은 표기)
    const exitText = this.add.text(VIEWPORT.width - px(16), px(44), "정시 퇴근", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(11),
      color: COLOR_HEX.neonPink,
    });
    exitText.setOrigin(1, 0);
    this.exitBtnZone = this.add.zone(VIEWPORT.width - px(40), px(50), px(80), px(24));
    // Zone은 인자 없는 setInteractive()로 자체 width/height 기반 hit area 자동 생성.
    this.exitBtnZone.setInteractive();
    if (this.exitBtnZone.input) this.exitBtnZone.input.cursor = "pointer";
    this.exitBtnZone.on("pointerdown", () => {
      // 정시 퇴근 — game scene을 stop하고 main menu로
      const gameScene = this.scene.get(SCENE_KEYS.game) as Phaser.Scene | undefined;
      if (gameScene) {
        // GameOverScene으로 전이 (early_exit).
        // HUD는 score number만 보유 — GameOverScene이 number도 받도록 확장되어 안전.
        const hud = this.registry.get("hud") as HudData | undefined;
        const hudVal = hud ?? DEFAULT_HUD;
        this.scene.stop(SCENE_KEYS.hud);
        this.scene.stop(SCENE_KEYS.game);
        this.scene.start(SCENE_KEYS.gameOver, {
          chapter: hudVal.chapter,
          score: hudVal.score,
          earnedCoin: hudVal.earnedCoin,
          reason: "early_exit",
          bestReachedChapter: Math.max(0, hudVal.chapter - 1),
        });
      }
    });

    // initial state
    this.refresh(DEFAULT_HUD);

    // subscribe to registry updates — listener reference를 instance에 보관해 두 번째 launch 때
    // 정확한 fn 매칭으로 off 가능하도록 한다. 또 wake/start 시 이전 listener가 잔존하면 중복
    // 호출되어 destroyed Text 접근 위험.
    this.hudListener = (_parent: unknown, value: HudData) => {
      this.refresh(value);
    };
    this.registry.events.on(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
  }

  private refresh(data: HudData): void {
    // 이미 destroyed/inactive Text에 setText 호출하면 frame.source가 null인 상태에서
    // drawImage throw → scene 전이가 중단된다 (root cause: registry events는 game-level이라
    // scene이 stop되어도 listener가 자동 정리되지 않을 수 있음).
    if (!this.scoreText?.active) return;
    this.scoreText.setText(Math.floor(data.score).toString().padStart(6, "0"));
    const cm = data.comboMultiplier;
    const cmText = cm > 1 ? `×${cm.toFixed(1).replace(/\.0$/, "")} (${data.comboCount})` : "";
    this.comboText.setText(cmText);
    this.floorText.setText(`${data.floor}F / Ch.${data.chapter}`);
    this.fledText.setText(`FLED ${data.fled}/${data.fledLimit}`);
    this.coinText.setText(`C ${data.earnedCoin}`);
  }

  shutdown(): void {
    if (this.hudListener) {
      this.registry.events.off(`${Phaser.Data.Events.CHANGE_DATA_KEY}hud`, this.hudListener);
      this.hudListener = undefined;
    }
  }
}
