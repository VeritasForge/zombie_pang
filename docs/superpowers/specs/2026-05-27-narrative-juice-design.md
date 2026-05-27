# 좀비팡 서사 연출(Narrative Juice) 설계

- **Status**: Draft (브레인스토밍 완료 → writing-plans 대기)
- **Date**: 2026-05-27
- **Author**: Claude (브레인스토밍 세션, 사용자 `/goal` 위임 하 자율 결정)
- **상위 SSOT**: `docs/game-design/bible.md` §2/§3/§5, `CLAUDE.md` §7
- **관련 ADR**: ADR-0010(층 서사 텍스트, Open), ADR-0002(가변 보상 범위, Open), ADR-0006(게임 디자인 원칙)

---

## 1. 배경 & 목적

좀비팡 시나리오(Bible §2 World & Story Bible)와 실제 코드를 대조한 결과, **게임 규칙·윤리 메커니즘은 충실히 구현됐으나 "서사 연출(narrative juice)"이 일관되게 비어 있음**이 드러났다. *"좀비 사옥을 한 층씩 올라가 퇴근한다"*는 핵심 서사를 **감각적으로 전달하는 연출**이 미구현 상태다.

본 스펙은 미구현 서사 연출 **5개 항목**을, 프로젝트의 Hexagonal 아키텍처·도메인 순수성·자산 0·텍스트 0줄 정책을 지키며 구현하기 위한 설계다.

### 12살 비유

지금 게임은 *회색 무대에서 배우(좀비)만 정확히 움직이는 리허설*이다. 본 스펙은 **무대 배경·조명·효과음**을 입혀 "내가 진짜 좀비 사옥을 오르고 있다"는 느낌을 만든다. 단, 새 배우(좀비 종)나 새 대본(규칙)은 추가하지 않는다 — 연출만.

---

## 2. 범위 (5개 항목, 우선순위 순)

| # | 항목 | 한 줄 | 영역 |
|---|------|------|------|
| 1 | 보스 슬로우모션 climax | 보스 처치 직전 긴장 고조 | 인게임 |
| 2 | BOSS APPROACHING 경고 | wave 10 진입 시 보스 임박 cue | 인게임 |
| 3 | 챕터별 배경/인테리어 톤 | 5개 부서의 분위기 차별화 | 인게임 |
| 4 | 좀비 마스크 색 | 직급 위계 시각화 | 인게임 |
| 5 | 사옥 줌아웃 + 층 색칠 | 챕터 클리어 = 한 층 정복 | 전환 화면 |

### 범위 밖 (Non-Goals)

- 좀비 종 추가, 카드 추가, 새 게임 규칙 — **연출만**, 메커니즘 불변.
- 사옥 인테리어 **재건 보상**(가구/비품 회복) — ADR-0002 Layer 2 가변 영역, post-MVP (§11 참조).
- 외부 이미지/사운드 자산 — 전부 Phaser Graphics + Web Audio 합성.

---

## 3. 핵심 설계 결정 (확정 + 근거)

> 모든 결정은 **추측이 아니라 1차 출처(Bible/ADR/실제 코드) 확인**을 거쳐 내렸다.

### 결정 1 — 텍스트 정책: 인게임 무텍스트 / 전환 컷인만 텍스트

- **근거**: Bible §6 "게임 화면 텍스트 0줄(HUD 숫자 제외)" + §9 Don'ts "카운트다운 압박 텍스트 금지". 반면 Bible §3 챕터 전환 시퀀스는 `"PUNCH OUT! 17:30" cutscene`, `retrospective 1줄`처럼 **전환 컷씬엔 텍스트 허용**.
- **ADR-0010 정합 확인**: ADR-0010(Open, 권장 C)은 인게임 층 서사를 **아이콘으로 대체**, 텍스트 0줄 보존을 권장. 본 설계는 인게임을 **모티프 Graphics**(아이콘류)로, 부서명 텍스트는 **전환 화면**(이미 텍스트가 있는 `game-over-scene`)에만 1회 → ADR-0010 범위(인게임 층 표시)와 충돌 없음.
- **적용**:
  - BOSS APPROACHING → **무텍스트** (붉은 비네트 펄스 + 저음 + 셰이크)
  - 부서명("신입부서" 등) → **챕터 전환 화면 텍스트** 1회
  - 챕터 인테리어 → **인게임 모티프 Graphics** (텍스트 없음)

### 결정 2 — 마스크 색: 오라색 유지 + 마스크 표식 추가

- **충돌**: 현재 좀비는 이모지 + **오라색**(녹/황/적/보라)으로 *종류* 구분(`zombie.ts:27-52`). Bible §2 마스크색(흰/회/진회/검정)은 *직급 위계*. 어두운 배경(`#1a1a1a`)에서 검정 마스크(`#0A0A0A`)는 가시성 0.
- **결정**: 오라색(종류·가독성) **유지** + 이모지 하단에 **마스크 표식 Graphics** 추가(이중 인코딩). 검정 마스크는 `maskWhite` 얇은 테두리로 가시성 확보.

### 결정 3 — 슬로우모션 방식: 전역 `time.timeScale` 미사용, 보스 omega 감속

- **근거 (코드 확인)**: `PhaserGameClock.now() = game.loop.now`(performance.now 기반 wall-clock, `phaser-game-clock.ts:29-31`). Phaser `time.timeScale`은 `game.loop.now`에 영향을 주지 않으므로 결정론 combo decay는 timeScale과 무관하다. **그러나** 보스 위치(`tickBossPosition`)도 `clock.now` 기반이라 전역 timeScale로는 **보스가 안 느려진다**. 또 `scene.time.now`(lifespan/killedAtMs 경로)는 timeScale 영향 가능성이 있어 부작용 위험.
- **결정**: 전역 `timeScale`을 건드리지 **않고**, climax 동안 **보스 omega ×0.3 감속 + 약한 desaturate 비네트 + (기존) 처치 0.6s freeze frame**으로 "슬로우모션 인상"을 만든다.
  - 장점: 결정론 clock 무영향(검증됨) / `scene.time.now` 부작용 0 / **E2E `timeScale` 무관**(폴링은 wall-clock).
  - 보스전엔 움직이는 객체가 보스뿐(미니언은 정지 배치)이라 시각 효과 충분.
- **트리거**: `isBossClimax(hp, maxHp) = hp/maxHp ≤ 0.25` (신규 도메인 순수 함수). `computeRageLevel`은 챕터마다 경계가 달라(Ch1~3 항상 rage 0) 모든 보스 일관 적용 불가 → 별도 비율 함수 신설.

### 결정 4 — 층 점등 = 결정론 (사옥 진행도 시각화)

- **ADR-0002 정합 확인**: ADR-0002(Open, Tentative Default B)의 "사옥 **인테리어 재건 보상** 가변"은 *가구/비품 회복 순서*라는 **보상 메커니즘**을 가리킨다. 본 항목 5는 *클리어한 층을 빌딩에 색칠*하는 **진행도 시각화**로, 보상이 아니다 → 결정론(`chaptersCleared × 10`, 아래→위 순차 점등)이 ADR-0002 가변 범위와 무관.
- **근거**: 50층 등반 서사는 순차 점등(아래→위)이 자연스럽고, 무상태·무RNG로 테스트 100% 용이.

### 결정 5 — BOSS APPROACHING 저음 cue: 신규 AudioEvent

- **근거 (코드 확인)**: `AudioEvent` union에 보스 임박용 저음이 없음(`audio.ts`, 9종). Bible §3 "Telegraph 0~1s: 셰이크 8px, **저음 cue**" 명세 존재. `WebAudioSynth`의 `EVENT_TONES`는 `Record<AudioEvent, ...>`라 union 추가 시 누락이 타입 에러로 강제되고, `freqEnd` ramp로 하강 저음 합성 가능(자산 0 충족).
- **결정**: `boss_approaching` AudioEvent 추가 (예: `sawtooth 60→40Hz, 0.8s` rumble).

---

## 4. 아키텍처

### 원칙: "분기/경계가 있으면 도메인, 단순 1:1 lookup이면 어댑터 상수"

접근법 A(순수함수+어댑터 분리)를 YAGNI와 균형 적용. 경계 테스트 가치가 있는 분기만 `domain/` 순수 함수로 빼고, 챕터→색 같은 단순 lookup은 어댑터 상수 테이블에 둔다(억지 도메인화 = 과설계).

```
        결정/매핑 (domain/ 순수)             렌더링 (adapters/phaser)
  ┌────────────────────────────┐    ┌──────────────────────────────┐
  │ isBossClimax(hp,maxHp)       │    │ 보스 omega 감속 / 비네트       │
  │   → boss/boss-climax.ts      │ →  │ BOSS APPROACHING Graphics cue  │
  │ litFloorsFor(chaptersCleared)│    │ 사옥 빌딩 + 층 색칠 tween       │
  │   → run/building-progress.ts │    │ 챕터 배경 모티프 / 마스크 표식  │
  └────────────────────────────┘    └──────────────────────────────┘
       테스트 100% + 3 카테고리            vitest-canvas-mock smoke (70%)

  단순 상수 (adapters/phaser/config.ts):
    MASK_COLORS, INTERIOR_PALETTES, climax/approaching TIMINGS
```

---

## 5. 항목별 상세 설계

### 5-1. 보스 슬로우모션 climax 🐌

| | |
|---|---|
| **신규 도메인** | `src/domain/boss/boss-climax.ts` — `CLIMAX_HP_RATIO = 0.25`, `isBossClimax(hp, maxHp): boolean` |
| **어댑터 수정** | `juice-manager.ts`에 `setBossClimax(active: boolean)` (desaturate 비네트 on/off). `game-scene.ts` update tick에서 `isBossClimax(bossZombie.hp, maxHp)` 감시 → 진입/이탈 전이 시 omega 배수 토글 + 비네트 |
| **omega 감속** | 기존 `applyRageMultipliers` 결과 `effective.omega`에 climax 시 ×0.3 추가 곱(라인 `game-scene.ts:609-616` 경로) |
| **처치 freeze** | 기존 `boss_kill` freeze(0.6s) 유지 — Bible "마지막 tap 0.6초 freeze"와 정합 |
| **상태 전이** | climax는 idempotent 전이(이미 active면 재적용 안 함) — 매 프레임 비네트 재생성 금지 |

### 5-2. BOSS APPROACHING 경고 🚨 (무텍스트)

| | |
|---|---|
| **트리거** | `advanceWave()`가 `wave === 10` 진입 감지 (현재 `scheduleNextSpawn:281`이 즉시 보스 스폰) → **0.8초 cue 후 `spawnBoss()`** |
| **연출** | 화면 가장자리 붉은 **비네트 펄스**(Graphics, 2회) + `audio.play("boss_approaching")` 저음 + 약한 셰이크. **텍스트 0** |
| **오디오 신규** | `audio.ts` AudioEvent에 `boss_approaching` 추가, `web-audio-synth.ts` `EVENT_TONES`에 저음 rumble |
| **주의** | cue 동안 입력 잠금 여부: 보스 스폰 전이라 좀비 없음 → 잠금 불필요. cue Graphics는 보스 스폰 시 정리 |

### 5-3. 챕터별 배경/인테리어 톤 🎨

| | |
|---|---|
| **상수 신규** | `config.ts` `INTERIOR_PALETTES: Record<1..5, {bg, accent, motif}>` |
| **5챕터 매핑** | 1 신입부서(형광등 막대) / 2 영업본부(헤드셋 원호) / 3 R&D(화이트보드 격자) / 4 임원실(카펫 질감) / 5 CEO+옥상(KPI 꺾은선) |
| **렌더** | `game-scene.create()`에서 `this.chapter`로 배경색 + 모티프 Graphics(자산 0). 풀 일러스트 ❌, 도형 암시 ⭕ |
| **성능** | 정적 → `create()` 1회 생성, 매 프레임 재생성 금지 |

### 5-4. 좀비 마스크 색 🎭

| | |
|---|---|
| **상수 신규** | `config.ts` `MASK_COLORS = { intern: 0xf0ead6, middle: 0x7a7a7a, lead: 0x3a3a3a, ceo: 0x0a0a0a }` |
| **렌더** | `zombie.ts` `VISUAL_SPECS`에 `maskColor` 추가 → 이모지 하단 마스크 표식 Graphics(작은 막대/타원). 오라색 유지 |
| **검정 가시성** | CEO(검정) 마스크는 `maskWhite` 얇은 stroke 테두리로 어두운 배경 분리 |

### 5-5. 사옥 줌아웃 + 층 색칠 🏢

| | |
|---|---|
| **신규 도메인** | `src/domain/run/building-progress.ts` (신규 디렉토리) — `litFloorsFor(chaptersCleared): number` (0~50 클램프) |
| **어댑터 수정** | `game-over-scene.ts` `renderChapterEnd()`에 50층 빌딩 미니어처 Graphics + 점등 tween (0.15s stagger) + 살짝 줌아웃(scale tween) + 부서명 텍스트 |
| **시퀀스** | Bible §3: freeze(기구현) → **빌딩 줌아웃+층 색칠** → 카드 fan-out(기구현). 카드 등장 *전* 삽입 |

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

기능 완료조건:
- [ ] 보스 HP 25% 이하 진입 시 보스 움직임이 눈에 띄게 느려지고 비네트가 켜진다(이탈/처치 시 복구).
- [ ] wave 10 진입 시 보스 스폰 전 0.8초 붉은 펄스 + 저음 cue가 재생된다(텍스트 0).
- [ ] 5개 챕터의 배경색·모티프가 서로 다르다.
- [ ] 4종 좀비에 직급별 마스크 표식이 보이고, CEO 검정 마스크가 어두운 배경에서 식별된다.
- [ ] 챕터 클리어 화면에 빌딩이 표시되고 클리어한 층까지 색칠 + 부서명이 표시된다.
- [ ] `grep -r "__zp_test__" dist/` = 0건 (신규 cheat hook 미추가 — 본 스펙은 hook 추가 없음).

---

## 7. 금지사항 (Don'ts)

| 금지 | 대신 |
|------|------|
| 전역 `scene.time.timeScale` 조작으로 슬로우모션 | 보스 omega 감속 + 비네트 (결정론·E2E 안전) |
| 인게임 화면에 "BOSS APPROACHING"/부서명 **텍스트** | 인게임은 비주얼/사운드, 텍스트는 전환 화면만 |
| `domain/`에 색(hex)·Phaser import | 색은 `config.ts` 상수, 분기만 도메인 순수 함수 |
| 외부 이미지/사운드 자산 | Phaser Graphics + `WebAudioSynth` 합성 |
| 매 프레임 배경/빌딩/비네트 Graphics 재생성 | `create()` 1회 생성 + 상태 토글 |
| `Math.random`/`Date.now`/`setTimeout` 도메인 직접 사용 | `IRandom`/`IClock` 포트 (본 스펙 도메인은 외부 의존 0) |
| 사옥 점등을 RNG 가변으로 | 결정론 순차(`chaptersCleared × 10`) |
| 카운트다운 압박 텍스트("남은 5초!") | 보스 임박은 비주얼 위협만 |

---

## 8. 고려사항 (엣지/성능/회귀)

1. **timeScale 부작용 회피** (결정 3): 전역 timeScale 미사용으로 combo decay/lifespan/E2E 폴링 부작용 원천 차단.
2. **div-zero**: `isBossClimax(hp, 0)` → `false` 반환(throw 금지, 렌더 경로 graceful).
3. **Graphics 누수**: 비네트·빌딩·모티프·cue Graphics는 scene shutdown 시 정리(기존 `juice-manager` `activeFreezeOverlays` 패턴 차용).
4. **climax 상태 전이**: 보스 HP가 25% 경계를 오갈 때 비네트 깜빡임 방지 — idempotent on/off + 약간의 히스테리시스 고려(구현 시 검증).
5. **E2E 회귀**: `setBossHp(12)`로 Ch5 보스를 25%↓로 만들면 climax가 트리거됨 → `boss-wave.spec`의 rage 단계 검증이 omega 변화에 영향받지 않는지 확인(omega는 위치만, `bossRageLevel`/`bossHp` 폴링은 무관할 것으로 예상하나 **검증 필수**).
6. **번들 크기**: 신규 코드는 순수 함수 + Graphics 호출이라 gzip 영향 미미. `pnpm size`로 확인.
7. **FPS degradation 무간섭**: 배경 모티프는 정적이라 particle degradation 시스템과 독립.

---

## 9. 제약사항 (Constraints)

- **자산 0**: 외부 이미지/사운드 다운로드 금지(Agent Rule #7).
- **도메인 순수성**: `domain/`은 Phaser/DOM/색 import 금지(Agent Rule #6).
- **텍스트 정책**: 인게임 화면 텍스트 0줄(Bible §6).
- **단일 SSOT 충돌 시**: 코드 ↔ Bible 충돌은 코드를 Bible에 맞춤(본 스펙은 Bible의 미구현 연출을 코드로 실현 — 충돌 아님).
- **HP/lifespan 수치 불일치**: 별도 이슈(Bible §2/§8 vs 코드). 본 스펙 범위 밖 — `/code-review`에서 발견된 문서 동기화 작업으로 분리.

---

## 10. 테스트 전략 (TDD 3 카테고리)

| 대상 | 정책 | RED 케이스 |
|------|------|-----------|
| `boss-climax.ts` | domain 100% + mutation ≥80% | `[Happy]` 24%→true / `[Boundary]` 정확히 25%, 0%, 100% / `[Error]` maxHp=0→false, 음수 hp |
| `boss-climax.prop.test.ts` | property seed=42 | invariant: `0≤hp≤maxHp`에서 `isBossClimax`는 `hp/maxHp≤0.25`와 동치 |
| `building-progress.ts` | domain 100% + mutation ≥80% | `[Happy]` 3→30 / `[Boundary]` 0→0, 5→50, 6→50(클램프) / `[Error]` 음수→0 |
| `web-audio-synth` boss_approaching | infra 80% | `[Happy]` 이벤트 재생 / `[Boundary]` ctx suspended skip / `[Error]` ctx null no-op |
| `juice-manager.setBossClimax` | adapters 70% | smoke: 비네트 생성/정리, idempotent |
| 사옥 빌딩 렌더 | adapters 70% | `litFloorsFor` 결과만큼 색칠 Graphics 호출 검증 |
| 기존 E2E | 회귀 0 | `boss-wave.spec`/`game-flow.spec` 재실행 |

---

## 11. ADR 관계

| ADR | Status | 본 스펙과의 관계 |
|-----|--------|-----------------|
| ADR-0010 (층 서사 텍스트) | Open, 권장 C(아이콘) | **정합** — 인게임=모티프(아이콘류), 부서명=전환 화면 텍스트(범위 밖) |
| ADR-0002 (가변 보상 범위) | Open, Default B(인테리어 보상 가변) | **무관** — 본 스펙 "층 점등"은 진행도 시각화(결정론), "인테리어 재건 보상"(가변)은 post-MVP |
| ADR-0006 (게임 디자인 원칙) | — | 텍스트/압박/자산 정책 준수 |

> **신규 ADR 필요 여부**: 본 스펙은 새 외부 의존성·아키텍처 변경이 없다(Phaser/WebAudio 기존). `boss_approaching` AudioEvent 추가는 기존 Port 확장이라 ADR 불요. 단 "사옥 점등 결정론" 결정은 Bible §3 Layer 2(가변) 명세와 표면상 다르므로, **구현 시 ADR-0002에 코멘트** 또는 신규 ADR로 "진행도 시각화는 가변 보상과 별개"를 기록하는 것을 writing-plans에서 판단.

---

## 12. 파일 변경 인벤토리 (실존 검증 완료)

### 신규 생성
- `src/domain/boss/boss-climax.ts` + `.test.ts` + `.prop.test.ts` (디렉토리 `src/domain/boss/` 실존 ✅)
- `src/domain/run/building-progress.ts` + `.test.ts` (**디렉토리 `src/domain/run/` 신규 생성** — CLAUDE.md §4 아키텍처 다이어그램 의도 실현)

### 수정 (실존 확인)
- `src/domain/ports/audio.ts` — `AudioEvent`에 `boss_approaching` 추가
- `src/infrastructure/audio/web-audio-synth.ts` — `EVENT_TONES`에 저음 rumble + `.test.ts`
- `src/adapters/phaser/config.ts` — `MASK_COLORS`, `INTERIOR_PALETTES`, climax/approaching `TIMINGS`
- `src/adapters/phaser/objects/zombie.ts` — `VISUAL_SPECS.maskColor` + 마스크 표식 렌더
- `src/adapters/phaser/managers/juice-manager.ts` — `setBossClimax` (비네트)
- `src/adapters/phaser/scenes/game-scene.ts` — climax 감시(update), BOSS APPROACHING cue(advanceWave), 챕터 배경(create)
- `src/adapters/phaser/scenes/game-over-scene.ts` — 사옥 빌딩 + 층 색칠 + 부서명(renderChapterEnd)

---

## 13. Open Questions

없음 — 브레인스토밍에서 모든 결정 확정(§3). 구현 중 발견되는 미세 결정(히스테리시스 임계, 모티프 도형 세부)은 writing-plans/구현 단계에서 처리.
