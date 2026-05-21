# 좀비팡 (Off-Clock Pang)

> 당신은 마지막 사원이다. 50층 좀비 사옥에서 야근을 끝내고 옥상까지 올라가 퇴근하라.

**Phaser 3 + TypeScript + Vite + PWA** 기반 모바일 캐주얼 액션 게임. 한 손 30~60초 라운드 × 5챕터(50층)의 B급 코믹 호러.

## 핵심 디자인

- 1세션 = 1챕터 = 10층 = 60초 envelope (CEO 보스 5초 페이즈)
- 좀비 4종 — 신입/과장/팀장/CEO (회사 위계 메타포)
- Combo ×1.5/×2/×3, Critical (머리 tap = 2배)
- Power-up 3종 — 폭탄/빙결/자석
- Meta 카드 15장 (Damage/Crit%/Duration/Coin + Special 3)
- Daily Streak 상승 보너스 +20%/일 (페널티 0)
- 정시 퇴근 graceful exit, 광고/알림 없음
- 오프라인 동작 (PWA)

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

## 빌드 & 테스트

```bash
pnpm build        # 프로덕션 빌드
pnpm test         # 단위 + 커버리지
pnpm test:prop    # property-based (fast-check)
pnpm test:mutation  # mutation (Stryker)
pnpm test:e2e     # Playwright
pnpm typecheck
pnpm lint
```

## 디렉토리 구조

Hexagonal 4계층. 자세한 내용은 [CLAUDE.md](./CLAUDE.md), [docs/architecture/hexagonal-game.md](./docs/architecture/hexagonal-game.md) 참조.

```
src/
├─ domain/         # 순수 게임 규칙 (Score, Combo, Wave, ...)
├─ application/    # Use cases
├─ adapters/       # phaser/, persistence/
├─ infrastructure/ # PWA, RNG, Audio, Haptic, ...
└─ shared/
```

## 라이선스

MIT — [LICENSE](./LICENSE).
