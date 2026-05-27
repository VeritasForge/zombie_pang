// WebAudioSynth — IAudio 구현체 (Web Audio API 합성).
// 외부 음원 파일 0. oscillator + gain envelope만 사용.
// Bible §5 4-layer SFX 매트릭스 기반.

import type { AudioEvent, IAudio } from "@domain/ports/audio";

type Ctx = AudioContext;

type ToneSpec = {
  readonly type: OscillatorType;
  readonly freq: number;
  readonly /** Hz */ freqEnd?: number;
  readonly /** seconds */ durationS: number;
  readonly /** 0~1 */ gain: number;
  readonly /** seconds, 0=immediate */ delayS?: number;
};

const EVENT_TONES: Record<AudioEvent, readonly ToneSpec[]> = {
  kill_normal: [
    { type: "sine", freq: 200, durationS: 0.08, gain: 0.15 },
    { type: "square", freq: 400, durationS: 0.08, gain: 0.08 },
  ],
  kill_crit: [
    { type: "sawtooth", freq: 400, durationS: 0.15, gain: 0.18 },
    { type: "triangle", freq: 600, durationS: 0.05, gain: 0.12 },
  ],
  combo_5: [
    { type: "sine", freq: 600, durationS: 0.07, gain: 0.16 },
    { type: "sine", freq: 1200, durationS: 0.07, gain: 0.12, delayS: 0.07 },
    { type: "sine", freq: 1800, durationS: 0.07, gain: 0.1, delayS: 0.14 },
  ],
  powerup_pickup: [
    { type: "sine", freq: 523, durationS: 0.1, gain: 0.18 }, // C5
    { type: "sine", freq: 659, durationS: 0.1, gain: 0.16, delayS: 0.1 }, // E5
    { type: "sine", freq: 784, durationS: 0.1, gain: 0.14, delayS: 0.2 }, // G5
  ],
  boss_kill: [
    { type: "sawtooth", freq: 80, durationS: 0.6, gain: 0.22 },
    { type: "square", freq: 200, durationS: 0.3, gain: 0.12, delayS: 0.05 },
    { type: "sine", freq: 600, durationS: 0.15, gain: 0.16, delayS: 0.25 },
  ],
  boss_approaching: [
    // 하강 저음 rumble (보스 임박 telegraph). 60→40Hz.
    { type: "sawtooth", freq: 60, freqEnd: 40, durationS: 0.8, gain: 0.2 },
    { type: "square", freq: 120, freqEnd: 90, durationS: 0.6, gain: 0.08, delayS: 0.05 },
  ],
  wave_clear: [
    { type: "sine", freq: 523, durationS: 0.18, gain: 0.16 },
    { type: "sine", freq: 659, durationS: 0.18, gain: 0.14, delayS: 0.15 },
    { type: "sine", freq: 784, durationS: 0.24, gain: 0.14, delayS: 0.3 },
  ],
  hit: [{ type: "square", freq: 100, durationS: 0.05, gain: 0.14 }],
  menu_select: [{ type: "sine", freq: 800, durationS: 0.06, gain: 0.12 }],
  punch_in: [
    { type: "sine", freq: 1000, durationS: 0.1, gain: 0.14 },
    { type: "sine", freq: 800, durationS: 0.1, gain: 0.12, delayS: 0.1 },
  ],
};

export class WebAudioSynth implements IAudio {
  private _ctx: Ctx | null = null;

  private getCtx(): Ctx | null {
    if (this._ctx) return this._ctx;
    if (typeof globalThis === "undefined") return null;
    const w = globalThis as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this._ctx = new Ctor();
    } catch {
      this._ctx = null;
    }
    return this._ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // 사용자 gesture 부재 환경 등 — silent
      }
    }
  }

  play(event: AudioEvent): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    if (ctx.state !== "running") {
      // Audio가 아직 unlock되지 않은 상태 — silent skip (PreloadScene PUNCH IN 후 unlock됨).
      return;
    }
    const tones = EVENT_TONES[event];
    if (!tones) return;
    const now = ctx.currentTime;
    for (const tone of tones) {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tone.type;
        const startAt = now + (tone.delayS ?? 0);
        const stopAt = startAt + tone.durationS;
        osc.frequency.setValueAtTime(tone.freq, startAt);
        if (tone.freqEnd !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, tone.freqEnd), stopAt);
        }
        // Linear attack 5ms, exponential decay to near-zero by stopAt.
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, tone.gain), startAt + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(stopAt);
      } catch {
        // OscillatorNode lifecycle 예외 — silent skip.
      }
    }
  }
}
