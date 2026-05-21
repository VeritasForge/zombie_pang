// AudioManager — Phaser adapter audio dispatcher.
// IAudio Port를 위임받아 scene event와 연결하는 thin facade.

import type { AudioEvent, IAudio } from "@domain/ports/audio";

export class AudioManager {
  constructor(private readonly audio: IAudio) {}

  play(event: AudioEvent): void {
    this.audio.play(event);
  }

  async resume(): Promise<void> {
    await this.audio.resume();
  }
}
