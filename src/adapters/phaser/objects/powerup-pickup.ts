// PowerupPickup — 처치 위치에 생성되는 탭 가능한 파워업 아이콘. 탭 시 GameScene이 발동.
import type { PowerUpType } from "@domain/powerup/powerup";
import Phaser from "phaser";
import { COLORS, FONT_FAMILY, fontPx, px } from "../config";

const PICKUP_RADIUS = px(24);
const PICKUP_LIFESPAN_MS = 4500;

const GLYPH: Record<PowerUpType, string> = { bomb: "B", freeze: "F", magnet: "M" };
const TINT: Record<PowerUpType, number> = {
  bomb: COLORS.neonPink,
  freeze: 0x4dd0e1,
  magnet: COLORS.comboGold,
};

export class PowerupPickup extends Phaser.GameObjects.Container {
  public readonly powerUpType: PowerUpType;
  public readonly spawnedAt: number;
  static readonly LIFESPAN_MS = PICKUP_LIFESPAN_MS;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType, spawnedAt: number) {
    super(scene, x, y);
    this.powerUpType = type;
    this.spawnedAt = spawnedAt;

    const g = scene.add.graphics();
    g.fillStyle(TINT[type], 0.92);
    g.fillCircle(0, 0, PICKUP_RADIUS);
    g.lineStyle(px(2), COLORS.maskWhite, 1);
    g.strokeCircle(0, 0, PICKUP_RADIUS);
    const label = scene.add
      .text(0, 0, GLYPH[type], {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(18),
        color: "#1a1a1a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add([g, label]);

    this.setSize(PICKUP_RADIUS * 2, PICKUP_RADIUS * 2);
    this.setInteractive(new Phaser.Geom.Circle(0, 0, PICKUP_RADIUS), Phaser.Geom.Circle.Contains);
    this.setDepth(50);
    scene.add.existing(this);
    scene.tweens.add({
      targets: this,
      scale: { from: 0.85, to: 1.05 },
      duration: 260,
      yoyo: true,
      repeat: -1,
    });
  }
}
