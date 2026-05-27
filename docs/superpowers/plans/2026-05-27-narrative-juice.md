# Narrative Juice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 좀비 사옥 등반 서사를 감각적으로 전달하는 5개 연출(챕터 배경 / 마스크 색 / 사옥 빌딩 / BOSS APPROACHING / 보스 슬로우모션)을 자산 0·도메인 순수성·인게임 텍스트 0줄을 지키며 구현한다.

**Architecture:** 분기/경계 로직(`isBossClimax`, `litFloorsFor`)은 `domain/` 순수 함수로 TDD 100%, 색/팔레트는 `config.ts` 상수, 렌더는 `adapters/phaser`. 구현 순서는 위험 격리(저위험 cosmetic → 고위험 boss-rage).

**Tech Stack:** Phaser 3.80, TypeScript strict, Vitest + @fast-check/vitest, Web Audio 합성. Spec: `docs/superpowers/specs/2026-05-27-narrative-juice-design.md`.

**규약:** 파일 kebab-case, named export only, `type` 우선, `px()`/`fontPx()`로 dpr 래핑, import alias `@domain`/`@application`/`@shared`/`@infrastructure`. 모든 RED는 `[Happy]/[Boundary]/[Error]` 라벨. 검증: `pnpm typecheck && pnpm lint && pnpm test` exit 0.

---

## File Structure

| 파일 | 책임 | 신규/수정 |
|------|------|----------|
| `src/adapters/phaser/config.ts` | `INTERIOR_PALETTES`, `MASK_COLORS`, climax/approaching TIMINGS 상수 | 수정 |
| `src/adapters/phaser/config.test.ts` | 팔레트/마스크 상수 불변(5색 distinct 등) | 신규 |
| `src/adapters/phaser/scenes/game-scene.ts` | 챕터 배경+모티프(create), BOSS APPROACHING cue(advanceWave), climax 감시(update) | 수정 |
| `src/adapters/phaser/objects/zombie.ts` | `maskColor` 표식 + stroke 렌더 | 수정 |
| `src/domain/run/building-progress.ts` | `litFloorsFor` 순수 함수 | 신규 (+디렉토리) |
| `src/domain/run/building-progress.test.ts` | 3 카테고리 단위 | 신규 |
| `src/adapters/phaser/scenes/game-over-scene.ts` | 사옥 빌딩 배경 레이어 + 누적 점등 + 부서명 | 수정 |
| `src/domain/ports/audio.ts` | `AudioEvent`에 `boss_approaching` | 수정 |
| `src/infrastructure/audio/web-audio-synth.ts` | `EVENT_TONES` 저음 rumble | 수정 |
| `src/infrastructure/audio/web-audio-synth.test.ts` | boss_approaching tone 검증 | 수정 |
| `src/domain/boss/boss-climax.ts` | `isBossClimax` 순수 함수 | 신규 |
| `src/domain/boss/boss-climax.test.ts` + `.prop.test.ts` | 3 카테고리 + property | 신규 |
| `src/adapters/phaser/managers/juice-manager.ts` | `setBossClimax`(비네트), BOSS APPROACHING 수렴 펄스 helper | 수정 |
| `docs/adr/draft/ADR-0014-progress-viz-and-slowmo.md` | 진행도 시각화 결정론 + 0.3배속 보스-only 근사 | 신규 |

---

## Task 1: 챕터별 배경/인테리어 톤 (spec 5-3)

**Files:**
- Modify: `src/adapters/phaser/config.ts`
- Create: `src/adapters/phaser/config.test.ts`
- Modify: `src/adapters/phaser/scenes/game-scene.ts` (create 메서드, 라인 162 부근)

- [ ] **Step 1: config.ts에 INTERIOR_PALETTES 추가**

`src/adapters/phaser/config.ts`의 `COLOR_HEX` 블록 다음에 추가:

```ts
export type MotifId = "fluorescent" | "headset" | "whiteboard" | "carpet" | "kpi";

export type InteriorPalette = {
  readonly bg: string; // setBackgroundColor용 "#rrggbb"
  readonly accent: number; // Graphics fillStyle용 0xrrggbb
  readonly motif: MotifId;
};

// 챕터(1~5) → 인테리어 톤 (Bible §2 5막). bg는 어두운 베이스, accent는 모티프 색.
export const INTERIOR_PALETTES: Record<number, InteriorPalette> = {
  1: { bg: "#1a1a26", accent: 0x6bcb77, motif: "fluorescent" },
  2: { bg: "#201a26", accent: 0xffd93d, motif: "headset" },
  3: { bg: "#15211f", accent: 0x4dd0e1, motif: "whiteboard" },
  4: { bg: "#261f1a", accent: 0xc9a227, motif: "carpet" },
  5: { bg: "#0d0d1a", accent: 0xff2d87, motif: "kpi" },
} as const;
```

- [ ] **Step 2: 실패 테스트 작성**

`src/adapters/phaser/config.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { INTERIOR_PALETTES } from "./config";

describe("INTERIOR_PALETTES", () => {
  // [Happy] 챕터 1~5 모두 정의됨
  it.each([1, 2, 3, 4, 5])("[Happy] 챕터 %i 팔레트 정의", (ch) => {
    expect(INTERIOR_PALETTES[ch]).toBeDefined();
  });

  // [Boundary] 5개 배경색이 서로 다르다 (챕터 구분 보장)
  it("[Boundary] 5개 bg가 모두 distinct", () => {
    const bgs = [1, 2, 3, 4, 5].map((c) => INTERIOR_PALETTES[c]?.bg);
    expect(new Set(bgs).size).toBe(5);
  });

  // [Boundary] 5개 motif id가 모두 다르다
  it("[Boundary] 5개 motif가 모두 distinct", () => {
    const motifs = [1, 2, 3, 4, 5].map((c) => INTERIOR_PALETTES[c]?.motif);
    expect(new Set(motifs).size).toBe(5);
  });

  // [Error] 범위 밖 챕터는 undefined (호출부 fallback 책임)
  it("[Error] 챕터 0/6은 undefined", () => {
    expect(INTERIOR_PALETTES[0]).toBeUndefined();
    expect(INTERIOR_PALETTES[6]).toBeUndefined();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인 → 통과 확인**

Run: `pnpm test src/adapters/phaser/config.test.ts`
Step 1을 먼저 했으면 PASS. (상수 정의가 테스트 대상이라 RED는 import 실패로 자연 발생 — Step 1 누락 시 "INTERIOR_PALETTES is not exported".)

- [ ] **Step 4: game-scene에 배경 + 모티프 렌더 추가**

`src/adapters/phaser/scenes/game-scene.ts` import에 `INTERIOR_PALETTES`, `type InteriorPalette` 추가. `create()`의 `this.cameras.main.setBackgroundColor(COLOR_HEX.bgDark);` (라인 162)를 교체:

```ts
const palette = INTERIOR_PALETTES[this.chapter] ?? INTERIOR_PALETTES[1];
if (palette) {
  this.cameras.main.setBackgroundColor(palette.bg);
  this.drawInteriorMotif(palette);
}
```

`create()` 아래에 private 메서드 추가 (정적 1회 생성, depth 음수로 좀비 뒤):

```ts
/** 챕터 인테리어 모티프 — 자산 0, Graphics 도형 암시. alpha 낮게(게임플레이 방해 X). */
private drawInteriorMotif(palette: InteriorPalette): void {
  const g = this.add.graphics();
  g.setDepth(-10);
  const w = VIEWPORT.width;
  const h = VIEWPORT.height;
  g.lineStyle(px(2), palette.accent, 0.22);
  g.fillStyle(palette.accent, 0.1);
  switch (palette.motif) {
    case "fluorescent": // 형광등 막대 3개 (가로)
      for (let i = 1; i <= 3; i++) {
        const y = (h * i) / 4;
        g.lineBetween(px(40), y, w - px(40), y);
      }
      break;
    case "headset": // 헤드셋 원호 2개
      g.strokeCircle(w / 2, h * 0.3, px(120));
      g.strokeCircle(w / 2, h * 0.7, px(90));
      break;
    case "whiteboard": // 화이트보드 격자
      for (let x = px(40); x < w; x += px(60)) g.lineBetween(x, px(80), x, h - px(80));
      for (let y = px(80); y < h; y += px(60)) g.lineBetween(px(40), y, w - px(40), y);
      break;
    case "carpet": // 카펫 대각 질감
      for (let x = -h; x < w; x += px(48)) g.lineBetween(x, 0, x + h, h);
      break;
    case "kpi": // KPI 꺾은선 (상승)
      g.beginPath();
      g.moveTo(px(20), h * 0.8);
      g.lineTo(w * 0.3, h * 0.6);
      g.lineTo(w * 0.55, h * 0.68);
      g.lineTo(w * 0.8, h * 0.35);
      g.lineTo(w - px(20), h * 0.2);
      g.strokePath();
      break;
  }
}
```

- [ ] **Step 5: 검증 + 커밋**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: exit 0.

```bash
git add src/adapters/phaser/config.ts src/adapters/phaser/config.test.ts src/adapters/phaser/scenes/game-scene.ts
git commit -m "feat(juice): 챕터별 배경/인테리어 모티프 (spec 5-3)"
```

---

## Task 2: 좀비 마스크 색 (spec 5-4)

**Files:**
- Modify: `src/adapters/phaser/config.ts`
- Modify: `src/adapters/phaser/config.test.ts`
- Modify: `src/adapters/phaser/objects/zombie.ts`

- [ ] **Step 1: config.ts에 MASK_COLORS 추가**

`INTERIOR_PALETTES` 다음에:

```ts
// 좀비 직급 마스크 색 (Bible §2). 진회/검정은 어두운 배경 대비 부족 → stroke 보조(zombie.ts).
export const MASK_COLORS = {
  intern: 0xf0ead6, // 흰
  middle: 0x7a7a7a, // 회
  lead: 0x3a3a3a, // 진회
  ceo: 0x0a0a0a, // 검정
} as const;
// stroke가 필요한(어두운) 마스크 — 대비 ≥3:1 확보용 maskWhite 외곽선.
export const MASK_NEEDS_STROKE = new Set<number>([0x3a3a3a, 0x0a0a0a]);
```

- [ ] **Step 2: 실패 테스트 추가**

`src/adapters/phaser/config.test.ts`에 추가:

```ts
import { MASK_COLORS, MASK_NEEDS_STROKE } from "./config";

describe("MASK_COLORS", () => {
  // [Happy] 4종 마스크 색 정의
  it("[Happy] 4종 마스크 색 distinct", () => {
    const vals = Object.values(MASK_COLORS);
    expect(new Set(vals).size).toBe(4);
  });
  // [Boundary] 진회/검정은 stroke 필요, 흰/회는 불필요
  it("[Boundary] 진회·검정만 stroke 대상", () => {
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.lead)).toBe(true);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.ceo)).toBe(true);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.intern)).toBe(false);
    expect(MASK_NEEDS_STROKE.has(MASK_COLORS.middle)).toBe(false);
  });
});
```

Run: `pnpm test src/adapters/phaser/config.test.ts` → PASS (상수 정의됨).

- [ ] **Step 3: zombie.ts VISUAL_SPECS에 maskColor 추가**

`src/adapters/phaser/objects/zombie.ts` import에 `MASK_COLORS, MASK_NEEDS_STROKE` 추가. `ZombieVisualSpec` 타입에 `readonly maskColor: number;` 추가하고, `VISUAL_SPECS` 4종에 각각 추가:

```ts
[ZOMBIE_TYPE.INTERN]: { emoji: "\u{1F9DF}", fontSize: px(56), auraColor: COLORS.intern, auraRadius: px(36), maskColor: MASK_COLORS.intern },
[ZOMBIE_TYPE.MIDDLE]: { emoji: "\u{1F9DF}‍♂️", fontSize: px(60), auraColor: COLORS.middle, auraRadius: px(40), maskColor: MASK_COLORS.middle },
[ZOMBIE_TYPE.LEAD]: { emoji: "\u{1F9DF}‍♀️", fontSize: px(64), auraColor: COLORS.lead, auraRadius: px(44), maskColor: MASK_COLORS.lead },
[ZOMBIE_TYPE.CEO]: { emoji: "\u{1F9E0}", fontSize: px(96), auraColor: COLORS.ceo, auraRadius: px(70), maskColor: MASK_COLORS.ceo },
```

- [ ] **Step 4: 마스크 표식 렌더 추가**

`zombie.ts` 생성자에서 emoji body 추가(`this.add(this.emojiText);`, 라인 100) 직후, HP bar 블록 앞에 삽입:

```ts
// 마스크 표식 — 직급 위계(Bible §2). 폭=fontSize*0.4, 높이=px(6), 이모지 하단 px(4).
const maskW = spec.fontSize * 0.4;
const maskH = px(6);
const maskY = spec.fontSize / 2 + px(4);
const mask = scene.add.graphics();
mask.fillStyle(spec.maskColor, 1);
mask.fillRoundedRect(-maskW / 2, maskY, maskW, maskH, px(2));
if (MASK_NEEDS_STROKE.has(spec.maskColor)) {
  mask.lineStyle(px(2), COLORS.maskWhite, 1); // 대비 ≥3:1 (WCAG 1.4.11)
  mask.strokeRoundedRect(-maskW / 2, maskY, maskW, maskH, px(2));
}
this.add(mask);
```

- [ ] **Step 5: 검증 + 커밋**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: exit 0.

```bash
git add src/adapters/phaser/config.ts src/adapters/phaser/config.test.ts src/adapters/phaser/objects/zombie.ts
git commit -m "feat(juice): 좀비 직급 마스크 표식 + 진회/검정 stroke (spec 5-4)"
```

---

## Task 3: 사옥 줌아웃 + 층 색칠 (spec 5-5)

**Files:**
- Create: `src/domain/run/building-progress.ts` (신규 디렉토리)
- Create: `src/domain/run/building-progress.test.ts`
- Modify: `src/adapters/phaser/scenes/game-over-scene.ts` (renderChapterEnd, 라인 64~)

- [ ] **Step 1: 실패 테스트 작성**

`src/domain/run/building-progress.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { litFloorsFor } from "./building-progress";

describe("litFloorsFor", () => {
  // [Happy] 3챕터 클리어 → 30층 점등
  it("[Happy] 3 → 30", () => {
    expect(litFloorsFor(3)).toBe(30);
  });
  // [Boundary] 0 → 0, 5 → 50
  it("[Boundary] 0 → 0", () => expect(litFloorsFor(0)).toBe(0));
  it("[Boundary] 5 → 50", () => expect(litFloorsFor(5)).toBe(50));
  // [Boundary] 6(초과) → 50 클램프
  it("[Boundary] 6 → 50 (클램프)", () => expect(litFloorsFor(6)).toBe(50));
  // [Error] 음수 → 0
  it("[Error] 음수 → 0", () => expect(litFloorsFor(-2)).toBe(0));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/domain/run/building-progress.test.ts`
Expected: FAIL — "Cannot find module './building-progress'".

- [ ] **Step 3: 최소 구현**

`src/domain/run/building-progress.ts` 생성:

```ts
// 사옥 점등 진행도 (결정론). 클리어 챕터 수 → 점등 층 수.
// Bible §2 50층 / 5챕터. ADR draft: 진행도 시각화는 가변 보상과 별개(결정론).

export const FLOORS_PER_CHAPTER = 10;
export const TOTAL_FLOORS = 50;

export function litFloorsFor(chaptersCleared: number): number {
  if (!Number.isFinite(chaptersCleared) || chaptersCleared <= 0) return 0;
  return Math.min(TOTAL_FLOORS, Math.floor(chaptersCleared) * FLOORS_PER_CHAPTER);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/domain/run/building-progress.test.ts`
Expected: PASS (5 cases).

- [ ] **Step 5: game-over-scene에 빌딩 배경 레이어 추가**

`game-over-scene.ts` import에 `import { litFloorsFor, TOTAL_FLOORS } from "@domain/run/building-progress";` 추가. `renderChapterEnd()`의 `const title = ...` (라인 68) **앞**에 빌딩 렌더 호출 추가:

```ts
this.drawBuilding(data.bestReachedChapter);
```

`renderChapterEnd` 메서드 뒤에 private 메서드 추가:

```ts
/** 사옥 빌딩 미니어처 — 배경 레이어. 누적 점등 + 줌아웃. depth 0(카드는 10+). */
private drawBuilding(chaptersCleared: number): void {
  const cx = VIEWPORT.width / 2;
  const bw = px(120);
  const bh = px(500);
  const top = px(60);
  const floorH = bh / TOTAL_FLOORS;
  const lit = litFloorsFor(chaptersCleared);
  const palette = INTERIOR_PALETTES[Math.min(5, Math.max(1, chaptersCleared))] ?? INTERIOR_PALETTES[1];
  const accent = palette?.accent ?? COLORS.limeGreen;

  const container = this.add.container(cx, top + bh / 2);
  container.setDepth(0).setAlpha(0.5);

  const frame = this.add.graphics();
  frame.lineStyle(px(2), COLORS.maskWhite, 0.6);
  frame.strokeRect(-bw / 2, -bh / 2, bw, bh);
  container.add(frame);

  // 점등 층: 아래(50F top)→위 누적. 방금 클리어한 10층은 stagger tween.
  const justCleared = Math.max(0, chaptersCleared) * 10;
  const prevLit = Math.max(0, lit - 10);
  for (let f = 0; f < lit; f++) {
    // f=0 은 1F(빌딩 바닥). y는 아래에서 위로.
    const y = bh / 2 - (f + 1) * floorH;
    const cell = this.add.graphics();
    cell.fillStyle(accent, 0.85);
    cell.fillRect(-bw / 2 + px(3), y + px(1), bw - px(6), floorH - px(2));
    container.add(cell);
    if (f >= prevLit && f < justCleared) {
      cell.setAlpha(0);
      this.tweens.add({ targets: cell, alpha: 1, delay: (f - prevLit) * 150, duration: 200 });
    }
  }

  // 줌아웃
  container.setScale(1.1);
  this.tweens.add({ targets: container, scale: 1, duration: 1200, ease: "Quad.easeOut" });

  // 부서명 (전환 화면 텍스트 허용)
  const deptNames: Record<number, string> = {
    1: "신입부서", 2: "영업본부", 3: "R&D", 4: "임원실", 5: "CEO 집무실",
  };
  const dept = deptNames[Math.min(5, Math.max(1, chaptersCleared))] ?? "";
  const deptText = this.add.text(cx, top - px(10), dept, {
    fontFamily: FONT_FAMILY, fontSize: fontPx(13), color: COLOR_HEX.limeGreen,
  });
  deptText.setOrigin(0.5, 1).setDepth(11);
}
```

`game-over-scene.ts` import에 `INTERIOR_PALETTES`가 없으면 config import 라인에 추가.

- [ ] **Step 6: 검증 + 커밋**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: exit 0 (building-progress 도메인 100%, game-over 빌드 통과).

```bash
git add src/domain/run/building-progress.ts src/domain/run/building-progress.test.ts src/adapters/phaser/scenes/game-over-scene.ts
git commit -m "feat(juice): 사옥 빌딩 누적 점등 + 부서명 (spec 5-5)"
```

---

## Task 4: BOSS APPROACHING 경고 (spec 5-2)

**Files:**
- Modify: `src/domain/ports/audio.ts`
- Modify: `src/infrastructure/audio/web-audio-synth.ts`
- Modify: `src/infrastructure/audio/web-audio-synth.test.ts`
- Modify: `src/adapters/phaser/managers/juice-manager.ts`
- Modify: `src/adapters/phaser/scenes/game-scene.ts` (advanceWave, 라인 545~)

- [ ] **Step 1: AudioEvent에 boss_approaching 추가**

`src/domain/ports/audio.ts`의 union에 추가:

```ts
export type AudioEvent =
  | "punch_in"
  | "kill_normal"
  | "kill_crit"
  | "combo_5"
  | "powerup_pickup"
  | "boss_kill"
  | "boss_approaching"
  | "wave_clear"
  | "hit"
  | "menu_select";
```

- [ ] **Step 2: web-audio-synth 테스트 실패 확인**

Run: `pnpm typecheck`
Expected: FAIL — `EVENT_TONES`가 `Record<AudioEvent,...>`라 `boss_approaching` 누락으로 타입 에러. (이것이 RED.)

- [ ] **Step 3: EVENT_TONES에 저음 rumble 추가**

`src/infrastructure/audio/web-audio-synth.ts` `EVENT_TONES`의 `boss_kill` 항목 뒤에 추가:

```ts
  boss_approaching: [
    { type: "sawtooth", freq: 60, freqEnd: 40, durationS: 0.8, gain: 0.2 },
    { type: "square", freq: 120, freqEnd: 90, durationS: 0.6, gain: 0.08, delayS: 0.05 },
  ],
```

- [ ] **Step 4: web-audio-synth 테스트 추가**

`src/infrastructure/audio/web-audio-synth.test.ts`에 boss_approaching 케이스 추가. 기존 테스트 형식을 그대로 따르되(같은 파일의 다른 이벤트 테스트와 동형), 최소 다음을 보장:

```ts
// [Happy] boss_approaching 재생 시 oscillator가 생성된다 (ctx running mock 기준)
it("[Happy] boss_approaching plays descending rumble", () => {
  // 기존 테스트의 mock AudioContext 셋업을 재사용. play("boss_approaching") 호출 후
  // createOscillator 호출 횟수 == EVENT_TONES.boss_approaching.length (2) 확인.
});
```

> 실행자 주의: 이 파일의 기존 테스트(예: `boss_kill`)가 mock context를 어떻게 구성하는지 먼저 읽고, 동일 패턴으로 `boss_approaching`에 대해 (a) ctx running 시 oscillator 2개 생성, (b) ctx suspended 시 skip, (c) ctx null 시 no-op를 검증하라. 새 mock을 발명하지 말 것.

- [ ] **Step 5: juice-manager에 BOSS APPROACHING 수렴 펄스 helper 추가**

`src/adapters/phaser/managers/juice-manager.ts`에 public 메서드 추가 (`applyFreezeFrame` 뒤):

```ts
/** BOSS APPROACHING 무텍스트 cue — 4코너→중앙 수렴 펄스 ×2 + 약한 셰이크. */
playBossApproaching(): void {
  const cam = this.scene.cameras.main;
  this.audio.play("boss_approaching");
  this.haptic.vibrate([80, 40, 80]);
  this.applyShake(TIMINGS.shake.normal, 200);
  for (let pulse = 0; pulse < 2; pulse++) {
    const ring = this.scene.add.graphics();
    ring.setScrollFactor(0).setDepth(998);
    ring.lineStyle(px(6), 0xff2d2d, 0.6);
    ring.strokeRect(0, 0, cam.width, cam.height);
    ring.setScale(1.0);
    this.activeFreezeOverlays.push(ring as unknown as Phaser.GameObjects.Rectangle);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 0.7,
      scaleY: 0.7,
      alpha: 0,
      delay: pulse * 250,
      duration: 350,
      ease: "Quad.easeIn",
      onComplete: () => {
        ring.destroy();
        this.activeFreezeOverlays = this.activeFreezeOverlays.filter(
          (o) => (o as unknown) !== (ring as unknown),
        );
      },
    });
  }
}
```

`juice-manager.ts` import에 `px`가 없으면 config import에 추가.

- [ ] **Step 6: game-scene advanceWave에 cue 딜레이 삽입**

`src/adapters/phaser/scenes/game-scene.ts` `advanceWave()` (라인 545)를 수정 — wave 10 진입 시 cue 후 보스 스폰. 현재 `scheduleNextSpawn()`이 boss wave면 즉시 spawnBoss를 호출하므로, wave 10 진입 분기에 cue + 지연을 추가:

```ts
private advanceWave(): void {
  if (this.wave >= 10) return;
  this.wave += 1;
  this.spawnedInWave = 0;
  this.killedInWave = 0;
  this.resolvedInWave = 0;
  this.juice.applyKillJuice("wave_clear", VIEWPORT.width / 2, VIEWPORT.height / 2, "paper");
  // wave 10(보스) 진입: wave_clear 후 ~200ms gap → BOSS APPROACHING cue 0.8s → 보스 스폰.
  if (Wave.of(this.wave).isBossWave()) {
    this.time.delayedCall(200, () => {
      this.juice.playBossApproaching();
      this.time.delayedCall(800, () => this.scheduleNextSpawn());
    });
    this.publishHud();
    return;
  }
  this.scheduleNextSpawn();
  this.publishHud();
}
```

> 주의: 기존 `scheduleNextSpawn()`의 boss-wave 분기(라인 281)는 그대로 둔다 — 위 delayedCall이 그 분기를 호출한다. cue 동안 보스 미존재라 입력 잠금 불요(spec 5-2).

- [ ] **Step 7: 검증 + 커밋**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: exit 0.

```bash
git add src/domain/ports/audio.ts src/infrastructure/audio/web-audio-synth.ts src/infrastructure/audio/web-audio-synth.test.ts src/adapters/phaser/managers/juice-manager.ts src/adapters/phaser/scenes/game-scene.ts
git commit -m "feat(juice): BOSS APPROACHING 무텍스트 cue + boss_approaching SFX (spec 5-2)"
```

---

## Task 5: 보스 슬로우모션 climax (spec 5-1, 고위험)

**Files:**
- Create: `src/domain/boss/boss-climax.ts`
- Create: `src/domain/boss/boss-climax.test.ts` + `boss-climax.prop.test.ts`
- Modify: `src/adapters/phaser/managers/juice-manager.ts`
- Modify: `src/adapters/phaser/scenes/game-scene.ts` (update tick, 라인 604~)

- [ ] **Step 1: 실패 테스트 작성**

`src/domain/boss/boss-climax.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { CLIMAX_HP_RATIO, isBossClimax } from "./boss-climax";

describe("isBossClimax", () => {
  // [Happy] HP 24% → climax true
  it("[Happy] 24/100 → true", () => expect(isBossClimax(24, 100)).toBe(true));
  // [Boundary] 정확히 25% → true (≤ literal)
  it("[Boundary] 25/100 → true", () => expect(isBossClimax(25, 100)).toBe(true));
  it("[Boundary] 26/100 → false", () => expect(isBossClimax(26, 100)).toBe(false));
  // [Boundary] 0% → true, 100% → false
  it("[Boundary] 0/100 → true", () => expect(isBossClimax(0, 100)).toBe(true));
  it("[Boundary] 100/100 → false", () => expect(isBossClimax(100, 100)).toBe(false));
  // [Error] maxHp=0 → false (graceful, throw 금지)
  it("[Error] maxHp=0 → false", () => expect(isBossClimax(5, 0)).toBe(false));
  it("[Error] 음수 hp → true (0 이하)", () => expect(isBossClimax(-1, 100)).toBe(true));
  it("[Error] NaN maxHp → false", () => expect(isBossClimax(5, Number.NaN)).toBe(false));
  // 상수 노출
  it("[Boundary] CLIMAX_HP_RATIO === 0.25", () => expect(CLIMAX_HP_RATIO).toBe(0.25));
});
```

`src/domain/boss/boss-climax.prop.test.ts` 생성:

```ts
import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { CLIMAX_HP_RATIO, isBossClimax } from "./boss-climax";

describe("boss-climax properties (seed=42, numRuns=1000)", () => {
  // invariant: 0≤hp≤maxHp 에서 isBossClimax ⇔ hp/maxHp ≤ 0.25
  test.prop(
    [fc.double({ min: 1, max: 1000, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true })],
    { seed: 42, numRuns: 1000 },
  )("isBossClimax ⇔ ratio ≤ 0.25", (maxHp, frac) => {
    const hp = maxHp * frac;
    expect(isBossClimax(hp, maxHp)).toBe(hp / maxHp <= CLIMAX_HP_RATIO);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/domain/boss/boss-climax`
Expected: FAIL — "Cannot find module './boss-climax'".

- [ ] **Step 3: 최소 구현**

`src/domain/boss/boss-climax.ts` 생성:

```ts
// 보스 climax(슬로우모션) 진입 판정 — 결정론 순수 함수.
// Bible §3 Climax. rage와 독립(모든 챕터 일관 적용). 슬로우모션 omega 대체 트리거.

export const CLIMAX_HP_RATIO = 0.25;

/** 보스 HP 비율이 임계 이하면 climax. maxHp 비정상이면 false(graceful, 렌더 경로). */
export function isBossClimax(hp: number, maxHp: number): boolean {
  if (!Number.isFinite(maxHp) || maxHp <= 0) return false;
  if (!Number.isFinite(hp)) return false;
  return hp / maxHp <= CLIMAX_HP_RATIO;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/domain/boss/boss-climax`
Expected: PASS (unit 9 + prop 1).

- [ ] **Step 5: juice-manager에 setBossClimax(desaturate 비네트) 추가**

`src/adapters/phaser/managers/juice-manager.ts`에 필드 + 메서드 추가:

```ts
private climaxVignette: Phaser.GameObjects.Graphics | null = null;

/** climax desaturate throb 비네트 on/off. idempotent. 색 무관(채도 저하 인상) — alpha 0.35. */
setBossClimax(active: boolean): void {
  if (active) {
    if (this.climaxVignette) return; // idempotent
    const cam = this.scene.cameras.main;
    const g = this.scene.add.graphics();
    g.setScrollFactor(0).setDepth(997);
    // 가장자리 어둑 비네트 (중앙은 투명) — 4변 그라데이션 근사.
    const edge = px(60);
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, cam.width, edge);
    g.fillRect(0, cam.height - edge, cam.width, edge);
    g.fillRect(0, 0, edge, cam.height);
    g.fillRect(cam.width - edge, 0, edge, cam.height);
    this.climaxVignette = g;
    this.scene.tweens.add({
      targets: g, alpha: 0.6, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  } else {
    if (this.climaxVignette) {
      this.scene.tweens.killTweensOf(this.climaxVignette);
      this.climaxVignette.destroy();
      this.climaxVignette = null;
    }
  }
}
```

`destroy()` 메서드에 정리 추가:

```ts
this.setBossClimax(false);
```

- [ ] **Step 6: game-scene update tick에 climax 감시 + omega 대체**

`src/adapters/phaser/scenes/game-scene.ts` import에 `import { isBossClimax } from "@domain/boss/boss-climax";` 추가. 필드 추가:

```ts
private bossClimaxActive = false;
```

`spawnBoss()`와 `init()`/reset 경로에서 `this.bossClimaxActive = false;`로 초기화(boss state 리셋 블록, 라인 240 부근 + spawnBoss 시작). update tick의 boss 위치 갱신 블록(라인 604-618)을 수정:

```ts
if (this.bossWaveActive && this.bossZombie && this.bossPhaseConfig) {
  const container = getContainer(this);
  const chapterBranded = asChapterNumber(this.chapter);
  const maxHp = bossHpForChapter(this.chapter);
  const rage = computeRageLevel(this.bossZombie.hp, maxHp, chapterBranded);
  const effective = applyRageMultipliers(this.bossPhaseConfig, rage);
  // climax: HP ≤25% 진입 시 omega를 base 기준 ×0.3로 "대체"(rage 곱 무시). one-way latch.
  const climax = isBossClimax(this.bossZombie.hp, maxHp);
  if (climax && !this.bossClimaxActive) {
    this.bossClimaxActive = true;
    this.juice.setBossClimax(true);
  }
  // ease ramp 없이 즉시 대체하되, 기존 rage 전환과 동일 known 점프(spec §8.3). 필요 시 lerp.
  const omega = this.bossClimaxActive
    ? this.bossPhaseConfig.omega * 0.3
    : effective.omega;
  const pos = tickBossPosition({
    clock: container.ports.clock,
    bossStartTimeMs: this.bossStartTimeMs,
    center: { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 },
    R: effective.R,
    omega,
  });
  this.bossZombie.setPosition(pos.x, pos.y);
}
```

`onBossKilled()` (라인 488)와 boss state 리셋(라인 240 부근)에 `this.bossClimaxActive = false; this.juice.setBossClimax(false);` 추가 — 보스 처치/리셋 시 비네트 정리.

> 주의: `bossPhaseConfig.omega`는 base(PHASE_CONFIGS) 값이다(spawnBossWave가 getPhaseConfig 반환). 따라서 `bossPhaseConfig.omega * 0.3`이 정확히 "base 기준 ×0.3"이다. `effective.omega`(rage 곱)를 곱하지 않는 것이 핵심.

- [ ] **Step 7: 검증 + 커밋**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: exit 0 (boss-climax 도메인 100% + mutation, prop 통과).

```bash
git add src/domain/boss/boss-climax.ts src/domain/boss/boss-climax.test.ts src/domain/boss/boss-climax.prop.test.ts src/adapters/phaser/managers/juice-manager.ts src/adapters/phaser/scenes/game-scene.ts
git commit -m "feat(juice): 보스 슬로우모션 climax — base omega ×0.3 대체 + desaturate 비네트 (spec 5-1)"
```

---

## Task 6: ADR 작성 + 최종 검증

**Files:**
- Create: `docs/adr/draft/ADR-0014-progress-viz-and-slowmo.md`

- [ ] **Step 1: ADR 작성**

`docs/adr/draft/ADR-0014-progress-viz-and-slowmo.md` 생성 (5 섹션: Status/Context/Decision/Consequences/Alternatives):

```markdown
# ADR-0014: 사옥 진행도 시각화 결정론 + 슬로우모션 보스-only 근사

- **Status**: Proposed
- **Date**: 2026-05-27

## Context
서사 연출 스펙(2026-05-27-narrative-juice-design.md)에서 두 결정이 기존 명세와 표면상 충돌한다:
(1) 사옥 층 점등 — Bible §3 "인테리어 재건 순서 = Layer 2(가변)"; (2) Bible §3 "슬로우모션 0.3배속".

## Decision
1. **층 점등 = 결정론**: 클리어 챕터 수 → 점등 층(chaptersCleared×10). 이는 *진행도 시각화*이며 ADR draft `ADR-0002-variable-reward-scope`의 *인테리어 재건 보상(가구/비품 회복)* 가변과 별개다.
2. **슬로우모션 = 보스-only omega 근사**: 결정론 clock(game.loop.now) 제약상 전역 timeScale을 쓸 수 없어, climax 시 보스 omega를 base 기준 ×0.3로 대체한다. desaturate 비네트 + 0.6s freeze로 "시간 느려짐" 인상 보강.

## Consequences
- 진행도 시각화와 가변 보상이 코드/문서에서 명확히 분리된다.
- "0.3배속"이 전역이 아닌 보스 모션 한정이라 Bible 의도 대비 약하나, 결정론·E2E 안전을 확보한다.

## Alternatives
- 전역 timeScale: 결정론 combo decay/lifespan/E2E에 부작용 → 기각.
- 층 점등 가변(RNG): 50층 등반 서사(아래→위)와 모순 + 무상태 결정론 대비 복잡 → 기각.

## Note
Accepted `docs/adr/0002-game-engine.md`와 draft `ADR-0002-variable-reward-scope.md`가 번호 0002 충돌 — draft Accept 전 재번호 필요.
```

- [ ] **Step 2: 전체 검증**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: 모두 exit 0. `grep -r "__zp_test__" dist/` → 0건 확인.

- [ ] **Step 3: E2E 회귀 확인**

Run: `pnpm test:e2e`
Expected: boss-wave/game-flow 통과. cue 0.8s 딜레이로 game-flow 타이밍 이슈 시, E2E의 보스 도달 대기(waitForFunction) timeout을 점검(코드 수정 아닌 대기 보강).

- [ ] **Step 4: 커밋**

```bash
git add docs/adr/draft/ADR-0014-progress-viz-and-slowmo.md
git commit -m "docs(adr): ADR-0014 진행도 시각화 결정론 + 슬로우모션 보스-only 근사"
```

---

## Self-Review

**1. Spec coverage:**
- 5-3 챕터 배경 → Task 1 ✅
- 5-4 마스크 색 → Task 2 ✅
- 5-5 사옥 빌딩 → Task 3 ✅
- 5-2 BOSS APPROACHING → Task 4 ✅
- 5-1 climax → Task 5 ✅
- 결정 5 audio 파라미터 → Task 4 Step 3 ✅
- 결정 6 cue 차별화(수렴 펄스 vs desaturate) → Task 4 Step 5 + Task 5 Step 5 ✅
- 결정 3 base omega ×0.3 대체 → Task 5 Step 6 ✅
- §11 신규 ADR → Task 6 ✅

**2. Placeholder scan:** Task 4 Step 4(web-audio-synth 테스트)는 "기존 mock 패턴 재사용"으로 위임 — 실행자가 기존 파일을 읽고 동형 작성. 이는 기존 테스트 인프라 의존이라 코드 복붙보다 정확. 그 외 placeholder 없음.

**3. Type consistency:** `litFloorsFor`/`TOTAL_FLOORS`(Task 3), `isBossClimax`/`CLIMAX_HP_RATIO`(Task 5), `INTERIOR_PALETTES`/`MASK_COLORS`/`MASK_NEEDS_STROKE`(Task 1·2), `playBossApproaching`/`setBossClimax`(juice-manager) — 정의 task와 사용 task 간 이름 일치 확인 완료.

**알려진 제약(구현 중 검증):** climax omega 즉시 대체는 위상 점프 가능(spec §8.3, 기존 rage와 동일 known pattern) — 시각 확인 후 필요 시 ease ramp 추가. 부서명 텍스트는 전환 화면이라 인게임 텍스트 0줄 정책과 무관(spec 결정 1).
