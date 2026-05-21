# ADR-CL-0001: "정시 퇴근" 버튼 최적 위치

- **Status**: Open
- **Date**: 2026-05-17
- **Originated**: Phase A-3 PWA+UX 토론에서 ux-craft와 narrative-architect 사이 위치 합의 미결
- **Decision Drivers Conflict**: ux-craft(#3) ↔ narrative-architect(#5) ↔ dark-pattern-critic(#7)
- **재논의 시점**: 출시 30일 데이터 후

## Context

좀비팡의 차별 정체성인 "정시 퇴근" 버튼(=세션 자발 종료)은 어디에 어떻게 배치할지가 매우 민감하다.

- 너무 깊으면 사용 불가능 → 정체성 형해화
- 너무 노출되면 "퇴근하라"는 권유가 너무 강해 게임 몰입 방해
- 위치별 클릭률, 세션 길이, retention의 trade-off가 미정

## Decision Drivers

1. 정체성 보존 ("정시 퇴근"이 의미 있어야 함)
2. 발견성
3. 비강요 (선택권만 제공, 권유는 자제)
4. 자율 종료가 사용자 신뢰의 핵심
5. UI 미니멀리즘

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. 챕터 끝 + 메뉴 동등** | 챕터 클리어 후 next/clock-out 동등 버튼 + 메뉴 항상 노출 | #3, #5 | (없음) |
| **B. 메뉴 깊숙이** | Setting > Game > Clock-out 식 | (없음) | #5 (정체성 손상) |
| **C. 상단 상시 노출** | 게임 화면 상단에 "퇴근" 버튼 상시 표시 | (없음) | #3 (권유 과함), #7 |
| **D. 챕터 끝에만 노출** | 챕터 클리어 후에만 선택지 | #3 부분 | (메뉴 부재 → 중간 종료 어려움) |

## Status: Open

권장 *A (챕터 끝 + 메뉴 동등)*. MVP는 이 안으로 출시하되, 출시 30일 후 다음 KPI 기반 재검토:

- 자발 clock-out 비율 (전체 세션 중)
- clock-out 후 다음 세션까지 평균 간격
- 메뉴 경로 vs 챕터 끝 경로 사용 비율
- "퇴근 후" 사용자 만족도(예: review 텍스트 감성 분석)

KPI가 정체성과 맞지 않으면(예: clock-out 비율 <5%) 위치 강화 옵션 검토.

## Tentative Consequences

- **A 채택 시**: 발견성 + 비강요의 균형. 메뉴 경로는 항상 열려 있어 자율성 보장.
- **B 채택 시**: 정체성이 게임 안에 없음 → 사실상 일반 종료 버튼과 같음. narrative-architect 강한 반대.
- **C 채택 시**: 권유 과함 → "광고처럼 느껴진다" 위험.
- **D 채택 시**: 챕터 중간 종료 불편 → 사용자 자율성 침해.

## 후속 조치

- 출시 30일 KPI 검토 회의 일정 Phase B Master Plan에 명시
- clock-out 후 메시지("오늘 X마리, 코인 Y개 획득. 내일 봐요!") 톤 정합 검토
