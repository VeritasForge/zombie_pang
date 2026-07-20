// GameScene — 웨이브 클리커 메인 루프.
// 한 run 동안 유지되며 floor를 내부에서 증가. 도메인 직접 import 없이 floor-plan/spawner/use-case 사용.

import { MetaProgression } from "@domain/meta/progression"; // Task 5에서 제거되는 임시 shim
import { FLOOR_MAX, bandOf, floorPlan } from "@domain/run/floor-plan";
import { type Combo, Combo as ComboClass } from "@domain/score/combo";
import { Score } from "@domain/score/score";
import { findSpawnPoint } from "@domain/wave/spawn-position";
import { Spawner } from "@domain/wave/spawner";
import { ZOMBIE_TYPE, type ZombieType, specOf } from "@domain/wave/zombie-type";
import { getContainer } from "@infrastructure/container";
import Phaser from "phaser";
import { COLOR_HEX, INTERIOR_PALETTES, SCENE_KEYS, VIEWPORT, px } from "../config";
import { JuiceManager } from "../managers/juice-manager";
import { Zombie } from "../objects/zombie";

const SPAWN_AREA = {
  minX: px(60),
  maxX: VIEWPORT.width - px(60),
  minY: px(130),
  maxY: VIEWPORT.height - px(100),
};
const MIN_SPAWN_DISTANCE_PX = px(96);
const CRIT_DAMAGE = 2;

type ZpTestHooks = {
  readonly setFloor: (floor: number) => void;
  readonly forceZombieTimeout: () => void;
};

type ActiveZombie = {
  readonly id: string;
  readonly obj: Zombie;
  readonly type: ZombieType;
  readonly spawnedAt: number;
  readonly lifespanMs: number;
};

export type GameSceneInitData = {
  readonly floor?: number;
  readonly carryRunId?: string;
  readonly carryStartedAt?: number;
};

export class GameScene extends Phaser.Scene {
  private floor = 1;
  private score: Score = Score.zero();
  private combo: Combo = ComboClass.initial();
  private lastHitAtMs = 0;
  private fled = 0;
  private killedInFloor = 0;
  private zombies: ActiveZombie[] = [];
  private nextSpawnAtMs = 0;
  private nextZombieId = 0;
  private juice!: JuiceManager;
  private spawner = new Spawner();
  private runId = "";
  private runStartedAt = 0;
  private isPaused = false;

  constructor() {
    super({ key: SCENE_KEYS.game });
  }

  init(data: GameSceneInitData): void {
    this.floor = Math.max(1, Math.min(FLOOR_MAX, Math.floor(data.floor ?? 1)));
    this.score = Score.zero();
    this.combo = ComboClass.initial();
    this.lastHitAtMs = 0;
    this.fled = 0;
    this.killedInFloor = 0;
    this.zombies = [];
    this.nextZombieId = 0;
    this.isPaused = false;
    if (data.carryRunId !== undefined) this.runId = data.carryRunId;
    if (data.carryStartedAt !== undefined) this.runStartedAt = data.carryStartedAt;
  }

  create(): void {
    const container = getContainer(this);
    this.applyBackground();

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
    }

    this.juice = new JuiceManager(this, container.ports.audio, container.ports.haptic);
    if (!this.scene.isActive(SCENE_KEYS.hud)) {
      this.scene.launch(SCENE_KEYS.hud);
    }
    this.publishHud();
    this.scheduleNextSpawn();

    this.input.topOnly = true;
    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);

    this.publishE2eState();
    this.exposeTestHooks();
  }

  private applyBackground(): void {
    const palette = INTERIOR_PALETTES[bandOf(this.floor)] ?? INTERIOR_PALETTES[1];
    this.cameras.main.setBackgroundColor(palette ? palette.bg : COLOR_HEX.bgDark);
  }

  private plan() {
    return floorPlan(this.floor);
  }

  private needed(): number {
    return Math.max(0, this.plan().quota - this.killedInFloor);
  }

  private canSpawn(): boolean {
    const p = this.plan();
    return this.zombies.length < p.cap && this.zombies.length < this.needed();
  }

  private scheduleNextSpawn(): void {
    if (this.killedInFloor === 0 && this.zombies.length === 0) {
      this.nextSpawnAtMs = this.time.now; // 첫 좀비는 즉시
      return;
    }
    const container = getContainer(this);
    this.nextSpawnAtMs =
      this.time.now + this.spawner.delayForRate(this.plan().spawnRateMs, container.ports.random);
  }

  private spawnZombie(): void {
    if (!this.canSpawn()) return;
    const container = getContainer(this);
    const type = this.spawner.spawnForBand(bandOf(this.floor), container.ports.random);
    const spec = specOf(type);
    const existingPoints = this.zombies.map((z) => ({ x: z.obj.x, y: z.obj.y }));
    const point = findSpawnPoint(
      existingPoints,
      SPAWN_AREA,
      MIN_SPAWN_DISTANCE_PX,
      container.ports.random,
    );
    const id = `z-${this.floor}-${this.nextZombieId++}`;
    const z = new Zombie(this, point.x, point.y, { id, type, hp: spec.hp, maxHp: spec.hp });
    this.zombies.push({ id, obj: z, type, spawnedAt: this.time.now, lifespanMs: spec.lifespanMs });
  }

  private onZombieDown(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject): void {
    if (this.isPaused) return;
    if (!(obj instanceof Zombie)) return;
    const container = getContainer(this);
    const localPoint = obj.getLocalPoint(pointer.x, pointer.y);
    const isCritical = obj.isHeadHit(localPoint.x, localPoint.y);
    const killed = obj.takeDamage(isCritical ? CRIT_DAMAGE : 1);

    if (!killed) {
      container.audioManager.play("hit");
      return;
    }

    const now = this.time.now;
    const result = container.useCases.killZombie(
      { random: container.ports.random, clock: container.ports.clock },
      {
        zombieType: obj.zombieType,
        isCritical,
        currentScore: this.score,
        currentCombo: this.combo,
        meta: MetaProgression.empty(), // Task 5에서 제거
        killedAtMs: now,
        lastHitAtMs: this.lastHitAtMs === 0 ? now : this.lastHitAtMs,
      },
    );
    this.score = result.newScore;
    this.combo = result.newCombo;
    this.lastHitAtMs = now;

    if (isCritical) {
      this.juice.applyKillJuice("crit", obj.x, obj.y, themeForZombie(obj.zombieType));
    } else {
      this.juice.applyKillJuice("normal", obj.x, obj.y, themeForZombie(obj.zombieType));
    }
    const c = this.combo.count();
    if (c === 5 || c === 10 || c === 15) {
      this.juice.applyKillJuice("combo_5+", obj.x, obj.y, themeForZombie(obj.zombieType));
    }

    this.removeZombie(obj.zombieId);
    this.killedInFloor += 1;
    this.publishHud();

    if (this.killedInFloor >= this.plan().quota) {
      this.onFloorCleared();
    }
  }

  private onFloorCleared(): void {
    if (this.floor >= FLOOR_MAX) {
      this.endRunWith("clear");
      return;
    }
    this.juice.applyKillJuice("wave_clear", VIEWPORT.width / 2, VIEWPORT.height / 2, "paper");
    this.floor += 1;
    this.killedInFloor = 0;
    this.applyBackground();
    this.scheduleNextSpawn();
    this.publishHud();
  }

  private removeZombie(id: string): void {
    const idx = this.zombies.findIndex((z) => z.id === id);
    if (idx >= 0) {
      const removed = this.zombies[idx];
      if (removed) removed.obj.destroy();
      this.zombies.splice(idx, 1);
    }
  }

  update(): void {
    if (this.isPaused) return;
    this.juice.tickFps();

    if (this.time.now >= this.nextSpawnAtMs && this.canSpawn()) {
      this.spawnZombie();
      this.scheduleNextSpawn();
    }

    const now = this.time.now;
    const toRemove: string[] = [];
    for (const z of this.zombies) {
      if (now - z.spawnedAt > z.lifespanMs) toRemove.push(z.id);
    }
    for (const id of toRemove) {
      this.fled += 1;
      this.combo = this.combo.miss();
      this.removeZombie(id);
    }
    if (toRemove.length > 0) {
      this.publishHud();
      if (this.fled >= this.plan().escapeLimit) {
        this.onFloorFail();
        return;
      }
      this.scheduleNextSpawn();
    }

    this.publishE2eState();
  }

  private onFloorFail(): void {
    this.endRunWith("fled_limit");
  }

  private endRunWith(reason: "clear" | "fled_limit"): void {
    this.isPaused = true;
    const delay = reason === "clear" ? 900 : 500;
    this.time.delayedCall(delay, () => {
      this.scene.stop(SCENE_KEYS.hud);
      this.scene.start(SCENE_KEYS.gameOver, {
        score: this.score,
        floorsReached: reason === "clear" ? FLOOR_MAX : Math.max(0, this.floor - 1),
        reason,
        runId: this.runId,
        runStartedAt: this.runStartedAt,
      });
      this.scene.stop();
    });
  }

  private publishHud(): void {
    const p = this.plan();
    this.registry.set("hud", {
      score: this.score.value(),
      comboCount: this.combo.count(),
      comboMultiplier: this.combo.multiplier(),
      floor: this.floor,
      killed: this.killedInFloor,
      quota: p.quota,
      fled: this.fled,
      fledLimit: p.escapeLimit,
    });
  }

  private publishE2eState(): void {
    if (typeof window === "undefined") return;
    const p = this.plan();
    const snapshot = {
      floor: this.floor,
      quota: p.quota,
      killed: this.killedInFloor,
      score: this.score.value(),
      fled: this.fled,
      fledLimit: p.escapeLimit,
      comboCount: this.combo.count(),
      isPaused: this.isPaused,
      zombies: this.zombies.map((z) => ({ id: z.id, type: z.type, x: z.obj.x, y: z.obj.y })),
      sceneActive: this.scene.isActive(),
      activeScene: SCENE_KEYS.game,
    };
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_state: unknown }).__zp_state = snapshot;
    // biome-ignore lint/style/useNamingConvention: e2e polling entry point.
    (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.game;
  }

  private exposeTestHooks(): void {
    if (typeof window === "undefined") return;
    if (!import.meta.env.DEV && import.meta.env.VITE_ZP_E2E !== "1") return;
    // biome-ignore lint/style/useNamingConvention: e2e test hook 네임스페이스.
    (window as unknown as { __zp_test__: ZpTestHooks }).__zp_test__ = {
      setFloor: (floor: number): void => {
        this.floor = Math.max(1, Math.min(FLOOR_MAX, Math.floor(floor)));
        this.killedInFloor = 0;
        this.fled = 0;
        for (const z of [...this.zombies]) z.obj.destroy();
        this.zombies = [];
        this.applyBackground();
        this.scheduleNextSpawn();
        this.publishHud();
      },
      forceZombieTimeout: (): void => {
        const past = this.time.now - 1_000_000;
        for (const z of this.zombies) {
          (z as { spawnedAt: number }).spawnedAt = past;
        }
      },
    };
  }

  shutdown(): void {
    this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onZombieDown, this);
    if (this.juice) this.juice.destroy();
    for (const z of this.zombies) z.obj.destroy();
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
