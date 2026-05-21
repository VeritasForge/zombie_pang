// Composition root — Phaser game + DI 컨테이너 부트스트랩.
// 도메인은 import하지 않는다 (Hexagonal DIP). use case 함수만 wire-up.

import { LocalStorageSaveStore } from "@adapters/persistence/local-storage-save-store";
import { SCENE_KEYS, VIEWPORT } from "@adapters/phaser/config";
import { AudioManager } from "@adapters/phaser/managers/audio-manager";
import { BootScene } from "@adapters/phaser/scenes/boot-scene";
import { GameOverScene } from "@adapters/phaser/scenes/game-over-scene";
import { GameScene } from "@adapters/phaser/scenes/game-scene";
import { HudScene } from "@adapters/phaser/scenes/hud-scene";
import { MainMenuScene } from "@adapters/phaser/scenes/main-menu-scene";
import { PreloadScene } from "@adapters/phaser/scenes/preload-scene";
import { applyPowerUp } from "@application/apply-powerup";
import { endRun } from "@application/end-run";
import { killZombie } from "@application/kill-zombie";
import { pickUpgrade } from "@application/pick-upgrade";
import { startRun } from "@application/start-run";
import type { IAudio } from "@domain/ports/audio";
import type { IClock } from "@domain/ports/clock";
import type { IHaptic } from "@domain/ports/haptic";
import type { IRandom } from "@domain/ports/random";
import type { ISaveStore } from "@domain/ports/save-store";
import Phaser from "phaser";
import { WebAudioSynth } from "./audio/web-audio-synth";
import { SystemClock } from "./clock/system-clock";
import { VibrationApi } from "./haptic/vibration-api";
import { SeededRandom } from "./random/seeded-random";

export type UseCases = {
  readonly startRun: typeof startRun;
  readonly killZombie: typeof killZombie;
  readonly applyPowerUp: typeof applyPowerUp;
  readonly pickUpgrade: typeof pickUpgrade;
  readonly endRun: typeof endRun;
};

export type Ports = {
  readonly saveStore: ISaveStore;
  readonly clock: IClock;
  readonly random: IRandom;
  readonly audio: IAudio;
  readonly haptic: IHaptic;
};

export type Container = {
  readonly ports: Ports;
  readonly useCases: UseCases;
  readonly audioManager: AudioManager;
};

const SCENE_DATA_KEY = "container";

function getStorage(): Storage {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage
      : ({
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
          clear: () => undefined,
          key: () => null,
          length: 0,
        } as Storage);
  } catch {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
  }
}

export function buildContainer(): Container {
  const saveStore = new LocalStorageSaveStore(getStorage());
  const clock = new SystemClock();
  const random = new SeededRandom();
  const audio = new WebAudioSynth();
  const haptic = new VibrationApi();
  const audioManager = new AudioManager(audio);

  return {
    ports: { saveStore, clock, random, audio, haptic },
    useCases: {
      startRun,
      killZombie,
      applyPowerUp,
      pickUpgrade,
      endRun,
    },
    audioManager,
  };
}

export function startGame(parent: HTMLElement): Phaser.Game {
  const container = buildContainer();
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#1a1a1a",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEWPORT.width,
      height: VIEWPORT.height,
    },
    render: {
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
      pixelArt: false,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    input: {
      activePointers: 3,
      touch: { capture: true },
    },
    scene: [BootScene, PreloadScene, MainMenuScene, GameScene, HudScene, GameOverScene],
  };

  const game = new Phaser.Game(config);
  // Container를 game.registry에 저장 — 모든 scene에서 접근 가능.
  game.registry.set(SCENE_DATA_KEY, container);
  // Boot scene에 명시적으로 data 주입 (scene.start 직전 트리거).
  game.scene.start(SCENE_KEYS.boot, { container });

  if (typeof import.meta !== "undefined" && import.meta.hot) {
    import.meta.hot.dispose(() => {
      game.destroy(true, false);
    });
  }

  return game;
}

export function getContainer(scene: Phaser.Scene): Container {
  const fromRegistry = scene.game.registry.get(SCENE_DATA_KEY) as Container | undefined;
  if (!fromRegistry) {
    throw new Error("Container not initialized. Did you call startGame()?");
  }
  return fromRegistry;
}

export const CONTAINER_KEY = SCENE_DATA_KEY;
