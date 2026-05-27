# ADR-0014: 사옥 진행도 시각화 결정론 + 슬로우모션 보스-only 근사

- **Status**: Proposed
- **Date**: 2026-05-27
- **관련**: `docs/superpowers/specs/2026-05-27-narrative-juice-design.md`, draft `ADR-0002-variable-reward-scope.md`

## Context

서사 연출 스펙에서 두 결정이 기존 명세와 표면상 충돌한다:

1. **사옥 층 점등** — Bible §3은 "사옥 인테리어 재건 순서 = Layer 2(가변)"로 명시한다.
2. **슬로우모션** — Bible §3 CEO 보스 Climax는 "슬로우모션 0.3배속"으로 명시한다.

결정론 clock(`game.loop.now`, wall-clock) 아키텍처와 자산 0 / 도메인 순수성 제약 하에서 이 둘을 어떻게 구현할지 합의가 필요하다.

## Decision

1. **층 점등 = 결정론**: 클리어 챕터 수 → 점등 층(`litFloorsFor = chaptersCleared × 10`, 0~50 클램프, 누적). 이는 *진행도 시각화*이며, draft `ADR-0002-variable-reward-scope`의 *인테리어 재건 보상(가구/비품 회복 순서)* 가변과 **별개의 관심사**다. 진행도 표시는 보상 메커니즘이 아니므로 결정론으로 둔다.

2. **슬로우모션 = 보스-only omega 근사**: 전역 `scene.time.timeScale`은 `scene.time.now` 기반 lifespan/killedAtMs 경로에 부작용을 주고 E2E 타이밍을 흔들 수 있다(결정론 combo decay는 `game.loop.now` 기반이라 무관하나, 전역 토글은 회피가 안전). 따라서 climax(HP ≤ 25%) 진입 시 보스 omega를 **base 기준 ×0.3로 대체**한다(기존 rage 배수를 곱하지 않음 — Ch5 rage2 ×1.6과 중첩 시 ×0.48이 되어 의도·톤이 깨지는 문제 방지). 부족한 "전역 시간지연" 인상은 desaturate 비네트 + 기존 0.6s freeze로 보강한다.

## Consequences

- 진행도 시각화와 가변 보상이 코드/문서에서 명확히 분리된다(혼동 차단).
- "0.3배속"이 전역이 아닌 보스 모션 한정이라 Bible 의도 대비 약하나, 결정론·E2E 안전·도메인 순수성을 확보한다.
- climax는 one-way latch(보스 HP는 감소만)라 경계 깜빡임이 원천 차단된다.

## Alternatives

- **전역 timeScale 슬로우모션**: 결정론 combo decay/lifespan/E2E 폴링에 부작용 → 기각.
- **climax omega를 rage 배수에 곱하기**: Ch5에서 ×0.48이 되어 "격노(빠름)+슬로우(느림)" 톤 충돌 → 기각, base 대체 채택.
- **층 점등 RNG 가변**: 50층 등반 서사(아래→위)와 모순 + 무상태 결정론 대비 복잡 → 기각.

## Note

Accepted `docs/adr/0002-game-engine.md`와 draft `docs/adr/draft/ADR-0002-variable-reward-scope.md`가 번호 **0002 충돌** 상태다. draft를 Accept하기 전 재번호가 필요하다(본 ADR과 별개의 정리 작업).
