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

    // 원형 hit area 배치 — zombie.ts와 동일한 Phaser Container 보정 규칙 적용.
    // Phaser InputManager.pointWithinHitArea는 TransformXY로 raw local point를 구한 뒤
    // `x += displayOriginX; y += displayOriginY` 보정을 적용한다. Container.displayOriginX
    // = width / 2 (custom getter) 이므로 setSize(2r, 2r) 후 visual center 클릭은 최종적으로
    // (r, r)에 매핑된다. hit area Circle을 (0, 0)에 두면 visual top-left로 밀려나 pickup을
    // 정확히 탭해도 거의 항상 miss한다 — Circle은 반드시 (r, r) 중심에 배치해야 한다.
    const r = PICKUP_RADIUS;
    this.setSize(r * 2, r * 2);
    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(r, r, r),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
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
