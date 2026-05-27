import { describe, expect, it } from "vitest";
import { WebAudioSynth } from "./web-audio-synth";

describe("WebAudioSynth", () => {
  it("[Happy] play does not throw when ctx is suspended", () => {
    const synth = new WebAudioSynth();
    expect(() => synth.play("kill_normal")).not.toThrow();
  });

  it("[Happy] resume returns a promise", async () => {
    const synth = new WebAudioSynth();
    await expect(synth.resume()).resolves.toBeUndefined();
  });

  it("[Boundary] handles all defined events", () => {
    const synth = new WebAudioSynth();
    const events = [
      "kill_normal",
      "kill_crit",
      "combo_5",
      "powerup_pickup",
      "boss_kill",
      "boss_approaching",
      "wave_clear",
      "hit",
      "menu_select",
      "punch_in",
    ] as const;
    for (const e of events) {
      expect(() => synth.play(e)).not.toThrow();
    }
  });

  // [Happy] boss_approaching(하강 저음 rumble)도 안전하게 재생 시도
  it("[Happy] boss_approaching does not throw", () => {
    const synth = new WebAudioSynth();
    expect(() => synth.play("boss_approaching")).not.toThrow();
  });

  it("[Error] silent when AudioContext is absent", () => {
    const w = globalThis as unknown as {
      AudioContext?: unknown;
      webkitAudioContext?: unknown;
    };
    const origAc = w.AudioContext;
    const origWk = w.webkitAudioContext;
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    try {
      const synth = new WebAudioSynth();
      expect(() => synth.play("hit")).not.toThrow();
    } finally {
      w.AudioContext = origAc;
      w.webkitAudioContext = origWk;
    }
  });
});
