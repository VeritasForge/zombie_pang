# Domain Glossary for 좀비팡

좀비팡 핵심 도메인 용어 정의. 새 도메인 모델 추가 시 본 파일을 업데이트.

> **상위 SSOT**: `docs/game-design/bible.md` §1~§8
> 본 문서는 **타입 시그니처 + 12살 비유 + Bible 인용**을 제공합니다.

---

## 0. Player (플레이어)

### EMP-0427

```ts
type EmployeeNumber = Brand<string, 'EmployeeNumber'>
// 항상 'EMP-0427' (사번 고정)
```

- **정의**: 이름 없는 마지막 정상인 사원. 야근 중 우연히 살아남음.
- **무기**: 사무 비품 (키보드, 스테이플러, 정수기 통, 결재판) — 총·도검 0개
- **12살 비유**: *학교에 혼자 남은 학생*. 청소도구로 좀비를 *졸업시킴*
- **출처**: Bible §1

---

## 1. Zombie (좀비) — 4종

좀비팡의 좀비는 **번아웃의 물질화** (WHO 2019 번아웃 직업현상 분류 근거).
처치 = *동료의 퇴근* (죽이는 것이 아님).

### ZombieType

```ts
export const ZOMBIE_TYPE = {
  INTERN: 'INTERN',     // 신입
  MIDDLE: 'MIDDLE',     // 과장
  LEAD: 'LEAD',         // 팀장
  CEO: 'CEO',           // CEO Founder Zero (보스)
} as const

export type ZombieType = (typeof ZOMBIE_TYPE)[keyof typeof ZOMBIE_TYPE]

type ZombieMetadata = {
  readonly type: ZombieType
  readonly hp: number          // 1 / 1 / 2 / 5
  readonly hitBoxSize: number  // 80 / 80 / 80 / 90 (INTERN은 fast라 90)
  readonly maskColor: number   // hex: 0xF0EAD6 / 0x7A7A7A / 0x3A3A3A / 0x0A0A0A
  readonly floorEarliest: number  // 1 / 3 / 6 / 10
  readonly speed: 'fast' | 'middle' | 'slow' | 'boss'
}
```

### 4종 명세표 (Bible §2)

| 명칭 | 직급 | 속도 | HP | Phaser 표현 | 마스크 색 | 첫 등장 |
|------|------|------|-----|-----------|----------|--------|
| 신입 / Intern | 갓 감염 | 빠름 | 1 | 작은 원 + 사각형 명찰 | 흰 `#F0EAD6` | 1F |
| 과장 / Middle | 책임감 짓눌림 | 중간 | 1 | 중간 사각형 + 종이 파티클 | 회색 `#7A7A7A` | 3F |
| 팀장 / Lead | 회의 미종결 | 느림 | 2 (crack) | 큰 사각형 + 분노 게이지 링 | 진회색 `#3A3A3A` | 6F |
| CEO / Founder Zero | 보스 | 보스 | 5 | 거대 원 + Graphics 후광 | 검정 `#0A0A0A` | 10F, 20F, 30F, 40F, 50F |

- **12살 비유**: 직급별 좀비는 *야근에 갇힌 동료* 4명입니다. *졸업장(처치)* 을 주면 퇴근시켜줍니다.
- **출처**: Bible §2

---

## 2. Wave (웨이브)

```ts
type WaveNumber = Brand<number, 'WaveNumber'>  // 1~10
```

- **정의**: 1 챕터 안의 1 층 단위. 1 챕터 = 10 wave = 10 floor = 60초.
- **spawn rate**: wave 1 = 1000ms → wave 10 = 300ms (선형 감소)
- **lifespan**: wave 1 = 2000ms → wave 10 = 1200ms
- **12살 비유**: *학교 시험 한 문제*가 wave 하나. 10문제 풀면 챕터 시험 끝.
- **출처**: Bible §3, §8

---

## 3. Floor (층)

```ts
type FloorNumber = Brand<number, 'FloorNumber'>  // 1~50

export const asFloorNumber = (n: number): FloorNumber => {
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new RangeError(`Invalid FloorNumber: ${n}`)
  return n as FloorNumber
}
```

- **정의**: 사옥 50층 중 한 층. 1 wave = 1 floor (1:1 매핑).
- **5챕터 매핑**: 1~10F (신입부서), 11~20F (영업본부), 21~30F (R&D), 31~40F (임원실), 41~50F (CEO 집무실 + 옥상)
- **12살 비유**: *학교 1층부터 5층까지 올라가는 계단*. 한 층씩 정복.
- **출처**: Bible §2

---

## 4. Chapter (챕터)

```ts
type ChapterNumber = Brand<number, 'ChapterNumber'>  // 1~5
```

- **정의**: 10층 = 1챕터. MVP는 5챕터 = 50층.
- **누적 DPS 곡선**: ×1.00 / ×1.85 / ×3.10 / ×4.20 / ×5.36
- **Boss HP 곡선**: 1.0× / 1.5× / 2.25× / 3.10× / 3.84×
- **예상 클리어율**: 92% / 90% / 88% / 87% / 88% (풀런 ~85%)
- **12살 비유**: *학교 1학년~5학년*. 학년이 올라갈수록 시험이 어려워집니다.
- **출처**: Bible §2, §3, §8

---

## 5. Run (런)

```ts
type Run = {
  readonly chapter: ChapterNumber
  readonly floor: FloorNumber
  readonly score: Score
  readonly comboKills: number
  readonly fledCount: number       // 0~5 (5 = chapter fail)
  readonly activePowerUps: readonly PowerUpType[]   // ≤ 2
  readonly hand: readonly CardId[]   // 챕터 누적 카드
  readonly streak: StreakDays
}
```

- **정의**: 한 번의 게임 시도. 시작 → 챕터 클리어 / fail / 정시 퇴근까지.
- **종료 조건**: (1) 5챕터 클리어 = 엔딩 / (2) 도주 5 누적 = chapter fail (조기 퇴근) / (3) 사용자 정시 퇴근 선택
- **메타 보존**: 챕터 중간 정시 퇴근해도 카드/골드/인테리어 보존 (Bible §3, §7 안티패턴 #10)
- **12살 비유**: *학교 한 학기*. 학기 끝나면 점수표 받고, 다음 학기 새 시도.
- **출처**: Bible §3

---

## 6. Score (점수)

```ts
type Score = Brand<number, 'Score'>

export class ScoreVO {
  add(delta: number): ScoreVO   // delta ≥ 0 (negative throw)
  value(): Score
}
```

- **정의**: 누적 점수. 좀비 처치 시 `100 × comboTier × critMultiplier` 가산.
- **base score**: 100
- **invariant**: `score ≥ 0` 항상 성립 (property-based 검증)
- **12살 비유**: *시험 점수*. 한 문제(좀비) 풀 때마다 +100점, 콤보면 +150/200/300점.
- **출처**: Bible §3, §8

---

## 7. Combo (콤보)

```ts
export type ComboTier = 1 | 1.5 | 2 | 3

export class Combo {
  constructor(deps: { clock: IClock; decayMs?: number })
  incrementOnKill(): void
  tier(): ComboTier
}
```

- **정의**: 연속 처치 카운터. 5/10/15 kill 도달 시 tier 승급.
- **decay**: 1500ms (default) / 2000ms (늘어지는 회의 카드 보유)
- **tier**: ×1 → ×1.5 (5kill) → ×2 (10kill) → ×3 (15kill)
- **invariant**: tier는 *단조 증가하다 decay/miss에만 리셋*
- **12살 비유**: *문제 연속 정답*. 5개 연속 맞히면 *콤보 보너스*, 1.5초 안에 다음 문제 못 풀면 콤보 끊김.
- **출처**: Bible §3, §8

---

## 8. Critical (크리티컬)

```ts
type CritMultiplier = 2.0 | 2.5
```

- **정의**: 좀비 머리(상단) tap → crit. 2× 점수 (사직서 한 방 카드 보유 시 2.5×).
- **시각 cue**: flash white 1프레임 + L3 SFX (결재 도장 *쾅*) + shake 9px
- **12살 비유**: *문제의 핵심 단어*에 정확히 답 → 보너스 ×2
- **출처**: Bible §3, §5, §8

---

## 9. Power-up (3종)

```ts
export const POWERUP_TYPE = {
  BOMB: 'BOMB',
  FREEZE: 'FREEZE',
  MAGNET: 'MAGNET',
} as const
export type PowerUpType = (typeof POWERUP_TYPE)[keyof typeof POWERUP_TYPE]

type PowerUpEffect = {
  readonly type: PowerUpType
  readonly durationMs: number   // BOMB=0, FREEZE=3000, MAGNET=3000
}
```

- **drop rate (T0/T3)**: 5% / 6.5% (max) — 곱셈 누적만 (덧셈 금지)
- **보스 처치 시**: 30% 확정 (3종 균등 추첨)
- **동시 활성 한도**: 2개 (3개째 reject)
- **invariant**: drop rate는 슬롯머신화 방지를 위해 UI에 정량 표기 금지 (Bible §7 안티패턴 #9)
- **12살 비유**: 폭탄 = *모든 문제 한번에 정답*, 빙결 = *3초간 시험지가 멈춤*, 자석 = *문제가 손에 끌려옴*
- **출처**: Bible §3, §4, §8

---

## 10. Meta Card (메타 카드) — 15장

```ts
type CardId = Brand<string, 'CardId'>

type Card = {
  readonly id: CardId
  readonly category: CardCategory
  readonly tier: 1 | 2 | 3
  readonly name: string
  readonly effect: (run: Run) => Run    // 효과 적용 함수
}

export const CARD_CATEGORY = {
  DAMAGE: 'DAMAGE',
  CRIT: 'CRIT',
  DURATION: 'DURATION',
  COIN_GAIN: 'COIN_GAIN',
  SPECIAL: 'SPECIAL',
} as const
```

### 15장 명세 (Bible §4)

| ID | 카테고리 | Tier | 카드명 | 효과 |
|----|---------|------|--------|------|
| 1 | DAMAGE | 1 | 양손 회수 | +1 |
| 2 | DAMAGE | 2 | 의자 휘두르기 | +2 |
| 3 | DAMAGE | 3 | 정수기통 던지기 | +3 |
| 4 | CRIT | 1 | 정확한 한 방 | +5% |
| 5 | CRIT | 2 | 빈틈을 노린 일격 | +10% |
| 6 | CRIT | 3 | 카운터 펀치 | +15% |
| 7 | DURATION | 1 | 점심시간 연장 | +0.5s |
| 8 | DURATION | 2 | 야근 거부권 | +1s |
| 9 | DURATION | 3 | 휴가 일수 추가 | +1.5s |
| 10 | COIN_GAIN | 1 | 잔돈 모으기 | +10% |
| 11 | COIN_GAIN | 2 | 회식비 절약 | +20% |
| 12 | COIN_GAIN | 3 | 성과급 협상 | +30% |
| 13 | SPECIAL | — | 자기장 ID카드 | 자석 범위 +20px |
| 14 | SPECIAL | — | 늘어지는 회의 | 콤보 decay +0.5s |
| 15 | SPECIAL | — | 사직서 한 방 | crit ×2 → ×2.5 |

- **추첨**: 결정론 균등 3장 fan-out → 1장 선택 (가챠 금지)
- **Unlock**: Tier 2 (챕터 2 클리어), Tier 3 (챕터 4 클리어), Special (누적 coin 1000/3000/10000)
- **12살 비유**: *학교 시험에서 받은 보상 카드*. 다음 시험에서 *연필 +1자루*, *지우개 좀 더 크게* 같은 보너스.
- **출처**: Bible §4

---

## 11. Daily Streak (출근 도장)

```ts
type StreakDays = Brand<number, 'StreakDays'>   // 0~7

type DailyStreak = {
  readonly days: StreakDays
  readonly coinMultiplier: number    // 1 + 0.2 × days, [1.0, 2.4]
  readonly lastPunchAt: number       // epoch ms
}
```

- **정의**: 연속 출근일. +20% coin / 일 (선형 누적).
- **상한**: 7일 (+140% → multiplier 2.4)
- **페널티**: **0 (없음)** — 끊겨도 도장은 흐려질 뿐 사라지지 않음
- **8일째**: 자동 휴식 모달 ("연차 사용")
- **invariant**: `streak ∈ [0,7]`, `coinMultiplier = 1 + 0.2 × streak`
- **12살 비유**: *학교 개근상*. 매일 출석하면 *과자 +20%*. 결석해도 *벌점 없음* — 그냥 도장이 흐려질 뿐.
- **출처**: Bible §4, §7 안티패턴 #1, §8

---

## 12. Coin (코인)

```ts
type Coin = Brand<number, 'Coin'>
```

- **정의**: 영구 메타 화폐. Special 카드 unlock 게이트 (1000 / 3000 / 10000).
- **획득**: 챕터 클리어 + Daily Streak 보너스
- **사용**: Special 카드 unlock만 (소비 X, 누적 게이트)
- **invariant**: `coin ≥ 0`
- **12살 비유**: *학교 포인트*. 시험 잘 보면 점점 쌓이고, 특정 점수에서 *새 보상*이 열림.
- **출처**: Bible §4, §8

---

## 13. CEO Boss (CEO 보스)

```ts
type Boss = {
  readonly chapter: ChapterNumber
  readonly hp: number              // 5 × chapterMultiplier
  readonly phase: 'TELEGRAPH' | 'ENGAGEMENT' | 'CLIMAX'
  readonly dialogue: string        // 챕터별 1줄
}

const CEO_HP_MULTIPLIER: Record<ChapterNumber, number> = {
  1: 1.00, 2: 1.50, 3: 2.25, 4: 3.10, 5: 3.84,
}
```

- **등장**: 각 챕터 10층 (10F, 20F, 30F, 40F, 50F)
- **5초 3-phase**: Telegraph (0~1s) → Engagement (1~4s) → Climax (4~5s)
- **freeze frame**: 마지막 처치에서 600ms (normal kill은 freeze 금지)
- **drop**: 30% 확정 (Power-up 3종 균등)

### 챕터별 대사 (Bible §2)

| 챕터 | 대사 |
|------|------|
| 1 (10F) | "성과는 어디 있나?" |
| 2 (20F) | "회의는 끝나지 않았다" |
| 3 (30F) | "우리는 가족이지 않은가" |
| 4 (40F) | "이 정도면 다행이다" |
| 5 (50F) | "이번 분기 KPI…" |

처치 = 대사의 종결 = *유해한 명령의 종결*. 50층 처치 후 사직서 컷씬 → 엔딩.

- **12살 비유**: *학교 학년 말 시험*. 보통 문제 9개 푼 뒤 *마지막 큰 문제* 하나가 보스. 정복하면 졸업.
- **출처**: Bible §2, §3, §8

---

## 14. Spawn Rate (스폰 속도)

```ts
function spawnRate(wave: WaveNumber): number {
  // 선형 감소: wave 1 = 1000, wave 10 = 300
  return 1000 - ((wave - 1) * 700) / 9
}
```

- **범위**: 300ms ~ 1000ms
- **invariant**: `spawnRate(N ∈ [1,10]) ∈ [300, 1000]` ms
- **12살 비유**: *문제 출제 속도*. 학년이 올라갈수록 *1초마다 한 문제*에서 *0.3초마다 한 문제*로 가속.
- **출처**: Bible §8

---

## 15. Lifespan (좀비 수명)

```ts
function lifespan(wave: WaveNumber): number {
  // 선형 감소: wave 1 = 2000, wave 10 = 1200
  return 2000 - ((wave - 1) * 800) / 9
}
```

- **정의**: 좀비가 화면에 등장한 후 도주하기까지의 시간.
- **범위**: 1200ms ~ 2000ms
- **초과 시**: FLED 카운터 +1 → 5 누적 시 chapter fail
- **12살 비유**: *문제 풀이 제한 시간*. 학년 높을수록 시간이 짧아짐.
- **출처**: Bible §8

---

## 16. Hit Box (히트 박스)

```ts
type HitBoxSize = 80 | 90
// fast 좀비(INTERN) = 90×90 (작아도 빠르므로 보정)
// 나머지 3종 = 80×80
// visible size = 64×64 (hit box보다 작음 = 후한 판정)
```

- **좀비 간 최소 거리**: 96px (간격 보장)
- **Thumb Zone 분포**: 하단 60% (70%) + 중앙 (20%) + 상단 (10%, 도주 전용)
- **12살 비유**: *시험지의 OMR 칸*. 칸이 *손가락보다 약간 큼* (80px) — 살짝 빗나가도 정답 인정.
- **출처**: Bible §6, §8

---

## 17. Tap (탭) / Miss / Fled (도주)

```ts
type TapResult = 'HIT' | 'CRIT' | 'MISS'
type FledEvent = { zombieId: ZombieId; floor: FloorNumber }
```

- **Tap**: 좀비 hit box 내부 = HIT, 상단 (머리) = CRIT, 외부 = MISS
- **Miss**: 점수 변동 없음 + 콤보 영향 없음 (관대 정책)
- **Fled (도주)**: 좀비가 lifespan 안에 처치되지 않고 화면 밖으로 사라짐 → FLED 카운터 +1
- **Fail 임계**: FLED 5 누적 = chapter fail (조기 퇴근 모달)
- **12살 비유**: *문제를 풀지 못하고 시간이 지남* = 도주. 5개 놓치면 그 학기 *조기 퇴근* (재시도).
- **출처**: Bible §3, §6

---

## 18. Clock Out (정시 퇴근) / Punch In (출근)

```ts
type ChapterEndChoice = 'NEXT_CHAPTER' | 'VIEW_CARDS' | 'CLOCK_OUT'
```

- **Punch In**: 메인 메뉴 → 게임 시작 (PUNCH IN 버튼)
- **Clock Out**: 챕터 종료 시 3택 중 하나 (정시 퇴근). 모두 *동등 가중치*, default highlight 없음
- **메타 보존**: Clock Out해도 카드/골드/인테리어 전부 보존 (페널티 0)
- **컷씬**: "PUNCH OUT! 17:30" 1초 cutscene
- **12살 비유**: *학교 종 소리*. 챕터 끝나면 *그만 가도 됨* — 강요 없음.
- **출처**: Bible §1, §3, §7 안티패턴 #10

---

## 19. Freeze Frame (정지 프레임)

```ts
type FreezeFrameDuration = 0 | 600   // ms
// CEO 처치만 600ms, normal kill은 freeze 금지
```

- **정의**: CEO 보스 처치 마지막 tap에서 600ms 화면 정지 + desaturate 80% + vignette 12% + 1px scale oscillation
- **사용처**: CEO 보스 처치만 (normal kill freeze 금지 = 게임 흐름 보존)
- **12살 비유**: *결승골 슬로우 모션*. 보통 골은 그냥 지나가고, 결승전 마지막 골만 *느리게 보여줌*.
- **출처**: Bible §3, §5, §8

---

## 20. "팡!" (의성어)

```ts
type PangTrigger = {
  isCrit: true
  comboTier: 1.5 | 2 | 3   // combo 5+ 동시 조건
}
```

- **트리거**: crit + combo 5+ **동시 조건만**
- **시각**: 1.5초 squash (0→1.2→1.0), Y -20px 부유, fade out
- **폰트**: Pretendard Black, fill `#FFCE00`, stroke `#1A1A1A` 3px, 32~40px
- **위치**: 처치된 좀비 좌표 위 -40px
- **언어 정책**: 글로벌 출시에도 음역 유지 (카타카나·영문 금지) — Bible §1
- **12살 비유**: *만화의 폭발 의성어*. 평범한 공격엔 안 나오고, *연속 정확한 공격에만* 등장.
- **출처**: Bible §1, §5

---

## 21. Interior (사옥 인테리어)

```ts
type Interior = {
  readonly chapter: ChapterNumber
  readonly elements: readonly InteriorElement[]   // 카드별 인테리어 매핑
  readonly goldBurst: boolean    // 1~3% 확률 ×5 골드 폭증 (Layer 2 가변)
}
```

- **정의**: 5챕터별 인테리어. 카드 효과와 매핑 (예: 양손 회수 → 합판 벽재 / 정수기통 던지기 → 방탄유리 벽재)
- **Layer 2 가변**: 인테리어 재건 순서, 골드 폭증 ×5 (1~3%)
- **12살 비유**: *학교 교실 꾸미기*. 학년이 올라갈수록 *벽지가 바뀌고, 새 가구가 들어옴*.
- **출처**: Bible §2, §3, §4

---

## 22. Domain Errors

| 에러 클래스 | 발생 조건 |
|------------|----------|
| `ScoreError` | negative score 시도, NaN 입력 |
| `InvalidWaveError` | wave < 1 또는 > 10 |
| `InvalidChapterError` | chapter < 1 또는 > 5 |
| `InvalidFloorError` | floor < 1 또는 > 50 |
| `PortMissingError` | constructor에 Port 누락 |
| `PowerUpStackOverflowError` | 동시 활성 ≥ 3 시도 |
| `CardNotFoundError` | unknown card id |
| `CardPoolUnderflowError` | 풀에 카드 < 3 (3장 추첨 불가) |
| `StoreQuotaError` | localStorage quota 초과 (adapter 전파) |
| `StoreUnavailableError` | localStorage 비활성 (private mode 등) |

---

## 23. 12살 종합 비유 (재배치)

> 좀비팡은 **학교 시험 게임**입니다.
>
> - **Player (EMP-0427)** = *마지막 학생*
> - **Zombie 4종** = *야근에 갇힌 동료들* (졸업장 = 처치)
> - **Wave / Floor** = *시험 한 문제 / 학교 층*
> - **Chapter** = *학년* (5학년 = 졸업)
> - **Score** = *시험 점수*
> - **Combo** = *연속 정답 보너스*
> - **Critical** = *핵심 단어에 정확히 답*
> - **Power-up** = *시험 도구* (지우개=폭탄, 정지시계=빙결, 자석=자석)
> - **Meta Card** = *시험 후 받는 보상 카드*
> - **Daily Streak** = *개근상* (벌점 없음)
> - **Coin** = *학교 포인트* (특정 점수에서 새 카드 열림)
> - **CEO Boss** = *학년 말 큰 시험*
> - **Clock Out** = *학교 종 — 그만 가도 됨*
> - **"팡!"** = *만화 폭발 의성어* — 연속 정확 공격 시만 등장

---

## References

- 본 프로젝트 SSOT: `docs/game-design/bible.md` (Phase A-8)
- Bible §1 (Concept), §2 (World), §3 (Core Loop), §4 (Meta), §5 (Juice), §7 (Ethics), §8 (수치)
- Master Plan: `docs/plan/zombie-pang-master-plan.md` §6.2 (도메인 모듈 명세)
- 본 문서와 충돌 시 우선순위: `Bible > 본 문서 > Code`
