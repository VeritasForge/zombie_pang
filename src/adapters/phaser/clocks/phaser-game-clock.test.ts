import { describe, expect, it } from "vitest";
import { PhaserGameClock, type PhaserGameLoopLike } from "./phaser-game-clock";

// PhaserGameClock 테스트.
// 글로벌 CLAUDE.md TDD 3 카테고리 규칙: [Happy] / [Boundary] / [Error] 각 ≥ 1.
//
// Phaser.Game 전체를 mock하지 않고, PhaserGameLoopLike 좁은 인터페이스 fake로 검증.

function makeFakeGame(initialNow = 0): PhaserGameLoopLike & { setNow: (v: number) => void } {
  const state = { now: initialNow };
  return {
    loop: state,
    setNow(v: number) {
      state.now = v;
    },
  };
}

describe("PhaserGameClock", () => {
  it("[Happy] now() returns game.loop.now verbatim", () => {
    const game = makeFakeGame(12345);
    const clock = new PhaserGameClock(game);
    expect(clock.now()).toBe(12345);
  });

  it("[Happy] monotonic() shares the same source as now()", () => {
    const game = makeFakeGame(7777);
    const clock = new PhaserGameClock(game);
    expect(clock.monotonic()).toBe(clock.now());
  });

  it("[Happy] reflects subsequent frame updates (monotonic increase)", () => {
    const game = makeFakeGame(100);
    const clock = new PhaserGameClock(game);
    expect(clock.now()).toBe(100);
    game.setNow(116.67); // 60FPS 한 프레임 뒤
    expect(clock.now()).toBe(116.67);
    game.setNow(133.34);
    expect(clock.monotonic()).toBe(133.34);
  });

  it("[Boundary] returns 0 at frame 0 (before first RAF step)", () => {
    // Phaser는 첫 step() 호출 전 game.loop.now = 0. 도메인 로직이 0을 정상 값으로 다뤄야 함.
    const game = makeFakeGame(0);
    const clock = new PhaserGameClock(game);
    expect(clock.now()).toBe(0);
    expect(clock.monotonic()).toBe(0);
  });

  it("[Boundary] handles large monotonic values (24h+ session)", () => {
    // 24시간 = 86_400_000 ms. PWA가 백그라운드에 오래 있다가 복귀해도 floating-point 정밀도 유지.
    const aDayMs = 24 * 60 * 60 * 1000;
    const game = makeFakeGame(aDayMs);
    const clock = new PhaserGameClock(game);
    expect(clock.now()).toBe(aDayMs);
  });

  it("[Error] throws when game is undefined", () => {
    expect(() => new PhaserGameClock(undefined as unknown as PhaserGameLoopLike)).toThrow();
  });

  it("[Error] throws when game.loop is missing", () => {
    const broken = {} as unknown as PhaserGameLoopLike;
    expect(() => new PhaserGameClock(broken)).toThrow(/game\.loop/);
  });
});
