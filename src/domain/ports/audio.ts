// Domain Port: IAudio + AudioEvent
// Web Audio API 직접 호출 금지. 도메인은 이벤트만 발행한다.

export type AudioEvent =
  | "punch_in"
  | "kill_normal"
  | "kill_crit"
  | "combo_5"
  | "powerup_pickup"
  | "boss_kill"
  | "boss_approaching"
  | "wave_clear"
  | "hit"
  | "menu_select";

export interface IAudio {
  play(event: AudioEvent): void;
  resume(): Promise<void>;
}
