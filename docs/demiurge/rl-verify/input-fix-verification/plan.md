# 수렴 검증 플랜 — 좀비팡 Input 시스템 Fix

## 대상
- **작업 설명**: 좀비팡 게임의 Phaser input 시스템에 적용된 fix들의 기술적 타당성 검증
- **모드**: 코드 리뷰 + 가설 검증 (혼합)
- **대상 파일 경로**:
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/scenes/preload-scene.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/scenes/main-menu-scene.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/scenes/hud-scene.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/scenes/game-over-scene.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/scenes/game-scene.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/objects/zombie.ts`
  - `/Users/cjynim/lab/zombie_pang/src/adapters/phaser/objects/upgrade-card.ts`
  - `/Users/cjynim/lab/zombie_pang/node_modules/phaser/dist/phaser.js` (참조)

## Tier
**Tier 3 (심층 검증)** — 게임 input 시스템 전체에 영향. Phaser source code 외부 사실 확인 필요. 잘못 진단된 root cause는 사용자 보고 증상 미해결로 직결.

## 검증 항목

| # | 항목 | 검증 방법 | 사용 Agent |
|---|------|----------|-----------|
| H1 | Zone `setInteractive({useHandCursor:true})` 가 silent fail인가? | Phaser source code 확인 + 명세 검증 | RESEARCHER |
| H2 | 적용한 fix가 정확한가? | 코드 inspection + 대안 분석 | ARCHITECT |
| H3 | 다른 root cause 가능성 (scene 전이, input.topOnly, dpr × scale 좌표) | 가설 반박 + 잠재 결함 발굴 | CONTRARIAN |
| H4 | Wave deadlock fix `resolvedInWave`가 boss/챕터 전이 시 깨지는가? | 시나리오 trace | CONTRARIAN |
| H5 | 적용한 fix가 더 단순하게 가능한가? | 최소 대안 | SIMPLIFIER |

## 검증 관점 및 Agent 할당

| 관점 | 역할 | 사용 Agent | 필수 여부 |
|------|------|-----------|----------|
| 외부 사실 확인 | RESEARCHER | compound-engineering:ce-framework-docs-researcher | **필수 (Tier 3)** |
| 반박/잠재 결함 | CONTRARIAN | compound-engineering:ce-adversarial-document-reviewer | **필수** |
| 구조적 타당성 | ARCHITECT | compound-engineering:ce-correctness-reviewer | 권장 |
| 단순화 | SIMPLIFIER | compound-engineering:ce-code-simplicity-reviewer | 권장 |
| 종합 판정 | EVALUATOR | convergence-evaluator | **필수** |

## Agent별 상세 프롬프트는 Phase 5 호출 시 inline 제공

## 수렴/완료 기준
- [ ] Tier 3: 모든 발견사항의 안정 카운터 ≥ 3
- [ ] 새로운 발견 0건
- [ ] CONTESTED 항목 0건
- [ ] 합의도 ≥ 0.85

## 하지 말 것
- 검증 대상 파일을 수정하지 마 — 검증만
- 추측으로 수렴했다고 판단하지 마
- 수렴하지 않았는데 COMPLETE 출력 금지
