// Composition root — Phaser game + DI 컨테이너 부트스트랩.
// 도메인은 import하지 않는다 (Hexagonal DIP). use case 함수만 wire-up.

import { LocalStorageSaveStore } from "@adapters/persistence/local-storage-save-store";
import { PhaserGameClock } from "@adapters/phaser/clocks/phaser-game-clock";
import { PHASER_FPS, SCENE_KEYS, VIEWPORT } from "@adapters/phaser/config";
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
import { InstallPromptManager } from "./pwa/install-prompt";
import { MidnightCueManager } from "./pwa/midnight-cue";
import { registerServiceWorker } from "./pwa/register-sw";
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

export type PwaServices = {
  readonly installPrompt: InstallPromptManager;
  readonly midnightCue: MidnightCueManager;
};

export type Container = {
  readonly ports: Ports;
  readonly useCases: UseCases;
  readonly audioManager: AudioManager;
  readonly pwa: PwaServices;
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
  const installPrompt = new InstallPromptManager(saveStore);
  const midnightCue = new MidnightCueManager();

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
    pwa: { installPrompt, midnightCue },
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
    fps: { ...PHASER_FPS },
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
  // PWA Service Worker 등록 — fire-and-forget. dev 모드 / SW 미지원은 내부에서 graceful skip.
  void registerServiceWorker({
    onNeedRefresh: () => console.info("[좀비팡] 업데이트 발견 — 새로고침 시 적용됩니다."),
    onOfflineReady: () => console.info("[좀비팡] 오프라인 준비 완료."),
    onRegisterError: (err) => console.warn("[좀비팡] SW 등록 실패", err),
  });
  // Phaser.Game 인스턴스가 생긴 이후, 도메인이 게임 루프와 동기화된 시간을 보도록
  // ports.clock을 PhaserGameClock으로 교체. SystemClock은 부팅 직전/jsdom 테스트 fallback.
  const phaserClock = new PhaserGameClock(game);
  const portsWithGameClock = { ...container.ports, clock: phaserClock };
  const containerWithGameClock: Container = { ...container, ports: portsWithGameClock };
  // Container를 game.registry에 저장 — 모든 scene에서 접근 가능.
  game.registry.set(SCENE_DATA_KEY, containerWithGameClock);
  // Boot scene에 명시적으로 data 주입 (scene.start 직전 트리거).
  game.scene.start(SCENE_KEYS.boot, { container: containerWithGameClock });

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
