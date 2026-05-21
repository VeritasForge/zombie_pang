# ADR-0005: Meta 카드 Unlock 임계 노출 방식

- **Status**: Open
- **Date**: 2026-05-17
- **Originated**: Phase A-2 Meta+Juice 토론 잔여 디테일
- **Decision Drivers Conflict**: ux-craft(#3) + meta-progression-strategist(#4) ↔ dark-pattern-critic(#7)
- **재논의 시점**: Phase B Master Plan (UI 와이어프레임 확정 단계)

## Context

좀비팡 Meta 카드 시스템(15장)은 누적 좀비 처치 수, 누적 콤보, 누적 코인 등 다양한 임계값을 기준으로 unlock된다. 사용자에게 "다음 카드까지 얼마나 남았는지"를 어떻게 노출할 것인지가 미해결이다.

- 항상 노출 시: 진행도가 명확하지만 "임계 강박" → 강제 플레이 압박이 발생할 위험.
- 비노출 시: 우연한 발견의 기쁨은 보존되지만 사용자가 "왜 안 풀리지?" 혼란을 느낄 수 있음.
- long-press(또는 카드 슬롯 길게 누르기) 노출 시: 능동적으로 정보를 요청한 사용자만 받음 → FOMO(Fear Of Missing Out) 회피.

## Decision Drivers

1. FOMO 최소화 (Phase A-2 합의: "임계 박힌 다음 카드까지 X마리" 표시 금지)
2. 정보 접근성 (사용자가 원할 때는 확인 가능)
3. UI 미니멀리즘 (텍스트 0줄 원칙과 정합)
4. 신뢰성 (랜덤 시스템과 달리 임계는 결정론적 → 숨길 명분 없음)
5. 첫 플레이 학습 곡선

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. 항상 노출** | 카드 슬롯에 6px 진행 바 상시 표시 | #3 부분 | #7 |
| **B. Long-press 노출** | 카드 슬롯 길게 누르면 임계 정보 팝업 | #3, #4 | (없음) |
| **C. 완전 비노출** | 임계 정보 어디서도 노출 안 함, 우연성 보존 | #6 game-feel-juicer | #3, #4 |
| **D. 첫 unlock 시 1회 안내** | "다음은 더 깊은 곳에 숨겨져 있어요" 정도의 1회 toast | (보조 옵션) | - |

## Status: Open

권장 *B (Long-press 노출)*. 그러나 Phase B UI 와이어프레임 작성 시 다음 검증 후 확정:

- long-press의 발견성(discoverability) 검증 — 어떻게 사용자에게 "길게 누르면 정보가 나옵니다"를 알릴 것인가? (D 옵션 1회 toast 결합 가능성)
- 모바일 PWA에서 long-press 제스처가 브라우저 기본 동작(컨텍스트 메뉴)과 충돌하지 않는지
- 진행 바의 시각적 무게(6px)가 카드 일러스트 대비 너무 가볍지 않은지

## Tentative Consequences

- **B 채택 시**: 임계는 사용자가 능동적으로 요청할 때만 표시됨. FOMO 회피 + 정보 접근성 동시 충족. dark-pattern-critic 만족.
- **A 채택 시**: 진행도가 모든 슬롯에 상시 노출 → "임계 강박" 위험. Phase A-2 합의("X마리 표시 금지")와 충돌.
- **C 채택 시**: 사용자가 시스템을 이해하기 어려워 학습 곡선 가팔라짐. 무력감 유발 가능.
- **D 단독 채택 시**: 첫 안내 후 잊혀짐. 재학습 경로 부재.
