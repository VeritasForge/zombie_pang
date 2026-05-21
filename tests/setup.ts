import "vitest-canvas-mock";
import { vi } from "vitest";

// Vibration API 미지원 환경 graceful fallback
if (typeof navigator !== "undefined" && !navigator.vibrate) {
  Object.defineProperty(navigator, "vibrate", {
    value: vi.fn(() => true),
    writable: true,
  });
}

// AudioContext mock (Web Audio API)
class MockAudioContext {
  state = "suspended";
  destination = {};
  currentTime = 0;
  resume = vi.fn(() => Promise.resolve());
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440, setValueAtTime: vi.fn() },
    type: "sine",
  }));
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }));
}

(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
  MockAudioContext;
(globalThis as unknown as { webkitAudioContext: typeof MockAudioContext }).webkitAudioContext =
  MockAudioContext;
