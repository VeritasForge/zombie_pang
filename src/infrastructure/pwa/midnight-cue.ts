// midnight-cue — 00:00~06:00 첫 진입 시 디밍 모달 노출 정책 매니저.
//
// Bible §6 + master plan §3.3:
//   - 00:00~06:00 시간대(로컬 시간)에 세션 1회 한정 노출
//   - 메시지: "오늘은 충분히 했어요. 좀비도 잠들었어요."
//   - 화면 50% 디밍 + BGM 30% 볼륨 (호출자 책임)
//   - 옵션 [그래도 1라운드만] / [내일 봐요] — 압박 카피 금지
//
// 본 매니저는 *언제* 모달을 띄울지 결정만 한다. 실제 dimming/볼륨/UI는 호출자가 처리한다.
// 시간대는 wall-clock 의미가 필수이므로 `Date` 객체를 직접 받는다 (IClock의 monotonic으로는 시각 추출 불가).
// 세션 상태는 in-memory로 보관 — 페이지 reload 시 자동 reset (1회 한정 정책의 자연 구현).

export const MIDNIGHT_CUE_START_HOUR = 0; // 00:00 inclusive
export const MIDNIGHT_CUE_END_HOUR = 6; // 06:00 exclusive

export class MidnightCueManager {
  private shownThisSession = false;

  shouldShow(now: Date): boolean {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      throw new TypeError("MidnightCueManager.shouldShow: invalid Date");
    }
    if (this.shownThisSession) return false;
    const hour = now.getHours();
    return hour >= MIDNIGHT_CUE_START_HOUR && hour < MIDNIGHT_CUE_END_HOUR;
  }

  recordShown(): void {
    this.shownThisSession = true;
  }

  /** 테스트/디버그용. 새 세션 시작과 동일 효과. */
  resetSession(): void {
    this.shownThisSession = false;
  }
}
