# ADR-0009: 카드 등급 드랍 확률 노출 여부

- **Status**: Open
- **Date**: 2026-05-17
- **Originated**: Phase A-2 Meta+Juice 토론에서 dark-pattern-critic이 "확률 공시 의무"와 "가챠법 회피"의 정합성 질문 제기
- **Decision Drivers Conflict**: ux-craft(#3) + meta-progression-strategist(#4) ↔ dark-pattern-critic(#7) ↔ regulatory(법적 의무)
- **재논의 시점**: Phase B Master Plan + 출시 직전 법무 검토

## Context

좀비팡 Meta 카드(15장)는 챕터 클리어 보상 또는 코인 임계 도달 시 unlock된다. Phase A-2에서 "랜덤 드랍 비중을 최소화" 합의가 있었으나, 일부 카드(Special 5장 중 2장)는 "특정 조건 + 확률" 형태로 unlock될 가능성이 남아 있다.

대부분의 국가/지역에서 "확률형 아이템"은 확률 공시 의무가 있다(한국 게임산업법 개정, 중국 공포공시, EU 소비자보호 가이드라인). 그러나:

- 너무 자세한 확률 공시는 사용자에게 "가챠다"라는 인식을 심어 톤(B급 코믹 호러)과 충돌
- 비공시는 법적 리스크 + 신뢰 손상
- 적절한 노출 위치/방식이 미정

## Decision Drivers

1. 법적 준수 (지역별 확률공시 의무)
2. 사용자 신뢰
3. "가챠 아님" 톤 보존 (좀비팡 정체성)
4. UI 미니멀리즘
5. 글로벌 출시 시 다국가 대응

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. 완전 공시 (전 카드)** | Setting > Probability 메뉴에서 모든 카드 unlock 조건/확률 명시 | #7 | (없음) |
| **B. 확률 요소 제거** | 모든 unlock을 결정론적 조건으로만 (랜덤 비중 0%) | #6, #7 | #4 (다양성 축소) |
| **C. 최소 공시** | 확률이 적용되는 항목만 별도 페이지에 공시 | #4, #3 | #7 (부분 공시는 회피로 비춰질 수 있음) |
| **D. In-game pop-up** | 카드 unlock 시 "이 카드는 X% 확률로 드랍됩니다" 표시 | (보조 옵션) | #3 (UI 노이즈) |

## Status: Open

권장 *B + C 하이브리드*: 가능한 한 결정론적 조건으로 만들고, 불가피하게 확률이 들어가는 항목은 최소 공시.

Phase B Master Plan + 법무 검토 단계에서 확정:

- 한국 게임산업법(2024 개정) 적용 여부 (PWA가 "게임"으로 분류되는지)
- 출시 대상국 별 확률공시 의무 매트릭스 작성
- 결정론적 unlock으로 100% 전환 가능한지 검증 (디자인 측면)
- 공시 위치: Setting > About > Probability Disclosure (눈에 띄지만 강요 안 됨)

## Tentative Consequences

- **B 채택 시**: "가챠 아님"이 디자인 + 법적 양면에서 명확. dark-pattern-critic, regulatory 모두 만족. 그러나 디자인적으로 일부 다양성 손실.
- **A 채택 시**: 가장 안전. 그러나 톤 손상 + UI 노이즈.
- **C 단독 시**: 부분 공시가 오히려 "감추는 부분이 있다"는 인상을 줄 수 있음.
- **D 채택 시**: in-game 흐름을 깨뜨리며 모먼트 손상.

## 후속 조치

- Phase B에서 unlock 시스템 전체를 결정론으로 만들 수 있는지 디자인 재검토
- 법무 검토 체크리스트 작성 (출시 대상국별)
