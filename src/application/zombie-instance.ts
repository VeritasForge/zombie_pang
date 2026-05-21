// ZombieInstance — Application layer 좀비 인스턴스 표현.
// Domain의 ZombieSpec(불변 정의)와 달리, on-screen 좀비의 식별자 + 현재 HP를 포함한다.

import type { ZombieType } from "@domain/wave/zombie-type";

export type ZombieInstance = {
  readonly id: string;
  readonly type: ZombieType;
  readonly hp: number;
};
