# ADR-0002: 가변 비율 보상 Layer 2 적용 범위

- **Status**: Open
- **Date**: 2026-05-16
- **Originated**: Phase A-0 컨셉 토론 잔여 불일치
- **Decision Drivers Conflict**: compulsion-architect(#1) + meta-progression-strategist(#4) ↔ difficulty-balancer(#3) + dark-pattern-critic(#7)
- **재논의 시점**: Phase A-2 Meta 토론

## Context

Round 2에서 #3의 *결정론 Layer 1 / 가변 Layer 2 분리* 안이 채택됐다 (좀비 처치 결과는 결정론, 사옥 재건 보상은 가변 비율). 그러나 **Layer 2의 가변 적용 범위**가 어디까지인지 미합의:

- 사옥 인테리어 재건 (정수기 / 복합기 / 회의실 등 보상)만 가변?
- 영구 업그레이드 카드 가챠도 가변?
- 카드 시너지 콤보 추첨도 가변?
- 매 처치 1~3% 골드 폭증(×5) 트리거도 가변?

## Decision Drivers

1. Flow zone 보존 (#3): 가변 영역이 너무 넓으면 mastery 신호가 파괴됨
2. Compulsion engine (#1): 가변이 적으면 retention engine이 약해짐
3. 의사결정 깊이 (#4): 카드 가챠 가변은 의사결정의 즐거움을 제공
4. 슬롯머신화 위험 (#7): 가변 보상의 누적은 도박 메커니즘과 신경학적으로 동일

## Options Considered

| Option | Layer 2 가변 범위 |
|---|---|
| **A. 최소 (인테리어만)** | 사옥 재건 보상만 가변. 카드는 결정론적 풀에서 뽑음 |
| **B. 중간 (인테리어 + 골드 폭증)** | 인테리어 + 1~3% 골드 폭증(×5) 가변. 카드는 결정론 |
| **C. 확장 (인테리어 + 골드 + 카드 추첨)** | 위 + 라운드 종료 카드 3장 추첨 풀 가변 |
| **D. 최대 (모두 가변)** | 위 + 시너지 콤보·power-up 드랍률까지 가변 |

## Status: Open

Phase A-2 Meta 토론에서 다음 시뮬레이션 후 결정:
- 각 옵션의 Wave 10 도달 시간 분산 (flow 영향)
- 30~60초 라운드 안에서 가변 이벤트가 몇 회 트리거되는지
- 도박 의존성 자가 진단 척도 (PGSI 모방) 시뮬레이션

## Tentative Default

협상안 미합의 시 **Option B (중간)** 채택 — 가변의 75%는 게임 외부(사옥 메타), 25%는 게임 내부(골드 폭증).
