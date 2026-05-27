// Zombie GameObject — Phaser Container 기반 prefab.
// Bible §2 + Sample 친숙도 절충: emoji text + Phaser Graphics decoration.
// emoji는 OS 폰트라 외부 asset 0 정책 충족.
// hit area는 emoji 시각 지름과 일치하는 **원형** — 사용자 mental model "이미지 안 클릭=사냥"
// 보장. 정사각형 hit box(이전 120 dpr)는 emoji 시각보다 커서 좀비끼리 hit box가 겹치면
// Phaser input.topOnly로 가려진 좀비의 hover/click이 무시되어 비결정성이 발생.
// 머리 영역(원의 상단 35%) = critical zone.

import type { ZombieType } from "@domain/wave/zombie-type";
import { ZOMBIE_TYPE } from "@domain/wave/zombie-type";
import Phaser from "phaser";
import { COLORS, MASK_COLORS, MASK_NEEDS_STROKE, px } from "../config";

// emoji 시각 반지름 ≈ fontSize / 2. 여기에 padding으로 모바일 터치 친화도 확보 + 가장자리를
// 살짝 벗어나도 사냥 가능. spec.fontSize는 이미 dpr 곱한 값(px(56) 등), padding도 동일 단위.
// INTERN(가장 작은 좀비) 기준: 28*dpr + 12*dpr = 40*dpr radius = 40 css px radius = 80 css px 지름.
// Apple HIG 44pt(88 css px) 권장 영역에 근접한 친화 사이즈. MIN_SPAWN_DISTANCE_PX(96)와 매칭.
const HIT_RADIUS_PADDING = px(12);

type ZombieVisualSpec = {
  readonly emoji: string;
  readonly fontSize: number; // 이미 dpr 곱한 backing buffer 단위.
  readonly auraColor: number;
  readonly auraRadius: number; // 이미 dpr 곱한 backing buffer 단위.
  readonly maskColor: number; // 직급 위계 마스크 색 (Bible §2).
};

const VISUAL_SPECS: Record<ZombieType, ZombieVisualSpec> = {
  [ZOMBIE_TYPE.INTERN]: {
    emoji: "\u{1F9DF}", // 🧟
    fontSize: px(56),
    auraColor: COLORS.intern,
    auraRadius: px(36),
    maskColor: MASK_COLORS.intern,
  },
  [ZOMBIE_TYPE.MIDDLE]: {
    emoji: "\u{1F9DF}‍♂️", // 🧟‍♂️
    fontSize: px(60),
    auraColor: COLORS.middle,
    auraRadius: px(40),
    maskColor: MASK_COLORS.middle,
  },
  [ZOMBIE_TYPE.LEAD]: {
    emoji: "\u{1F9DF}‍♀️", // 🧟‍♀️
    fontSize: px(64),
    auraColor: COLORS.lead,
    auraRadius: px(44),
    maskColor: MASK_COLORS.lead,
  },
  [ZOMBIE_TYPE.CEO]: {
    emoji: "\u{1F9E0}", // 🧠
    fontSize: px(96),
    auraColor: COLORS.ceo,
    auraRadius: px(70),
    maskColor: MASK_COLORS.ceo,
  },
};

export type ZombieInit = {
  readonly id: string;
  readonly type: ZombieType;
  readonly hp: number;
  readonly maxHp: number;
};

const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif';

export class Zombie extends Phaser.GameObjects.Container {
  public zombieId: string;
  public zombieType: ZombieType;
  public hp: number;
  public maxHp: number;
  /** 원형 hit area 반지름 (dpr 적용 backing buffer 단위). isHeadHit 판정에서도 사용. */
  public readonly hitRadius: number;
  private aura: Phaser.GameObjects.Graphics;
  private emojiText: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, init: ZombieInit) {
    super(scene, x, y);
    this.zombieId = init.id;
    this.zombieType = init.type;
    this.hp = init.hp;
    this.maxHp = init.maxHp;

    const spec = VISUAL_SPECS[init.type];
    this.hitRadius = spec.fontSize / 2 + HIT_RADIUS_PADDING;

    // 1) 후광 — 좀비 색 aura (탭 가시성 향상)
    this.aura = scene.add.graphics();
    this.aura.fillStyle(spec.auraColor, 0.25);
    this.aura.fillCircle(0, 0, spec.auraRadius);
    this.aura.fillStyle(spec.auraColor, 0.4);
    this.aura.fillCircle(0, 0, spec.auraRadius * 0.7);
    this.add(this.aura);

    // 2) Emoji body (sample 친숙도 + OS native rendering = retina 친화)
    // spec.fontSize는 이미 dpr 곱한 backing buffer 단위.
    this.emojiText = scene.add.text(0, 0, spec.emoji, {
      fontFamily: EMOJI_FONT,
      fontSize: `${spec.fontSize}px`,
    });
    this.emojiText.setOrigin(0.5, 0.5);
    this.add(this.emojiText);

    // 2.5) 마스크 표식 — 직급 위계(Bible §2). 폭=fontSize*0.4, 높이=px(6), 이모지 하단 px(4).
    // 진회/검정은 어두운 배경 대비 부족 → maskWhite stroke로 외곽 분리(대비 ≥3:1, WCAG 1.4.11).
    const maskW = spec.fontSize * 0.4;
    const maskH = px(6);
    const maskY = spec.fontSize / 2 + px(4);
    const mask = scene.add.graphics();
    mask.fillStyle(spec.maskColor, 1);
    mask.fillRoundedRect(-maskW / 2, maskY, maskW, maskH, px(2));
    if (MASK_NEEDS_STROKE.has(spec.maskColor)) {
      mask.lineStyle(px(2), COLORS.maskWhite, 1);
      mask.strokeRoundedRect(-maskW / 2, maskY, maskW, maskH, px(2));
    }
    this.add(mask);

    // 3) HP bar (hp > 1 좀비만)
    if (init.maxHp > 1) {
      this.hpBar = scene.add.graphics();
      this.add(this.hpBar);
      this.redrawHpBar();
    }

    // 원형 hit area.
    // Phaser 3.80 InputManager.pointWithinHitArea는 TransformXY로 raw local point를 구한 뒤
    // `x += displayOriginX; y += displayOriginY` 보정을 적용한 final point를 hitAreaCallback에
    // 전달한다. Container.displayOriginX = width / 2 (custom getter). 따라서 setSize(2r, 2r) 후
    // visual center 클릭은 final (r, r)에 매핑됨. hit area Circle은 (r, r) 중심에 배치해야
    // visual emoji 영역과 hit 영역이 정확히 일치. (Circle을 (0, 0)에 두면 visual top-left에
    // 위치하게 되어 emoji 클릭이 거의 항상 hit miss — 사용자 보고 비결정성의 한 원인.)
    const r = this.hitRadius;
    const diameter = r * 2;
    this.setSize(diameter, diameter);
    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(r, r, r),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });

    // appear tween — scale 1.0 유지(hit area 항상 full size), alpha만 페이드인.
    // 시각적 등장 효과는 alpha + 작은 y 이동으로 표현. hit detection 영역은 spawn 즉시 활성.
    this.setAlpha(0);
    scene.tweens.add({
      targets: this as Phaser.GameObjects.GameObject,
      alpha: 1,
      duration: 150,
      ease: "Quad.easeOut",
    });

    scene.add.existing(this);
  }

  private redrawHpBar(): void {
    if (!this.hpBar) return;
    const spec = VISUAL_SPECS[this.zombieType];
    // spec.fontSize는 이미 dpr 적용된 값. 추가 px 적용은 height 4와 offset 6에만 적용.
    const w = spec.fontSize * 0.9;
    const h = px(4);
    const y = spec.fontSize / 2 + px(6);
    const ratio = this.maxHp === 0 ? 0 : this.hp / this.maxHp;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x444444, 0.7);
    this.hpBar.fillRect(-w / 2, y, w, h);
    const barColor = ratio > 0.5 ? 0x6bcb77 : ratio > 0.25 ? 0xffd93d : 0xff4d4d;
    this.hpBar.fillStyle(barColor, 1);
    this.hpBar.fillRect(-w / 2, y, w * ratio, h);
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      return true;
    }
    this.redrawHpBar();
    // 더 명확한 hit feedback — scale 0.8 yoyo + tint flash.
    // 주의: Container 전체에 scale 적용하면 hit area도 함께 축소되어 후속 tap 판정에 영향.
    // emojiText만 scale 변화시켜 시각 피드백 유지 + hit box 불변 보장.
    this.scene.tweens.killTweensOf(this.emojiText);
    this.scene.tweens.add({
      targets: this.emojiText,
      scale: 0.8,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.emojiText.setTint(0xff4d4d);
    this.scene.time.delayedCall(120, () => {
      if (this.emojiText.active) this.emojiText.clearTint();
    });
    return false;
  }

  /**
   * Container local x,y가 머리 영역에 해당하는지.
   * Bible §3 weak spot (head = 상단 35%) — 원형 hit area의 상단 35%.
   * y가 -r ~ -r*0.3 사이(상단 35% 영역) + 원 안.
   */
  isHeadHit(localX: number, localY: number): boolean {
    const r = this.hitRadius;
    const inCircle = localX * localX + localY * localY <= r * r;
    const inHead = localY <= -r * 0.3;
    return inCircle && inHead;
  }
}
