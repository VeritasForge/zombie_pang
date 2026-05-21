# Round 1 — Game Feel Juicer

## 입장: "Juice가 곧 onboarding이다"

텍스트 0줄을 가능하게 만드는 건 단 하나, **압도적인 game feel**이다. 학습은 글이 아니라 *몸의 반사*로 일어난다. Jan Willem Nijman의 "Juice it or lose it" 강연이 증명했다: 같은 게임도 juice 한 줌만 더하면 30초 retention이 2배 된다.

## 핵심 주장

### 1. 첫 tap = "팡!" 의 해부
- **Hit pause** 80ms: 좀비가 터지는 순간 화면 전체 정지. 이게 "맞췄다"의 가장 강한 시그널.
- **Screen shake** 4px amplitude × 120ms decay: 손에 닿은 임팩트.
- **Particle burst** 8~12개, 좀비 컬러와 동일 hue: 컬러로 어떤 좀비를 깼는지도 학습된다.
- **Sound**: 저역 "둠" + 고역 "팡!" 동시 = 만족감의 황금비. iOS는 첫 tap에서 AudioContext.resume() 강제.
- **Haptic**: navigator.vibrate(15ms). iOS Safari에서는 no-op, Android에서만 작동 (typeof check).
- **Number popup**: +100, 콤보 시 ×1.5가 좀비 위에 솟구쳐 fade-out.

이 6중주가 0.3초 안에 동시 발사되면, 사용자는 "왜?"를 묻지 않고 **다음 좀비를 찾는다**.

### 2. 화살표 안내는 juice의 일부
- compulsion-architect가 말한 "다음 좀비 화살표"는 UI가 아니라 **카메라 motion**으로 처리하자. 좀비 등장 위치로 카메라가 1px 살짝 끌려가는 "lookat tween" → 시선 유도.
- 강제 화살표 아이콘은 "튜토리얼 냄새"를 풍긴다. Subtle motion이 답이다.

### 3. Powerup 자석 등장
- 4층 powerup 드랍 시:
  - 좀비 폭사 → 자석 아이콘이 ***튀어 오르며 회전*** (sin curve, 1.2초 hover)
  - 주변 좀비들이 자석 쪽으로 *살짝 끌리는* 사전 모션 0.3초 → "아, 끌어당기는구나" 학습
  - tap 시 화면 전체에 metallic ping + 모든 좀비 흡인 = 시각만으로 100% 이해

### 4. 도주 시각화
- 5층 첫 좀비 도주는 **위로 천천히 사라지며 빨갛게 흐려지는** 모션. 화면 상단에 작은 카운터 "FLED 1/5" — 텍스트는 숫자 + 도주 좀비 실루엣 아이콘만.
- 누적 5 도달 시 **화면 전체 빨간 vignette + 심박 사운드** → 패배 직전 긴장감.

## 양보 지점

- **prefers-reduced-motion** 대응에 100% 동의. shake/freeze 50% 감쇠. 단 *제거*는 안 됨 — feel이 죽으면 게임이 죽는다.
- **dark mode 강제**에 동의. 어둠 속 형광 좀비 4종이 가장 예쁘다. eye strain 우려도 해결.
- **tap-only**에 동의. swipe는 juice 동선을 망친다. tap의 응답성이 juice의 정점.

## 우려

- **저사양 기기 60fps**: particle 다수 + shake 동시 발생 시 일부 안드로이드에서 frame drop. → particle pool, shake 큐잉 1개로 제한 필요. 이건 mobile-ux-pragmatist에게 위임.
- **hit box 80×80**: visible 64×64보다 크게 잡는 건 game feel상 옳다(못 맞춰서 짜증 < 살짝 빗나가도 맞음). 동의.
- **splash 1초**: 너무 짧다. 로고 fade-in 0.4s + hold 0.6s + fade-out 0.3s = 1.3초 정도가 미학적으로 옳음. 협상 가능.

## Round 1 결론

Juice는 *덧붙이는 것*이 아니라 **언어 그 자체**다. 첫 tap의 6중주, 자석의 안무, 도주의 vignette — 이 세 장면이 30초 안에 시퀀스로 흐르면 텍스트는 단 한 줄도 필요 없다.
