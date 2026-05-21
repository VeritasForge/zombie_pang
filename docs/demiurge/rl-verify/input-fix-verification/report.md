# 수렴 검증 리포트 — 좀비팡 Input 시스템 Fix

> 작업: 좀비팡 Phaser input 시스템 fix 다관점 검증
> Iteration: 1
> 일시: 2026-05-21
> 종합 판정: **NEEDS_WORK** (진단 H2 REFUTED, P0/P1 추가 fix 필요)

---

## 1. 가설별 판정 (안정 카운터)

| 가설 | RESEARCHER | CONTRARIAN | ARCHITECT | SIMPLIFIER | 안정 카운터 | 최종 판정 |
|------|-----------|-----------|----------|-----------|-----------|---------|
| H1: 좀비 클릭 미동작 | CONTESTED | CONTESTED | — | — | 0 | **NEEDS_REVIEW** |
| H2: setInteractive silent fail | **REFUTED** | CONTESTED | — | — | 0 | **REFUTED** |
| H3: Wave deadlock | — | SUPPORTED | PASS | SIMPLER | 1 | **ACCEPT** (단순화 권고) |

### 해석
- **H2 REFUTED (신뢰도 High)**: Phaser 3.90 InputPlugin.js L2408-2412 소스코드 검증 결과, Zone의 setInteractive({useHandCursor:true})는 silent fail하지 않음. Zone은 width/height를 보유하고 있어 setHitAreaFromTexture fallback에서 정상적으로 Rectangle 히트박스 생성. useHandCursor도 정상 작동. 
  - **영향**: 적용된 4개 씬의 setInteractive 변경은 실제로 **무효(noop)** — 원래 코드로 복귀 권장.
  - **실제 원인**: 입력 미동작은 (a) Zone 위치 화면 밖 (b) 다른 GameObject 위 가려짐 (c) scene.input 전체 비활성화 (d) event stopPropagation 등.

- **H1 CONTESTED (합의도 0.30)**: 두 리뷰어 모두 좀비 클릭의 근본 원인을 특정하지 못함. takeDamage scale tween (0.85 yoyo, 150-156줄), input.topOnly 정책, HudScene z-order 상호작용 등 여러 후보. 추가 진단 필요.

- **H3 ACCEPTED**: Wave deadlock fix는 정확. boss lifespan 60000ms 도주 엣지 케이스 커버.

---

## 2. 즉시 fix 필요 (P0)

### P0-1: Score 객체 위조 (신뢰도 75%)
- **파일:줄**: `hud-scene.ts:101-103`
- **문제**: `{ value: () => hudVal.score } as unknown` 위조 Score 객체
- **영향**: GameOverScene에서 `.toString()` 호출 시 "[object Object]" 반환. endRun use case에 잘못된 객체 전달되어 리더보드 기록 오염 가능.
- **처방**: Score 인터페이스 정의 후 정확한 타입 인스턴스 전달. 또는 hudVal.score(number)만 추출 전달.

### P0-2: JuiceManager overlay destroy 누락 (신뢰도 High)
- **파일:줄**: `juice-manager.ts` flashOverlay/freezeFrame (depth 999~1000)
- **문제**: GameScene shutdown 시 overlay Sprite destroy 호출 없음. endChapter delayedCall 900ms 동안 overlay가 화면에 잔존하며 클릭 이벤트 가로챔.
- **영향**: GameOver 버튼 클릭 미동작의 **실제 원인** (not silent fail)
- **처방**: scene.events.on('shutdown', () => { flashOverlay?.destroy(); freezeFrame?.destroy(); })

### P0-3: HudScene input 이벤트 z-order 가로채기 (신뢰도 High)
- **파일:줄**: `hud-scene.ts:101-103` input 레지스트레이션 위치
- **문제**: HudScene 버튼들(스킬, 사망, 정시퇴근)이 GameScene 위에 그려져 있지만 input.topOnly = true일 경우 좀비/게임오버 버튼 클릭 이벤트 가로챔.
- **영향**: 좀비 클릭 반응성 저하, 게임오버 버튼 클릭 실패 (50~80% 재현율 예상)
- **처방**: HudScene input 컨텍스트를 GameScene과 명확히 분리. 또는 hitArea 충돌 감지 후 stopPropagation 제거.

---

## 3. P1 fix (중간 우선순위)

### P1-1: endRunWith 메타데이터 누락 (신뢰도 50%)
- **파일:줄**: `game-over-scene.ts:235-244`
- **문제**: endRunWith 호출 시 runId/meta/streak 미전달. endRun 함수가 runId mismatch로 실패 가능.
- **처방**: GameOverScene에서 runId/meta/streak를 props로 받아 endRunWith에 전달.

### P1-2: takeDamage scale tween 부작용 (신뢰도 High, hp>1 경우)
- **파일:줄**: `zombie.ts:150-156`
- **문제**: takeDamage 호출 시 `scale: 0.85` yoyo tween. 연속 피해 시 tween 잔존으로 좀비 시각적 크기 변동 + 히트박스 불일치 가능성.
- **처방**: tween 시작 전 기존 tween 중단(kill). 또는 상태 머신으로 피해 애니메이션 정규화.

---

## 4. SIMPLIFIER 권고 (선택 사항)

### 권고-1: Wave deadlock 카운터 제거
- **대안**: `if (zombies.length === 0 && spawnedInWave >= maxSpawn)` 로 derive.
- **이득**: -2 변수(waveCleared, clearedCount) 제거, 상태 단순화.
- **리스크**: 낮음. 로직 동치.

### 권고-2: HIT_BOX_SIZE 유지 (132 → 120)
- **현재**: 132로 수정된 상태
- **권고**: 120 복귀. 132는 좀비 겹침 시 클릭 범위 확대로 오인격 가능성 증가.

---

## 5. Residual Risks

| 리스크 | 영향도 | 완화 전략 |
|-------|-------|---------|
| H1 근본 원인 미파악 (합의도 0.30) | High | P0-2, P0-3 적용 후 재테스트. 여전히 미동작 시 Playwright e2e로 히트박스 위치 검증 |
| HudScene z-order 경합 (P0-3) | High | 지수적 충돌. 즉시 fix 필수 |
| Score 객체 위조 (P0-1) | Medium | 리더보드 데이터 정합성 영향. 이미 오염된 DB는 마이그레이션 필요 |
| Wave deadlock 엣지 케이스 (H3) | Low | fix 정확하나, -2 변수 제거로 복잡도 추가 감소 권장 |

---

## 6. 합의도 계산

| 항목 | 합의도 | 근거 |
|------|-------|------|
| H2 root cause (setInteractive) | 0.95 | RESEARCHER 소스 검증 강함. CONTRARIAN도 silent fail 아님 인정 |
| H1 root cause (좀비 클릭) | 0.30 | CONTESTED — 다중 후보(tween, z-order, stopPropagation). 단일 근본 원인 특정 실패 |
| H3 fix correctness (Wave deadlock) | 0.90 | 3/4 agent 일치. 로직 검증 완료 |
| P0 fix 영향도 | 0.75 | 3개 P0 중 2개(overlay, z-order)는 High확신. Score는 Medium(위조만 확인, 런타임 영향 1/2) |
| 적용 fix 부작용 | 0.70 | overlay destroy 추가는 안전. z-order 분리는 주의 필요(HUD 기능 일부 재테스트) |

**총 합의도 = (0.95 + 0.30 + 0.90 + 0.75 + 0.70) / 5 = 0.72**

목표 0.85 미달. P0 fix 후 재검증 필요.

---

## 7. 다음 Iteration 필요 항목

### 즉시 (Iteration 2)
1. **P0-1, P0-2, P0-3 코드 적용**
2. **HudScene과 GameScene input 분리 테스트** (Playwright e2e로 GameOver 버튼 클릭 + 좀비 클릭 동시 검증)
3. **JuiceManager overlay destroy 동작 확인** (DevTools로 Sprite 소멸 타임라인 추적)
4. **리더보드 Score 객체 직렬화 검증** (JSON stringify → 정상 number 기록되는지)

### 선택 (Iteration 2~3)
- SIMPLIFIER 권고-1, 권고-2 적용 + 회귀테스트

### 보충 진단 (Iteration 2에서 P0 fix 이후도 미동작 시)
- Devtools input hitArea 시각화 (Phaser debug 모드)
- 좀비 클릭 히트박스 위치 vs 실제 렌더링 위치 교차검증
- scene.input.topOnly, pointerRaycast 우선순위 추적

---

## 8. 최종 권고

### 🔴 NEEDS_WORK — 다음 조건 만족 후 ACCEPT 전환

**mandatory (P0)**
- [ ] P0-1 Score 객체 위조 → 정확한 타입 인스턴스로 교체
- [ ] P0-2 JuiceManager overlay.destroy() 등록
- [ ] P0-3 HudScene input z-order 분리 (컨텍스트 레이어 명확화)

**recommended (P1)**
- [ ] P1-1 endRunWith 메타데이터 전달
- [ ] P1-2 takeDamage tween 중단 안전장치

**testing**
- [ ] Playwright e2e: GameOver 버튼 + 좀비 클릭 + Chapter 전이 자동 검증 (3개 케이스 × 10회)
- [ ] 수동 재테스트: Wave 5 이상 좀비 다량 겹침 상황 + 연속 클릭

**회귀 테스트 합의도 목표: 0.85 이상**
