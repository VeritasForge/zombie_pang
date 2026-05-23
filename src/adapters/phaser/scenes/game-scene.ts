// GameScene — 게임 메인 루프.
// 좀비 spawn, tap 입력, use case 호출, juice 트리거. 도메인 직접 import 없음.

import { spawnBossWave } from "@application/spawn-boss-wave";
import { tickBossPosition } from "@application/tick-boss-position";
import { getPhaseConfig } from "@domain/boss/boss-phase-config";
import { applyRageMultipliers, computeRageLevel } from "@domain/boss/boss-rage-level";
import type { DailyStreak } from "@domain/meta/daily-streak";
import { MetaProgression } from "@domain/meta/progression";
import { bossHpForChapter } from "@domain/powerup/boss";
import type { Combo } from "@domain/score/combo";
import { Combo as ComboClass } from "@domain/score/combo";
import { Score } from "@domain/score/score";
import { findSpawnPoint } from "@domain/wave/spawn-position";
import { Spawner } from "@domain/wave/spawner";
import { Wave } from "@domain/wave/wave";
import { ZOMBIE_TYPE, type ZombieType, specOf } from "@domain/wave/zombie-type";
import { getContainer } from "@infrastructure/container";
import { asChapterNumber } from "@shared/types/branded";
import Phaser from "phaser";
import { COLOR_HEX, SCENE_KEYS, VIEWPORT, px } from "../config";
import { JuiceManager } from "../managers/juice-manager";
import { BossHud } from "../objects/boss-hud";
import { Zombie } from "../objects/zombie";

const FLED_LIMIT = 5;
// 좀비 spawn 영역 — HUD 상단/하단 + 좌우 가장자리 제외. px() = dpr 곱.
const SPAWN_AREA = {
  minX: px(60),
  maxX: VIEWPORT.width - px(60),
  minY: px(130),
  maxY: VIEWPORT.height - px(100),
};
// 좀비끼리 hit box 겹침 회피 — Phaser input.topOnly=true 환경에서 가려진 좀비의 hover/click이
// 무시되는 문제(사용자 시각에서 "되었다 안 되었다" 비결정성)를 줄인다.
// 좀비 hit box(120 dpr)의 80% — 미세 겹침은 허용하되 완전 가림 회피.
const MIN_SPAWN_DISTANCE_PX = px(96);

// Chapter 1은 학습 단계 → 더 느린 spawn rate, 더 긴 lifespan, 더 적은 좀비 수.
function paceForChapter(chapter: number): {
  spawnRateScale: number;
  lifespanScale: number;
  zombiesPerWave: (wave: number) => number;
} {
  if (chapter <= 1) {
    return {
      spawnRateScale: 1.6,
      lifespanScale: 1.8,
      zombiesPerWave: (wave) => Math.min(2 + Math.floor((wave - 1) / 2), 5), // wave 1=2, w3=3, w5=4, w7=5
    };
  }
  if (chapter === 2) {
    return {
      spawnRateScale: 1.3,
      lifespanScale: 1.3,
      zombiesPerWave: () => 5,
    };
  }
  return {
    spawnRateScale: 1.0,
    lifespanScale: 1.0,
    zombiesPerWave: () => 6,
  };
}

type ActiveZombie = {
  readonly id: string;
  readonly obj: Zombie;
  readonly type: ZombieType;
  readonly spawnedAt: number;
  readonly lifespanMs: number;
};

export type GameSceneInitData = {
  readonly chapter?: number;
  readonly carryMeta?: MetaProgression;
  readonly carryStreak?: DailyStreak;
  readonly carryRunId?: string;
  readonly carryStartedAt?: number;
  readonly carryEarnedCoin?: number;
};

export class GameScene extends Phaser.Scene {
  private chapter = 1;
  private wave = 1;
  private score: Score = Score.zero();
  private combo: Combo = ComboClass.initial();
  private lastHitAtMs = 0;
  private fled = 0;
  private earnedCoinAccum = 0;
  private zombies: ActiveZombie[] = [];
  private nextSpawnAtMs = 0;
  private spawnedInWave = 0;
  private killedInWave = 0;
  // killed + fled in current wave. wave 진행 조건은 이 값 기준.
  // (killedInWave만으로 판정하면 모든 좀비가 도주했을 때 wave가 영원히 멈춤 — spawn deadlock.)
  private resolvedInWave = 0;
  private nextZombieId = 0;
  private bossZombie: Zombie | null = null;
  private bossHud: BossHud | null = null;
  private bossWaveActive = false;
  private bossStartTimeMs = 0;
  private bossMinionIds: Set<string> = new Set();
  private juice!: JuiceManager;
  private spawner = new Spawner();
  private meta: MetaProgression = MetaProgression.empty();
  private streak: DailyStreak | null = null;
  private runId = "";
  private runStartedAt = 0;
  private isPaused = false;

  constructor() {
    super({ key: SCENE_KEYS.game });
  }

  init(data: GameSceneInitData): void {
    this.chapter = Math.max(1, Math.min(5, data.chapter ?? 1));
    this.wave = 1;
    this.score = Score.zero();
    this.combo = ComboClass.initial();
    this.lastHitAtMs = 0;
    this.fled = 0;
    this.earnedCoinAccum = data.carryEarnedCoin ?? 0;
    this.zombies = [];
    this.spawnedInWave = 0;
    this.killedInWave = 0;
    this.resolvedInWave = 0;
    this.nextZombieId = 0;
    this.bossZombie = null;
    this.bossHud = null;
    this.bossWaveActive = false;
    this.bossStartTimeMs = 0;
    this.bossMinionIds = new Set();
    this.isPaused = false;
    this.meta = data.carryMeta ?? MetaProgression.empty();
    this.streak = data.carryStreak ?? null;
    if (data.carryRunId !== undefined) {
      this.runId = data.carryRunId;
    }
    if (data.carryStartedAt !== undefined) {
      this.runStartedAt = data.carryStartedAt;
    }
  }

  create(): void {
    const container = getContainer(this);
    this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);

    // 첫 챕터 시작 시 startRun 호출.
    if (this.runId === "") {
      this.runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const result = container.useCases.startRun(
        {
          saveStore: container.ports.saveStore,
          clock: container.ports.clock,
          random: container.ports.random,
        },
        { runId: this.runId },
      );
      this.runStartedAt = result.startedAt;
      this.meta = result.meta;
      this.streak = result.streak;
    }

    this.juice = new JuiceManager(this, container.ports.audio, container.ports.haptic);

    // HUD scene 병행 시작.
    if (!this.scene.isActive(SCENE_KEYS.hud)) {
      this.scene.launch(SCENE_KEYS.hud);
    }

    this.publishHud();
    this.scheduleNextSpawn();

    // 입력 — 좀비 hit
    // topOnly=true (Phaser 기본값이지만 명시): pointer 아래 여러 interactive object가 겹치면
    // 가장 top depth 하나만 GAMEOBJECT_DOWN 발화. HUD scene과 좀비 영역이 우발적으로 겹치는
    // 경우에도 좀비 입력이 가로채이지 않도록 방어.
    this.input.topOnly = true;
    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);

    // 빈 공간 tap = miss (combo reset 없음, 단순 hit SFX)
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      // pointer가 zombie hit zone에 있으면 GAMEOBJECT_DOWN가 먼저 발화 후 막힘.
      // 여기서는 background tap만 — silent.
      void pointer;
    });

    // e2e 검증용 — window에 현재 활성 scene 표시 (Playwright polling 진입점).
    this.publishE2eState();
  }

  private scheduleNextSpawn(): void {
    const wave = Wave.of(this.wave);
    if (wave.isBossWave()) {
      // 보스 wave — 단일 CEO spawn 직후 spawn 멈춤.
      if (!this.bossZombie) {
        this.spawnBoss();
      }
      this.nextSpawnAtMs = Number.POSITIVE_INFINITY;
      return;
    }
    // 첫 spawn은 즉시 (사용자가 좀비를 빨리 봐야 학습 가능).
    if (this.spawnedInWave === 0) {
      this.nextSpawnAtMs = this.time.now;
      return;
    }
    const container = getContainer(this);
    const baseDelay = this.spawner.nextSpawnDelayMs(wave, container.ports.random);
    const pace = paceForChapter(this.chapter);
    this.nextSpawnAtMs = this.time.now + baseDelay * pace.spawnRateScale;
  }

  private currentZombiesPerWave(): number {
    return paceForChapter(this.chapter).zombiesPerWave(this.wave);
  }

  private spawnZombie(): void {
    if (this.spawnedInWave >= this.currentZombiesPerWave()) return;
    const container = getContainer(this);
    const wave = Wave.of(this.wave);
    const type = this.spawner.spawn(wave, container.ports.random);
    const spec = specOf(type);
    // 기존 좀비 위치와 겹치지 않는 spawn 좌표 시도 (최대 5회). 모두 실패 시 마지막 점 채택.
    const existingPoints = this.zombies.map((z) => ({ x: z.obj.x, y: z.obj.y }));
    const point = findSpawnPoint(
      existingPoints,
      SPAWN_AREA,
      MIN_SPAWN_DISTANCE_PX,
      container.ports.random,
    );
    const id = `z-${this.chapter}-${this.wave}-${this.nextZombieId}`;
    this.nextZombieId += 1;
    // 일반 좀비는 모두 1tap (sample 친숙도 + 모바일 카주얼 페이싱).
    const z = new Zombie(this, point.x, point.y, { id, type, hp: 1, maxHp: 1 });
    const pace = paceForChapter(this.chapter);
    this.zombies.push({
      id,
      obj: z,
      type,
      spawnedAt: this.time.now,
      lifespanMs: spec.lifespanMs * pace.lifespanScale,
    });
    this.spawnedInWave += 1;
  }

  private spawnBoss(): void {
    const container = getContainer(this);
    const chapterBranded = asChapterNumber(this.chapter);
    const payload = spawnBossWave(chapterBranded);

    // 1) CEO 스폰 (중앙 고정)
    const hp = bossHpForChapter(this.chapter);
    const cx = VIEWPORT.width / 2;
    const cy = VIEWPORT.height / 2;
    const ceoId = `boss-${this.chapter}`;
    const ceo = new Zombie(this, cx, cy, { id: ceoId, type: ZOMBIE_TYPE.CEO, hp, maxHp: hp });
    this.bossZombie = ceo;
    this.zombies.push({
      id: ceoId,
      obj: ceo,
      type: ZOMBIE_TYPE.CEO,
      spawnedAt: this.time.now,
      lifespanMs: 60000,
    });

    // 2) 미니언 일괄 스폰 (한 frame 내) — 기존 spawner 좌표 로직 재사용
    this.bossMinionIds = new Set();
    for (const spec of payload.minions) {
      for (let i = 0; i < spec.count; i++) {
        const minionSpec = specOf(spec.type);
        const existingPoints = this.zombies.map((z) => ({ x: z.obj.x, y: z.obj.y }));
        const point = findSpawnPoint(
          existingPoints,
          SPAWN_AREA,
          MIN_SPAWN_DISTANCE_PX,
          container.ports.random,
        );
        const minionId = `boss-minion-${this.chapter}-${this.nextZombieId++}`;
        const minion = new Zombie(this, point.x, point.y, {
          id: minionId,
          type: spec.type,
          hp: minionSpec.hp,
          maxHp: minionSpec.hp,
        });
        this.zombies.push({
          id: minionId,
          obj: minion,
          type: spec.type,
          spawnedAt: this.time.now,
          lifespanMs: minionSpec.lifespanMs,
        });
        this.bossMinionIds.add(minionId);
      }
    }

    // 3) HUD + 플래그
    this.bossHud = new BossHud(this, VIEWPORT.width / 2, px(40), hp);
    this.bossHud.setDepth(900);
    this.bossWaveActive = true;
    this.bossStartTimeMs = container.ports.clock.now();
    void payload.phase; // phase config는 update() tick에서 fresh 조회 (격노 단계 반영)
  }

  private onZombieDown(_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject): void {
    if (this.isPaused) return;
    if (!(obj instanceof Zombie)) return;
    const container = getContainer(this);
    const localPoint = obj.getLocalPoint(_pointer.x, _pointer.y);
    const isCritical =
      obj.zombieType !== ZOMBIE_TYPE.CEO ? obj.isHeadHit(localPoint.x, localPoint.y) : false;
    // CEO weak spot: head = critical zone (same logic)
    const isWeakSpot =
      obj.zombieType === ZOMBIE_TYPE.CEO ? obj.isHeadHit(localPoint.x, localPoint.y) : false;

    const dmg = 1 + Math.max(0, this.meta.damage());
    const killed = obj.takeDamage(dmg * (isWeakSpot ? 2 : 1));

    if (!killed) {
      container.audioManager.play("hit");
      return;
    }

    // killZombie use case
    const now = this.time.now;
    const result = container.useCases.killZombie(
      {
        random: container.ports.random,
        clock: container.ports.clock,
      },
      {
        zombieType: obj.zombieType,
        isCritical,
        currentScore: this.score,
        currentCombo: this.combo,
        meta: this.meta,
        killedAtMs: now,
        lastHitAtMs: this.lastHitAtMs === 0 ? now : this.lastHitAtMs,
      },
    );
    this.score = result.newScore;
    this.combo = result.newCombo;
    this.lastHitAtMs = now;
    this.earnedCoinAccum += result.earnedCoin;

    // Juice
    if (obj.zombieType === ZOMBIE_TYPE.CEO) {
      this.juice.applyKillJuice("boss_kill", obj.x, obj.y, "usb");
    } else if (isCritical) {
      this.juice.applyKillJuice("crit", obj.x, obj.y, themeForZombie(obj.zombieType));
    } else {
      this.juice.applyKillJuice("normal", obj.x, obj.y, themeForZombie(obj.zombieType));
    }
    if (this.combo.count() === 5 || this.combo.count() === 10 || this.combo.count() === 15) {
      this.juice.applyKillJuice("combo_5+", obj.x, obj.y, themeForZombie(obj.zombieType));
    }

    // 좀비 제거
    this.removeZombie(obj.zombieId);
    this.killedInWave += 1;
    this.resolvedInWave += 1;

    if (obj.zombieType === ZOMBIE_TYPE.CEO) {
      this.onBossKilled();
      return;
    }

    this.publishHud();

    // wave 종료 판정 — killed + fled가 wave 한도를 채우면 진행.
    if (this.resolvedInWave >= this.currentZombiesPerWave()) {
      this.advanceWave();
    }
  }

  private removeZombie(id: string): void {
    const idx = this.zombies.findIndex((z) => z.id === id);
    if (idx >= 0) {
      const removed = this.zombies[idx];
      if (removed) removed.obj.destroy();
      this.zombies.splice(idx, 1);
    }
  }

  private onBossKilled(): void {
    this.isPaused = true;

    // D6: 잔여 미니언 한 frame 내 일괄 폭사 — 점수 정상 인정, drop은 후속 spec 범위
    for (const minionId of Array.from(this.bossMinionIds)) {
      const entry = this.zombies.find((z) => z.id === minionId);
      if (entry) {
        const spec = specOf(entry.type);
        this.score = this.score.add(spec.reward);
        this.removeZombie(minionId);
      }
    }
    this.bossMinionIds.clear();
    this.bossWaveActive = false;

    if (this.bossHud) {
      this.bossHud.destroy();
      this.bossHud = null;
    }
    this.bossZombie = null;
    this.publishHud();

    this.time.delayedCall(900, () => {
      this.endChapter();
    });
  }

  private endChapter(): void {
    // GameOverScene으로 전이 — 카드 선택 또는 다음 챕터 또는 메인 메뉴.
    // GameScene 자신을 stop 안 하면 GameScene input이 GameOverScene 위에서 가로채감.
    this.scene.stop(SCENE_KEYS.hud);
    this.scene.start(SCENE_KEYS.gameOver, {
      chapter: this.chapter,
      score: this.score,
      earnedCoin: this.earnedCoinAccum,
      meta: this.meta,
      streak: this.streak,
      runId: this.runId,
      runStartedAt: this.runStartedAt,
      reason: this.chapter >= 5 ? "clear" : "chapter_end",
      bestReachedChapter: this.chapter,
    });
    this.scene.stop();
  }

  private advanceWave(): void {
    if (this.wave >= 10) {
      // wave 10 클리어 == 보스 처치 후. 이 분기는 도달하지 않음.
      return;
    }
    this.wave += 1;
    this.spawnedInWave = 0;
    this.killedInWave = 0;
    this.resolvedInWave = 0;
    this.juice.applyKillJuice("wave_clear", VIEWPORT.width / 2, VIEWPORT.height / 2, "paper");
    this.scheduleNextSpawn();
    this.publishHud();
  }

  update(): void {
    if (this.isPaused) return;
    this.juice.tickFps();

    // spawn tick
    if (this.time.now >= this.nextSpawnAtMs && this.spawnedInWave < this.currentZombiesPerWave()) {
      this.spawnZombie();
      this.scheduleNextSpawn();
    }

    // lifespan check — fled
    const now = this.time.now;
    const toRemove: string[] = [];
    for (const z of this.zombies) {
      if (z.type === ZOMBIE_TYPE.CEO) continue;
      if (now - z.spawnedAt > z.lifespanMs) {
        toRemove.push(z.id);
      }
    }
    for (const id of toRemove) {
      // D5 γ 격리: 보스 wave 중 미니언 도주는 fled 카운트 안 함, combo도 유지
      if (this.bossWaveActive && this.bossMinionIds.has(id)) {
        this.bossMinionIds.delete(id);
        this.removeZombie(id);
        continue;
      }
      this.fled += 1;
      this.resolvedInWave += 1;
      this.combo = this.combo.miss();
      this.removeZombie(id);
    }
    if (toRemove.length > 0) {
      this.publishHud();
      if (this.fled >= FLED_LIMIT) {
        this.onFledLimit();
        return;
      }
      // 도주로 wave가 완료되면 다음 wave로 진행 (deadlock 방지).
      if (this.resolvedInWave >= this.currentZombiesPerWave()) {
        this.advanceWave();
      }
    }

    // boss 위치 갱신 (Lissajous 8자 + 격노 단계 가속)
    if (this.bossWaveActive && this.bossZombie) {
      const container = getContainer(this);
      const chapterBranded = asChapterNumber(this.chapter);
      const basePhase = getPhaseConfig(chapterBranded);
      const maxHp = bossHpForChapter(this.chapter);
      const rage = computeRageLevel(this.bossZombie.hp, maxHp, chapterBranded);
      const effective = applyRageMultipliers(basePhase, rage);
      const pos = tickBossPosition({
        clock: container.ports.clock,
        bossStartTimeMs: this.bossStartTimeMs,
        center: { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 },
        R: effective.R,
        omega: effective.omega,
      });
      this.bossZombie.setPosition(pos.x, pos.y);
    }

    // boss HP 동기화
    if (this.bossZombie && this.bossHud) {
      this.bossHud.setHp(this.bossZombie.hp);
    }

    // e2e 검증용 state publish (매 프레임).
    this.publishE2eState();
  }

  /**
   * Playwright e2e가 polling으로 게임 상태를 검증할 수 있도록 window에 노출.
   * production에서도 노출되지만 cheating 외 위험 없음 (단방향 read-only snapshot).
   * window.__zp_state 형태로 attach.
   */
  private publishE2eState(): void {
    if (typeof window === "undefined") return;
    const snapshot = {
      chapter: this.chapter,
      wave: this.wave,
      score: this.score.value(),
      fled: this.fled,
      comboCount: this.combo.count(),
      isPaused: this.isPaused,
      zombies: this.zombies.map((z) => ({
        id: z.id,
        type: z.type,
        x: z.obj.x,
        y: z.obj.y,
      })),
      sceneActive: this.scene.isActive(),
      activeScene: SCENE_KEYS.game,
    };
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_state: unknown }).__zp_state = snapshot;
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.game;
  }

  private onFledLimit(): void {
    this.isPaused = true;
    this.time.delayedCall(500, () => {
      this.scene.stop(SCENE_KEYS.hud);
      this.scene.start(SCENE_KEYS.gameOver, {
        chapter: this.chapter,
        score: this.score,
        earnedCoin: this.earnedCoinAccum,
        meta: this.meta,
        streak: this.streak,
        runId: this.runId,
        runStartedAt: this.runStartedAt,
        reason: "fled_limit",
        bestReachedChapter: Math.max(0, this.chapter - 1),
      });
      // GameScene 자신을 stop — input handler가 GameOverScene 위에서 가로채지 않도록.
      this.scene.stop();
    });
  }

  private publishHud(): void {
    const data = {
      score: this.score.value(),
      comboCount: this.combo.count(),
      comboMultiplier: this.combo.multiplier(),
      chapter: this.chapter,
      floor: (this.chapter - 1) * 10 + this.wave,
      fled: this.fled,
      fledLimit: FLED_LIMIT,
      earnedCoin: this.earnedCoinAccum,
    };
    this.registry.set("hud", data);
  }

  shutdown(): void {
    this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);
    if (this.juice) {
      this.juice.destroy();
    }
    for (const z of this.zombies) {
      z.obj.destroy();
    }
    this.zombies = [];
  }
}

function themeForZombie(type: ZombieType): "card" | "paper" | "coffee" | "usb" {
  switch (type) {
    case ZOMBIE_TYPE.INTERN:
      return "card";
    case ZOMBIE_TYPE.MIDDLE:
      return "paper";
    case ZOMBIE_TYPE.LEAD:
      return "coffee";
    case ZOMBIE_TYPE.CEO:
      return "usb";
    /* c8 ignore next 2 -- exhaustive */
    default:
      return "paper";
  }
}

// Bible §1 안내: 게임 화면 텍스트 0줄 (HUD 숫자 제외). HUD scene이 별도 표시.
export const GAME_FLED_LIMIT = FLED_LIMIT;
