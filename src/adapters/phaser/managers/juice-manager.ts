// JuiceManager — Bible §5 juice 매트릭스 통합.
// hit-stop / shake / flash / freeze / particle / SFX / haptic 일괄 트리거.

import type { IAudio } from "@domain/ports/audio";
import type { IHaptic } from "@domain/ports/haptic";
import Phaser from "phaser";
import { COLORS, FPS, TIMINGS, VIEWPORT, px } from "../config";
import { ParticleSystem, type ParticleTheme } from "../objects/particle";

export type KillJuiceEvent = "normal" | "crit" | "combo_5+" | "boss_kill" | "wave_clear";

export class JuiceManager {
  private particles: ParticleSystem;
  private framesBelowThreshold = 0;
  private particleScale: 1 | 0.5 | 0.25 = 1;
  private flashOverlay: Phaser.GameObjects.Rectangle | null = null;
  // freeze frame overlay는 매 호출마다 새 Rectangle을 생성. tween onComplete에서 destroy되지만
  // boss kill 등으로 scene이 stop되는 경우 tween cancel 후 overlay가 잔존할 수 있음.
  // 추적 후 destroy()에서 일괄 정리하여 다음 scene의 입력을 가리지 않도록 보장.
  private activeFreezeOverlays: Phaser.GameObjects.Rectangle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly audio: IAudio,
    private readonly haptic: IHaptic,
  ) {
    this.particles = new ParticleSystem(scene);
    // scene shutdown 시 자동 cleanup. 안전망 — GameScene.shutdown에서 destroy()를 명시 호출하지만
    // boss kill 후 delayedCall(900) 사이의 비정상 종료 등 엣지 케이스 방어.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** scene.update에서 호출 — 평균 FPS<50이 3프레임 연속이면 particle 다운그레이드. */
  tickFps(): void {
    const fps = this.scene.game.loop.actualFps;
    if (fps < FPS.threshold) {
      this.framesBelowThreshold += 1;
      if (this.framesBelowThreshold >= FPS.belowFramesToDegrade) {
        this.degradeParticles();
      }
    } else {
      this.framesBelowThreshold = 0;
    }
  }

  private degradeParticles(): void {
    if (this.particleScale === 1) this.particleScale = 0.5;
    else if (this.particleScale === 0.5) this.particleScale = 0.25;
  }

  applyKillJuice(event: KillJuiceEvent, x: number, y: number, theme: ParticleTheme = "card"): void {
    switch (event) {
      case "normal": {
        this.applyHitStop(TIMINGS.hitStop.normal);
        this.applyShake(TIMINGS.shake.normal, 120);
        this.emitParticles(x, y, TIMINGS.particleCount.normal, theme);
        this.audio.play("kill_normal");
        break;
      }
      case "crit": {
        this.applyHitStop(TIMINGS.hitStop.crit);
        this.applyShake(TIMINGS.shake.crit, 150);
        this.applyFlash(0xffffff, TIMINGS.flash.white);
        this.emitParticles(x, y, TIMINGS.particleCount.crit, theme);
        this.audio.play("kill_crit");
        this.haptic.vibrate(50);
        break;
      }
      case "combo_5+": {
        this.emitParticles(x, y, TIMINGS.particleCount.normal, theme);
        this.audio.play("combo_5");
        this.haptic.vibrate([30, 20, 30]);
        break;
      }
      case "boss_kill": {
        this.applyHitStop(TIMINGS.hitStop.boss);
        this.applyShake(TIMINGS.shake.boss, 300);
        this.applyFlash(COLORS.comboGold, TIMINGS.flash.gold);
        this.applyFreezeFrame(TIMINGS.freeze.boss);
        this.emitParticles(x, y, TIMINGS.particleCount.boss, "usb");
        this.audio.play("boss_kill");
        this.haptic.vibrate([100, 40, 100]);
        break;
      }
      case "wave_clear": {
        this.applyFreezeFrame(TIMINGS.freeze.waveClear);
        this.audio.play("wave_clear");
        break;
      }
      /* c8 ignore next 2 -- exhaustive switch */
      default:
        break;
    }
  }

  applyHitStop(_durationMs: number): void {
    // camera zoom yoyo는 dpr×zoom 조합 시 hit detection 좌표를 깨뜨려 제거.
    // hit feedback은 zombie의 scale yoyo + tint flash로 대체 (zombie.ts takeDamage).
    void _durationMs;
  }

  applyShake(amplitude: number, durationMs: number): void {
    // Phaser shake intensity는 0~1 비율. amplitude(이미 dpr 적용) → 화면 폭(VIEWPORT, 동일 dpr 적용) 기준 정규화.
    const intensity = amplitude / (this.scene.cameras.main.width || VIEWPORT.width);
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  applyFlash(color: number, durationMs: number): void {
    const cam = this.scene.cameras.main;
    if (!this.flashOverlay) {
      this.flashOverlay = this.scene.add.rectangle(
        cam.width / 2,
        cam.height / 2,
        cam.width,
        cam.height,
        color,
        0,
      );
      this.flashOverlay.setScrollFactor(0).setDepth(1000);
    }
    this.flashOverlay.setFillStyle(color, 0.6);
    this.scene.tweens.add({
      targets: this.flashOverlay,
      fillAlpha: 0,
      duration: Math.max(durationMs * 4, 80),
      ease: "Quad.easeOut",
      onUpdate: (_t, target: Phaser.GameObjects.Rectangle) => {
        target.setFillStyle(color, target.fillAlpha);
      },
    });
  }

  applyFreezeFrame(durationMs: number): void {
    // 화면 흑백 vignette — 0.6초 (Boss kill) / 0.3초 (Wave clear).
    const cam = this.scene.cameras.main;
    const overlay = this.scene.add.rectangle(
      cam.width / 2,
      cam.height / 2,
      cam.width,
      cam.height,
      0x000000,
      0.3,
    );
    overlay.setScrollFactor(0).setDepth(999);
    this.activeFreezeOverlays.push(overlay);
    this.scene.tweens.add({
      targets: overlay,
      fillAlpha: 0,
      duration: durationMs,
      ease: "Quad.easeOut",
      onComplete: () => {
        overlay.destroy();
        this.activeFreezeOverlays = this.activeFreezeOverlays.filter((o) => o !== overlay);
      },
    });
  }

  /** BOSS APPROACHING 무텍스트 cue — 4코너→중앙 수렴 펄스 ×2 + 약한 셰이크 + haptic. */
  playBossApproaching(): void {
    const cam = this.scene.cameras.main;
    this.audio.play("boss_approaching");
    this.haptic.vibrate([80, 40, 80]);
    this.applyShake(TIMINGS.shake.normal, 200);
    for (let pulse = 0; pulse < 2; pulse++) {
      const ring = this.scene.add.graphics();
      ring.setScrollFactor(0).setDepth(998);
      ring.x = cam.width / 2;
      ring.y = cam.height / 2;
      ring.lineStyle(px(6), 0xff2d2d, 0.6);
      ring.strokeRect(-cam.width / 2, -cam.height / 2, cam.width, cam.height);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 0.7,
        scaleY: 0.7,
        alpha: 0,
        delay: pulse * 250,
        duration: 350,
        ease: "Quad.easeIn",
        onComplete: () => ring.destroy(),
      });
    }
  }

  emitParticles(x: number, y: number, count: number, theme: ParticleTheme): void {
    const scaled = Math.max(2, Math.floor(count * this.particleScale));
    this.particles.emit(x, y, scaled, theme);
  }

  destroy(): void {
    this.particles.destroy();
    if (this.flashOverlay) {
      this.flashOverlay.destroy();
      this.flashOverlay = null;
    }
    // 활성 freeze overlay 모두 정리 — scene 전이 시 잔존 방지.
    for (const o of this.activeFreezeOverlays) {
      if (o.active) o.destroy();
    }
    this.activeFreezeOverlays = [];
  }
}
