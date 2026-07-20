// Phaser Adapter 상수 — 색상, viewport, juice timing.
// Bible §2 (좀비 4종 색), §5 (juice 매트릭스).

// Retina 대응 — backing buffer 크기를 dpr 배수로 확장하여 stretch 흐림 방지.
// 학습 데이터/실측: 모바일 dpr=2~3, 데스크탑=1~2. 너무 큰 buffer 우려로 max 3 cap.
export const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;
const BASE_W = 390;
const BASE_H = 844;

// 화면 픽셀 단위 → backing buffer 단위 변환 헬퍼.
// 모든 절대 픽셀 값은 px(n)으로 감싸서 retina 자동 적용.
export const px = (n: number): number => Math.round(n * DPR);
export const fontPx = (n: number): string => `${Math.round(n * DPR)}px`;

export const COLORS = {
  bgDark: 0x1a1a1a,
  neonPink: 0xff2d87,
  limeGreen: 0xc5e90b,
  maskWhite: 0xf0ead6,
  intern: 0x6bcb77,
  middle: 0xffd93d,
  lead: 0xff6b6b,
  ceo: 0xa66cff,
  textPrimary: 0xf0ead6,
  textShadow: 0x000000,
  // 추가 — UI 보조 색
  cardBg: 0x2a2a2a,
  hudBg: 0x0d0d0d,
  fledDanger: 0xff4d4d,
  comboGold: 0xffce00,
} as const;

export const COLOR_HEX = {
  bgDark: "#1a1a1a",
  neonPink: "#FF2D87",
  limeGreen: "#C5E90B",
  maskWhite: "#F0EAD6",
  textPrimary: "#F0EAD6",
  comboGold: "#FFCE00",
} as const;

export type InteriorPalette = {
  readonly bg: string; // setBackgroundColor용 "#rrggbb"
};

// 챕터(1~5) → 인테리어 톤 (Bible §2 5막). bg는 어두운 베이스.
export const INTERIOR_PALETTES: Record<number, InteriorPalette> = {
  1: { bg: "#1a1a26" },
  2: { bg: "#201a26" },
  3: { bg: "#15211f" },
  4: { bg: "#261f1a" },
  5: { bg: "#0d0d1a" },
} as const;

// 좀비 직급 마스크 색 (Bible §2). 진회/검정은 어두운 배경 대비 부족 → stroke 보조(zombie.ts).
export const MASK_COLORS = {
  intern: 0xf0ead6, // 흰
  middle: 0x7a7a7a, // 회
  lead: 0x3a3a3a, // 진회
  ceo: 0x0a0a0a, // 검정
} as const;
// stroke가 필요한(어두운) 마스크 — 대비 ≥3:1 확보용 maskWhite 외곽선.
export const MASK_NEEDS_STROKE = new Set<number>([0x3a3a3a, 0x0a0a0a]);

// VIEWPORT는 backing buffer 크기. 게임 좌표는 모두 이 단위로 표현된다.
export const VIEWPORT = { width: BASE_W * DPR, height: BASE_H * DPR } as const;

export const TIMINGS = {
  hitStop: { normal: 67, crit: 100 }, // ms — 시간 단위, 변환 X
  // shake amplitude는 px 단위 → dpr 곱하기.
  shake: {
    normal: 6 * DPR,
    crit: 9 * DPR,
  },
  flash: { white: 16, gold: 33 }, // ms — 시간 단위, 변환 X
  freeze: { waveClear: 300 }, // ms — 시간 단위, 변환 X
  particleCount: { normal: 8, crit: 12 }, // count, 변환 X
} as const;

// FPS 모니터 — adaptive degradation (Bible §5).
export const FPS = {
  threshold: 50,
  belowFramesToDegrade: 3,
} as const;

// Phaser TimeStep 설정 — Phaser.Game config의 fps 객체로 그대로 전달된다.
//   target          : 목표 FPS. 60Hz 기준.
//   forceSetTimeOut : false면 RAF 우선. iOS Safari 백그라운드 복귀 안정성을 위해 RAF 유지.
//   smoothStep      : 최근 deltaHistory 프레임의 이동평균으로 delta jitter를 흡수. 모바일에서 권장.
//   deltaHistory    : smoothing 윈도우 크기 (프레임 수).
//   panicMax        : 탭 백그라운드 복귀 후 cool-down 프레임 수. 큰 delta를 _target으로 clamp.
//
// 결정론 도메인 로직(combo decay 등)은 본 smoothed delta를 사용하지 않고
// PhaserGameClock.now() = game.loop.now (non-smoothed monotonic)를 참조한다.
export const PHASER_FPS = {
  target: 60,
  forceSetTimeOut: false,
  smoothStep: true,
  deltaHistory: 10,
  panicMax: 120,
} as const;

export const FONT_FAMILY =
  '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

export const SCENE_KEYS = {
  boot: "BootScene",
  preload: "PreloadScene",
  mainMenu: "MainMenuScene",
  game: "GameScene",
  hud: "HudScene",
  gameOver: "GameOverScene",
} as const;
