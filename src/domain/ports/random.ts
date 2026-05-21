// Domain Port: IRandom
// 결정론적 난수 추상화. 도메인은 Math.random을 직접 호출하지 않는다.
// 구현체는 SeededRandom (mulberry32) 등으로 주입한다.

export interface IRandom {
  /** Uniform [0, 1) */
  next(): number;
  /** Uniform integer [0, maxExclusive) */
  nextInt(maxExclusive: number): number;
  /** 빈 배열 입력 시 throw */
  pick<T>(items: readonly T[]): T;
}
