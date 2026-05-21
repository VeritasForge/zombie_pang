// Domain Port: IClock
// 도메인은 Date.now/performance.now를 직접 호출하지 않는다.
// 구현체는 SystemClock 또는 테스트의 FakeClock으로 주입한다.

export interface IClock {
  /** Monotonic milliseconds */
  now(): number;
}
