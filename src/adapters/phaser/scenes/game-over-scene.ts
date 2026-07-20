// GameOverScene — run 종료 결과. reason: clear / fled_limit / early_exit.

import { type EndRunReason, type LeaderboardEntry, STORAGE_KEYS_RUN } from "@application/end-run";
import { Score } from "@domain/score/score";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";

export type GameOverInitData = {
  readonly score: Score | number;
  readonly floorsReached: number;
  readonly reason: EndRunReason;
  readonly runId?: string;
  readonly runStartedAt?: number;
};

function toScore(s: Score | number): Score {
  return typeof s === "number" ? Score.from(s) : s;
}

export class GameOverScene extends Phaser.Scene {
  private initData: GameOverInitData | null = null;

  constructor() {
    super({ key: SCENE_KEYS.gameOver });
  }

  init(data: GameOverInitData): void {
    this.initData = data;
  }

  create(): void {
    if (typeof window !== "undefined") {
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
      (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.gameOver;
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
      (window as unknown as { __zp_gameover_reason: string }).__zp_gameover_reason =
        this.initData?.reason ?? "";
    }
    const data = this.initData;
    if (!data) {
      this.scene.start(SCENE_KEYS.mainMenu);
      return;
    }
    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);
    this.renderRunEnd(data);
  }

  private renderRunEnd(data: GameOverInitData): void {
    const cx = VIEWPORT.width / 2;

    let title = "수고하셨습니다";
    let subtitle = "";
    if (data.reason === "clear") {
      title = "50층 완주";
      subtitle = "정시에 퇴근하셨습니다";
    } else if (data.reason === "fled_limit") {
      title = "오늘은 여기까지";
      subtitle = "해도 충분합니다";
    } else {
      title = "정시 퇴근";
      subtitle = "내일 또 만나요";
    }

    this.centerText(cx, px(100), title, 26, COLOR_HEX.neonPink, true);
    this.centerText(cx, px(140), subtitle, 14, COLOR_HEX.limeGreen, false);

    const result = this.callEndRun(data);

    this.centerText(
      cx,
      px(200),
      `SCORE: ${toScore(data.score).toString()}`,
      18,
      COLOR_HEX.maskWhite,
      false,
    );
    this.centerText(
      cx,
      px(230),
      `FLOORS: ${data.floorsReached} / 50`,
      14,
      COLOR_HEX.maskWhite,
      false,
    );
    if (result.highScoreUpdated) {
      this.centerText(cx, px(262), "NEW HIGH SCORE!", 14, COLOR_HEX.comboGold, true);
    }

    this.renderLeaderboard(cx, px(310));

    this.makeButton(
      cx,
      VIEWPORT.height - px(140),
      px(220),
      px(56),
      "다시 시작",
      COLORS.neonPink,
      () => {
        this.scene.start(SCENE_KEYS.game);
        this.scene.stop();
      },
    );
    this.makeButton(
      cx,
      VIEWPORT.height - px(80),
      px(220),
      px(44),
      "메인 메뉴",
      COLORS.maskWhite,
      () => {
        this.scene.start(SCENE_KEYS.mainMenu);
        this.scene.stop();
      },
    );
  }

  private callEndRun(data: GameOverInitData): { readonly highScoreUpdated: boolean } {
    const container = getContainer(this);
    const runId = data.runId ?? `run-${Date.now()}`;
    try {
      const result = container.useCases.endRun(
        { saveStore: container.ports.saveStore, clock: container.ports.clock },
        {
          runId,
          floorsReached: data.floorsReached,
          finalScore: toScore(data.score),
          reason: data.reason,
        },
      );
      return { highScoreUpdated: result.highScoreUpdated };
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: 저장 실패는 사용자 디버깅용 경고 출력이 필요.
      console.warn("[좀비팡] endRun 실패 — 점수/리더보드 저장 누락 가능", err);
      return { highScoreUpdated: false };
    }
  }

  private renderLeaderboard(cx: number, y: number): void {
    const container = getContainer(this);
    const raw = container.ports.saveStore.get<LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    const entries = Array.isArray(raw) ? raw.slice(0, 5) : [];
    this.centerText(cx, y, "TOP 5", 14, COLOR_HEX.limeGreen, false);
    if (entries.length === 0) {
      const t = this.add.text(cx, y + px(28), "(첫 기록을 만들어보세요)", {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0).setAlpha(0.6);
      return;
    }
    entries.forEach((entry, i) => {
      const text = `${i + 1}. ${Math.floor(entry.score).toString().padStart(6, "0")}  ${entry.floorsReached}F`;
      const t = this.add.text(cx, y + px(28) + i * px(22), text, {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0);
    });
  }

  private centerText(
    x: number,
    y: number,
    label: string,
    size: number,
    color: string,
    bold: boolean,
  ): void {
    const t = this.add.text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(size),
      color,
      ...(bold ? { fontStyle: "bold" } : {}),
    });
    t.setOrigin(0.5, 0.5);
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    const g = this.add.graphics();
    g.lineStyle(px(2), color, 1);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, px(10));
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(16),
      color: color === COLORS.neonPink ? COLOR_HEX.neonPink : COLOR_HEX.maskWhite,
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 0.5);
    const zone = this.add.zone(x, y, w, h);
    zone.setInteractive();
    if (zone.input) zone.input.cursor = "pointer";
    zone.on("pointerdown", () => {
      getContainer(this).audioManager.play("menu_select");
      onClick();
    });
  }
}
