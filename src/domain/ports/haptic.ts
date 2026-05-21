// Domain Port: IHaptic
// 도메인은 navigator.vibrate를 직접 호출하지 않는다.
// 미지원 환경 (iOS Safari)에서는 어댑터에서 no-op 처리.

export interface IHaptic {
  vibrate(pattern: number | readonly number[]): void;
}
