export type BossPosition = { readonly x: number; readonly y: number };

/**
 * Lissajous 1:2 곡선 (8자). x축 진동이 y축의 2배 주기.
 *
 * 공식:
 *   x = center.x + R * sin(2ω·t)
 *   y = center.y + R * sin(ω·t)
 *
 * @param tMs 누적 시간 (ms). 음수면 RangeError throw.
 * @param center 화면 중심 좌표.
 * @param R per-axis 진폭. bounding box = [center.x±R] × [center.y±R].
 * @param omegaRadPerSec 각속도 (rad/s).
 */
export function computeBossPosition(
  tMs: number,
  center: { readonly x: number; readonly y: number },
  R: number,
  omegaRadPerSec: number,
): BossPosition {
  if (tMs < 0) {
    throw new RangeError(`tMs must be non-negative (got ${tMs})`);
  }
  const t = tMs / 1000;
  return {
    x: center.x + R * Math.sin(2 * omegaRadPerSec * t),
    y: center.y + R * Math.sin(omegaRadPerSec * t),
  };
}

/** Frame delta 정규화: 음수→0, >maxDt→maxDt (Phaser 일시정지/시계 역행 방어). */
export function clampDeltaMs(dt: number, maxDt = 100): number {
  if (dt < 0) return 0;
  if (dt > maxDt) return maxDt;
  return dt;
}
