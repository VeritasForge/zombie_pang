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
      "wave_clear",
      "hit",
      "menu_select",
      "punch_in",
    ] as const;
    for (const e of events) {
      expect(() => synth.play(e)).not.toThrow();
    }
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
