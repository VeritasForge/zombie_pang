# ADR-0011: Install Prompt Dismiss 3회 후 재활성화 경로

- **Status**: Open
- **Date**: 2026-05-17
- **Originated**: Phase A-3 PWA+UX 토론에서 pwa-architect가 "install prompt는 사용자 거부 3회 후 비활성화" 합의. 그러나 추후 사용자가 마음을 바꿨을 때 재활성화 경로가 미정.
- **Decision Drivers Conflict**: pwa-architect(#PWA) ↔ ux-craft(#3) ↔ dark-pattern-critic(#7)
- **재논의 시점**: Phase B Master Plan (Setting 메뉴 디자인 단계)

## Context

PWA의 `beforeinstallprompt` 이벤트는 사용자가 dismiss 시 일정 기간 다시 노출되지 않는다. Phase A-3 합의에서 "3회 dismiss 후 영구 비활성화"가 결정됐다. 그러나:

- 사용자가 처음엔 거부했지만 게임이 마음에 들어 나중에 설치하고 싶을 수 있다
- 자동 재노출은 다크 패턴 (사용자가 명확히 거부했는데 다시 표시)
- 그렇다고 영영 봉인하면 디자인 의도와 충돌

## Decision Drivers

1. 사용자 자율성 (dismiss 의사 존중)
2. 다크 패턴 회피 (자동 재노출 금지)
3. 발견성 (재활성화 경로가 너무 깊으면 사실상 봉인)
4. UI 미니멀리즘 (Setting 메뉴 항목 증가 부담)
5. PWA API 제약 (브라우저별 prompt 재호출 정책 차이)

## Options Considered

| Option | 설명 | 찬성 | 반대 |
|---|---|---|---|
| **A. Setting > Install App 옵션** | Setting 메뉴에 "앱으로 설치" 상시 항목 추가, 사용자 능동 호출 | #3, #7 | (없음) |
| **B. 30일 후 자동 재노출** | 3회 dismiss + 30일 경과 시 1회 재노출 허용 | #PWA | #7 (자동 재노출 = 다크) |
| **C. 영구 비활성화** | 한 번 결정하면 끝 | (최소 다크) | #4 (사용자 후회 권리 박탈) |
| **D. 챕터 클리어 마일스톤 시 1회 권유** | "10챕터 클리어 축하 → 설치하시겠어요?" | (절충안) | #7 (조건부 다크) |

## Status: Open

권장 *A (Setting > Install App 옵션)*. Phase B Master Plan 시 다음 확정:

- Setting 메뉴 위치: 상단 햄버거 메뉴 > Setting > 앱 옵션 > "앱으로 설치하기"
- iOS Safari의 "홈 화면에 추가" 가이드 별도 노출 (PWA prompt API 미지원)
- 이미 설치된 사용자는 메뉴 항목 자동 숨김 (`display-mode: standalone` 감지)
- 텔레메트리: install 전환율 추적 (3회 dismiss 후 Setting 통해 설치한 비율)

## Tentative Consequences

- **A 채택 시**: 사용자 자율성 최대 + 다크 패턴 회피. Setting 메뉴 1항목 추가는 미니멀리즘 부담이지만 수용 가능.
- **B 채택 시**: dismiss 의사를 시간으로 무효화 → dark-pattern-critic 명시적 반대. 회피.
- **C 채택 시**: 사용자가 후회해도 회복 불가. 발견성 0.
- **D 채택 시**: 마일스톤과 다른 의도가 결합되어 사용자가 혼란. 조건부 다크 패턴.

## 후속 조치

- Setting 메뉴 와이어프레임 작성 시 install 항목 우선순위 명시
- iOS Safari 사용자 대상 "홈 화면 추가" 단계별 가이드 일러스트 디자인
