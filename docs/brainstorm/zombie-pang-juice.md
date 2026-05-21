# 좀비팡 Juice 통합 — B급 코믹 호러의 0.4초 손맛 루프

> **Phase A-7 Brainstorm 산출물** — Juice 카탈로그, 톤, "팡!" 사운드
> 입력: docs/debate/meta-juice/consensus.md §5 (합의도 0.82)
> 출처: Phase A-2 game-feel-juicer 주도

---

## 톤 — B급 코믹 호러

좀비팡의 톤은 **B급 코믹 호러**로 확정되었다. 진지 호러도 카와이도 미니멀 추상도 아니다. 진지 호러는 점심시간에 켤 수 없고, 카와이는 야근의 비참함을 희석하며, 미니멀 추상은 손맛이 죽는다.

B급 코믹 호러는 **네온 핑크 / 라임 그린 + 비통한 코미디(melancholic slapstick)**의 교집합이다. *Plants vs Zombies와 Inside 사이 어딘가, Mike Judge의 Office Space에 더 가까운 자리*다. 좀비가 *결재되지 못한 보고서*를 들고 다니고, 처치되면 *사원증과 포스트잇*이 흩날린다 — 무겁지 않지만 의미는 남는다.

이 톤이 사용자에게 의미있는 이유는, **모바일 캐주얼 게임의 default 톤(귀엽거나, 자극적이거나)에서 이탈**하기 때문이다. 좀비팡은 사용자를 *어른으로 대우*한다. 야근의 비참함을 직시하되, 웃을 수 있는 거리에서 다룬다.

---

## 0.4초 손맛 루프 — 6중주 Juice

매 좀비 처치는 **0.4초 안에 6개 cue가 동시 폭발**한다:

```
T+0      | tap 충돌 감지
T+0~66ms | hit-stop 4프레임 (66ms freeze)
         | + screen shake 6px (감쇠 0.85)
         | + flash white 1프레임 (crit 시만)
         | + particle 8p (사원증, 포스트잇)
         | + 4-layer SFX (impact + groan + crit + 콤보)
         | + aftermath 숫자 팝업 "+100"
T+66ms~  | shake 감쇠 → 화면 안정
T+400ms  | 다음 cue 진입 가능
```

각 cue는 *서로 다른 감각 채널*에 가닿는다: 시각(shake, flash, particle, popup), 청각(SFX layer), 촉각(haptic). 6개가 동시 발화하면 *6중주*가 된다 — 콘서트의 화음처럼.

**Adaptive Particle Degradation**이 적용된다: 24 → 12 → 6단계, thermal state·fps 기반 자동 감소. FPS < 50이 3프레임 연속 감지되면 한도가 24개에서 6개로 다운그레이드된다. 사용자는 알아채지 못한다 — 30프레임에 걸쳐 alpha decay가 점진적으로 축소되기 때문이다.

**Screen shake는 thumb zone 침범 시 진폭 6→3px로 자동 감쇠**한다. 한 손 portrait 조작에서 shake가 tap 정확도를 깨면 손맛이 죽는다.

---

## Juice 카탈로그 매트릭스 (60fps 기준)

| 이벤트 | hit-stop | shake | particle | flash | SFX layer | haptic | freeze |
|---|---|---|---|---|---|---|---|
| **Normal kill** | 4f (66ms) | 6px | 8p (사원증) | — | 1+2 | — | — |
| **Crit kill** | 6f (100ms) | 9px | 12p (사원증+종이) | 1f white | 1+2+3 | 50ms | — |
| **Combo 5+** | — | — | +ring 1개 | — | 4 ("팡!") | [30,20,30] (80ms) | — |
| **PowerUp pickup** | — | — | sparkle 6p | 1f color | 5 | — | — |
| **Boss kill** | 8f (133ms) | 12px → 6px decay | 24p (USB+커피+종이) | 2f gold | 1-4 full | [100,40,100] (240ms) | **600ms** |
| **Wave clear** | — | — | confetti 16p | — | 6 | — | 300ms |
| **Hit (사용자 피격)** | 2f | 4px | — | 1f red | 7 | 100ms | — |

Boss kill의 haptic 패턴은 mobile-ux-pragmatist의 200ms 한도 제안을 반영해 `[80,30,80,30,80]` (290ms)에서 `[100,40,100]` (240ms)로 *조정 후 채택*되었다. 240ms는 임계와 가깝지만 boss 카타르시스를 보존하기 위한 절충이다.

Haptic은 **콤보 5+ / 보스 처치 / wave clear 3개 이벤트로만 한정**된다. normal kill에 haptic을 넣으면 야근 시간 진동이 *불쾌한 노이즈*가 된다.

---

## Particle 풀 — 사무 비품 8종

피·살점 대신 **사무 비품**이 흩날린다:

| 좀비 | 기본 particle | 서사적 의미 |
|---|---|---|
| 신입 | 사원증 + 포스트잇 | 입사 첫날의 흔적 / 전달되지 못한 메모 |
| 과장 | 종이 + 명함 | 결재되지 못한 보고서 / 교환되지 못한 연결 |
| 팀장 | 커피잔 + 클립 | 식어버린 야근 동반자 / 고정 도구가 풀어짐 |
| CEO 보스 | USB + 종이 + 사원증 | 데이터 유출 / KPI의 잔해 (3종 혼합 24p) |

이 결정이 의미있는 이유는, **좀비를 죽이는 행위가 폭력으로 보이지 않게** 만들기 때문이다. 사원증이 떨어지면 *동료 한 명이 퇴근했다*는 신호다. 좀비팡의 폭력 둔감화 리스크가 가장 낮은 지점은 *처치 시각 표현*이다.

---

## 4-layer SFX — Web Audio API only, 외부 파일 0

| Layer | 합성 사양 | 서사 톤 |
|---|---|---|
| 1 impact | 80Hz square 30ms + 220Hz sine 50ms decay | 의자 다리가 책상에 부딪힌 둔탁한 소리 |
| 2 zombie groan | 110~180Hz sawtooth + LFO 4Hz 깊이 12% | 회의실 마이크 피드백 / 복사기 동작음 |
| 3 crit punch | 600Hz triangle 20ms + white noise 15ms band-pass 2kHz | 결재 도장 *쾅* |
| 4 combo "팡!" | 1.2kHz sine 15ms + 600Hz square 60ms + reverb 80ms | 풍선껌 터지는 톤 / 회사 단톡방 알림음 |
| 5 powerup chime | 880Hz → 1320Hz → 1760Hz arpeggio 90ms | 자판기 동전 떨어지는 톤 |
| 6 wave clear | C5-E5-G5 chord 350ms | 엘리베이터 도착 *띵* + 화답 |
| 7 hit damage | 60Hz sawtooth 80ms decay + low-pass 400Hz | 형광등 깜빡이는 *틱* |

구현 노드는 `OscillatorNode` + `GainNode` + `BiquadFilterNode` 조합이다. **외부 사운드 파일 0개**. 이 결정은 두 가지 효과를 동시에 낸다 — (1) 자산 < 3MB 제약 충족, (2) iOS Safari AudioContext 처리 단순화. PUNCH IN tap 시 AudioContext가 한 번만 resume되면 그 후 모든 사운드는 합성된다.

---

## "팡!" 의성어 — 좀비팡의 시그니처

"팡!"은 **crit + combo 5+ 동시 조건**에서만 노출된다. 단독 발생 시 노출 안 함 — 희소성이 강조의 핵심이다.

```
조건: crit kill AND combo ≥ 5
노출: 1.5초 / scale 0→1.2→1.0 (squash) / Y -20px 부유 / fade out
폰트: 굵은 sans-serif (Pretendard Black 권장)
색: fill #FFCE00 (포스트잇 노란색), stroke #1A1A1A 3px (회의실 칠판)
위치: 처치된 좀비 좌표 위 -40px (화면 중앙 고정 금지)
크기: portrait 360px 폭에서 글자 32~40px
```

한국어 의성어 미학으로 튜닝되어 있고, 글로벌 출시에도 **음역 그대로 유지**된다 — *카타카나·영문 금지*. "BANG!"이 아니라 "팡!"이다. 게임의 코드네임 *퇴근팡 (Off-Clock Pang)* 과 일치한다.

이 결정이 의미있는 이유는, **한국 게임이 글로벌에서 자기 미학을 유지하는 드문 사례**가 되기 때문이다. 한국 의성어의 압축적 강도("팡!"이 영어 두 음절을 한 음절에 담는다)를 굳이 번역하지 않는다.

---

## Freeze frame 0.6초 — CEO 처치 전용

freeze frame은 **CEO 처치에만** 적용된다. normal kill에 freeze는 절대 금지다 — 60초 안에 freeze를 자주 쓰면 *템포 시스템*이 깨진다.

```
t0      | CEO 처치 충돌
t0~600ms | 모든 입자 정지
        | + desaturate 80%
        | + vignette 12%
        | + 1px scale oscillation (라이브 신호)
t600ms   | desaturate 해제 + 사옥 줌아웃 시작
```

**1px scale oscillation**이 핵심이다. 600ms freeze 중에도 화면이 *완전히 정지되지 않은 것*처럼 보이게 한다. 사용자가 *게임이 멈춘 줄 알고 다시 탭*하는 오해를 방지한다 (ADR-0006).

이후 transition은 사옥 외관 줌아웃 → 한 층 색 채워짐 → 카드 3장 fan-out으로 이어진다. *0.6초의 카타르시스*가 챕터 종료의 의미를 만든다.

---

## 22시 이후 진동 1/3 강도

밤 22시 이후에는 진동 강도가 자동으로 1/3로 줄어든다. game-feel-juicer가 dark-pattern-critic에게 양보한 결정이다. 자정 cue("오늘은 충분히 했어요")와 일관성을 유지하기 위해서다.

밤에 게임을 하는 사용자는 *조용히 하는 것*이 우선이다. 좀비팡은 사용자가 *자기 환경에 맞춰* 게임을 할 수 있도록 자동으로 조절한다. 이것이 좀비팡의 *조용한 배려*다 — 텍스트로 강조하지 않고, 진동의 강도로만 표현된다.
