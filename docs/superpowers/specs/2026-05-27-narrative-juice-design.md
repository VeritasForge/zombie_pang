# 좀비팡 서사 연출(Narrative Juice) 설계

- **Status**: Draft v2 (브레인스토밍 + ce-doc-review 1라운드 반영 완료 → writing-plans 대기)
- **Date**: 2026-05-27
- **Author**: Claude (브레인스토밍 세션, 사용자 `/goal` 위임 하 자율 결정 + 다관점 리뷰 반영)
- **상위 SSOT**: `docs/game-design/bible.md` §2/§3/§5, `CLAUDE.md` §7
- **관련 ADR**: ADR-0010(층 서사 텍스트, Open), **`docs/adr/draft/ADR-0002-variable-reward-scope.md`**(가변 보상 범위, Open — 아래 §11 번호 충돌 주의), ADR-0006(게임 디자인 원칙)
- **Review 반영**: §14 ce-doc-review 결정 로그 참조

---

## 1. 배경 & 목적

좀비팡 시나리오(Bible §2)와 실제 코드를 대조한 결과, **게임 규칙·윤리 메커니즘은 충실히 구현됐으나 "서사 연출(narrative juice)"이 일관되게 비어 있음**이 드러났다.

> **제품 가설 (미검증 — identity bet)**: 본 작업의 우선순위 근거는 *Bible-vs-code gap 내부 audit*이며, "회색 무대 느낌이 retention/이해를 해친다"는 **playtest 신호는 아직 없다**. 따라서 본 스펙은 gap-closing이 아니라 *의도적 정체성 베팅*으로 frame한다. 저비용·고차별 항목(챕터 배경)을 먼저 구현해 값싼 read를 얻은 뒤 나머지를 확정하는 순서를 권고한다(§2 구현 순서).

### 12살 비유

지금 게임은 *회색 무대에서 배우(좀비)만 정확히 움직이는 리허설*이다. 본 스펙은 **무대 배경·조명·효과음**을 입혀 "내가 진짜 좀비 사옥을 오르고 있다"는 느낌을 만든다. 새 배우(좀비 종)나 새 대본(규칙)은 추가하지 않는다 — 연출만.

---

## 2. 범위 (5개 항목) + 구현 순서

| # | 항목 | 한 줄 | 영역 | 위험 | 서사가치 |
|---|------|------|------|------|---------|
| 1 | 보스 슬로우모션 climax | 보스 처치 직전 긴장 고조 | 인게임 | **높음**(boss-rage 상호작용) | 중 |
| 2 | BOSS APPROACHING 경고 | wave 10 진입 시 보스 임박 cue | 인게임 | 중(juice 충돌) | 중 |
| 3 | 챕터별 배경/인테리어 톤 | 5개 부서의 분위기 차별화 | 인게임 | 낮음(상수) | **높음** |
| 4 | 좀비 마스크 색 | 직급 위계 시각화 | 인게임 | 낮음(상수) | 중 |
| 5 | 사옥 줌아웃 + 층 색칠 | 챕터 클리어 = 한 층 정복 | 전환 화면 | 낮음 | **높음**(핵심 등반 서사) |

### 구현 순서 (위험 격리 — 단일 스펙 유지)

사용자가 "전체 5개 일괄, 단일 스펙"을 선택했으므로 **분리하지 않는다**. 단 adversarial 리뷰의 "고위험(item 1)이 저위험 cosmetic 출시를 게이트" 우려를 **구현 순서로 해소**한다:

```
저위험·고서사 먼저 ──────────────────────────► 고위험 나중
  3 챕터 배경 → 4 마스크 색 → 5 사옥 빌딩 → 2 APPROACHING → 1 climax
```

각 단계는 독립 커밋 + `/code-review` 게이트. item 1(climax)에서 막혀도 3·4·5는 이미 머지 가능.

### 범위 밖 (Non-Goals)

- 좀비 종/카드/규칙 추가 — **연출만**.
- 사옥 인테리어 **재건 보상**(가구/비품 회복) — `ADR-0002-variable-reward-scope` Layer 2 가변 영역, post-MVP (§11).
- 외부 이미지/사운드 자산 — Phaser Graphics + Web Audio 합성.
- HP/lifespan Bible-vs-code 수치 불일치 — 별도 문서 동기화 작업(§9).

---

## 3. 핵심 설계 결정 (확정 + 근거)

> 모든 결정은 **추측이 아니라 1차 출처(Bible/ADR/실제 코드) 확인**을 거쳐 내렸다.

### 결정 1 — 텍스트 정책: 인게임 무텍스트 / 전환 컷인만 텍스트

- **근거**: Bible §6 "게임 화면 텍스트 0줄(HUD 숫자 제외)" + §9 "카운트다운 압박 텍스트 금지". 반면 Bible §3은 `"PUNCH OUT! 17:30" cutscene` 등 **전환 컷씬엔 텍스트 허용**.
- **ADR-0010 정합**: 인게임 층 서사는 **아이콘/모티프**(권장 C), 부서명 텍스트는 **전환 화면**(이미 텍스트 영역)에만 1회.

### 결정 2 — 마스크 색: 오라색 유지 + 마스크 표식 추가 (대비 명시)

- **충돌**: 오라색(녹/황/적/보라)=종류 구분. Bible §2 마스크색=직급 위계. 어두운 배경(`#1a1a1a`)에서 검정(`#0A0A0A`)·진회(`#3A3A3A`) 마스크는 대비 부족(< 3:1).
- **결정**: 오라색 유지 + 이모지 하단 마스크 표식 Graphics. **진회·검정 마스크는 `maskWhite`(0xF0EAD6) stroke `px(2)`로 외곽 분리** → 대비 ≥ 3:1 확보(WCAG 1.4.11 Non-text Contrast). 색은 단독 신호가 아니라 stroke 형태와 병행.

### 결정 3 — 슬로우모션: 전역 `timeScale` 미사용 + climax는 base omega 기준 ×0.3 대체

- **근거 (코드 확인)**: `PhaserGameClock.now() = game.loop.now`(wall-clock, `adapters/phaser/clocks/phaser-game-clock.ts:29-31`). `time.timeScale`은 `game.loop.now`에 무영향 → 결정론 combo decay 불변. 단 `scene.time.now`(lifespan/killedAtMs)는 timeScale 영향 가능 → 전역 timeScale **회피**.
- **rage 충돌 해소 (코드 확인, `boss-rage-level.ts:22-26`)**: Ch4는 `ratio≤0.5→rage1(omega×1.3)`, Ch5는 `ratio≤0.33→rage2(omega×1.6)`. climax(`ratio≤0.25`)는 이 구간과 **겹친다**. 단순 ×0.3 곱은 Ch5에서 `1.6×0.3=0.48`로 의도(0.3배)와 다르고 "격노(빠름)+슬로우(느림)" 톤 충돌.
  - **결정**: climax 활성 시 `effective.omega = base.omega × 0.3` (**rage omega 배수를 대체**, 곱하지 않음). `R`(진폭)은 rage 적용값 유지(격노한 보스가 슬로우에 걸린 연출). → 전 챕터 일관 0.3배.
- **위상 점프 완화 (`boss-movement.ts` 확인)**: 위치 `sin(ω·t)`는 누적 t 기반이라 omega 급변 시 위상 점프(teleport). climax 진입 시 omega를 **~0.3s ease로 ramp**(hard toggle 금지)하여 점프 완화. (기존 rage 전환도 동일 점프 패턴이나 climax는 base 기준이라 폭이 커 ramp 필수.)
- **트리거 + latch**: `isBossClimax(hp, maxHp) = hp/maxHp ≤ 0.25` (신규 도메인 순수 함수). 보스 HP는 `takeDamage` **감소만**(회복 mechanic 없음 — 코드 확인) → **one-way latch**: 한번 진입하면 처치까지 유지. 히스테리시스/깜빡임 원천 차단.
- **Bible "0.3배속" trade-off**: Bible §3 "슬로우모션 0.3배속"은 전역 시간지연 뉘앙스이나, 결정론 clock 제약상 **보스-only 근사**로 구현. 부족분은 scene-wide 보조 cue(desaturate 비네트 + 기존 0.6s freeze)로 "시간 느려짐" 인상 보강. 이 절충을 ADR로 기록(§11).

### 결정 4 — 층 점등 = 결정론 (사옥 진행도 시각화)

- **`ADR-0002-variable-reward-scope` 정합**: 해당 ADR의 "인테리어 **재건 보상**(가구/비품 회복 순서) 가변"은 **보상 메커니즘**. 본 항목 5는 *클리어 층을 빌딩에 색칠*하는 **진행도 시각화**(보상 아님) → 결정론(`chaptersCleared × 10`, 누적·아래→위)이 ADR 가변 범위와 무관. 신규 ADR로 "진행도 시각화 ≠ 가변 보상" 명문화(§11).

### 결정 5 — BOSS APPROACHING 저음 cue: 신규 AudioEvent (파라미터 commit)

- **근거 (코드 확인)**: `AudioEvent`에 보스 임박 저음 없음. Bible §3 "Telegraph: 저음 cue" 명세. `EVENT_TONES`는 `Record<AudioEvent,...>`라 union 추가 시 누락 강제, `freqEnd` ramp로 하강 저음 합성(자산 0).
- **commit 파라미터**: `boss_approaching` = `[{ type:"sawtooth", freq:60, freqEnd:40, durationS:0.8, gain:0.2 }, { type:"square", freq:120, freqEnd:90, durationS:0.6, gain:0.08 }]` (하강 rumble + 약한 고조파). 구현 시 미세 조정 가능하나 "하강 저음"이 acceptance.

### 결정 6 — cue 시각 차별화 + 멀티감각 접근성 (신규)

- **문제 (design-lens P1, conf 100)**: BOSS APPROACHING(붉은 비네트)과 climax(붉은 비네트)가 **시각적으로 동일**, 기존 `wave_clear`/`boss_kill` juice(셰이크+비네트)와도 같은 어휘. 무텍스트라 청각·색각 장애 접근 불가.
- **결정 — 신호를 motion shape + 채도 + 멀티감각으로 분리**:

| cue | 시각(형태) | 색/채도 | 청각 | 촉각 |
|-----|-----------|---------|------|------|
| BOSS APPROACHING | **4코너→중앙 수렴 펄스** ×2 (빠름) | 붉은 alpha 0.6 | `boss_approaching` 저음 | `haptic.vibrate([80,40,80])` |
| climax (지속) | **가장자리 desaturate(흑백화) throb** (느림) | 채도↓ 위주(색 무관) alpha 0.35 | (기존 SFX) | — |

- **색각 독립**: climax는 "붉음"이 아니라 **채도 저하**가 주 신호 → 적록색각 무관. BOSS APPROACHING은 수렴 **모션**으로 식별(색 단독 의존 X).
- **기존 juice와 타이밍 분리**: wave 10 진입 시 `wave_clear` juice 완료 후 **~200ms gap** → BOSS APPROACHING cue. 시각 충돌 방지.

### 결정 7 — 정체성 가드레일 (product-lens)

- 좀비팡의 정체성은 *"no pressure, 게임이 끝난다"*. climax/approaching은 **"punch-out 안도감으로 해소되는 긴장"**이지 *"do-or-die 위협/압박"*이 아니다.
- vignette alpha·rumble gain·shake 강도는 brand에 맞춰 **절제**(과한 위협 금지). 카운트다운/위협 텍스트 0 유지(Bible §9). climax는 긴장→처치 freeze→안도(다음 층)로 해소되는 호(arc)로 튜닝.

---

## 4. 아키텍처

### 원칙: "분기/경계가 있으면 도메인, 단순 1:1 lookup이면 어댑터 상수"

```
        결정/매핑 (domain/ 순수, 테스트 100%)        렌더링 (adapters/phaser, 70%)
  ┌────────────────────────────────┐    ┌────────────────────────────────┐
  │ isBossClimax(hp,maxHp) ≤0.25     │    │ omega base×0.3 ease-ramp / latch │
  │   → boss/boss-climax.ts          │ →  │ 수렴펄스 cue / desaturate throb   │
  │ litFloorsFor(chaptersCleared)    │    │ 사옥 빌딩 + 누적 층 색칠 tween     │
  │   → run/building-progress.ts     │    │ 챕터 배경 모티프 / 마스크 stroke   │
  └────────────────────────────────┘    └────────────────────────────────┘

  단순 상수 (adapters/phaser/config.ts):
    MASK_COLORS, INTERIOR_PALETTES, climax/approaching TIMINGS
```

---

## 5. 항목별 상세 설계 (구현 순서대로)

### 5-3. 챕터별 배경/인테리어 톤 🎨 (먼저)

| | |
|---|---|
| **상수 신규** | `config.ts` `INTERIOR_PALETTES: Record<1..5, { bg:number; accent:number; motif:MotifId }>` |
| **색값 commit (예시, 대비 검증 대상)** | 1 신입부서 `bg #1a1a26 / accent #6bcb77(형광녹) / motif fluorescent` · 2 영업본부 `bg #201a26 / accent #ffd93d / motif headset` · 3 R&D `bg #15211f / accent #4dd0e1 / motif whiteboard` · 4 임원실 `bg #261f1a / accent #c9a227 / motif carpet` · 5 CEO+옥상 `bg #0d0d1a / accent #ff2d87 / motif kpi` |
| **모티프 가독성** | 각 모티프 accent 색 + **alpha 0.18~0.30**(배경 위 식별 가능, 게임플레이 방해 X) + 선두께 `px(2)` 이상. 형태로 구분(색 단독 신호 금지). |
| **렌더** | `game-scene.create()`에서 `this.chapter`로 배경색 + 모티프 Graphics(자산 0). 정적 → 1회 생성. |
| **완료조건** | 5개 챕터 배경이 **서로 식별 가능**(단순 "다름"이 아니라, 내부 리뷰에서 텍스트 없이 부서 추정 가능 — §6). |

### 5-4. 좀비 마스크 색 🎭

| | |
|---|---|
| **상수 신규** | `config.ts` `MASK_COLORS = { intern: 0xf0ead6, middle: 0x7a7a7a, lead: 0x3a3a3a, ceo: 0x0a0a0a }` |
| **표식 치수** | 폭 = 컨테이너 폭의 ~40%, 높이 `px(6)`, 이모지 하단 `px(4)` 아래 중앙. 가장 작은 좀비(intern)에서도 가시. |
| **진회·검정 가시성** | `lead`(0x3A3A3A)·`ceo`(0x0A0A0A) 표식은 `maskWhite`(0xF0EAD6) **stroke `px(2)`** 외곽선 → 대비 ≥ 3:1. (밝은 흰/회는 stroke 불요.) |
| **렌더** | `zombie.ts` `VISUAL_SPECS`에 `maskColor` 추가. 오라색 유지(이중 인코딩: 오라=종류, 마스크=위계). |

### 5-5. 사옥 줌아웃 + 층 색칠 🏢

| | |
|---|---|
| **신규 도메인** | `src/domain/run/building-progress.ts` (신규 디렉토리) — `litFloorsFor(chaptersCleared): number` (0~50 클램프, **누적**) |
| **빌딩 배치** | `game-over-scene.ts` `renderChapterEnd()` — 빌딩 미니어처를 **배경 레이어**(`setDepth(0)`, alpha 0.5)로 중앙 세로 배치. 폭 ~`px(120)`, 높이 ~`px(500)`, 50층(층당 ~`px(10)`). 텍스트·카드는 그 위(`setDepth(10+)`). |
| **누적 점등** | `litFloorsFor(bestReachedChapter)` 층까지 accent 색칠(이전 챕터 층 유지). 방금 클리어한 10개 층은 **0.15s stagger 점등 tween**. |
| **줌아웃** | 빌딩 scale 1.1→1.0 ease(1.2s). |
| **기존 시퀀스 통합** | 현재 `renderChapterEnd` 순서: title(80)→subtitle(120)→score(156)→카드(320)→버튼(520/580). **수정**: title 직후 빌딩 배경 줌아웃+점등(1.2s) → 그 위로 기존 카드 fan-out. 카드/버튼 y좌표 불변(빌딩은 배경 depth라 충돌 X). 부서명 텍스트는 빌딩 상단. |

### 5-2. BOSS APPROACHING 경고 🚨 (무텍스트, 후반)

| | |
|---|---|
| **트리거** | `advanceWave()`가 `wave === 10` 진입 감지 → `wave_clear` juice 후 ~200ms gap → **0.8초 cue → `spawnBoss()`** (현재 `scheduleNextSpawn:281` 즉시 스폰을 cue 딜레이로 분리) |
| **연출** | 결정 6 표: 4코너→중앙 수렴 붉은 펄스 ×2 + `audio.play("boss_approaching")` + `haptic.vibrate([80,40,80])` + 약한 셰이크. **텍스트 0**. |
| **Telegraph 관계** | BOSS APPROACHING = wave 10 **진입** cue(보스 스폰 전, 본 스펙). Bible §3 "Telegraph(보스 phase 0~1s)"는 **별개 개념**이며 현재 코드에 phase 타이밍 미구현 — 혼동 방지 위해 본 스펙은 진입 cue만 다룬다. |
| **입력 처리** | cue 0.8s 동안 보스 미존재 → tap은 silent(기존 background tap 경로). 별도 잠금 불요. |
| **정리** | cue Graphics는 보스 스폰 시 destroy. |

### 5-1. 보스 슬로우모션 climax 🐌 (고위험, 마지막)

| | |
|---|---|
| **신규 도메인** | `src/domain/boss/boss-climax.ts` — `CLIMAX_HP_RATIO = 0.25`, `isBossClimax(hp, maxHp): boolean` (maxHp≤0 → false, graceful) |
| **omega 처리** | climax 활성 시 `effective.omega = base.omega × 0.3` (**rage 배수 대체**), `R`은 rage값 유지. ~0.3s ease ramp로 진입(위상 점프 완화). |
| **latch** | one-way: `isBossClimax` true 도달 후 처치까지 유지(HP 감소만이므로 안전). |
| **비네트** | `juice-manager.ts` `setBossClimax(active)` — 가장자리 desaturate throb(alpha 0.35). idempotent(이미 active면 no-op). |
| **exit 상태표** | (1) 보스 처치 → 기존 `boss_kill` freeze(0.6s) 중 비네트 fade-out → endChapter. (2) 챕터 종료 전이 → scene shutdown 시 비네트/Graphics 정리(기존 `activeFreezeOverlays` 패턴). |
| **감시 위치** | `game-scene.ts` update tick `if (bossWaveActive && bossZombie)` 블록(라인 ~604) 내 `isBossClimax` 평가 → omega 배수/비네트 토글. |

---

## 6. 완료조건 (Completion Criteria)

모든 명령 **exit 0**:

```bash
pnpm typecheck   # error 0 (no any)
pnpm lint        # error 0
pnpm test        # domain 100% / adapters-phaser 70% / 신규 도메인 mutation ≥80%
pnpm test:prop   # isBossClimax invariant seed=42 numRuns=1000 통과
pnpm build       # gzip < 1.5MB 유지
pnpm test:e2e    # boss-wave/game-flow 회귀 0
```

기능 완료조건 (기계적):
- [ ] Ch1~5 모든 보스가 HP 25% 이하에서 **일관되게** base omega의 0.3배로 감속(rage 무관) + desaturate 비네트 on, 처치/종료 시 복구.
- [ ] wave 10 진입 시 보스 스폰 전 수렴 펄스 + 저음 + haptic cue(텍스트 0), `wave_clear` 직후와 ~200ms 분리.
- [ ] 5개 챕터 배경색·모티프가 서로 다르다.
- [ ] 4종 마스크 표식이 보이고, 진회·검정 마스크가 stroke로 어두운 배경에서 식별(대비 ≥ 3:1).
- [ ] 챕터 클리어 화면에 빌딩 + 누적 점등 + 부서명, 카드 fan-out과 레이아웃 충돌 없음.
- [ ] `grep -r "__zp_test__" dist/` = 0건.

**outcome 완료조건 (감각 전달 — product-lens)**:
- [ ] **내부 리뷰 1회**: 텍스트를 가린 스크린샷에서 (a) 챕터별 부서를 모티프만으로 추정 가능, (b) BOSS APPROACHING이 wave_clear와 구별됨, (c) climax가 "감속/긴장"으로 읽힘.
- [ ] **접근성**: 모든 신규 cue가 색 단독 신호가 아님(형태/채도/모션/촉각 병행), 신규 표식 대비 ≥ 3:1(WCAG 2.1 AA).

---

## 7. 금지사항 (Don'ts)

| 금지 | 대신 |
|------|------|
| 전역 `scene.time.timeScale` 조작 슬로우모션 | 보스 omega base×0.3 대체 + ease ramp |
| climax omega를 rage 배수에 **곱하기** | base 기준 **대체**(0.48 같은 톤 충돌 방지) |
| omega hard toggle (위상 점프) | ~0.3s ease ramp |
| BOSS APPROACHING/부서명 인게임 **텍스트** | 인게임 비주얼/사운드/촉각, 텍스트는 전환 화면만 |
| 붉은 비네트를 cue마다 동일 사용 | 수렴 펄스(approaching) vs desaturate throb(climax) 형태 분리 |
| 색 단독 신호 (적록색각·청각 장애 배제) | 형태+채도+모션+haptic 병행 |
| `domain/`에 색(hex)·Phaser import | 색은 `config.ts`, 분기만 도메인 순수 함수 |
| 외부 이미지/사운드 자산 | Phaser Graphics + `WebAudioSynth` 합성 |
| 매 프레임 배경/빌딩/비네트 재생성 | `create()` 1회 + 상태 토글 |
| 사옥 점등 RNG 가변 | 결정론 누적(`chaptersCleared × 10`) |
| climax를 do-or-die 위협으로 과장 | punch-out 안도로 해소되는 절제된 긴장(정체성 가드레일) |

---

## 8. 고려사항 (엣지/성능/회귀)

1. **timeScale 부작용 회피**(결정 3): 전역 timeScale 미사용 → combo decay/lifespan/E2E 폴링 부작용 차단.
2. **climax-rage 상호작용 테스트**: Ch5 hp=0.25 진입 시 `effective.omega === base.omega × 0.3`(rage2 ×1.6가 곱해지지 않음) 단위 테스트 필수.
3. **위상 점프**: ease ramp로 완화하나 잔여 점프는 기존 rage 전환과 동일 known pattern으로 수용. 구현 시 시각 확인.
4. **div-zero**: `isBossClimax(hp, 0)` → false(throw 금지).
5. **Graphics 누수**: 비네트·빌딩·모티프·cue Graphics는 scene shutdown 정리(`activeFreezeOverlays` 패턴).
6. **E2E 회귀**: `boss-wave.spec`은 `bossHp`/`bossRageLevel`만 폴링(위치 무관, 코드 확인) → omega 변경 영향 없음 예상. `setBossHp(12)`로 Ch5 25%↓ 진입 시 climax latch 동작 확인. cue 0.8s 딜레이가 game-flow 타이밍에 미치는 영향 검증.
7. **번들/FPS**: 신규 코드는 순수 함수+Graphics라 영향 미미. 정적 배경은 particle degradation과 독립. `pnpm size` 확인.

---

## 9. 제약사항 (Constraints)

- **자산 0**(Agent Rule #7), **도메인 순수성**(Rule #6), **인게임 텍스트 0줄**(Bible §6).
- **HP/lifespan 수치 불일치**(Bible §2/§8 vs 코드)는 본 스펙 범위 밖 — 별도 문서 동기화 작업.
- **WCAG 2.1 AA**(Bible §6): 신규 비주얼 대비 ≥ 3:1, 색 단독 신호 금지.

---

## 10. 테스트 전략 (TDD 3 카테고리)

| 대상 | 정책 | RED 케이스 |
|------|------|-----------|
| `boss-climax.ts` | domain 100% + mutation ≥80% | `[Happy]` 24%→true / `[Boundary]` 정확히 25%, 0%, 100% / `[Error]` maxHp=0→false, 음수 hp |
| `boss-climax.prop.test.ts` | property seed=42 | invariant: `0≤hp≤maxHp`에서 `isBossClimax` ⇔ `hp/maxHp≤0.25` |
| `building-progress.ts` | domain 100% + mutation ≥80% | `[Happy]` 3→30 / `[Boundary]` 0→0, 5→50, 6→50(클램프) / `[Error]` 음수→0 |
| climax-rage 통합 | adapters 70% | Ch5 hp=0.25에서 effective.omega = base×0.3 (rage 미곱) |
| `web-audio-synth` boss_approaching | infra 80% | `[Happy]` 재생 / `[Boundary]` ctx suspended skip / `[Error]` ctx null no-op |
| `juice-manager.setBossClimax` | adapters 70% | smoke: 비네트 생성/정리, idempotent |
| 챕터 배경/모티프 | adapters 70% | smoke: 5개 챕터 배경색 Graphics 생성, 5색 상이 |
| 마스크 표식 | adapters 70% | smoke: 4종 maskColor 적용, lead/ceo stroke 존재 |
| 사옥 빌딩 | adapters 70% | `litFloorsFor` 결과만큼 색칠 호출 |
| 기존 E2E | 회귀 0 | `boss-wave.spec`/`game-flow.spec` |

---

## 11. ADR 관계 + 후속 ADR

| ADR | Status | 관계 |
|-----|--------|------|
| ADR-0010 (층 서사 텍스트) | Open, 권장 C(아이콘) | **정합** — 인게임=모티프, 부서명=전환 화면 |
| `docs/adr/draft/ADR-0002-variable-reward-scope.md` | Open, Default B | **무관** — 본 스펙 "층 점등"=진행도 시각화(결정론), "재건 보상"=가변(post-MVP) |
| ADR-0006 (게임 디자인 원칙) | — | 텍스트/압박/자산/접근성 정책 준수 |

> ⚠️ **ADR 번호 충돌 (adversarial conf 100)**: Accepted `docs/adr/0002-game-engine.md`와 draft `docs/adr/draft/ADR-0002-variable-reward-scope.md`가 **같은 번호 0002**를 쓴다. 본 스펙은 draft 쪽을 가리키며 항상 전체 경로로 표기한다. **draft Accept 전 재번호 권고**(writing-plans/별도 작업).

**신규 ADR 권고 (확정)**: writing-plans에서 신규 ADR 1건 작성 권고 —
- (a) "사옥 층 점등 = 진행도 시각화(결정론), 가변 보상과 별개" 명문화,
- (b) "Bible §3 '0.3배속'은 결정론 clock 제약상 보스-only omega 근사로 구현" trade-off 기록.

---

## 12. 파일 변경 인벤토리 (실존 검증 완료)

### 신규 생성
- `src/domain/boss/boss-climax.ts` + `.test.ts` + `.prop.test.ts` (`src/domain/boss/` 실존 ✅)
- `src/domain/run/building-progress.ts` + `.test.ts` (**`src/domain/run/` 신규 디렉토리** — CLAUDE.md §4 아키텍처 의도)
- 신규 ADR 1건 (§11, writing-plans에서 번호 확정)

### 수정 (실존 확인)
- `src/domain/ports/audio.ts` — `AudioEvent`에 `boss_approaching`
- `src/infrastructure/audio/web-audio-synth.ts` — `EVENT_TONES` 저음 rumble + `.test.ts`
- `src/adapters/phaser/config.ts` — `MASK_COLORS`, `INTERIOR_PALETTES`, climax/approaching `TIMINGS`
- `src/adapters/phaser/objects/zombie.ts` — `VISUAL_SPECS.maskColor` + 표식 stroke 렌더
- `src/adapters/phaser/managers/juice-manager.ts` — `setBossClimax` (desaturate 비네트) + BOSS APPROACHING 수렴 펄스 helper
- `src/adapters/phaser/scenes/game-scene.ts` — climax 감시/omega ramp(update), BOSS APPROACHING cue(advanceWave), 챕터 배경(create)
- `src/adapters/phaser/scenes/game-over-scene.ts` — 사옥 빌딩 배경 레이어 + 누적 점등 + 부서명(renderChapterEnd)

---

## 13. Open Questions

브레인스토밍 + 리뷰에서 모든 핵심 결정 확정. 구현 단계 미세 결정만 잔존:
- 챕터 배경 hex/모티프 도형 최종값(대비 검증 후 확정).
- climax omega ease ramp 곡선/지속(0.3s 기준, 시각 확인 후 조정).
- 빌딩 미니어처 정확 치수(viewport 비율 확인).

---

## 14. ce-doc-review 결정 로그 (Round 1)

5 persona(coherence/feasibility/design-lens/adversarial/product-lens) 검증 결과 반영:

| Finding | persona/conf | 처리 |
|---------|-------------|------|
| climax omega ×0.3 ↔ rage ×1.6 중첩(P0) | adversarial 75 + coherence 50 | **반영** — base 기준 대체(결정 3) |
| CEO/진회 마스크 가시성·stroke 미명시(P0/P2) | design 100 + coherence 75 | **반영** — stroke px(2)+대비≥3:1(결정 2, 5-4) |
| cue 시각 동일 + 기존 juice 충돌(P1) | design 100 + adversarial 75 | **반영** — 형태 분리+200ms gap(결정 6) |
| 무텍스트 cue 접근성(P1) | design 100 | **반영** — 채도/모션/haptic 멀티감각(결정 6) |
| omega가 Bible 0.3배속 의도 미재현(P1) | adversarial 75 | **반영** — trade-off ADR 기록(결정 3, §11) |
| ADR-0002 번호 충돌/참조 모호(P1) | adversarial 100 | **반영** — draft 전체 경로+재번호 권고(§11) |
| interior motif 가독성 미명시(P1) | design 100 + adversarial 50 | **반영** — alpha/선두께/색값(5-3) |
| 완료조건 감각 미측정(P2) | product 75 | **반영** — outcome 완료조건(§6) |
| 우선순위/번들 위험(P2) | adversarial 50 + product 75 | **반영** — 위험 기반 구현 순서(§2, 단일 스펙 유지) |
| 정체성 intensity 가드레일(P3) | product 50 | **반영** — 결정 7 |
| 구현 디테일(audio 파라미터/hysteresis/치수/exit/빌딩 통합) | design 75 다수 | **반영** — 결정 5, 5-1~5-5 commit |
| 테스트 챕터 배경 누락(P2) | coherence 75 | **반영** — §10 행 추가 |
| 위상 점프 teleport(advisory 50) | feasibility 50 | **반영** — ease ramp(결정 3, §8.3) |
| clock 경로 "infrastructure" 표기 | feasibility residual | **정정** — `adapters/phaser/clocks/`(결정 3) |
