// Particle system — 사무 비품 파티클 (사원증/종이/커피/USB).
// Bible §5: 동시 표시 max 24p, Adaptive degradation (FPS<50 → 6p).
// Object pool 패턴 — Graphics 작은 사각형 재사용.

import type Phaser from "phaser";
import { px } from "../config";

export type ParticleTheme = "card" | "paper" | "coffee" | "usb";

type ParticleSlot = {
  readonly graphics: Phaser.GameObjects.Graphics;
  inUse: boolean;
};

const POOL_SIZE = 32;

const THEME_COLORS: Record<ParticleTheme, readonly number[]> = {
  card: [0xf0ead6, 0xff2d87, 0xffffff],
  paper: [0xf0ead6, 0xd0c5a8, 0xffffff],
  coffee: [0x6b4423, 0xa0764a, 0xf0ead6],
  usb: [0x707070, 0xc5e90b, 0xffffff],
};

export class ParticleSystem {
  private pool: ParticleSlot[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const g = scene.add.graphics();
      g.setVisible(false);
      g.setDepth(50);
      this.pool.push({ graphics: g, inUse: false });
    }
  }

  emit(x: number, y: number, count: number, theme: ParticleTheme): void {
    const clamped = Math.max(1, Math.min(count, POOL_SIZE));
    const colors = THEME_COLORS[theme];
    let emitted = 0;
    for (const slot of this.pool) {
      if (emitted >= clamped) break;
      if (slot.inUse) continue;
      slot.inUse = true;
      this.launchSlot(slot, x, y, colors);
      emitted += 1;
    }
  }

  private launchSlot(slot: ParticleSlot, x: number, y: number, colors: readonly number[]): void {
    const g = slot.graphics;
    g.clear();
    const colorIdx = Math.floor(Math.random() * colors.length);
    const color = colors[colorIdx] ?? colors[0] ?? 0xffffff;
    // 사각 파편 크기 (4~7 css-px) → dpr 적용.
    const size = px(4) + Math.random() * px(3);
    g.fillStyle(color, 1);
    g.fillRect(-size / 2, -size / 2, size, size);
    g.setPosition(x, y);
    g.setVisible(true);
    g.setAlpha(1);
    g.setScale(1);

    // 속도/중력 — px 단위 → dpr 적용. 각도와 duration은 그대로.
    const angle = Math.random() * Math.PI * 2;
    const speed = px(80) + Math.random() * px(140);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - px(60); // 위로 살짝 뜸
    const duration = 500 + Math.random() * 300;
    const gravity = px(200);

    this.scene.tweens.add({
      targets: g,
      x: x + vx * (duration / 1000),
      y: y + vy * (duration / 1000) + gravity * (duration / 1000) ** 2 * 0.5, // 중력 효과
      alpha: 0,
      scale: 0.3,
      angle: (Math.random() - 0.5) * 360,
      duration,
      ease: "Quad.easeOut",
      onComplete: () => {
        g.setVisible(false);
        slot.inUse = false;
      },
    });
  }

  destroy(): void {
    for (const slot of this.pool) {
      slot.graphics.destroy();
    }
    this.pool = [];
  }
}
