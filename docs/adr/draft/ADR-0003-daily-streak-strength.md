# ADR-0003: Daily Streak 페널티 강도

- **Status**: Open
- **Date**: 2026-05-16
- **Originated**: Phase A-0 컨셉 토론 잔여 불일치
- **Decision Drivers Conflict**: compulsion-architect(#1) + meta-progression-strategist(#4) ↔ dark-pattern-critic(#7)
- **재논의 시점**: Phase A-2 Meta 토론

## Context

"7일 출근 도장 후 자동 휴식 강제"가 합의안에 포함됐지만, **streak이 끊겼을 때의 페널티 강도**가 미합의:

- 끊겨도 처음부터 (Day 1 리셋)?
- Grace period 1일 (안 들어와도 streak 유지)?
- Streak 전면 폐지?

## Decision Drivers

1. 자발성 정의 (#7): "끊길까봐 켜는" 행동은 dark pattern
2. Retention (#1): streak 페널티가 없으면 retention 동기 약화
3. 메타 진행 정합성 (#4): streak 보너스 코인은 메타 카드 unlock 경로와 연결됨
4. 사용자 자율성: 휴가/여행 등 통제 불가능한 결손 상황

## Options Considered

| Option | 페널티 강도 | 부속 메커니즘 |
|---|---|---|
| **A. 페널티 0 (전면 폐지)** | 없음 | streak 자체 없음. coin 보너스 없음 |
| **B. 페널티 0 (보너스만)** | 없음 | "오늘 출근하면 +20% coin" 같은 *상승 보너스만*, 끊겨도 패널티 없음 |
| **C. Grace 1일** | 약함 | 1일 결손 허용, 2일째 리셋 |
| **D. Hard Reset** | 강함 | 결손 즉시 Day 1로 |

## Status: Open

Phase A-2 Meta 토론에서 결정. 다음 추가 검토:
- 사용자 자기 진단 ("내일 streak 끊길까 걱정되는가?")
- WHO 행동중독 분류와의 거리

## Tentative Default

협상안 미합의 시 **Option B (보너스만)** 채택 — streak이 *상실 회피* 동기가 아니라 *접근 동기*가 되도록 설계 반전.
