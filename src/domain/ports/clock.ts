// Domain Port: IClock
// 도메인은 Date.now / performance.now / setTimeout 등을 직접 호출하지 않는다.
// 모든 시간 의존 로직은 본 Port를 통해 주입된 구현체에 위임한다.
//
// 구현체 가이드:
//   - production: SystemClock (performance.now() 우선, Date.now() fallback)
//   - phaser 런타임: PhaserGameClock (scene.time.now 기반, game loop와 동기화)
//   - test: FakeClock (시간 수동 제어)
//
// 의미 정의:
//   본 인터페이스의 시간 값은 모두 monotonic milliseconds이다 (감소하지 않음).
//   wall-clock(epoch ms)이 필요한 경우는 별도 메소드를 추후 추가한다 (v2 ADR 대상).

export interface IClock {
  /**
   * Monotonic milliseconds since an implementation-defined epoch.
   * Never decreases between calls. Suitable for duration, decay, frame delta 계산.
   */
  now(): number;

  /**
   * Explicit alias for {@link now}. 의미를 코드 호출부에서 명확히 드러내고 싶을 때 사용.
   * 동작은 `now()`와 동일하다. Phaser scene.time.now / performance.now 와 의미가 같다.
   */
  monotonic(): number;
}
