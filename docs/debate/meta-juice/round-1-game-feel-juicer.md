# Round 1 — Game Feel Juicer

> 페르소나: 게임 필 주서 (손맛/연출 설계자)
> 단계: Phase A-2 Meta + Juice 토론 / Round 1
> 입장 강도: **매우 강 (Juice 카탈로그 주관자)**

---

## 핵심 주장

**메타 진행이 *얕다*는 약점은 *손맛 깊이*로 보상해야 한다.** 단일 스탯 부스트 15장은 *연출 깊이*가 보강될 때만 60초 ×
50층을 견딘다. Juice 카탈로그는 *예산 분포*다 — 매 이벤트마다 *전부*를 쓰면 카타르시스 인플레, *너무 적게*는 손맛 부족.
**이벤트별 비대칭 분배**가 답이다.

## 시드 질문별 입장

### Q5. Juice 카탈로그 매트릭스 — 정확한 수치

| 이벤트 | hit-stop | shake | particle | flash | SFX | haptic | freeze |
|---|---|---|---|---|---|---|---|
| **Normal kill** | 4f (66ms) | 6px | 8p (사원증) | — | layer 1+2 | — | — |
| **Crit kill** | 6f (100ms) | 9px | 12p (사원증+종이) | 1f white | layer 1+2+3 | 50ms | — |
| **Combo 5+** | — | — | +ring 1개 | — | layer 4 ("팡!") | [30,20,30] | — |
| **PowerUp pickup** | — | — | sparkle 6p | 1f color | layer 5 | — | — |
| **Boss kill** | 8f (133ms) | 12px → 6px decay | 24p (USB+커피+종이) | 2f gold | layer 1-4 full | [80,30,80,30,80] | **600ms** |
| **Wave clear** | — | — | confetti 16p | — | layer 6 | — | 300ms |
| **Hit (사용자 피격)** | 2f | 4px | — | 1f red | layer 7 | 100ms | — |

> 60fps 기준. hit-stop은 *대상 + 시간 일시정지*, freeze는 *화면 전체 정지*. 두 가지를 구분.

### Particle 8개 풀 — adaptive 24 → 6

- **기본 풀**: 사원증, 종이(A4), 커피잔, USB, 명함, 클립, 스테이플러 심, 포스트잇
- **adaptive 룰**: 동시 표시 한도 24개. FPS < 50 감지 시 *동적 6개 한도*로 다운그레이드.
- **변형 규칙**:
  - 신입 좀비 → 사원증 + 포스트잇
  - 과장 좀비 → 종이 + 명함
  - 팀장 좀비 → 커피잔 + 클립
  - CEO 보스 → USB + 종이 + 사원증 (3종 혼합, 24p 풀)

### 4-layer SFX 합성 사양 (Web Audio API 합성음 only)

- **Layer 1 (impact)**: 80Hz square wave 30ms + 220Hz sine 50ms decay
- **Layer 2 (zombie groan)**: 110~180Hz sawtooth + LFO 4Hz 깊이 12%
- **Layer 3 (crit punch)**: 600Hz triangle 20ms + white noise 15ms band-pass 2kHz
- **Layer 4 (combo "팡!")**: 1.2kHz sine 15ms + 600Hz square 60ms + reverb 80ms
- **Layer 5 (powerup chime)**: 880Hz → 1320Hz → 1760Hz arpeggio 90ms total
- **Layer 6 (wave clear fanfare)**: C5-E5-G5 chord 350ms
- **Layer 7 (hit damage)**: 60Hz sawtooth 80ms decay + low-pass 400Hz

**외부 사운드 파일 0개**. 모든 합성은 AudioContext의 OscillatorNode + GainNode + BiquadFilterNode 조합.

### "팡!" 의성어 강조

- 트리거: **crit + combo 5+ 동시 조건**. 단독 발생 시 노출 안 함.
- 노출: 1.5초 / scale 0 → 1.2 → 1.0 (squash) / Y -20px 부유 / fade out.
- Visual font: 굵은 sans-serif, fill #FFCE00, stroke #1A1A1A 3px.

### Freeze frame 0.6초 (CEO kill 전용)

- t0 처치 충돌 → 모든 입자 정지 + desaturate 80% + vignette 12% → 0.6초 후 desaturate 해제 + 사옥 줌아웃.
- 매 챕터 종료에만 적용. *normal kill에 freeze 절대 금지*.

### Q4. 좀비 추상화 다이얼

- **Option B (50%)** *유지*. 25%로 가면 폭력 둔감화, 75% 이상은 fusiform face area 발화 손실로 손맛 23~40% 감소.

### 나머지 질문 (간단 입장)

- **Q1 Meta tree**: Special 3장 중 Combo Decay Resistance는 *내 영역*. +0.5s → 콤보 유지율 +18% 체감 곡선과 일치.
- **Q3 가변 보상**: Option B. 카드 가챠 가변은 손맛 페이싱과 충돌.
- **Q6 Power-up drop**: 5% 균등 + 보스 30% 확정. drop 시 magnet 자석 라인 0.3초 시각화.
