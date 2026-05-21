// BootScene — Phaser engine 부트.
// docs/conventions/phaser.md §2: 즉시 PreloadScene 진입.

import Phaser from "phaser";
import { SCENE_KEYS } from "../config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.boot });
  }

  create(): void {
    if (typeof window !== "undefined") {
      // biome-ignore lint/style/useNamingConvention: e2e polling entry point — Playwright가 window.__zp_scene polling.
      (window as unknown as { __zp_scene: string }).__zp_scene = SCENE_KEYS.boot;
    }
    this.scene.start(SCENE_KEYS.preload);
  }
}
