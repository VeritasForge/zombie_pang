# ADR-0001: 광고 통합 여부 (Ads Integration)

- **Status**: Open
- **Date**: 2026-05-16
- **Originated**: Phase A-0 컨셉 토론 잔여 불일치
- **Decision Drivers Conflict**: compulsion-architect(#1) + meta-progression-strategist(#4) ↔ dark-pattern-critic(#7)
- **재논의 시점**: Phase B Master Plan

## Context

좀비팡 MVP에서 광고(전면 광고 / 리워드 비디오 / 배너) 통합을 할지 여부에 대해 페르소나 간 합의가 이뤄지지 않았다.

- #1 compulsion-architect, #4 meta-progression-strategist: F2P 모바일 게임의 표준 수익 모델로 리워드 비디오는 유저 자발성을 유지하면서도 retention/LTV를 끌어올린다고 주장.
- #7 dark-pattern-critic: 광고는 dark pattern의 진입점이며, "리워드 비디오" 자체가 "광고 보지 않으면 손해" 프레임을 강제한다고 비판. F2P 안티패턴 항목으로 광고 0개 요구.

## Decision Drivers

1. MVP 단계 게임 출시 (수익보다 검증 우선)
2. 사용자 경험 일관성 (B급 코믹 호러 톤 + 광고 = 위화감)
3. PWA 환경에서 광고 SDK 통합 복잡도
4. 윤리 가드 ("정시 퇴근" 메시지와 광고 노출의 충돌)
5. 향후 라이브 BM 확장 가능성

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. 광고 전면 제거** | MVP는 광고 0개, 일회성 풀언락 모델 | #7 | #1, #4 |
| **B. 리워드 비디오만** | 능동 선택형(자석 파워업 1개 = 광고 1회 시청)만 채택 | #1, #4 | #7 |
| **C. 전면+리워드 혼합** | 라운드 사이 전면 광고 + 리워드 비디오 | (없음) | #2, #5, #6, #7 |
| **D. 모든 광고 + 가챠** | 풀 F2P, 가챠/시즌패스/광고 모두 | #1 | 다수 |

## Status: Open

Phase B Master Plan 작성 시 다음 추가 정보를 수집한 뒤 재결정:
- PWA에서 사용 가능한 광고 SDK 옵션
- "정시 퇴근" 메시지와 광고 노출의 톤 충돌 시뮬레이션
- MVP 검증 KPI (광고 없이 retention 측정 가능한지)

## Tentative Consequences

- **A 채택 시**: MVP는 가볍게 출시, 데이터 측정 후 BM 결정. game-feel-juicer 톤 보존.
- **B 채택 시**: 광고가 보상 회로의 일부가 됨. 자발성 정의를 엄격히 적용해 "선택 안 하면 손해"를 회피해야 함.
- **C/D 채택 시**: dark-pattern-critic의 명시적 반대 입장 ADR로 영구 기록.
