# 수렴 검증 플랜 — CEO 보스 거동 강화 Spec

## 대상

- **작업 설명**: 좀비팡 CEO 보스 거동 강화 spec (8자 이동 + 미니언 + 격노 단계) 검증
- **모드**: 문서 검증
- **대상 파일 경로**: `/Users/cjynim/lab/zombie_pang/docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > Phase 6에서 `/organize` 호출 인자로 참조

## Tier

**Tier 2 (표준 검증)** — 판별 근거:
- 다수 컴포넌트 (도메인 4 모듈 + use case 2 + 어댑터 수정)
- 중간 영향 범위 (MVP 핵심 보스전 거동, 챕터 1~5 전체 영향)
- 외부 사실 인용 검증 필요 (Bible §3 5초 연출, §5 24p/600ms freeze, §7 Ethics 안티패턴 10건)
- 되돌리기 가능 (코드 미구현 단계)
- 시스템 전체 영향까진 아님 → Tier 3 아님

## 검증 항목

| # | 항목 | 검증 방법 | 사용 Agent/Skill |
|---|------|----------|-----------------|
| V1 | Bible §3/§5/§7 인용 정확성 | Bible 파일 라인 단위 대조 | RESEARCHER (general-purpose) |
| V2 | Hexagonal DIP 준수 (도메인 무의존) | 의존성 방향 검증, Port 주입 명세 검증 | ce-architecture-strategist |
| V3 | Phase 상수 테이블 수치 타당성 | 화면 크기 vs R, ω 회전수 vs envelope, 미니언 합계 | RESEARCHER + 페르소나 |
| V4 | TDD 3카테고리 룰 충족 | 테스트 매트릭스에서 [Happy]/[Boundary]/[Error] 각 ≥1개 확인 | TESTING-ARCH (testing-architecture skill) |
| V5 | Property-based invariant 5개 적절성 | 매개변수 범위, falsification 가능성 | TESTING-ARCH |
| V6 | Mutation 임계 (domain ≥80%, app ≥70%) | Bible/ADR-0004 정책과 일치 | TESTING-ARCH |
| V7 | 문서 내적 일관성 (D5↔7.1↔R2, 미니언 합계) | 섹션 간 모순 탐지 | DOC-REVIEW (ce-doc-review) |
| V8 | 명확성/모호성 (격노 부동소수점, 폭사 시점 등) | 두 가지 해석 가능한 표현 탐지 | DOC-REVIEW |
| V9 | YAGNI / 단순성 (도메인 4 모듈 + use case 2 과한가) | 합쳐도 되는 모듈 식별 | SIMPLIFIER (ce-code-simplicity-reviewer) |
| V10 | 반론: 8자 이동이 60초 envelope를 깨는가 | 가속 후 envelope 시뮬레이션 | CONTRARIAN |
| V11 | 반론: γ 격리(D5)가 다른 안티패턴 유발 | "보스 wave는 도주 free" 인식 위험 | CONTRARIAN |
| V12 | 반론: 미니언 8마리 화면 혼잡(R1)이 진짜 완화되나 | E2E E3 시나리오만으로 충분한지 | CONTRARIAN |
| V13 | 누락 검증: ADR 작성 필요성 (CLAUDE.md §8 Rule #9) | 새 도메인 추가가 ADR 트리거인가 | DOC-REVIEW + CONTRARIAN |

## 검증 관점 및 Agent 할당

| 관점 | 역할 | 사용 Agent/Skill | 필수 여부 |
|------|------|-----------------|----------|
| 반론/적대적 | CONTRARIAN | `compound-engineering:ce-adversarial-document-reviewer` | ✅ |
| 아키텍처 타당성 | ARCHITECT | `compound-engineering:ce-architecture-strategist` | - |
| 문서 품질 | DOC-REVIEW | `general-purpose` (compound-engineering:ce-doc-review skill 실행) | - |
| TDD/테스트 전략 | TESTING-ARCH | `general-purpose` (testing-architecture skill 실행) | - |
| 외부 사실 검증 | RESEARCHER | `general-purpose` (Bible/코드 직접 대조) | ✅ |
| 단순성 (YAGNI) | SIMPLIFIER | `compound-engineering:ce-code-simplicity-reviewer` | - |
| 종합 판정 | EVALUATOR | main agent (페르소나) | ✅ |

## Agent별 상세 프롬프트

### 관점 1: 반론/적대적 (CONTRARIAN)

- **Agent**: `compound-engineering:ce-adversarial-document-reviewer`
- **프롬프트**:
  > 좀비팡 CEO 보스 거동 강화 spec을 적대적 관점으로 검토하라.
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > 컨텍스트: 좀비팡은 30~60초 마이크로세션 PWA 캐주얼 액션 게임. Bible §7 Ethics 안티패턴 10개 준수가 핵심 차별점. 60초 envelope 강제.
  > 다음 가설을 깨려고 시도하라:
  > 1. **H1**: "Ch5 8자 이동 (R=150, ω=1.6) + 미니언 8마리가 60초 envelope를 깨지 않는다" — 가속 후 실제 envelope 초과 시뮬레이션
  > 2. **H2**: "γ 격리 정책(D5)이 다른 Ethics 안티패턴(예: 보스 wave 도주 free라는 학습 인식)을 유발하지 않는다"
  > 3. **H3**: "Phase 상수 (R, ω, 격노 트리거 HP%)가 학습 곡선 보호와 도전감 사이 균형이다"
  > 4. **H4**: "도메인 4 모듈 + use case 2 분리가 과하지 않다 (combine 가능 모듈 식별)"
  > 5. **H5**: "본 spec이 기존 boss-hud.ts, escape-counter 외 추가 변경 없이 통합 가능하다"
  > 각 가설에 대해 반례 또는 실패 시나리오를 구성하라. 추측 금지 — 실제 코드/Bible 검증.

### 관점 2: 아키텍처 타당성 (ARCHITECT)

- **Agent**: `compound-engineering:ce-architecture-strategist`
- **프롬프트**:
  > 좀비팡 CEO 보스 거동 강화 spec의 아키텍처 타당성을 검증하라.
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > 좀비팡 아키텍처 원칙 (CLAUDE.md §4): Hexagonal 4계층, DIP (도메인은 Phaser/DOM/setTimeout/Math.random/Date.now 무의존), Port는 `domain/ports/`에 interface로 선언.
  > 검증 항목:
  > 1. 신규 도메인 모듈 4개 (`boss-movement`, `boss-rage-level`, `minion-composition`, `boss-phase-config`)가 domain 순수성 위반 없이 설계되었는가
  > 2. application use case 2개 (`spawn-boss-wave`, `tick-boss-position`)가 Port 주입을 올바르게 명세하는가 (IClock만 주입, IRandom 미사용 결정의 일관성)
  > 3. adapter 수정 (`game-scene.ts`, `zombie.object.ts`, `escape-counter.ts skip()`)이 도메인을 침투하지 않는가
  > 4. 의존성 방향 다이어그램 (§5.4)이 코드와 일치 가능한가
  > 5. boss 도메인 모듈을 한 파일로 합치는 게 더 단순한가, 분리가 맞는가 (`boss-phase-config` = 상수 lookup만이라 inline 가능성)
  > 6. CEO HP를 다루는 기존 `src/domain/powerup/boss.ts`와 새 `domain/boss/*`가 서로 conflict하지 않는가 (boss 도메인 중복)
  > 발견사항을 [BUG | RISK | DESIGN-CONCERN | OK] 라벨링.

### 관점 3: 문서 품질 (DOC-REVIEW)

- **Agent**: `general-purpose`
- **프롬프트**:
  > `/compound-engineering:ce-doc-review` 스킬을 사용하여 다음 spec을 검토하라.
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > 컨텍스트: 좀비팡 MVP의 보스 거동 강화 디자인 spec. 도메인 모델 + 테스트 전략 + 데이터 흐름 + 정책 매트릭스 포함.
  > 특별 점검:
  > 1. 섹션 간 내적 일관성 — D5(γ 격리) ↔ 7.1(정책 매트릭스) ↔ R2(위험) ↔ 5.3(escape-counter skip) 정합성
  > 2. Phase 상수 테이블 (§4) ↔ 코드 시그니처 (§6.4 PHASE_CONFIGS) ↔ 테스트 매트릭스 (§9.1) 수치 일치
  > 3. 미니언 합계 (Ch1=0, Ch2=2, Ch3=4, Ch4=6, Ch5=8) 일관성
  > 4. 모호한 표현 (두 가지 해석 가능): 격노 트리거 HP% 부동소수점, 미니언 스폰 시점, 잔여 미니언 폭사 방식 — self-review에서 fix되었는지 확인
  > 5. 측정 가능한 완료조건이 모두 명시되어 있는가 (검증 게이트 §10)
  > 6. 금지사항 §11이 안티패턴과 1:1 매칭되는가
  > 발견사항을 [INCONSISTENCY | AMBIGUITY | MISSING | OK] 라벨링.

### 관점 4: TDD/테스트 전략 (TESTING-ARCH)

- **Agent**: `general-purpose`
- **프롬프트**:
  > `/testing-architecture` 스킬을 사용하여 spec의 테스트 전략 적절성을 검증하라.
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md` §9 (테스트 전략)
  > 좀비팡 정책 (Bible §7, ADR-0004, CLAUDE.md §6):
  > - 3 카테고리 룰: [Happy]/[Boundary]/[Error] 각 ≥ 1개 필수
  > - Domain 100% / Mutation ≥80%
  > - Application ≥95% / Mutation ≥70%
  > - fast-check property-based (seed=42, numRuns=1000)
  > - Stryker mutation
  > 검증 항목:
  > 1. 테스트 매트릭스 (§9.1) 각 파일에 3카테고리가 모두 라벨링되어 있는가
  > 2. [Error] 부재 사유 명시가 적절한가 (순수 함수, TS exhaustive, lookup table, Port 무관)
  > 3. Property invariant 5개 (P1~P5)가 falsification 가능한가 (= 코드 버그를 잡을 수 있는가)
  > 4. P3 (단조 증가) — Ch1→Ch2 missing? `totalMinions(2) ≥ totalMinions(1)`이지만 chapter 1→2 변화도 포함해야 함
  > 5. Mutation 임계 80%가 boss 모듈에 현실적인가 (작은 함수 + sin 공식의 mutation killing 가능성)
  > 6. 누락된 invariant 후보: 격노 단계의 단조성 (HP ↓ → rage ↑), 동일 chapter에서 격노 적용 후 R/ω 결정론
  > 7. E2E 시나리오 3개 (E1/E2/E3)가 핵심 시나리오를 커버하는가 (Ch5 격노 2단계 누락?)
  > 발견사항을 [GAP | WEAK | OK] 라벨링.

### 관점 5: 외부 사실 검증 (RESEARCHER)

- **Agent**: `general-purpose`
- **프롬프트**:
  > 좀비팡 spec의 Bible/ADR/코드 인용 정확성을 라인 단위로 검증하라.
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > 인용 매핑 (검증 필요):
  > 1. Bible §3 "Telegraph 0~1s / Engagement 1~4s / Climax 4~5s" — `docs/game-design/bible.md` 실제 내용과 일치하는지
  > 2. Bible §5 "24p 파편 (USB + 종이 + 사원증), 600ms freeze, L1-L4 SFX" — 실제 정확한가
  > 3. Bible §7 Ethics 안티패턴 10개 — 본 spec이 모두 회피하는가
  > 4. CLAUDE.md §4 Hexagonal 4계층 + DIP — 본 spec이 위반하지 않는가
  > 5. ADR-0004 TDD 3카테고리 + fast-check + Stryker — 본 spec §9가 정책과 일치하는가
  > 6. ADR-0006 게임 디자인 원칙 — 본 spec과 충돌하는 결정 있는가
  > 7. `src/adapters/phaser/scenes/game-scene.ts:183-252` — 현재 spawnBoss 코드가 spec 흐름과 통합 가능한가
  > 8. `src/domain/powerup/boss.ts:1-33` — 기존 CEO HP 곡선이 spec의 격노 단계와 통합 가능한가
  > 9. `src/adapters/phaser/objects/boss-hud.ts` — Bible §3 색상 변화와 격노 단계 매칭 가능한가
  > 10. `src/domain/run/escape-counter*.ts` — 실제 파일명과 spec의 가정 (D5 γ skip 메서드) 일치 가능성
  > 각 인용에 대해 [정확 | 불일치 | 부재] 판정. 파일:라인 근거 포함.

### 관점 6: 단순성 (SIMPLIFIER)

- **Agent**: `compound-engineering:ce-code-simplicity-reviewer`
- **프롬프트**:
  > 좀비팡 CEO 보스 거동 spec의 단순성을 검토하라 (YAGNI 관점).
  > 대상: `docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`
  > 검증 항목:
  > 1. 신규 도메인 모듈 4개 (boss-movement, boss-rage-level, minion-composition, boss-phase-config) — 합쳐도 되는 모듈 있는가
  >    - 특히 `boss-phase-config` (상수 lookup만) 가 `boss-movement` 또는 `boss-rage-level` 안에 inline 가능한가
  > 2. application use case 2개 (`spawn-boss-wave`, `tick-boss-position`) — `tick-boss-position`이 한 줄짜리 wrapper인가, 그러면 use case 불필요한가
  > 3. `applyRageMultipliers`가 별도 함수 필요한가, `computeRageLevel` 안에서 바로 PhaseConfig 반환하면 더 단순한가
  > 4. `totalMinions(chapter)` helper가 정말 필요한가 (테스트에서만 1회 사용?)
  > 5. `escapeCounter.skip()` API 추가가 정말 필요한가 — 대신 `isBossWave()` 체크 if문 한 줄로 가능한가
  > 6. spec 자체의 길이 — 460줄이 적절한가, 줄일 수 있는 섹션 있는가
  > 발견사항을 [OVER-ENGINEERED | OK | NEEDS-MORE-DETAIL] 라벨링.

### convergence-evaluator (공통)

본 시스템에 demiurge `convergence-evaluator` agent가 없으므로 **main agent가 페르소나로 대행**한다.

판정 규칙 (내장):
- 각 발견사항에 대해 라벨 부여: `CONFIRMED | DISPUTED | CONTESTED | RESOLVED | NEW`
- 안정 카운터: 이전 iteration과 동일 라벨이면 +1, 다르면 0으로 재설정
- iteration마다 `report.md` 갱신 (발견사항 목록 + 안정 카운터 + COMPLETE/CONTINUE 판정)
- CONTESTED 항목 있으면 다음 iteration에 제3 관점 추가 투입

## 수렴/완료 기준

- [ ] Tier 2: 모든 발견사항의 안정 카운터 >= 2 (판정 라벨 2회 연속 동일)
- [ ] 새로운 발견 0건
- [ ] CONTESTED 항목 0건
- [ ] V1 (Bible 인용)에서 "불일치" 0건 — 또는 spec에 fix 반영
- [ ] V2 (아키텍처)에서 [BUG] 0건
- [ ] V4 (TDD)에서 [GAP] 0건 — 또는 spec에 invariant/시나리오 추가

## 하지 말 것

- 검증 대상 spec 문서를 수정하지 마라 (Phase 6에서 `/organize` 호출로만 반영)
- 추측으로 수렴했다고 판단하지 마 — 실제 비교 근거 (파일:라인, Bible 인용) 필요
- subagent를 background로 실행하지 마라
- 수렴하지 않았는데 COMPLETE를 출력하지 마라
- CONTRARIAN의 반론을 무조건 채택하지 마라 — RESEARCHER/ARCHITECT가 반박 가능한지 확인
