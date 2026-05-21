// BossHud — CEO 등장 시 상단 HP 게이지.
// Bible §3 CEO 보스 3-phase: HP 3등분 색상 변화 (녹 → 황 → 적).

import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, VIEWPORT, fontPx, px } from "../config";

// VIEWPORT는 이미 dpr 곱한 값. 좌우 margin 16 css-px × dpr 적용.
const HUD_WIDTH = VIEWPORT.width - px(32);
const HUD_HEIGHT = px(20);
const HUD_RADIUS = px(4);
const HUD_LABEL_OFFSET = px(10);

export class BossHud extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private maxHp: number;
  private hp: number;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHp: number) {
    super(scene, x, y);
    this.maxHp = Math.max(1, maxHp);
    this.hp = this.maxHp;
    this.bg = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.label = scene.add.text(0, -HUD_HEIGHT - HUD_LABEL_OFFSET, "CEO", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(12),
      color: COLOR_HEX.neonPink,
    });
    this.label.setOrigin(0.5, 0);
    this.add([this.bg, this.fill, this.label]);
    this.redraw();
    scene.add.existing(this);
  }

  setHp(hp: number): void {
    this.hp = Math.max(0, Math.min(this.maxHp, hp));
    this.redraw();
  }

  private redraw(): void {
    this.bg.clear();
    this.bg.fillStyle(COLORS.hudBg, 0.85);
    this.bg.fillRoundedRect(-HUD_WIDTH / 2, -HUD_HEIGHT / 2, HUD_WIDTH, HUD_HEIGHT, HUD_RADIUS);
    this.bg.lineStyle(px(1), COLORS.maskWhite, 0.5);
    this.bg.strokeRoundedRect(-HUD_WIDTH / 2, -HUD_HEIGHT / 2, HUD_WIDTH, HUD_HEIGHT, HUD_RADIUS);

    const ratio = this.hp / this.maxHp;
    const fillW = Math.max(0, HUD_WIDTH * ratio);
    let color: number = COLORS.intern;
    if (ratio < 0.33) color = COLORS.lead;
    else if (ratio < 0.66) color = COLORS.middle;

    this.fill.clear();
    this.fill.fillStyle(color, 1);
    this.fill.fillRoundedRect(-HUD_WIDTH / 2, -HUD_HEIGHT / 2, fillW, HUD_HEIGHT, HUD_RADIUS);
  }
}
