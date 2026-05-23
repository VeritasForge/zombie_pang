# ADR-0007: 보스 거동 및 페이즈 모델

## Status

Proposed (2026-05-23) — 본 spec implement 첫 PR에서 Accepted 전환.

## Context

Bible §3은 CEO 보스에 대해 "Telegraph 1s / Engagement 3s / Climax 1s = 5초 연출"만 정의하고, 이동 패턴·미니언·격노 단계는 Open 상태였다. 사용자 피드백("CEO가 가만히 있어 너무 쉽다") 해소를 위해 보스 거동 강화 spec(`docs/superpowers/specs/2026-05-23-ceo-boss-behavior-design.md`)을 작성하면서 다음 4개 결정이 새로 도입되었다:

1. 새 도메인 디렉토리 `src/domain/boss/` 추가 (기존 `domain/powerup/boss.ts`와 책임 분리)
2. Lissajous 1:2 결정론 8자 궤도 도입 (`Math.sin` 순수 함수, IRandom 의존 없음)
3. D5 γ 격리 정책: 보스 wave 동안 미니언 도주는 fled 카운트 차단 (Bible §7 #10 carrot/stick 회피)
4. 보스 페이즈 모델 확장: Bible §3 "5초 연출"을 *연출 구간*으로 재해석, 실제 사용자 플레이 시간은 60초 envelope 안에서 동적 결정

CLAUDE.md §8 Rule #9 ("새 외부 의존성 추가 또는 아키텍처 변경 시 ADR 작성 필수")에 따라 본 ADR을 발행한다.

## Decision

(implement 첫 PR에서 채움)

## Consequences

(implement 첫 PR에서 채움)

## Alternatives

- 회피 대시 (탭 반응) — 거부. Ethics #10 carrot/stick + 결정론 위반.
- 랜덤 텔레포트 단독 — 거부. Ethics #4 슬롯머신화.
- `domain/run/escape-counter.ts` 도메인 추출 — 거부. 현 시점 over-engineering.
- Phase별 패턴 변신 — 거부. MVP 학습 부담.
