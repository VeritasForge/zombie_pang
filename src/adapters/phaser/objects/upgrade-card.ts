// UpgradeCard GameObject — 챕터 종료 시 3장 fan-out UI.
// Bible §4: 카드 3장 → 1장 선택. Tap callback 트리거.

import type { CardSpec } from "@domain/meta/card";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, fontPx, px } from "../config";

const CARD_W = px(96);
const CARD_H = px(140);
const CARD_PAD = px(12);
const CARD_TITLE_TOP = px(18);
const CARD_RADIUS = px(8);

export type UpgradeCardClickHandler = (index: 0 | 1 | 2) => void;

export class UpgradeCard extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    spec: CardSpec,
    private readonly index: 0 | 1 | 2,
    private readonly onClick: UpgradeCardClickHandler,
  ) {
    super(scene, x, y);
    this.bg = scene.add.graphics();
    this.drawCardBg(false);
    this.add(this.bg);

    const title = humanizeCardTitle(spec);
    this.titleText = scene.add.text(0, -CARD_H / 2 + CARD_TITLE_TOP, title, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.neonPink,
      align: "center",
      wordWrap: { width: CARD_W - CARD_PAD },
    });
    this.titleText.setOrigin(0.5, 0);
    this.add(this.titleText);

    this.descText = scene.add.text(0, 0, spec.description, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(11),
      color: COLOR_HEX.textPrimary,
      align: "center",
      wordWrap: { width: CARD_W - CARD_PAD },
    });
    this.descText.setOrigin(0.5, 0.5);
    this.add(this.descText);

    this.setSize(CARD_W, CARD_H);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains,
    );
    this.on("pointerover", () => this.drawCardBg(true));
    this.on("pointerout", () => this.drawCardBg(false));
    this.on("pointerdown", () => {
      this.onClick(this.index);
    });
    scene.add.existing(this);
  }

  private drawCardBg(hover: boolean): void {
    this.bg.clear();
    const border = hover ? COLORS.limeGreen : COLORS.neonPink;
    this.bg.fillStyle(COLORS.cardBg, 1);
    this.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
    this.bg.lineStyle(px(2), border, 1);
    this.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
  }
}

function humanizeCardTitle(spec: CardSpec): string {
  const TITLES: Record<string, string> = {
    DAMAGE_T1: "양손 회수",
    DAMAGE_T2: "의자 휘두르기",
    DAMAGE_T3: "정수기통 던지기",
    CRIT_T1: "정확한 한 방",
    CRIT_T2: "빈틈을 노린 일격",
    CRIT_T3: "카운터 펀치",
    DURATION_T1: "점심시간 연장",
    DURATION_T2: "야근 거부권",
    DURATION_T3: "휴가 일수 추가",
    COIN_T1: "잔돈 모으기",
    COIN_T2: "회식비 절약",
    COIN_T3: "성과급 협상",
    SPECIAL_MAGNET: "자기장 ID카드",
    SPECIAL_DECAY: "늘어지는 회의",
    SPECIAL_CRIT_MULTI: "사직서 한 방",
  };
  return TITLES[spec.id] ?? spec.id;
}

export const CARD_DIMENSIONS = { width: CARD_W, height: CARD_H } as const;
