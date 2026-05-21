import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VibrationApi } from "./vibration-api";

type NavWithVibrate = Navigator & { vibrate?: (pattern: number | number[]) => boolean };

describe("VibrationApi", () => {
  let originalVibrate: NavWithVibrate["vibrate"];

  beforeEach(() => {
    originalVibrate = (navigator as NavWithVibrate).vibrate;
  });

  afterEach(() => {
    (navigator as NavWithVibrate).vibrate = originalVibrate;
    vi.restoreAllMocks();
  });

  it("[Happy] forwards number pattern", () => {
    const spy = vi.fn(() => true);
    (navigator as NavWithVibrate).vibrate = spy;
    const api = new VibrationApi();
    api.vibrate(50);
    expect(spy).toHaveBeenCalledWith(50);
  });

  it("[Happy] forwards array pattern", () => {
    const spy = vi.fn(() => true);
    (navigator as NavWithVibrate).vibrate = spy;
    const api = new VibrationApi();
    api.vibrate([30, 20, 30]);
    expect(spy).toHaveBeenCalledWith([30, 20, 30]);
  });

  it("[Boundary] is no-op when navigator.vibrate is missing", () => {
    Reflect.deleteProperty(navigator, "vibrate");
    const api = new VibrationApi();
    expect(() => api.vibrate(50)).not.toThrow();
  });

  it("[Error] silent on vibrate exception", () => {
    const throwing = vi.fn(() => {
      throw new Error("blocked");
    });
    (navigator as NavWithVibrate).vibrate = throwing;
    const api = new VibrationApi();
    expect(() => api.vibrate(100)).not.toThrow();
  });
});
