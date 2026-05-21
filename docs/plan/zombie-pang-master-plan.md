# 좀비팡 Phase C Master Plan — 11 Task 자율 실행 SSOT

> **Phase B-0 산출물** — Phase C 코드 구현의 단일 명세서 (Single Source of Truth)
> 작성: 2026-05-17 / 입력 SSOT: `docs/game-design/bible.md` (4066 단어, Phase A 흡수 완료)
> 본 플랜은 Phase C 11 Task의 상세 명세이며, 자율 실행 중 코드 작성 시 본 문서와 코드가 충돌하면 **코드를 본 문서에 맞춘다.** Bible과 본 플랜이 충돌하면 **Bible이 우선**한다.

---

## 0. Context

### 0.1 배경
사용자 PoC(단일 HTML 좀비 클리커)를 **Phaser 3 + TypeScript + Vite + PWA** 기반의 **출시 가능한 MVP**로 발전시키는 것이 목표. 두 가지 가치를 동시에 달성:

1. **재사용 가능한 게임 개발 가이드 정립** — `/Users/cjynim/lab/map` CLAUDE.md + docs/ 구조를 게임용으로 1:1 매핑하여 향후 다른 Phaser 게임 SSOT로 활용.
2. **출시 가능한 좀비팡 MVP** — 5챕터 × 10층 = 50층 완주 가능, 카드 15장, 좀비 4종, Power-up 3종, Daily streak, 정시 퇴근 버튼, 오프라인 전 기능 작동.

### 0.2 Phase A 완료 결과 (흡수 완료)
| 산출물 | 위치 | 핵심 |
|---|---|---|
| Game Design Bible | `docs/game-design/bible.md` (4066 단어, 9 섹션) | Title/§1 컨셉/§2 World/§3 Core Loop/§4 Meta/§5 Juice/§6 PWA/§7 Ethics/§8 수치/§9 References |
| 페르소나 토론 합의 | `docs/debate/{concept, core-loop, meta-juice, pwa-ux}/consensus.md` | 4 토픽 × 7 페르소나, 합의도 0.786 / 0.86 / 0.87 / 0.87 (평균 **0.847**) |
| 기술 조사 | `docs/research/{phaser-vite-stack, pwa-mobile, addictive-loop}.md` | Phaser+Vite+Vitest+fast-check+Stryker / Workbox+iOS Safari / 안티패턴 |
| 브레인스토밍 통합 | `docs/brainstorm/zombie-pang-{concept, core-loop, meta, juice, pwa}.md` | A-0~A-3 + A-4~A-6 융합 narrative |
| ADR draft 15건 | `docs/adr/draft/ADR-{0001~0013, CL-0001~CL-0002}-*.md` | Resolved 4건 / Open 11건 (MVP는 Tentative Default 적용) |
| Phase A 합의 보고서 | `docs/demiurge/rl-verify/zombie-pang/phase-a-report.md` | 합의도 종합 **0.94**, "Phase A 완전검증" 라벨 |

### 0.3 Phase C 달성 목표
- Hexagonal 4계층 (domain → application → adapters → infrastructure) 구현
- TDD 3 카테고리 (`[Happy]/[Boundary]/[Error]`) + Property-based 강제
- Bible §8 수치 명세를 코드 상수로 직접 박제
- 자율 실행 (사용자 개입 0회) — AskUserQuestion 발생 = 실패 신호
- 11 /rl 콜 = 11 Task = 단일 ralph-loop.local.md 직렬 사이클

---

## 1. 완료조건 (Completion Criteria)

### 1.1 자동 검증 (Phase C 종료 시 모든 항목 exit 0)

| # | 명령 | 기대 결과 |
|---|---|---|
| 1 | `pnpm dev` | exit 0, http://localhost:5173 게임 플레이 가능 (Start → Game → 50층 완주) |
| 2 | `pnpm typecheck` | exit 0, error 0 (TypeScript strict, no `any`) |
| 3 | `pnpm lint` | exit 0, error 0 (Biome) |
| 4 | `pnpm test` | exit 0, 1.2 커버리지 매트릭스 통과, 1.3 TDD 3 카테고리 grep 통과 |
| 5 | `pnpm test:prop` | exit 0, fast-check 1000회 invariant 0건 실패 |
| 6 | `pnpm test:mutation` | Domain ≥ 80%, Application ≥ 70% (Stryker) |
| 7 | `pnpm build` | exit 0, `dist/` 생성, 번들 < **1.5MB gzip** |
| 8 | `pnpm test:e2e` | 3 Playwright 시나리오 통과 (30초 플레이 / wave10 보스 / 메타 카드) |
| 9 | `pnpm lighthouse` | PWA ≥ 90, Performance ≥ 80, Installable true |

### 1.2 커버리지 매트릭스 (원본 플랜 §1.1.1 그대로 인용)

| 레이어 | Line | Branch | Function | Statement | 추가 검증 |
|---|---|---|---|---|---|
| `domain/` | **100%** | **100%** | **100%** | **100%** | Mutation ≥ 80%, fast-check invariant 강제 |
| `application/` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Mutation ≥ 70%, Port mock 주입 |
| `adapters/persistence/` | ≥ 90% | ≥ 85% | ≥ 90% | ≥ 90% | Contract test (Port 준수) |
| `adapters/phaser/` | ≥ 70% | ≥ 60% | ≥ 70% | ≥ 70% | HEADLESS smoke + vitest-canvas-mock |
| `infrastructure/` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% | SW precache 검증, Vibration graceful fallback |
| `shared/` | **100%** | **100%** | **100%** | **100%** | Branded types, helper |

### 1.3 TDD 3 카테고리 강제

모든 도메인/애플리케이션 테스트 파일은 각 SUT(System Under Test)마다 `[Happy]/[Boundary]/[Error]` 라벨이 붙은 케이스를 최소 1개씩 포함. rl-verify가 grep으로 강제 검증.

| 카테고리 | 좀비팡 예시 |
|---|---|
| `[Happy]` | combo ×1.5 → 5kill 후 ×2 승급 / Power-up 정상 발동 / wave 10 도달 시 CEO 보스 등장 |
| `[Boundary]` | combo decay 정확히 1500ms / spawn rate 하한 300ms / 좀비 도주 4→5 fail 경계 / streak 7→8일 (상한+휴식 모달) / coin 0/1/9999 / Power-up 동시 활성 1→2→3 (한도) / freeze-frame 0/599/600/601ms |
| `[Error]` | localStorage quota 초과 → graceful degrade / Vibration API 미지원 → no-op / RNG seed 미주입 → throw / 잘못된 power-up 타입 / negative score 시도 / 도주 누적이 음수 |

### 1.4 Property-based Invariant (fast-check, seed=42, numRuns=1000)

| Invariant | 도메인 |
|---|---|
| `score ≥ 0` 항상 성립 | Score |
| Combo tier는 단조 증가하다 decay/miss에만 리셋 | Combo |
| 임의의 wave N (1~10)에 대해 `spawnRate(N) ∈ [300, 1000]` ms | Wave |
| 처치 + 도주 = 스폰 (수지) | Spawner |
| 챕터 카드 3장 추첨: 중복 없음, 모두 풀에서 추출 | Meta |
| `streak ∈ [0,7]`, `coinMultiplier = 1 + 0.2 × streak` | DailyStreak |
| 동일 seed → 동일 wave/spawn 시퀀스 (결정론) | SeededRandom |
| Power-up 동시 활성 ≤ 2 (한도 invariant) | PowerUp |
| Boss HP = 1.0 → 1.5 → 2.25 → 3.10 → 3.84 배 (5챕터 곡선) | Boss balancing |

### 1.5 게임 동작 (5챕터 × 10층 = 50층 완주 가능)

- **Start → Game Scene 진입**: 메인 메뉴 → "PUNCH IN" 탭 → 1F 즉시 진입
- **1챕터 자동 학습**: 텍스트 0줄로 tap=팡, 콤보, Power-up, 도주, 보스를 60초 안에 자연 노출 (Bible §3 60초 시퀀스)
- **5챕터 완주**: 50층 CEO 처치 후 사직서 컷씬 → "당신은 퇴근했습니다" 엔딩
- **좀비 4종 모두 작동**: 신입(HP1, 빠름) / 과장(HP1, 중간) / 팀장(HP2, 느림) / CEO 보스(HP5, 10층마다)
- **Combo 시스템**: ×1 → ×1.5(5kill) → ×2(10kill) → ×3(15kill), decay 1500ms
- **Critical**: 머리 tap = 2× (사직서 한 방 카드 보유 시 ×2.5)
- **Power-up 3종**: 폭탄(즉발) / 빙결(3초) / 자석(3초), drop 5% (T0) ~ 6.5% (T3 max)
- **CEO 보스 5회**: 각 챕터 50/55/60초 구간, 3-phase (telegraph / engagement / climax), 600ms freeze frame
- **Meta 카드 15장**: Base 12(4 카테고리 × 3 Tier) + Special 3(자기장 ID / 늘어지는 회의 / 사직서 한 방)
- **Daily streak**: 7일 누적, +20%/일, 페널티 0, 8일째 휴식 모달
- **정시 퇴근 버튼**: 매 챕터 종료 3택 동등 가중치 ([다음 챕터] / [카드 자세히] / [정시 퇴근])
- **Offline 동작**: Service Worker precache + localStorage 영구 메타
- **Portrait + 한 손 조작**: 390×844 강제, tap-only, safe-area-inset
- **첫 30초 onboarding 텍스트 0줄** (Bible §6)

### 1.6 가이드 문서 (map/ 구조와 1:1 매핑)

| # | 경로 | 내용 |
|---|---|---|
| 1 | `CLAUDE.md` (=`AGENTS.md` 심링크) | 10 섹션 (Project Overview / Tech Stack / Commands / Architecture / Coding Conventions / Testing / Domain / Agent Rules / Don'ts / References) |
| 2 | `docs/adr/0001-architecture.md` | Hexagonal 4계층 정식 박제 |
| 3 | `docs/adr/0002-game-engine.md` | Phaser 3 선택 근거 |
| 4 | `docs/adr/0003-coding-conventions.md` | TS strict + Biome + kebab-case + named export |
| 5 | `docs/adr/0004-tdd.md` | 3 카테고리 + fast-check + Stryker |
| 6 | `docs/adr/0005-pwa-strategy.md` | vite-plugin-pwa + Workbox + iOS Safari 한계 |
| 7 | `docs/adr/0006-game-design-principles.md` | Bible §7 안티패턴 10개 박제 |
| 8 | `docs/architecture/hexagonal-game.md` | 4계층 + Phaser Adapter 명세 |
| 9 | `docs/conventions/typescript.md` | strict / no any / branded types |
| 10 | `docs/conventions/phaser.md` | Scene 구조 / Object pool / DI |
| 11 | `docs/conventions/testing.md` | 3 카테고리 + fast-check + Stryker |
| 12 | `docs/conventions/folder-structure.md` | src/ 트리 명세 |
| 13 | `docs/domain/glossary.md` | Zombie/Wave/Combo/PowerUp/MetaProgression/CEO 보스/카드/streak 용어 |
| 14 | `docs/game-design/bible.md` (이미 존재) | Phase A SSOT, 변경 금지 |
| 15 | `docs/game-design/{core-loop,juice,balancing,monetization-free}.md` | Bible §3/§5/§8/§7 발췌 + 인덱스 |

### 1.7 자율 검증 산출물

| 경로 | 내용 |
|---|---|
| `docs/demiurge/rl-verify/zombie-pang/phase-b-report.md` | Phase B 완전검증 보고서 (본 플랜) |
| `docs/demiurge/rl-verify/zombie-pang/<task-id>.json` | 각 Task별 rl-verify 점수 ≥ 0.9 |
| `docs/demiurge/rl-verify/zombie-pang/final-report.md` | Phase C 최종 합의 보고서, "완전검증" 라벨 |

---

## 2. 금지사항 (Don'ts)

원본 플랜 §2 흡수 + Bible 기반 추가:

| 금지 | 대신 | 사유 |
|---|---|---|
| 가이드(CLAUDE.md/docs) 작성 전 코드 작성 | Task C-2 가이드를 C-3 이전에 완료 | 가이드가 이후 모든 코드의 SSOT |
| Domain 레이어에서 Phaser/DOM import | 순수 POJO + Port interface로 외부 의존 추상화 | Hexagonal DIP 위반 시 TDD 효율 붕괴 |
| Happy path만 테스트하고 GREEN 진입 | RED phase에서 3 카테고리 각 1개 이상 라벨링 | 글로벌 CLAUDE.md 강제 규칙 |
| RNG/Date.now/setTimeout을 도메인에 직접 사용 | `IRandom`, `IClock` Port로 추상화 + 테스트에서 fake 주입 | 결정론적 테스트 + 100% 브랜치 커버 |
| AskUserQuestion으로 결정 미루기 | 본 플랜 + Bible의 사전 박제 결정 우선 참조 | 자율주행 막힘 = 실패 신호 |
| 한 /rl 호출에서 2개 이상 Task 처리 | 1콜 = 1Task | ralph-loop.local.md 상태 충돌 + 컨텍스트 폭주 방지 |
| PWA manifest/SW를 마지막에 부가 | Task C-1 스켈레톤부터 vite-plugin-pwa 골격 포함 | 캐싱 누락 시 오프라인 깨짐 |
| 외부 이미지/사운드 자산 다운로드 | Phaser Graphics 도형 + Web Audio 합성음만 | Bible §6 + 라이선스 리스크 0화 |
| 좀비 4종 외 추가 종 추가 | MVP 스코프 고정 — 신입/과장/팀장/CEO 보스 4종만 | Bible §2 + MVP 범위 |
| 카드 15장 외 추가 | MVP 카드 풀 = Base 12 + Special 3 = 15장 고정 | Bible §4 + MVP 범위 |
| 외부 광고 SDK 통합 | MVP는 광고 0개 (ADR-0001 Open, MVP는 미적용 default) | Bible §7 안티패턴 #7 |
| Notification 권한 요청 | **영구 비요청** (v1/v2/v3 전부) | Bible §6 + Ethics §7 안티패턴 #2 |
| 카운트다운 압박 텍스트 ("남은 5초!") | 보스 위협만으로 압박 표현 | Bible §3 + Ethics §7 안티패턴 #6 |
| 카드 가챠 확률 정량 표기 ("최대 15%") | "Tier 3에서 drop 빈도 증가" 정성 표현만 | Bible §4 + Ethics §7 안티패턴 #9 |
| Streak 끊김 페널티 | 끊겨도 도장은 흐려질 뿐 사라지지 않음 | Bible §4 + Ethics §7 안티패턴 #1 |
| `git push` (사용자 명시 요청 전) | 로컬 커밋만 | 환경 안전 원칙 |
| 디버깅 중 root cause 없이 try/catch | systematic-debugging 5-why 분석 후 fix | TDD 가치 보존 |
| Wake Lock API 사용 | 60초 세션이므로 불필요 | Bible §6 |
| Notification permission 호출 코드 작성 | 코드베이스에서 `Notification.requestPermission` 등장 = 금지 | Ethics 박제 |

---

## 3. 고려사항 (Considerations)

### 3.1 iOS Safari 한계 (Bible §6 iOS 5개 핵심 박제)
- Vibration API: `typeof navigator.vibrate === 'function'` 가드 + no-op fallback
- Install prompt: meta tag + 가이드 모달 ("[공유] → [홈 화면에 추가]")
- AudioContext: PUNCH IN tap에서 `resume()` 호출 (autoplay 정책)
- Orientation: `screen.orientation.lock('portrait')` 시도 + 실패 시 landscape overlay
- PWA standalone display + `env(safe-area-inset-*)`

### 3.2 첫 30초 onboarding (Bible §6)
- 별도 Tutorial scene 없음, 1F가 곧 tutorial
- 모든 cue = motion + sound + 숫자 (텍스트 0줄)
- screen reader `aria-label` 풍부 ("Floor N, fled X of 5")
- 60초 시퀀스 (Bible §3 시간표) 정확히 준수

### 3.3 자정 cue (Bible §6)
- 00:00~06:00 첫 실행 시 세션 1회 노출
- 메시지: *"오늘은 충분히 했어요. 좀비도 잠들었어요."*
- 화면 50% 디밍 + BGM 30% 볼륨
- 옵션: [그래도 1라운드만] / [내일 봐요] (압박 카피 금지)
- 22시 이후 진동 자동 1/3 강도

### 3.4 접근성 (WCAG 2.1 AA, Bible §6 표)
- Color contrast ≥ 7:1
- Tap target ≥ 80×80
- `prefers-reduced-motion`: shake/particle 50% 감쇠 (제거 X)
- `prefers-color-scheme: dark` 강제
- 색약: 색 + 실루엣 동시 시그널
- `aria-live` "Floor N, fled X of 5"
- `forced-colors`: 좀비 1px black outline
- `<html lang="ko">`

### 3.5 성능 / 적응형 다운그레이드 (Bible §5)
- Particle 동시 표시 24p → FPS<50 3프레임 연속 시 6p로 다운그레이드
- 30프레임 alpha decay
- Adaptive Degradation 이력은 디버그 패널에 노출 (개발 모드만)

### 3.6 자율 실행 안전망
- 각 Task 시작 시 `.claude/ralph-loop.local.md` 초기화
- Task 실패 3회 연속 → `<task-id>.blocked.md` 작성 후 다음 Task 진입 중단
- rl-verify "완전검증" = 사실 모순 0 AND 미해결 TODO 0 AND 자동 명령 exit 0 AND 점수 ≥ 0.9

### 3.7 ADR Open 11건 (Phase C에서 결정 강요 회피)
- ADR-0001 Ads, ADR-0005 Card Unlock FOMO, ADR-0006 Freeze Frame Conflict, ADR-0007 Card 10000 coin, ADR-0009 Card Drop Probability, ADR-0010 Floor Narrative, ADR-0011 Install Prompt Reactivation, ADR-0012 Midnight Cue, ADR-0013 v3 Revenue, ADR-CL-0001 정시 퇴근 버튼 위치, ADR-CL-0002 fail 톤
- MVP는 각 ADR의 **Tentative Default** 적용 — 출시 후 30일 데이터 재검증

---

## 4. 제약사항 (Constraints)

| 영역 | 제약 |
|---|---|
| **런타임** | 브라우저(모바일 우선, Portrait 390×844), Node 20+ 빌드 환경 |
| **백엔드** | 없음 — 로컬 leaderboard만 (Firebase/Supabase는 v2 이슈) |
| **패키지 매니저** | `pnpm` 강제 (lockfile 단일화) |
| **외부 자산** | Phaser Graphics 도형 + Web Audio 합성음만, 외부 이미지/사운드 다운로드 금지 |
| **의존성** | Phaser 3.x, TypeScript 5.x, Vite 5.x, Vitest 1.x, fast-check 3.x, @stryker-mutator/core 8.x, vite-plugin-pwa 0.21+, Biome 1.x, @playwright/test 1.x |
| **모노레포** | 단일 npm 프로젝트, workspace 미사용 |
| **라이선스** | MIT, 모든 의존성 OSI-approved |
| **워크플로우** | superpowers + ralph-loop 워크플로우 강제, 각 Task `/rl-verify` 완전검증 |
| **상태 파일** | `.claude/ralph-loop.local.md` 단일, 병렬 /rl 금지 |
| **사용자 개입** | **0회 가정** (AskUserQuestion 발생 = 자율주행 실패 신호) |
| **자산 합계** | 첫 로딩 < **3MB** (Bible §6), 번들 < **1.5MB gzip** |
| **Service Worker cache** | iOS 50MB/도메인 한도 준수 |

---

## 5. 스킬 검색 (Skill Discovery)

원본 플랜 §5.2 그대로 인용. Phase C 진입 시점에서 재검색 불요(Phase A에서 매핑 확정).

### 5.1 Memory 매핑
Phase A 시작 시 fresh 검색. Phase A-10 완료 시 본 매핑 확정. Memory 저장은 Phase C 완료 후 재확인.

### 5.2 매핑 테이블

| 스킬/에이전트 | 위치 | 용도 | 적용 Task |
|---|---|---|---|
| `/superpowers:using-superpowers` | global plugin | conversation 시작 시 자동 진입 | 전체 |
| `/superpowers:executing-plans` | global plugin | Task 순차 실행 오케스트레이션 | Phase C 진입 |
| `/superpowers:test-driven-development` | global plugin | Happy/Boundary/Error 3 카테고리 강제 | C-3a~d, C-4, C-5 |
| `/superpowers:verification-before-completion` | global plugin | 각 Task 완료 직전 자동 명령 검증 | 모든 Task 종료 |
| `/superpowers:systematic-debugging` | global plugin | Task 실패 시 root cause 분석 | 실패 발생 시 |
| `/superpowers:using-git-worktrees` | global plugin | 격리된 worktree 작업 (선택) | C-0 시작 시 |
| `/rl` | global skill | Task 자율 루프 실행 | 모든 Task |
| `/rl-verify` | global skill | 수렴 검증 (Task + Phase) | 매 Task/Phase 종료 |
| `/deep-research` | global skill | Phaser/PWA 구현 디테일 외부 조사 | C-1, C-7 |
| `/compound-engineering:document-review` | global plugin | 가이드 문서 품질 검증 | C-2 종료 |
| `/compound-engineering:ce-debug` | global plugin | Task 실패 시 보조 디버깅 | 실패 발생 시 |
| `/commit` | global skill | Phase 경계 커밋 | 각 Task 종료 |
| `application-architect` agent | global agent | hexagonal 구조 리뷰 | C-2, C-3* 검증 |
| `code-investigator` agent | global agent | 기존 코드 조사 | C-0 |
| `convergence-evaluator` agent | global agent | rl-verify 보조 평가 | 모든 rl-verify |

### 5.3 미적용 (이번 플랜 범위 외)
`/vercel-react-best-practices` (React 미사용), `/healthcare-informatics`, `/cloud-native` (백엔드 없음), `/ml-platform`, `/rag-architecture`, `/llm-gateway`.

---

## 6. 아키텍처 SSOT

### 6.1 Hexagonal 4계층 + Phaser Adapter

```
┌────────────────────────────────────────────────────────┐
│ 외부 세계 (Browser / iOS Safari / localStorage / Audio) │
├────────────────────────────────────────────────────────┤
│ infrastructure/  (Composition root, 외부 API 래퍼)      │
│   ↓ Port 구현체 주입                                    │
│ adapters/        (Phaser UI / persistence)             │
│   ↓ application use case 호출                           │
│ application/     (5개 use case)                         │
│   ↓ domain 순수 규칙 실행                                │
│ domain/          (POJO + Port interface)               │
└────────────────────────────────────────────────────────┘
의존성 방향: domain ← application ← adapters/infrastructure
```

domain은 어떤 것도 import하지 않음. DIP는 Port interface로 강제.

### 6.2 디렉토리 트리 (확정 명세)

```
src/
├─ domain/
│  ├─ score/         # Score, Combo (Bible §8 수치)
│  │  ├─ score.ts             # Score VO + add/reset
│  │  ├─ combo.ts             # Combo tier + decay
│  │  └─ *.test.ts + *.prop.test.ts
│  ├─ wave/          # Wave, Spawner, ZombieType
│  │  ├─ wave.ts              # 1~10 wave + spawn-rate 곡선
│  │  ├─ spawner.ts           # IRandom 주입, 4종 분포
│  │  ├─ zombie-type.ts       # 신입/과장/팀장/CEO 보스
│  │  └─ *.test.ts + *.prop.test.ts
│  ├─ powerup/       # Bomb, Freeze, Magnet
│  │  ├─ powerup.ts           # 3종 정의
│  │  ├─ powerup-drop.ts      # drop rate + Coin T0~T3 곱셈
│  │  ├─ powerup-stack.ts     # 동시 활성 ≤ 2
│  │  └─ *.test.ts + *.prop.test.ts
│  ├─ meta/          # Card 15장, DailyStreak, UpgradeCard
│  │  ├─ card.ts              # Base 12 + Special 3
│  │  ├─ card-draw.ts         # 결정론 균등 3장 추첨
│  │  ├─ daily-streak.ts      # 7일 + 페널티 0 + 휴식 모달
│  │  ├─ unlock.ts            # Tier 2/3 + coin 게이트
│  │  └─ *.test.ts + *.prop.test.ts
│  ├─ run/           # Run state, Chapter, Floor
│  │  ├─ run.ts               # 5챕터 × 10층 = 50층 상태
│  │  ├─ chapter.ts           # 1~5, 누적 DPS 곡선
│  │  ├─ floor.ts             # 1~50
│  │  └─ *.test.ts
│  └─ ports/         # IRandom, IClock, ISaveStore, IAudio, IHaptic
│     ├─ random.port.ts
│     ├─ clock.port.ts
│     ├─ save-store.port.ts
│     ├─ audio.port.ts
│     └─ haptic.port.ts
├─ application/      # 5 use case
│  ├─ start-run.ts
│  ├─ kill-zombie.ts
│  ├─ apply-powerup.ts
│  ├─ pick-upgrade.ts
│  ├─ end-chapter.ts
│  ├─ end-run.ts
│  └─ *.test.ts
├─ adapters/
│  ├─ phaser/
│  │  ├─ scenes/
│  │  │  ├─ boot.scene.ts
│  │  │  ├─ preload.scene.ts
│  │  │  ├─ main-menu.scene.ts
│  │  │  ├─ game.scene.ts
│  │  │  ├─ hud.scene.ts
│  │  │  └─ game-over.scene.ts
│  │  ├─ objects/
│  │  │  ├─ zombie.object.ts
│  │  │  ├─ particle.object.ts
│  │  │  ├─ upgrade-card.object.ts
│  │  │  └─ boss.object.ts
│  │  ├─ managers/
│  │  │  ├─ audio.manager.ts
│  │  │  └─ juice.manager.ts
│  │  └─ config.ts
│  └─ persistence/
│     └─ local-storage-save-store.ts
├─ infrastructure/
│  ├─ pwa/
│  │  ├─ register-sw.ts
│  │  ├─ install-prompt.ts
│  │  └─ midnight-cue.ts
│  ├─ random/seeded-random.ts
│  ├─ clock/system-clock.ts
│  ├─ audio/web-audio-synth.ts
│  ├─ haptic/vibration-api.ts
│  └─ container.ts            # Composition root
├─ shared/
│  ├─ types/
│  │  ├─ branded.ts           # Score, Coin, FloorId 등 branded types
│  │  └─ result.ts
│  └─ utils/
│     ├─ assert.ts
│     └─ clamp.ts
└─ main.ts                    # Phaser Game container 생성
```

### 6.3 Port 인터페이스 (5개)

```typescript
// domain/ports/random.port.ts
export interface IRandom {
  next(): number          // [0, 1)
  range(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
}

// domain/ports/clock.port.ts
export interface IClock {
  now(): number           // epoch ms
  monotonic(): number     // performance.now() equiv
}

// domain/ports/save-store.port.ts
export interface ISaveStore {
  load(key: string): string | null
  save(key: string, value: string): void  // throws on quota
  remove(key: string): void
}

// domain/ports/audio.port.ts
export interface IAudio {
  play(layer: SfxLayer): void   // L1~L7
  setMasterVolume(v: number): void
  resume(): Promise<void>
}

// domain/ports/haptic.port.ts
export interface IHaptic {
  pulse(pattern: number | number[]): void  // no-op if unsupported
}
```

---

## 7. 게임 수치 상수 SSOT (Bible §8 인용 + 색상/사운드/타이밍 박제)

> **모든 코드 상수는 본 섹션을 참조한다. Bible §8과 본 섹션은 동일하다.**

### 7.1 Viewport / Display
| 상수 | 값 |
|---|---|
| viewport | 390×844 portrait 강제 |
| canvas background | `#0a0a0f` |
| color contrast | ≥ 7:1 vs bg |

### 7.2 좀비 / Spawn
| 상수 | 값 |
|---|---|
| spawn rate (시작) | 1000ms |
| spawn rate (wave 10) | 300ms |
| zombie lifespan (시작) | 2000ms |
| zombie lifespan (끝) | 1200ms |
| 좀비 간 최소 거리 | 96px |
| hit box (basic/middle/lead) | 80×80 |
| hit box (fast 신입) | 90×90 |
| visible size | 64×64 |
| Thumb Zone | 하단 60% (70%) + 중앙 (20%) + 상단 (10%) |
| 도주 fail 임계 | 5마리 누적 |

### 7.3 Combo / Crit
| 상수 | 값 |
|---|---|
| combo decay (default) | 1500ms |
| combo decay (늘어지는 회의 보유) | 2000ms (+0.5s) |
| combo tier | ×1 → ×1.5(5kill) → ×2(10kill) → ×3(15kill) |
| critical (머리 tap) | 2× |
| critical (사직서 한 방 보유) | 2.5× |

### 7.4 Round / Chapter
| 상수 | 값 |
|---|---|
| round goal | 60초 = wave 10 (10층) |
| envelope 상한 | 68초 |
| 챕터 수 (MVP) | 5 (= 50층) |
| 보스 phase | 마지막 5초 (상한 8초) |
| freeze frame (CEO 처치) | 600ms |
| freeze frame (normal kill) | **금지** |
| Chapter DPS 곡선 | ×1.00 / ×1.85 / ×3.10 / ×4.20 / ×5.36 |
| Boss HP 곡선 | 1.0× / 1.5× / 2.25× / 3.10× / 3.84× |
| 예상 클리어율 | 92% / 90% / 88% / 87% / 88% (풀런 ~85%) |

### 7.5 Card / Meta
| 상수 | 값 |
|---|---|
| 카드 풀 | 15장 (Base 12 + Special 3) |
| 챕터 종료 fan-out | 3장 추첨 / 1장 선택 |
| 추첨 방식 | 결정론 균등 |
| Unlock Tier 2 | 챕터 2 클리어 |
| Unlock Tier 3 | 챕터 4 클리어 |
| Unlock 자기장 ID카드 | 누적 1000 coin |
| Unlock 늘어지는 회의 | 누적 3000 coin |
| Unlock 사직서 한 방 | 누적 10000 coin (ADR-0007 Open, 출시 후 5000~10000 조정 가능) |

### 7.6 Power-up
| 상수 | 값 |
|---|---|
| 기본 drop rate (합계) | 5% (3종 균등 1.67% each) |
| 보스 처치 시 drop | 30% 확정 |
| Coin T3 누적 최대 | 6.5% (×1.3 곱셈) |
| 동시 활성 한도 | 2개 |
| 빙결 지속 | 3초 (+ Duration Tier) |
| 자석 지속 | 3초 (+ Duration Tier) |
| 자석 라인 시각화 | 0.2초 |

### 7.7 Juice / Game Feel
| 상수 | 값 |
|---|---|
| hit-stop (normal) | 4f (66ms @ 60fps) |
| hit-stop (crit) | 6f (100ms) |
| hit-stop (boss) | 8f (133ms) |
| shake (normal) | 6px (감쇠 0.85) |
| shake (crit) | 9px |
| shake (boss) | 12→6px decay |
| shake (thumb zone 침범) | 자동 6→3px |
| particle 동시 한도 | 24p (FPS<50 3f 연속 시 6p) |
| haptic (boss) | [100,40,100] (240ms) |
| haptic (combo 5+) | [30,20,30] (80ms) |
| haptic (22시 이후) | 자동 1/3 강도 |

### 7.8 Daily Streak
| 상수 | 값 |
|---|---|
| 일일 보너스 | +20% coin |
| 누적 방식 | 선형 +20%/일 |
| 상한 | 7일 (+140%) |
| 페널티 | **0** |
| 8일째 | 자동 휴식 모달 |

### 7.9 PWA
| 상수 | 값 |
|---|---|
| 첫 로딩 자산 합계 | < 3MB |
| SW cache 한도 (iOS) | 50MB/도메인 |
| Install prompt 노출 | 챕터 1 클리어 후 1회 |
| dismiss cooldown | 7일 |
| dismiss 누적 영구 비노출 | 3회 |
| 자정 cue 시간대 | 00:00~06:00 |
| 자정 cue 빈도 | 세션 1회 |
| 야간 진동 시작 | 22:00 |
| Notification 권한 | **영구 비요청** |

### 7.10 색상 팔레트 (Bible §1 톤 박제)
| 토큰 | hex | 용도 |
|---|---|---|
| neon-pink | `#FF2D87` | crit / 콤보 popup / 보스 후광 |
| lime-green | `#C5E90B` | wave clear / 점수 + popup / 좀비 형광 |
| dark-bg | `#1A1A1A` (canvas는 `#0a0a0f`) | 배경 / outline |
| mask-white | `#F0EAD6` | 신입 좀비 마스크 |
| mask-gray | `#7A7A7A` | 과장 좀비 마스크 |
| mask-darkgray | `#3A3A3A` | 팀장 좀비 마스크 |
| mask-black | `#0A0A0A` | CEO 보스 마스크 |
| accent-gold | `#FFCE00` | "팡!" 의성어 fill |

### 7.11 사운드 사양 (Web Audio API, Bible §5 4-layer SFX)

모든 SFX는 외부 파일 0 — `WebAudioSynth` (infrastructure/audio)에서 합성. Layer별 합성식:

| Layer | 합성식 | 톤 / 트리거 |
|---|---|---|
| **L1 impact** | 80Hz square 30ms + 220Hz sine 50ms decay | 모든 처치 (의자 충돌음) |
| **L2 zombie groan** | 110~180Hz sawtooth + LFO 4Hz 12% | 처치 시 (회의실 피드백) |
| **L3 crit punch** | 600Hz triangle 20ms + white noise 15ms BP 2kHz | crit kill (결재 도장) |
| **L4 combo "팡!"** | 1.2kHz sine 15ms + 600Hz square 60ms + reverb 80ms | combo 5+ + crit 동시 |
| **L5 powerup** | 880→1320→1760Hz arpeggio 90ms | Power-up pickup (자판기 동전) |
| **L6 wave clear** | C5-E5-G5 chord 350ms | wave 10 보스 처치 (엘리베이터 띵) |
| **L7 hit damage** | 60Hz sawtooth 80ms decay + LP 400Hz | 좀비 도주 시 (형광등 틱) |

BGM은 lazy load (v2 이후), MVP는 SFX만.

### 7.12 타이밍 박제 (60fps 기준)
| 이벤트 | 시간 |
|---|---|
| hit-stop normal | 4f = 66.67ms |
| hit-stop crit | 6f = 100ms |
| hit-stop boss | 8f = 133.33ms |
| freeze frame (CEO 처치) | 600ms |
| 챕터 전환 시퀀스 (Bible §3) | T+60.0 → T+65.5 (5.5초) |
| 자석 라인 시각화 | 200ms |
| "팡!" squash 지속 | 1500ms |
| 카드 fan-out stagger | 150ms × 3장 |

---

## 8. Task List (Phase C 11 Task 상세 명세)

> 각 Task는 단일 `/rl` 콜로 실행. 완료 후 `/rl-verify` 자동 트리거 → 점수 < 0.9면 동일 Task 재실행 (최대 3회), 3회 실패 시 `<task-id>.blocked.md` 작성 후 중단.

---

### Task C-0: 리포지토리 초기화

**완료조건** (체크리스트):
- [ ] `/Users/cjynim/lab/zombie_pang/package.json` 생성 (`name: "zombie-pang"`, `version: "0.1.0"`, `type: "module"`, `license: "MIT"`, `private: true`, `description: "Off-Clock Pang — 50층 좀비 사옥 퇴근 PWA"`)
- [ ] `package.json` `scripts`: dev, build, preview, test, test:prop, test:mutation, test:e2e, lighthouse, typecheck, lint, format (전부 placeholder OK — C-1에서 채움)
- [ ] `.gitignore`: node_modules, dist, .vite, coverage, .stryker-tmp, .playwright, *.log, .DS_Store
- [ ] `README.md`: 1페이지 (한 줄 컨셉 + 실행 명령 `pnpm install && pnpm dev`)
- [ ] `LICENSE`: MIT (저작권 holder: project)
- [ ] pnpm workspace 미사용 (단일 프로젝트)
- [ ] `pnpm install` 시 락파일 생성 가능 상태 (의존성은 비워둠 OK)
- [ ] `git status` clean → 첫 커밋

**산출물**:
- `/Users/cjynim/lab/zombie_pang/{package.json, .gitignore, README.md, LICENSE}`

**스킬 매핑**: 직접 작업 + `/rl-verify` + `code-investigator` agent (필요시).

**금지사항**: pnpm workspace 사용 금지 / 의존성 코드 추가 금지 (C-1에서 처리).

**고려사항**: README는 1페이지로 — 상세 문서는 C-2 가이드에서 작성.

---

### Task C-1: 스켈레톤 구축 (Phaser+TS+Vite+Vitest+fast-check+Stryker+PWA)

**완료조건** (체크리스트):
- [ ] `phaserjs/template-vite-ts` 기반 초기화 (혹은 동등 구조 수동 구축)
- [ ] `package.json` 의존성:
  - `dependencies`: `phaser@^3.80.0`
  - `devDependencies`: `vite@^5`, `vite-plugin-pwa@^0.21`, `typescript@^5`, `vitest@^1`, `@vitest/coverage-v8@^1`, `vitest-canvas-mock`, `@fast-check/vitest`, `fast-check@^3`, `@stryker-mutator/core@^8`, `@stryker-mutator/vitest-runner@^8`, `@biomejs/biome@^1`, `@playwright/test@^1`
- [ ] `scripts`: dev=`vite`, build=`vite build`, preview=`vite preview`, test=`vitest run --coverage`, test:prop=`vitest run --include "**/*.prop.test.ts"`, test:mutation=`stryker run`, test:e2e=`playwright test`, lighthouse=`lhci autorun`, typecheck=`tsc --noEmit`, lint=`biome check src`, format=`biome format --write src`
- [ ] `vite.config.ts`: `optimizeDeps: { include: ['phaser'] }`, VitePWA plugin (`registerType: 'autoUpdate'`, `globPatterns: ['**/*.{js,css,html,png,webp,json}']`, `maximumFileSizeToCacheInBytes: 5_000_000`, manifest 객체 포함)
- [ ] `vitest.config.ts`: `coverage.provider: 'v8'`, per-path threshold (domain 100%, application 95% 등 1.2 매트릭스 적용), `environment: 'jsdom'` (Phaser 어댑터 테스트용), setupFiles에 `vitest-canvas-mock`
- [ ] `stryker.config.json`: `mutate: ['src/domain/**/*.ts', '!src/domain/**/*.test.ts']`, `testRunner: 'vitest'`, `thresholds: { high: 90, low: 70, break: 70 }`, `incremental: true`, `coverageAnalysis: 'perTest'`
- [ ] `biome.json`: formatter + linter, `lineWidth: 100`, `indentStyle: 'space'`, `indentWidth: 2`, `semicolons: 'asNeeded'`
- [ ] `playwright.config.ts`: `use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } }`, `webServer: { command: 'pnpm preview', port: 4173 }`
- [ ] `tsconfig.json`: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`, `target: 'ES2022'`, `module: 'ESNext'`, `moduleResolution: 'Bundler'`, paths alias (`@/domain/*` 등)
- [ ] `public/manifest.webmanifest`: `name: "좀비팡"`, `short_name: "ZombiePang"`, `display: "standalone"`, `orientation: "portrait"`, `theme_color: "#FF2D87"`, `background_color: "#0a0a0f"`, `start_url: "/"`, icons 192/512
- [ ] `public/icons/{icon-192.png, icon-512.png}` placeholder (Phaser Graphics로 런타임 생성 후 dataURL 저장 또는 단색 사각형 PNG)
- [ ] `src/main.ts`: Phaser Game container 생성 (config는 `adapters/phaser/config.ts`에서 import), Composition root는 `infrastructure/container.ts`에서 호출
- [ ] 빈 디렉토리 골격: src/{domain, application, adapters/{phaser/{scenes, objects, managers}, persistence}, infrastructure/{pwa, random, clock, audio, haptic}, shared/{types, utils}}/.gitkeep
- [ ] 7종 명령 exit 0 확인: `pnpm dev` (시각 확인 후 SIGINT), `pnpm test` (테스트 0건 OK), `pnpm test:prop` (테스트 0건 OK), `pnpm test:mutation -- --dry-run` (실패 OK, 명령 자체 인식만), `pnpm typecheck`, `pnpm lint`, `pnpm build`

**산출물**:
- `package.json`, `pnpm-lock.yaml`
- `vite.config.ts`, `vitest.config.ts`, `stryker.config.json`, `playwright.config.ts`, `biome.json`, `tsconfig.json`
- `public/{manifest.webmanifest, icons/*}`
- `src/main.ts`, `src/**/.gitkeep`

**스킬 매핑**: `/superpowers:executing-plans` + `/superpowers:verification-before-completion` + `/deep-research` (Phaser 3.80 + vite-plugin-pwa 최신 API 확인) + `/rl-verify`.

**금지사항**: workbox 외 캐시 라이브러리 추가 금지 / ESLint+Prettier 추가 금지 (Biome 단일 채택).

**고려사항**: vite-plugin-pwa는 0.21+ 버전부터 manifest 객체 inline 지원. Stryker vitest runner는 ESM 호환성 확인 필요. Playwright 첫 실행 시 `pnpm playwright install --with-deps chromium`.

---

### Task C-2: 가이드 문서 작성 (CLAUDE.md + docs/adr + docs/architecture + docs/conventions + docs/domain/glossary)

**완료조건** (체크리스트):
- [ ] `/Users/cjynim/lab/zombie_pang/CLAUDE.md` 작성 (10 섹션):
  1. Project Overview (Bible §1 발췌)
  2. Tech Stack (Bible Title Page)
  3. Commands (Task C-1 scripts 7종)
  4. Architecture (본 플랜 §6 + 링크)
  5. Coding Conventions (TS strict + Biome + kebab-case + named export)
  6. Testing (3 카테고리 + fast-check + Stryker + 매트릭스)
  7. Domain (Bible §2/§3 발췌 + glossary 링크)
  8. Agent Rules (자율 실행, AskUserQuestion 금지, 1콜=1Task)
  9. Don'ts (본 플랜 §2)
  10. References (Bible + ADR + brainstorm + research 링크)
- [ ] `docs/adr/0001-architecture.md` (Status: Accepted, Context/Decision/Consequences/Alternatives 5 섹션) — Hexagonal 4계층 정식 박제
- [ ] `docs/adr/0002-game-engine.md` — Phaser 3 선택 (vs Pixi/Babylon)
- [ ] `docs/adr/0003-coding-conventions.md` — TS strict / Biome / branded types
- [ ] `docs/adr/0004-tdd.md` — 3 카테고리 / fast-check / Stryker
- [ ] `docs/adr/0005-pwa-strategy.md` — vite-plugin-pwa / Workbox / iOS 한계
- [ ] `docs/adr/0006-game-design-principles.md` — Bible §7 안티패턴 10개 박제 + Tentative Default 정책
- [ ] `docs/architecture/hexagonal-game.md` — 4계층 + Phaser Adapter 명세 + Port 5종 + Composition root 시퀀스 다이어그램
- [ ] `docs/conventions/typescript.md` — strict / no any / branded types / Result pattern
- [ ] `docs/conventions/phaser.md` — Scene 구조 / Object pool / DI / Update loop / Event Bus
- [ ] `docs/conventions/testing.md` — 3 카테고리 grep 규칙 / fast-check seed 정책 / Stryker incremental
- [ ] `docs/conventions/folder-structure.md` — src/ 트리 + 명명 규칙
- [ ] `docs/domain/glossary.md` — 용어 30+개 (Zombie 종 4 / Wave / Combo / Crit / PowerUp 3 / Card 15 / Streak / Coin / Chapter / Floor / EMP-0427 / "팡!" / Punch In / Punch Out 등)
- [ ] `docs/game-design/{core-loop, juice, balancing, monetization-free}.md` — Bible §3/§5/§8/§7 발췌 + 인덱스 (Bible은 SSOT, 본 파일은 view)
- [ ] CLAUDE.md ↔ AGENTS.md 심링크 (`ln -s CLAUDE.md AGENTS.md`)
- [ ] `/compound-engineering:document-review` 통과
- [ ] `application-architect` agent 리뷰 통과

**산출물**: 위 15개 파일 + AGENTS.md 심링크

**스킬 매핑**: 직접 작업 + `application-architect` agent 리뷰 + `/compound-engineering:document-review` + `/rl-verify`.

**금지사항**: Bible 내용 복붙 금지 (발췌 + 링크만) / ADR 5 섹션 누락 금지 / 신규 게임 수치 결정 금지 (Bible §8이 SSOT).

**고려사항**: map/ 디렉토리(`/Users/cjynim/lab/map`)의 형식을 참조 — 동일 양식 사용. ADR 0006은 안티패턴 10개 + Open ADR 11건의 MVP Tentative Default 정책을 명시해야 함.

---

### Task C-3a: 도메인 TDD — Score / Combo

**완료조건**:
- [ ] `src/domain/score/score.ts`: Score VO (POJO), `add(points)`, `multiply(combo)`, `current()` 메소드. branded type `Score = number & {__brand: 'Score'}`. negative 입력 시 throw.
- [ ] `src/domain/score/combo.ts`: Combo VO, `incrementOnKill(now: number)`, `tier(): 1 | 1.5 | 2 | 3`, `decayIfStale(now: number)`. IClock 주입.
- [ ] `src/domain/score/score.test.ts` — `[Happy]/[Boundary]/[Error]` 라벨 (예시):
  - `[Happy] add 100 points → score = 100`
  - `[Happy] combo ×1.5 → score = 150 after 100 base`
  - `[Boundary] score = 0 → add 0 → still 0`
  - `[Boundary] combo tier 5kill 직전 (4kill) = ×1`, `5kill 직후 = ×1.5`, `10kill 직후 = ×2`, `15kill 직후 = ×3`
  - `[Boundary] decay 1499ms = 유지`, `1500ms = 리셋`, `2000ms (늘어지는 회의) = 유지`
  - `[Error] add negative score → throw ScoreError`
  - `[Error] IClock 미주입 → constructor throw`
- [ ] `src/domain/score/score.prop.test.ts` — fast-check, seed=42, numRuns=1000:
  - `fc.property(fc.nat(), (n) => Score.from(n).add(n).current() >= 0)`
  - `fc.property(fc.array(fc.nat(), {minLength:0, maxLength:20}), (kills) => /* combo tier 단조성 */)`
- [ ] Vitest coverage: line/branch/function/statement 100%
- [ ] Stryker mutation score ≥ 80% (`pnpm test:mutation`)
- [ ] grep 검증: `grep -c "\[Happy\]\|\[Boundary\]\|\[Error\]" src/domain/score/*.test.ts` ≥ 9 (SUT 3개 × 3 카테고리 최소)

**산출물**:
- `src/domain/score/{score.ts, combo.ts, score.test.ts, combo.test.ts, score.prop.test.ts, combo.prop.test.ts}`

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify` + `application-architect` agent (Port 의존성 리뷰).

**금지사항**: Phaser/DOM/setTimeout 직접 사용 금지 — IClock Port 주입만.

**고려사항**: Combo decay는 IClock.monotonic() 기준. 사직서 한 방 카드 보유 시 crit 2.5× 적용 분기 별도 테스트.

---

### Task C-3b: 도메인 TDD — Wave / Spawner / ZombieType

**완료조건**:
- [ ] `src/domain/wave/wave.ts`: Wave 1~10 정의, `spawnRate(wave: number): number` (1000ms → 300ms 선형 감소), `lifespan(wave: number): number` (2000 → 1200)
- [ ] `src/domain/wave/zombie-type.ts`: 4종 enum + 메타데이터 (`hp`, `speed`, `hitBoxSize`, `maskColor`, `floorEarliest`)
- [ ] `src/domain/wave/spawner.ts`: `spawn(wave: number, random: IRandom): ZombieSpec`, Thumb Zone 분포 (60% 하단 / 20% 중앙 / 10% 상단 / 좀비 간 96px 거리 검증)
- [ ] `*.test.ts` 3 카테고리:
  - `[Happy] wave 1 spawn rate = 1000ms`, `wave 10 = 300ms`
  - `[Happy] CEO 보스는 wave 10에만 spawn`
  - `[Boundary] wave 0 → throw`, `wave 11 → throw`, `wave 5 → spawnRate ∈ [300, 1000]`
  - `[Boundary] 좀비 간 거리 정확히 96px = 허용`, `95px = reject + 재추첨`
  - `[Error] IRandom 미주입 throw`, `wave 음수 throw`
- [ ] `*.prop.test.ts` ≥ 2개:
  - `fc.integer({min:1,max:10}).chain(w => spawnRate(w) ∈ [300,1000])`
  - 동일 seed → 동일 spawn 시퀀스 (결정론)
- [ ] coverage 100% + mutation ≥ 80%

**산출물**: `src/domain/wave/{wave.ts, spawner.ts, zombie-type.ts, *.test.ts, *.prop.test.ts}`

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify`.

**금지사항**: Math.random() 직접 사용 금지 — IRandom Port만.

**고려사항**: spawn rate 곡선은 wave 1→10 사이 정확히 어떤 곡선인가? 본 플랜은 **선형 감소** (1000 - (wave-1) × 77.78) 정의. 데모 결과 너무 단조롭다면 C-9 폴리시에서 ease-in curve로 조정 검토.

---

### Task C-3c: 도메인 TDD — Power-up / Boss

**완료조건**:
- [ ] `src/domain/powerup/powerup.ts`: 3종 (Bomb / Freeze / Magnet) 정의 + 효과
- [ ] `src/domain/powerup/powerup-drop.ts`: drop rate 계산 (5% base × Coin Tier 곱셈, T3 max 6.5%)
- [ ] `src/domain/powerup/powerup-stack.ts`: 동시 활성 한도 2개 강제
- [ ] `src/domain/run/boss.ts`: CEO 보스 5종 (1챕터~5챕터), HP 곡선 (1.0/1.5/2.25/3.10/3.84), 3-phase (telegraph 1s / engagement 3s / climax 1s)
- [ ] `*.test.ts` 3 카테고리:
  - `[Happy] 폭탄 발동 → 화면 전체 좀비 즉시 처치`
  - `[Happy] 빙결 3초 → 모든 좀비 정지`, `자석 3초 → 좀비 끌어당김 + 자동 처치`
  - `[Happy] 보스 처치 시 30% drop`
  - `[Boundary] drop rate T0=5%, T3=6.5%`, drop 곱셈 누적만 (덧셈 금지)
  - `[Boundary] 동시 활성 1→2 허용, 3 reject`
  - `[Boundary] 보스 HP 챕터별 정확값`
  - `[Error] 잘못된 power-up 타입 throw`, `IRandom seed 미주입 throw`
- [ ] `*.prop.test.ts` ≥ 1개:
  - `fc.property(fc.float({min:0,max:1}), (r) => dropRate(coinTier=0, r) ∈ [0, 0.05])`
- [ ] coverage 100% + mutation ≥ 80%

**산출물**: `src/domain/powerup/{powerup.ts, powerup-drop.ts, powerup-stack.ts, *.test.ts, *.prop.test.ts}` + `src/domain/run/boss.ts`

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify`.

**금지사항**: drop rate 덧셈 누적 금지 (ADR-0008 Resolved) — 곱셈만.

**고려사항**: 슬롯머신화 방지 — UI는 "Tier 3에서 drop 빈도 증가" 정성 표현만, 정량 6.5% 노출 금지.

---

### Task C-3d: 도메인 TDD — Meta Progression / Daily Streak

**완료조건**:
- [ ] `src/domain/meta/card.ts`: 15장 정의 (Base 12 = Damage T1~T3, Crit% T1~T3, Duration T1~T3, Coin Gain T1~T3 / Special 3 = 자기장 ID, 늘어지는 회의, 사직서 한 방). 각 카드의 effect 함수 노출.
- [ ] `src/domain/meta/card-draw.ts`: `draw3(pool: Card[], random: IRandom): [Card, Card, Card]` — 결정론 균등 추첨, 중복 없음
- [ ] `src/domain/meta/unlock.ts`: Tier 2 (챕터 2 클리어) / Tier 3 (챕터 4 클리어) / Special 카드 (누적 coin 1000/3000/10000)
- [ ] `src/domain/meta/daily-streak.ts`: 7일 누적, +20%/일 (선형), 페널티 0, 8일째 자동 휴식
- [ ] `*.test.ts` 3 카테고리:
  - `[Happy] streak 1일 → multiplier 1.2`, `7일 → 2.4`
  - `[Happy] 카드 3장 추첨 → 중복 없음`
  - `[Boundary] streak 7 → 8일째 휴식 모달 trigger`, `끊김 → multiplier 1.0 (페널티 0)`
  - `[Boundary] coin 999 → 자기장 ID 미공개`, `1000 → 공개`
  - `[Error] 카드 풀 < 3 → throw`, `unknown card id → throw`
- [ ] `*.prop.test.ts` ≥ 2개:
  - `fc.property(fc.nat({max:30}), (days) => streak(days) ∈ [0,7])`
  - `fc.property(fc.uniqueArray(fc.nat({max:14}), {minLength:15}), () => draw3 returns 3 unique)`
- [ ] coverage 100% + mutation ≥ 80%

**산출물**: `src/domain/meta/{card.ts, card-draw.ts, unlock.ts, daily-streak.ts, *.test.ts, *.prop.test.ts}`

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify`.

**금지사항**: streak 페널티 추가 금지 (Bible §7 안티패턴 #1) / 카드 가챠화 금지 (결정론 균등만).

**고려사항**: ADR-0007 Open — 10000 coin 임계는 출시 후 5000~10000 조정 가능. 본 Task는 10000을 상수로 박제, 환경변수로 override 가능 설계.

---

### Task C-4: Application Use Cases

**완료조건**:
- [ ] `src/application/start-run.ts`: 새 런 시작 (Daily streak 적용, 영구 메타 로드)
- [ ] `src/application/kill-zombie.ts`: 좀비 처치 → Score + Combo + Particle event + Power-up drop check
- [ ] `src/application/apply-powerup.ts`: Power-up 활성화 (Bomb 즉발 / Freeze 3s / Magnet 3s, 동시 ≤ 2)
- [ ] `src/application/pick-upgrade.ts`: 챕터 종료 시 3장 fan-out → 1장 선택 → starting deck 반영
- [ ] `src/application/end-chapter.ts`: 챕터 종료 (성공/조기 퇴근 모두) → 인테리어 1층 채움 + 카드 fan-out + install prompt (챕터 1 1회만)
- [ ] `src/application/end-run.ts`: 런 종료 (5챕터 클리어 → 사직서 엔딩 / 도주 5 누적 → 조기 퇴근)
- [ ] 모든 use case는 Port 주입 (IRandom, IClock, ISaveStore, IAudio, IHaptic)
- [ ] `*.test.ts` 3 카테고리 (각 use case마다):
  - `[Happy] start-run → 영구 메타 로드 + streak +20% 적용`
  - `[Boundary] kill-zombie → combo tier 경계 (4→5kill 시 ×1.5 승급)`, `Power-up 동시 활성 2 한도`
  - `[Error] SaveStore quota 초과 → graceful degrade (메모리에만 보존)`, `IRandom 미주입 throw`
- [ ] line ≥ 95%, branch ≥ 90%, function/statement ≥ 95%
- [ ] mutation score ≥ 70%

**산출물**: `src/application/{start-run, kill-zombie, apply-powerup, pick-upgrade, end-chapter, end-run, *.test}.ts`

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify`.

**금지사항**: domain import는 가능하나 adapters/infrastructure import 금지 (DIP).

**고려사항**: install prompt 트리거는 ADR-0011 Open — MVP는 "챕터 1 클리어 후 1회 + dismiss 7일 cooldown + 3회 누적 영구 비노출" Tentative Default.

---

### Task C-5: Persistence Adapter (LocalStorageSaveStore + Contract Test)

**완료조건**:
- [ ] `src/adapters/persistence/local-storage-save-store.ts`: ISaveStore 구현
  - JSON 직렬화: `{ runs: number, coinTotal: number, streak: { lastDate: string, count: number }, unlockedCards: number[], dismissedInstallPrompt: { count: number, lastAt: number }, settings: {} }`
  - localStorage quota exceeded → graceful degrade (in-memory fallback + warning log)
  - 키 prefix: `zombie-pang:v1:`
- [ ] `src/adapters/persistence/local-storage-save-store.test.ts`:
  - Contract test: ISaveStore 인터페이스 준수 (load/save/remove 시그니처)
  - `[Happy] save + load round-trip 동일성`
  - `[Boundary] quota 직전 (5MB-1byte) 성공`, `quota 초과 → in-memory fallback`
  - `[Error] localStorage 미지원 (SSR/iframe) → in-memory fallback`
- [ ] fake-localStorage helper (vitest-canvas-mock 또는 자체 mock)
- [ ] line ≥ 90%, branch ≥ 85%

**산출물**: `src/adapters/persistence/{local-storage-save-store.ts, *.test.ts}` + `src/adapters/persistence/in-memory-save-store.ts` (fallback)

**스킬 매핑**: `/superpowers:test-driven-development` + `/rl-verify`.

**금지사항**: IndexedDB 사용 금지 (MVP는 localStorage만, v2에서 마이그레이션 검토).

**고려사항**: iOS Safari Private 모드는 localStorage가 quota 0 — fallback 경로 필수.

---

### Task C-6: Phaser Adapter — Scenes / Objects / Managers

**완료조건**:
- [ ] **Scenes 6개** (`src/adapters/phaser/scenes/`):
  - `boot.scene.ts` — Phaser 초기화, asset preload 사전 단계
  - `preload.scene.ts` — Graphics 도형 캐시 생성 (좀비 4종, particle 8종, "팡!" 텍스트)
  - `main-menu.scene.ts` — "PUNCH IN" 버튼 + Daily streak 24×24 배지 (우상단)
  - `game.scene.ts` — 메인 게임 루프 (좀비 spawn / tap 검출 / combo decay / Power-up 적용)
  - `hud.scene.ts` — Score / Combo / Floor N / fled X of 5 / Online dot (회색/황색)
  - `game-over.scene.ts` — 챕터 전환 시퀀스 (Bible §3) + 3택 동등 가중치 + 사직서 엔딩
- [ ] **Objects 4개** (`src/adapters/phaser/objects/`):
  - `zombie.object.ts` — 4종 (Graphics 합성, hit box 80×80 또는 90×90, 마스크 색)
  - `particle.object.ts` — 8종 풀 (사원증, 종이, 커피잔, USB, 명함, 클립, 스테이플러 심, 포스트잇)
  - `upgrade-card.object.ts` — 카드 fan-out (0.15s stagger × 3장)
  - `boss.object.ts` — CEO 보스 (거대 원 + Graphics 후광 + 차트 폴리곤, HP 3등분 색상 변화 녹→황→적)
- [ ] **Managers 2개** (`src/adapters/phaser/managers/`):
  - `audio.manager.ts` — IAudio Port 구현, WebAudioSynth 위임
  - `juice.manager.ts` — hit-stop, screen shake, freeze frame, flash 통합 관리, Adaptive Degradation
- [ ] `src/adapters/phaser/config.ts` — Phaser Game Config (390×844, Graphics renderer, parent: 'game')
- [ ] HEADLESS smoke test 1~2개 (`*.spec.ts`): Boot → Preload → MainMenu 전환 검증
- [ ] `pnpm dev` 실행 시 실제 플레이 가능 (1F~10F 1챕터 완주 수동 검증)
- [ ] line ≥ 70%, branch ≥ 60%

**산출물**: 위 12개 파일 + config.ts + smoke test

**스킬 매핑**: 직접 작업 + `/superpowers:verification-before-completion` + `/rl-verify`.

**금지사항**: domain 코드를 Scene 안에 작성 금지 (use case 호출만) / 외부 이미지 자산 사용 금지 (Graphics 합성만).

**고려사항**:
- 카드 fan-out stagger 150ms × 3장 = 총 450ms (Bible §3 T+61.8~62.5 envelope 내)
- "팡!" 의성어는 crit + combo 5+ 동시 조건만 발화 (Bible §5)
- Adaptive Degradation: FPS<50 3프레임 연속 시 particle 24p→6p (Bible §5)

---

### Task C-7: Infrastructure — PWA + Vibration + Web Audio Synth + Container

**완료조건**:
- [ ] `src/infrastructure/pwa/register-sw.ts` — vite-plugin-pwa의 `registerSW` 래퍼, autoUpdate 트리거
- [ ] `src/infrastructure/pwa/install-prompt.ts` — `beforeinstallprompt` 캡처, dismiss 7일 cooldown / 3회 누적 영구 비노출 (SaveStore 연동)
- [ ] `src/infrastructure/pwa/midnight-cue.ts` — 00:00~06:00 첫 진입 시 디밍 모달 (IClock 주입)
- [ ] `src/infrastructure/random/seeded-random.ts` — IRandom 구현, mulberry32 또는 xorshift, seed=42 default
- [ ] `src/infrastructure/clock/system-clock.ts` — IClock 구현 (`Date.now()` + `performance.now()`)
- [ ] `src/infrastructure/audio/web-audio-synth.ts` — IAudio 구현, 7 layer 합성 (Bible §5 + 본 플랜 §7.11)
- [ ] `src/infrastructure/haptic/vibration-api.ts` — IHaptic 구현, `typeof navigator.vibrate === 'function'` 가드 + no-op, 22시 이후 1/3 강도
- [ ] `src/infrastructure/container.ts` — Composition root (모든 Port 주입, `main.ts`에서 호출)
- [ ] `*.test.ts` ≥ 1개씩:
  - `[Happy] vibration 정상 호출`, `[Boundary] 22시 정확히 → 1/3 강도`, `[Error] vibration 미지원 → no-op`
  - `[Happy] seeded random 결정론`
  - `[Happy] WebAudio 7 layer 합성 callable`
- [ ] line ≥ 80%, branch ≥ 70%

**산출물**: 위 8개 파일 + *.test.ts

**스킬 매핑**: 직접 작업 + `/deep-research` (vite-plugin-pwa registerSW 최신 API + Web Audio synth 패턴) + `/rl-verify`.

**금지사항**: Notification.requestPermission 호출 금지 (Bible §6) / Wake Lock 사용 금지 (60초 세션).

**고려사항**: iOS Safari AudioContext는 사용자 gesture (PUNCH IN tap) 후 `resume()` 호출 필요 — `main-menu.scene.ts`에서 트리거.

---

### Task C-8: 통합 + E2E + Lighthouse

**완료조건**:
- [ ] `tests/e2e/punch-in.spec.ts` — Playwright "30초 플레이 후 score > 0"
- [ ] `tests/e2e/boss-fight.spec.ts` — "wave 10 도달 → CEO 보스 처치 → 챕터 1 클리어"
- [ ] `tests/e2e/meta-card.spec.ts` — "챕터 1 클리어 → 카드 3장 fan-out → 1장 선택 → starting deck 반영"
- [ ] `pnpm test:e2e` 3 시나리오 모두 통과 (Pixel 5 viewport 390×844)
- [ ] `pnpm lighthouse` (또는 `npx @lhci/cli autorun`): PWA ≥ 90, Performance ≥ 80, Installable true
- [ ] 번들 크기 검증: `du -sh dist/` 또는 `pnpm size` 결과 gzip < 1.5MB
- [ ] PWA 수동 검증 (Chrome DevTools Application 탭):
  - Manifest: `name "좀비팡"`, `display "standalone"`, `orientation "portrait"`
  - Service Worker: activated
  - Cache Storage: 핵심 자산 precached
  - Install 가능

**산출물**: `tests/e2e/*.spec.ts` 3개, `lighthouserc.json` 설정

**스킬 매핑**: 직접 작업 + `/superpowers:verification-before-completion` + `/rl-verify`.

**금지사항**: `--ignore-https-errors` 무분별 사용 금지 / 번들 크기 초과 시 lazy load 우선 검토 (Phaser dynamic import 등).

**고려사항**: Lighthouse PWA 점수는 manifest + SW + HTTPS (또는 localhost) + offline 동작 모두 필요.

---

### Task C-9: 최종 게임 밸런스 + 폴리시

**완료조건**:
- [ ] 5챕터 풀런 클리어율 측정 (수동 10회 + 자동 simulation 100회) → 85% ± 3% 범위 확인
- [ ] Bible §3 5챕터 누적 DPS / Boss HP 곡선과 실측 일치 검증
- [ ] Juice 매트릭스 (Bible §5) 7 이벤트 × 6 cue 모두 발화 확인 (디버그 패널)
- [ ] Adaptive Degradation 트리거 확인 (FPS<50 3프레임 시 particle 24→6 다운그레이드)
- [ ] 접근성 (`prefers-reduced-motion` / `prefers-color-scheme dark` / `forced-colors`) 시뮬레이션 통과
- [ ] iOS Safari (또는 WebKit 시뮬레이션) 수동 검증:
  - AudioContext resume on tap
  - Vibration no-op (지원 안 함)
  - Install 가이드 모달 노출
  - Orientation lock 실패 → landscape overlay
- [ ] 자정 cue (00:00~06:00 IClock 조작) 1회 노출 검증
- [ ] 22시 이후 진동 1/3 강도 검증
- [ ] 게임 텍스트 0줄 확인 (HUD 숫자 + aria-label만)
- [ ] "팡!" 의성어는 crit + combo 5+ 동시 조건만 발화 확인

**산출물**:
- `docs/demiurge/rl-verify/zombie-pang/balance-report.md` — 클리어율 / DPS 곡선 / Juice 발화 / 접근성 검증 결과
- Bug fix 커밋 (있다면)

**스킬 매핑**: 직접 작업 + `/superpowers:systematic-debugging` (밸런스 이슈 발견 시) + `/rl-verify`.

**금지사항**: Bible §8 수치 무단 변경 금지 — 조정 필요 시 Bible + 본 플랜 §7 동시 수정 + ADR 박제.

**고려사항**: 클리어율이 85% 범위 벗어나면 Wave spawn 곡선 (ease-in / linear / ease-out) 조정 검토. Bible §8 spawn rate 1000→300 선형은 출시 후 데이터 기반 재튜닝 (v2).

---

### Task C-10: 최종 rl-verify 합의 보고서 + Phase C 커밋

**완료조건**:
- [ ] `docs/demiurge/rl-verify/zombie-pang/final-report.md` 작성:
  - 완료조건 1.1 자동 검증 9 항목 체크리스트 + 실제 명령 결과 첨부 (stdout)
  - 완료조건 1.2 커버리지 매트릭스 실측치 (Vitest coverage 보고서)
  - 완료조건 1.3 TDD 3 카테고리 grep 결과
  - 완료조건 1.4 Property-based invariant 결과
  - 완료조건 1.5 게임 동작 14 항목 체크
  - 완료조건 1.6 가이드 문서 15 항목 체크
  - 사실 모순 0 확인 (Bible vs ADR vs 본 플랜 vs 코드)
  - "완전검증" 라벨 + rl-verify 점수 ≥ 0.9
- [ ] Memory 매핑 테이블 저장 여부 사용자 확인 (글로벌 CLAUDE.md 규칙) — Phase C는 자율 실행이므로 자동 저장 default
- [ ] `/commit` 으로 phase-c 최종 커밋 (push는 사용자 명시 요청 전까지 보류)

**산출물**: `docs/demiurge/rl-verify/zombie-pang/final-report.md`, phase-c git commit

**스킬 매핑**: `/rl-verify` 최종 회차 + `/superpowers:verification-before-completion` + `/commit`.

**금지사항**: `git push` 금지 (사용자 명시 요청 전).

**고려사항**: 미충족 항목 발견 시 보완 Task (C-11+)를 Task List 끝에 추가 → 동일 사이클 반복.

---

## 9. 실행 및 검증 프로세스

### 9.1 Task 등록 (필수)
Phase C 시작 시점에 본 플랜의 C-0 ~ C-10 11개 Task를 TaskCreate로 등록 (이미 Phase A 시작 시 등록 완료 — 본 플랜은 명세서 역할).

### 9.2 Task 실행 규칙
- **1 Task = 1 /rl 콜 = 단일 ralph-loop.local.md 사이클**
- Task 시작 시 `.claude/ralph-loop.local.md`를 해당 Task의 완료조건으로 초기화
- Task 진행 중 새 사실 발견 시 본 플랜을 직접 수정 후 진행 (Bible 변경은 ADR 필수)

### 9.3 Task별 검증 (자동)
각 Task 완료 후 `/rl-verify` 자동 트리거:
1. 완료조건 자동 명령 (`pnpm test`, `pnpm typecheck` 등) exit 0 확인
2. 산출물 다각도 검토 (Bible 정합성, 가이드 준수, TDD 3 카테고리)
3. 점수 < 0.9 → 보완 후 동일 Task 재실행 (최대 3회)
4. 3회 실패 → `<task-id>.blocked.md` 작성, 다음 Task 진입 중단

### 9.4 플랜 최종 검증
Task C-10 종료 후 `/rl-verify`로 완료조건 1.1~1.6 전수 검증:
- 미충족 항목 발견 시: 보완 Task를 끝에 추가 (C-11+) → 동일 사이클 반복
- 완료조건 전 항목 통과 시: "완전검증" 라벨로 final-report.md 확정

### 9.5 자율 실행 안전망
- Task 실패 3회 연속 시 다음 Task 진입 중단 → 사용자 보고
- AskUserQuestion 발생 시 즉시 중단 → 본 플랜의 박제 결정 우선 참조 권고

---

## 10. 위험 & 완화

원본 플랜 R1~R12 + Phase A에서 발견한 신규 위험:

| # | 위험 | 영향 | 완화 |
|---|---|---|---|
| R1 | Phaser GameObject 단위 테스트 canvas 의존성 폭발 | 중 | domain POJO 분리 강제(C-3*), Phaser는 HEADLESS smoke 1~2개로 제한 |
| R2 | 자율 실행 중 새 디자인 결정 → AskUserQuestion 막힘 | 고 | Bible §8 수치 박제 + 본 플랜 §7 박제. 미정 항목 = ADR Tentative Default |
| R3 | vite-plugin-pwa Workbox 캐시 미스 → 오프라인 깨짐 | 중 | C-1 manifest+SW 골격 포함, C-7 precache glob 확정, Lighthouse PWA 90+ 강제 |
| R4 | RNG/시간 의존 코드 100% 브랜치 커버 어려움 | 중 | IRandom/IClock Port 추상화, FakeClock + SeededRandom으로 결정론 |
| R5 | /rl 한 콜 길어져 ralph-loop.local.md 손상 | 중 | 1콜=1Task, 시작 시 상태 파일 초기화, 산출물 docs/에 직렬화 |
| R6 | iOS Safari PWA 한계 (vibration / install / orientation) | 저 | Bible §6 박제, fallback graceful degradation, C-7에서 가드 처리 |
| R7 | 외부 폰트/이미지 라이선스 리스크 | 저 | Graphics 도형 + Web Audio 합성음만, 외부 자산 금지 |
| R8 | TDD 3 카테고리 누락 | 고 | rl-verify가 매 Task에서 grep 강제 검증, 누락 시 점수 0.5 이하 |
| R9 | Stryker mutation 실행 시간 폭증 (CI 30분+) | 저 | domain만 mutation, incremental + perTest, 로컬 dry-run, 풀 실행 nightly |
| R10 | Property-based test 비결정론 (CI flaky) | 중 | fast-check seed=42 고정, numRuns=1000, 실패 시 reproducer 출력 |
| R11 | 5챕터 클리어율 85% 일탈 (너무 쉽거나 어려움) | 중 | C-9에서 simulation 100회 + 수동 10회 측정, 일탈 시 spawn 곡선 조정 |
| R12 | 번들 크기 1.5MB gzip 초과 | 저 | C-8에서 dynamic import + lazy load (BGM v2), Phaser tree-shaking |
| **R13** | **Bible §8 수치와 ADR 임계값 불일치** | 중 | Phase B 작성 중 본 플랜 §7과 Bible §8을 텍스트 sync 우선 작업 (B-0 자체 점검) |
| **R14** | **ADR Open 11건이 Phase C에서 결정 강요** | 중 | MVP는 Tentative Default 적용 (본 플랜 §3.7), 출시 후 30일 데이터 재검증 |
| **R15** | **Bible 텍스트 0줄 정책 vs HUD aria-label 충돌** | 저 | aria-label은 screen reader 전용이므로 "텍스트 0줄" 정의에서 제외 — Bible §1에 명시 |
| **R16** | **자정 cue 강제 노출이 UX 저해 가능** | 저 | 옵션 [그래도 1라운드만] 동등 가중치 + 세션 1회 한정 (ADR-0012 Tentative Default) |

---

## 11. Critical Files

### 11.1 작성/수정 대상 (Phase C)
**프로젝트 루트**:
- `/Users/cjynim/lab/zombie_pang/{package.json, pnpm-lock.yaml, .gitignore, README.md, LICENSE, CLAUDE.md, AGENTS.md}`
- `/Users/cjynim/lab/zombie_pang/{vite.config.ts, vitest.config.ts, stryker.config.json, playwright.config.ts, biome.json, tsconfig.json, lighthouserc.json}`

**Public 자산**:
- `/Users/cjynim/lab/zombie_pang/public/{manifest.webmanifest, icons/icon-192.png, icons/icon-512.png}`

**소스 코드**:
- `/Users/cjynim/lab/zombie_pang/src/domain/{score, wave, powerup, meta, run, ports}/*.ts`
- `/Users/cjynim/lab/zombie_pang/src/application/*.ts`
- `/Users/cjynim/lab/zombie_pang/src/adapters/{phaser/{scenes, objects, managers, config.ts}, persistence}/*.ts`
- `/Users/cjynim/lab/zombie_pang/src/infrastructure/{pwa, random, clock, audio, haptic, container.ts}/*.ts`
- `/Users/cjynim/lab/zombie_pang/src/shared/{types, utils}/*.ts`
- `/Users/cjynim/lab/zombie_pang/src/main.ts`
- `/Users/cjynim/lab/zombie_pang/tests/e2e/*.spec.ts`

**문서**:
- `/Users/cjynim/lab/zombie_pang/docs/adr/{0001~0006}-*.md` (정식 박제)
- `/Users/cjynim/lab/zombie_pang/docs/architecture/hexagonal-game.md`
- `/Users/cjynim/lab/zombie_pang/docs/conventions/{typescript, phaser, testing, folder-structure}.md`
- `/Users/cjynim/lab/zombie_pang/docs/domain/glossary.md`
- `/Users/cjynim/lab/zombie_pang/docs/game-design/{core-loop, juice, balancing, monetization-free}.md` (Bible 발췌 + 인덱스)
- `/Users/cjynim/lab/zombie_pang/docs/demiurge/rl-verify/zombie-pang/{phase-b-report, balance-report, final-report}.md`

### 11.2 참조 전용 (읽기만)
- `/Users/cjynim/lab/zombie_pang/docs/game-design/bible.md` — Phase A SSOT, 변경 시 ADR 필수
- `/Users/cjynim/lab/zombie_pang/docs/adr/draft/ADR-*.md` — Phase A draft 15건
- `/Users/cjynim/lab/zombie_pang/docs/{debate, brainstorm, research}/**/*.md` — Phase A 산출물
- `/Users/cjynim/lab/zombie_pang/docs/demiurge/rl-verify/zombie-pang/phase-a-report.md` — Phase A 합의 보고서
- `/Users/cjynim/lab/map/{AGENTS.md, docs/**}` — SSOT 형식의 모범
- `/Users/cjynim/.claude/CLAUDE.md` — 글로벌 플랜 작성 규칙

---

## 12. 검증 명령어 (End-to-End)

```bash
cd /Users/cjynim/lab/zombie_pang

# (1) 빌드/품질 7종 — 전체 exit 0
pnpm install
pnpm typecheck
pnpm lint
pnpm test            # 커버리지 매트릭스(1.2) + 3카테고리 라벨 grep
pnpm test:prop       # fast-check 1000회 invariant
pnpm test:mutation   # Stryker, Domain ≥80% / App ≥70%
pnpm build           # dist/ + 번들 < 1.5MB gzip

# (2) 개발 서버 + 수동 플레이
pnpm dev
# → http://localhost:5173 → Start → 1챕터 60초 자동 학습 → CEO 보스 처치 → 카드 3택 → 5챕터 옥상 → 사직서 엔딩

# (3) E2E + Lighthouse
pnpm test:e2e        # 3 Playwright 시나리오
pnpm lighthouse      # PWA ≥ 90, Performance ≥ 80

# (4) Bible 수치 sync 검증 (본 플랜 §7 vs Bible §8)
diff <(grep -E "spawn rate|combo decay|freeze frame|drop rate|streak" docs/game-design/bible.md | sort) \
     <(grep -E "spawn rate|combo decay|freeze frame|drop rate|streak" docs/plan/zombie-pang-master-plan.md | sort)
# 차이 없어야 함 (또는 sync된 reformatting만)

# (5) 가이드 문서 존재 검증
test -f CLAUDE.md && \
test -L AGENTS.md && \
test -f docs/adr/0001-architecture.md && \
test -f docs/adr/0002-game-engine.md && \
test -f docs/adr/0003-coding-conventions.md && \
test -f docs/adr/0004-tdd.md && \
test -f docs/adr/0005-pwa-strategy.md && \
test -f docs/adr/0006-game-design-principles.md && \
test -f docs/architecture/hexagonal-game.md && \
test -f docs/conventions/typescript.md && \
test -f docs/conventions/phaser.md && \
test -f docs/conventions/testing.md && \
test -f docs/conventions/folder-structure.md && \
test -f docs/domain/glossary.md && \
echo "guide-docs OK"

# (6) TDD 3 카테고리 grep 강제
test $(grep -rE "\[Happy\]|\[Boundary\]|\[Error\]" src/domain/ | wc -l) -ge 30 && echo "tdd-3-cat OK"

# (7) Property-based 1000 numRuns 강제
grep -rE "numRuns: 1000|numRuns:1000" src/domain/ tests/ && echo "fast-check 1000 OK"

# (8) Notification 권한 금지 검증
! grep -r "Notification.requestPermission\|new Notification(" src/ && echo "no-notification OK"

# (9) 외부 자산 다운로드 금지 검증
! grep -rE "fetch\(['\"]https?://(?!localhost)" src/adapters/phaser/ && echo "no-external-asset OK"

# (10) 최종 rl-verify 보고서
test -f docs/demiurge/rl-verify/zombie-pang/final-report.md && \
grep -q "완전검증" docs/demiurge/rl-verify/zombie-pang/final-report.md && \
echo "final-report OK"

# (11) PWA 동작 — Chrome DevTools Application 탭 수동:
#    - Manifest: name "좀비팡", display "standalone", orientation "portrait"
#    - Service Worker: activated
#    - Cache Storage: 핵심 자산 precached
#    - Install 가능 (Chrome desktop or Android)
```

---

## 13. Phase C 완료 후 다음 단계

### 13.1 v2 로드맵
- **시너지 콤보**: 카드 2장 조합 시 추가 효과 (예: 자기장 + 사직서 한 방 = 자석 끌어당김 후 즉시 처치)
- **광고 BM 결정**: ADR-0001 Open 재논의 — 사용자 가치 입증 후 1일 1회 보상형 광고 옵션 (윤리적 광고만)
- **Settings 메뉴**: BGM 볼륨 / 색약 모드 강도 / 진동 ON-OFF (Bible §6 접근성 항목 확장)
- **다국어**: `<html lang="ko">` 기본 + EN i18n (게임 텍스트 0줄 정책 유지)
- **BGM lazy load**: 챕터별 BGM 7곡 (1챕터당 1곡 + 보스 1곡 + 엔딩 1곡), Web Audio 합성 또는 외부 OGG (라이선스 명확화)
- **Cloud save**: Firebase Anonymous Auth + Firestore (v2 백엔드 도입 시)
- **출시 후 30일 데이터 기반 ADR Open 11건 재논의**

### 13.2 운영 모니터링
- **메트릭**: P50/P90 첫 로딩 시간, P50/P90 챕터 클리어 시간, retention D1/D7/D30, 챕터 1~5 클리어율
- **에러 추적**: Sentry 또는 LogRocket (v2 백엔드 도입 시)
- **A/B 테스트**: spawn 곡선 (선형 vs ease-in), Special 카드 임계 (5000 vs 10000 coin), install prompt 노출 시점
- **윤리 감사**: Bible §7 안티패턴 10개 + Ethics dashboard (출시 후 분기 1회)

### 13.3 학습 회고
- Phase A 페르소나 토론 4 라운드 평균 합의도 0.847 — v2 추가 토픽 (시너지 콤보 / BM)에서도 동일 프로토콜 적용
- Hexagonal 4계층 + Port 5종 패턴은 향후 Phaser 게임 SSOT로 재사용 가능 → `/Users/cjynim/lab/map`에 game-specific overlay 추가 검토

---

> **본 플랜은 Phase C 11 Task의 자율 실행 SSOT다. Bible §8 게임 수치와 본 플랜 §7은 동일하다. 충돌 시 Bible 우선. 본 플랜 변경은 ADR 또는 명시 사용자 승인 필요.**
