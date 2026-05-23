export type BossPosition = { readonly x: number; readonly y: number };

/**
 * Lissajous 1:2 곡선 (8자). x축 진동이 y축의 2배 주기.
 *
 * 공식:
 *   x = center.x + R * sin(2ω·t)
 *   y = center.y + R * sin(ω·t)
 *
 * @param tMs 누적 시간 (ms). 음수 또는 NaN/Infinity면 RangeError throw.
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
  // F3 (NaN guard): `tMs < 0` 단독은 NaN을 silent 통과 (NaN < 0 = false) → Math.sin(NaN) = NaN
  // → 보스 위치 {NaN, NaN} 전파. Number.isFinite로 NaN/±Infinity 모두 차단.
  if (!Number.isFinite(tMs) || tMs < 0) {
    throw new RangeError(`tMs must be a non-negative finite number (got ${tMs})`);
  }
  const t = tMs / 1000;
  return {
    x: center.x + R * Math.sin(2 * omegaRadPerSec * t),
    y: center.y + R * Math.sin(omegaRadPerSec * t),
  };
}
