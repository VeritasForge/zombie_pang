// PhaserGameClock — Phaser 런타임에서 IClock을 구현하는 어댑터.
//
// Phaser TimeStep은 매 step()마다 game.loop.now에 RAF timestamp(performance.now 결과)를
// 저장한다. 이는 non-smoothed monotonic 값이며, 결정론 도메인 로직이 의존하기에 적합하다.
//
// (참고: TimeStep.delta는 deltaHistory 평균으로 smoothing되므로 도메인용으로 부적합. delta 대신
//  now 차분을 직접 계산해 결정론을 강화한다.)
//
// 어댑터 위치 선정 사유: adapters/phaser/ 아래에 둠. infrastructure가 아닌 이유는 Phaser
// 의존이 발생하기 때문 — Hexagonal DIP를 만족하기 위해 domain은 IClock만 알면 된다.

import type { IClock } from "@domain/ports/clock";

/**
 * Phaser.Game이 노출하는 게임 루프 인터페이스에서 본 어댑터가 실제로 의존하는 부분만 추출.
 * 테스트에서는 fake 구현을 주입하여 Phaser 전체를 mock하지 않아도 된다.
 */
export interface PhaserGameLoopLike {
  readonly loop: { readonly now: number };
}

export class PhaserGameClock implements IClock {
  constructor(private readonly game: PhaserGameLoopLike) {
    if (!game || !game.loop) {
      throw new Error("PhaserGameClock: game.loop is required (received invalid game instance)");
    }
  }

  now(): number {
    return this.game.loop.now;
  }

  monotonic(): number {
    return this.game.loop.now;
  }
}
