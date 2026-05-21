# ADR-0006: Freeze Frame과 시스템 알림 충돌 처리

- **Status**: Open
- **Date**: 2026-05-17
- **Originated**: Phase A-2 Meta+Juice "Juice 묘사" 토론에서 game-feel-juicer가 freeze frame 600ms 명세 제시. accessibility-engineer가 시스템 알림 도착 시 충돌 가능성 지적.
- **Decision Drivers Conflict**: game-feel-juicer(#6) ↔ accessibility-engineer(#2)
- **재논의 시점**: Phase C-6 Juice 시스템 구현 단계

## Context

좀비팡의 콤보 ≥10 달성 시 freeze frame(0.6초간 화면 정지 + 카메라 zoom 1.05x)이 발동된다. 이는 게임 피로감(juice)의 핵심 모먼트지만, 정확히 그 600ms 사이에 다음과 같은 시스템 이벤트가 도착할 수 있다.

- iOS/Android push notification (다른 앱에서 도착)
- 시스템 모달(저장 공간 부족, 네트워크 변경 등)
- 인커밍 콜 / 알람
- PWA 환경에서 service worker 업데이트 prompt
- 화면 전환(앱 백그라운드 진입)

이런 이벤트가 freeze frame과 겹치면: (1) freeze가 풀린 후 게임 상태가 깨질 수 있고, (2) "방해"로 인해 모먼트가 망가져 사용자 경험이 손상되며, (3) 보상 회로 검증이 어려워진다.

## Decision Drivers

1. Juice 모먼트 보호 (게임 디자인의 핵심 정체성)
2. 시스템 이벤트 우선순위 (사용자 안전, 접근성)
3. 게임 상태 무결성 (콤보 카운터, 타이머)
4. PWA의 visibility API 활용 가능성
5. 디버깅 가능성 (어떤 이벤트가 발생했는지 로깅)

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. Freeze frame 우선** | 600ms는 어떤 일이 있어도 보존, 시스템 알림은 그 후 처리 | #6 | #2 (안전성) |
| **B. 시스템 이벤트 우선** | document.visibilitychange 발생 시 freeze 즉시 중단, 타이머 일시정지 | #2 | #6 (모먼트 손상) |
| **C. 하이브리드** | freeze frame은 보존하지만 끝난 직후 game pause로 자연 전환 | (절충안) | - |
| **D. requestAnimationFrame 기반 자기 회복** | freeze frame 진행 중 visibility 변경 감지 시 잔여 시간만큼 다음 활성화 시점에 마무리 | (기술 옵션) | - |

## Status: Open

권장 *C (하이브리드)*. Phase C-6 Juice 구현 단계에서 검증:

- PWA `document.visibilitychange`, `freeze`, `resume` 이벤트 동작 확인 (브라우저별 호환성 매트릭스 작성)
- 600ms 중 백그라운드 진입 시 콤보 카운터/타이머 상태 보존 정책
- 시각/청각 접근성 모드(reduce-motion)에서는 freeze frame을 0ms로 축소하여 충돌 자체를 회피
- 안티 어뷰즈: freeze frame을 "타이머 멈춤 트릭"으로 악용 못 하도록 game-clock과 visual-clock을 분리

## Tentative Consequences

- **A 채택 시**: 모먼트 보호 강력. 그러나 시스템 알림이 critical(저장 공간 부족 → 게임 크래시)일 때 위험.
- **B 채택 시**: 안전성 최우선. 그러나 freeze frame이 사실상 거의 매번 깨질 수 있어 디자인 의도 훼손.
- **C 채택 시**: 600ms 동안은 보호 + 끝나면 정상 처리. 사용자가 "어? 한 번 멋있었고 그 다음 알림이 떴네" 정도로 인지. 균형점.
- **D 채택 시**: 가장 우아하지만 구현 복잡도 ↑. Phase C 일정 압박이 있으면 후순위.
