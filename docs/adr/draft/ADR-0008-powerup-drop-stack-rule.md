# ADR-0008: Power-up Drop Rate 누적 방식 (곱셈 누적)

- **Status**: Resolved
- **Date**: 2026-05-17
- **Resolution Date**: 2026-05-17 (Phase A-1 Core Loop 토론에서 합의)
- **Originated**: Phase A-1 Core Loop 토론
- **Resolution**: 곱셈 누적만 허용 (덧셈 금지). Tier 3 최대 6.5%

## Context

좀비팡의 파워업(자석, 시간 정지, 폭탄 등)은 콤보 Tier에 따라 드랍 확률이 증가한다. 그러나 누적 방식(예: 콤보 Tier 1: +1%, Tier 2: +2.5%, Tier 3: +6.5%)에 대해 두 가지 해석이 가능했다.

- **덧셈 누적**: 기본 드랍률 + Tier 보너스 (예: base 1% + Tier 3 보너스 6.5% = 총 7.5%)
- **곱셈 누적**: 기본 드랍률 × Tier 배수 (예: base 1% × 6.5 = 6.5%)

덧셈 방식은 카드/이벤트 보너스가 추가될수록 확률이 폭주(>50%)할 위험. 곱셈 방식은 상한이 자연스럽게 통제됨.

## Decision Drivers

1. 확률 상한 제어 (안티 어뷰즈)
2. 디버깅 가능성 (단일 공식)
3. 사용자 멘탈 모델 (간단함)
4. Tuning 자유도
5. Phase A-1 합의값 "Tier 3 최대 6.5%" 보존

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. 곱셈 누적만** | drop_rate = base × tier_multiplier × card_multiplier × event_multiplier | 다수 | (없음) |
| **B. 덧셈 누적** | drop_rate = base + tier_bonus + card_bonus + event_bonus | (없음) | #1, #4 |
| **C. 혼합 (Tier는 곱셈, 카드는 덧셈)** | 각 차원이 다른 결합 | (복잡) | 다수 |

## Decision

**Option A 채택: 곱셈 누적만 허용.**

- 기본 드랍률(base): 1.0% (모든 파워업 공통)
- Tier multiplier:
  - Tier 1 (콤보 3~5): ×1.0 → 1.0%
  - Tier 2 (콤보 6~9): ×2.5 → 2.5%
  - Tier 3 (콤보 10+): ×6.5 → 6.5%
- 카드/이벤트 multiplier 도입 시에도 곱셈으로만 결합
- **상한(cap)**: 어떤 경우에도 최종 드랍률 ≤ 15% (안티 어뷰즈)

## Tentative Consequences

- **Pros**:
  - 확률 폭주 회피 (Tier × 카드 × 이벤트 = 자연 상한)
  - 단일 공식 → 디버깅 쉬움
  - "Tier 3 최대 6.5%" 합의값을 보장 (카드 없을 때)
- **Cons**:
  - 카드 효과의 체감 강도가 덧셈보다 약함 (예: 카드 ×1.2 = 6.5% → 7.8%)
  - 사용자에게는 차이를 설명할 때 "콤보가 높을수록 카드 효과도 커집니다" 식으로 안내 필요
- **고려사항**:
  - 곱셈 누적의 floor 처리 (소수점 반올림 정책) 명시
  - 디버그 모드에서 최종 drop_rate를 console에 노출

## 후속 조치

- Phase C Core Loop 구현 시 단위 테스트 케이스 작성:
  - `[Happy]` Tier 3 + 카드 ×1.2 = 7.8%
  - `[Boundary]` Tier 0(콤보 <3) = 0%, 카드 effect = 0
  - `[Error]` multiplier에 음수/NaN 들어왔을 때 base만 반환
