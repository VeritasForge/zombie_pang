// GameOverScene — End-of-chapter card pick / End-of-run leaderboard.
// Bible §3 success 3택: 다음 챕터 / 카드 자세히 / 정시 퇴근 — 모두 동등 가중치.

import { type EndRunReason, type LeaderboardEntry, STORAGE_KEYS_RUN } from "@application/end-run";
import type { DailyStreak } from "@domain/meta/daily-streak";
import { MetaProgression } from "@domain/meta/progression";
import { Score } from "@domain/score/score";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLORS, COLOR_HEX, FONT_FAMILY, SCENE_KEYS, VIEWPORT, fontPx, px } from "../config";
import { UpgradeCard } from "../objects/upgrade-card";

type EndKind = "clear" | "chapter_end" | "early_exit" | "fled_limit";

export type GameOverInitData = {
  readonly chapter: number;
  // Score 인스턴스 또는 number — HudScene의 정시 퇴근 분기에서는 number만 보유하므로 둘 다 허용.
  readonly score: Score | number;
  readonly earnedCoin: number;
  readonly meta?: MetaProgression;
  readonly streak?: DailyStreak | null;
  readonly runId?: string;
  readonly runStartedAt?: number;
  readonly reason: EndKind;
  readonly bestReachedChapter: number;
};

/** init.score가 number이면 Score VO로 lift. Score 인스턴스면 그대로 반환. */
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
    }

    const data = this.initData;
    if (!data) {
      this.scene.start(SCENE_KEYS.mainMenu);
      return;
    }
    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);

    if (data.reason === "chapter_end") {
      this.renderChapterEnd(data);
    } else {
      this.renderRunEnd(data);
    }
  }

  private renderChapterEnd(data: GameOverInitData): void {
    const container = getContainer(this);
    const cx = VIEWPORT.width / 2;

    const title = this.add.text(cx, px(80), `Chapter ${data.chapter} Clear`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(28),
      color: COLOR_HEX.neonPink,
      fontStyle: "bold",
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = this.add.text(cx, px(120), "PUNCH OUT! 17:30", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    subtitle.setOrigin(0.5, 0.5);

    const scoreText = this.add.text(cx, px(156), `SCORE ${toScore(data.score).toString()}`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(16),
      color: COLOR_HEX.maskWhite,
    });
    scoreText.setOrigin(0.5, 0.5);

    // 챕터별 누적 coin (highest cleared chapter 갱신용)
    const totalCoinSoFar =
      (container.ports.saveStore.get<number>(STORAGE_KEYS_RUN.TOTAL_COIN) ?? 0) + data.earnedCoin;

    const currentMeta = data.meta ?? MetaProgression.empty();
    const pickResult = container.useCases.pickUpgrade(
      { saveStore: container.ports.saveStore, random: container.ports.random },
      { chapter: data.chapter, totalCoin: totalCoinSoFar, currentMeta },
    );

    const cardY = px(320);
    const cardGap = px(110);
    const startX = cx - cardGap;

    const onCardClick = (idx: 0 | 1 | 2): void => {
      container.audioManager.play("powerup_pickup");
      const newMeta = pickResult.applyChoice(idx);
      // 다음 챕터로 진행. GameOverScene 자신도 stop 해야 input 충돌 방지.
      this.scene.start(SCENE_KEYS.game, {
        chapter: data.chapter + 1,
        carryMeta: newMeta,
        carryStreak: data.streak,
        carryRunId: data.runId,
        carryStartedAt: data.runStartedAt,
        carryEarnedCoin: data.earnedCoin,
      });
      this.scene.stop();
    };

    new UpgradeCard(this, startX, cardY, pickResult.offered[0], 0, onCardClick);
    new UpgradeCard(this, startX + cardGap, cardY, pickResult.offered[1], 1, onCardClick);
    new UpgradeCard(this, startX + cardGap * 2, cardY, pickResult.offered[2], 2, onCardClick);

    // 정시 퇴근 옵션 — 부모 viewport(dpr 적용) 기준으로 하단 정렬.
    const btnY1 = Math.min(px(520), VIEWPORT.height - px(200));
    const btnY2 = Math.min(px(580), VIEWPORT.height - px(140));
    this.makeButton(cx, btnY1, px(200), px(48), "정시 퇴근", COLORS.neonPink, () => {
      this.endRunWith(data, "early_exit");
    });
    this.makeButton(cx, btnY2, px(200), px(40), "메인 메뉴", COLORS.maskWhite, () => {
      this.endRunWith(data, "early_exit");
    });
  }

  private renderRunEnd(data: GameOverInitData): void {
    const cx = VIEWPORT.width / 2;

    let title = "수고하셨습니다";
    let subtitleText = "";
    if (data.reason === "clear") {
      title = "사직서 제출 완료";
      subtitleText = "정시에 퇴근하셨습니다";
    } else if (data.reason === "fled_limit") {
      title = "오늘은 여기까지";
      subtitleText = "해도 충분합니다";
    } else if (data.reason === "early_exit") {
      title = "정시 퇴근";
      subtitleText = "내일 또 만나요";
    }

    const titleObj = this.add.text(cx, px(100), title, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(26),
      color: COLOR_HEX.neonPink,
      fontStyle: "bold",
    });
    titleObj.setOrigin(0.5, 0.5);

    const subObj = this.add.text(cx, px(140), subtitleText, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    subObj.setOrigin(0.5, 0.5);

    // endRun 호출
    const reason = mapReason(data.reason);
    const result = this.callEndRun(data, reason);

    // 표시
    const scoreLine = this.add.text(cx, px(200), `SCORE: ${toScore(data.score).toString()}`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(18),
      color: COLOR_HEX.maskWhite,
    });
    scoreLine.setOrigin(0.5, 0.5);

    const coinLine = this.add.text(cx, px(230), `TOTAL COIN: ${result.totalCoin}`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });
    coinLine.setOrigin(0.5, 0.5);

    const chLine = this.add.text(cx, px(256), `CHAPTERS CLEARED: ${data.bestReachedChapter}`, {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.maskWhite,
    });
    chLine.setOrigin(0.5, 0.5);

    if (result.highScoreUpdated) {
      const hsLine = this.add.text(cx, px(282), "NEW HIGH SCORE!", {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(14),
        color: COLOR_HEX.comboGold,
        fontStyle: "bold",
      });
      hsLine.setOrigin(0.5, 0.5);
    }

    // Leaderboard top 5
    this.renderLeaderboard(cx, px(330));

    // 버튼 — 부모 스크린(viewport height)에 맞춤 + 명시적 self-stop
    const btnY1 = VIEWPORT.height - px(140);
    const btnY2 = VIEWPORT.height - px(80);
    this.makeButton(cx, btnY1, px(220), px(56), "다시 시작", COLORS.neonPink, () => {
      this.scene.start(SCENE_KEYS.game);
      this.scene.stop();
    });
    this.makeButton(cx, btnY2, px(220), px(44), "메인 메뉴", COLORS.maskWhite, () => {
      this.scene.start(SCENE_KEYS.mainMenu);
      this.scene.stop();
    });
  }

  private callEndRun(
    data: GameOverInitData,
    reason: EndRunReason,
  ): {
    readonly totalCoin: number;
    readonly highScoreUpdated: boolean;
  } {
    const container = getContainer(this);
    const runId = data.runId ?? `run-${Date.now()}`;
    try {
      const result = container.useCases.endRun(
        { saveStore: container.ports.saveStore, clock: container.ports.clock },
        {
          runId,
          chaptersCleared: data.bestReachedChapter,
          finalScore: toScore(data.score),
          earnedCoin: data.earnedCoin,
          reason,
        },
      );
      return { totalCoin: result.totalCoin, highScoreUpdated: result.highScoreUpdated };
    } catch {
      return {
        totalCoin: container.ports.saveStore.get<number>(STORAGE_KEYS_RUN.TOTAL_COIN) ?? 0,
        highScoreUpdated: false,
      };
    }
  }

  private endRunWith(data: GameOverInitData, kind: EndKind): void {
    // 새 GameOverScene으로 전이하여 endRun 호출하는 경로.
    // meta/streak/runId/runStartedAt 메타데이터를 모두 forward 해야 leaderboard/streak 갱신 정확.
    this.scene.start(SCENE_KEYS.gameOver, {
      chapter: data.chapter,
      score: data.score,
      earnedCoin: data.earnedCoin,
      meta: data.meta,
      streak: data.streak,
      runId: data.runId,
      runStartedAt: data.runStartedAt,
      reason: kind,
      bestReachedChapter: data.bestReachedChapter,
    });
    this.scene.stop();
  }

  private renderLeaderboard(cx: number, y: number): void {
    const container = getContainer(this);
    const raw = container.ports.saveStore.get<LeaderboardEntry[]>(STORAGE_KEYS_RUN.LEADERBOARD);
    const entries = Array.isArray(raw) ? raw.slice(0, 5) : [];
    const header = this.add.text(cx, y, "TOP 5", {
      fontFamily: FONT_FAMILY,
      fontSize: fontPx(14),
      color: COLOR_HEX.limeGreen,
    });
    header.setOrigin(0.5, 0);
    entries.forEach((entry, i) => {
      const text = `${i + 1}. ${Math.floor(entry.score).toString().padStart(6, "0")}  Ch.${entry.chaptersCleared}`;
      const t = this.add.text(cx, y + px(28) + i * px(22), text, {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0);
    });
    if (entries.length === 0) {
      const t = this.add.text(cx, y + px(28), "(첫 기록을 만들어보세요)", {
        fontFamily: FONT_FAMILY,
        fontSize: fontPx(12),
        color: COLOR_HEX.maskWhite,
      });
      t.setOrigin(0.5, 0);
      t.setAlpha(0.6);
    }
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
    // Zone은 인자 없는 setInteractive()로 자체 width/height 기반 hit area 자동 생성.
    // InputConfig object (예: { useHandCursor: true }) 형태는 texture-bound hit area
    // 자동 시도를 거치므로 texture 없는 Zone에서 silent fail 가능 (Phaser 3.90 명세).
    zone.setInteractive();
    if (zone.input) zone.input.cursor = "pointer";
    zone.on("pointerdown", () => {
      const container = getContainer(this);
      container.audioManager.play("menu_select");
      onClick();
    });
  }
}

function mapReason(kind: EndKind): EndRunReason {
  if (kind === "clear") return "clear";
  if (kind === "fled_limit") return "fled_limit";
  return "early_exit";
}
