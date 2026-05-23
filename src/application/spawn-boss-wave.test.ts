import { ZOMBIE_TYPE } from "@domain/wave/zombie-type";
import { asChapterNumber } from "@shared/types/branded";
import { describe, expect, it } from "vitest";
import { spawnBossWave } from "./spawn-boss-wave";

describe("spawnBossWave", () => {
  // [Happy] Ch3 → boss + minions [신입3, 과장1]
  it("[Happy] Ch3 → phase {R:120, ω:1.0} + minions [신입3, 과장1]", () => {
    const result = spawnBossWave(asChapterNumber(3));
    expect(result.phase).toEqual({ R: 120, omega: 1.0 });
    expect(result.minions).toEqual([
      { type: ZOMBIE_TYPE.INTERN, count: 3 },
      { type: ZOMBIE_TYPE.MIDDLE, count: 1 },
    ]);
  });

  // [Boundary] Ch1 → minions: []
  it("[Boundary] Ch1 → minions: [], phase {R:80, ω:0.5}", () => {
    const result = spawnBossWave(asChapterNumber(1));
    expect(result.minions).toEqual([]);
    expect(result.phase).toEqual({ R: 80, omega: 0.5 });
  });

  // [Boundary] Ch5 → minions 총 8
  it("[Boundary] Ch5 → minions 총 8마리 + phase {R:150, ω:1.6}", () => {
    const result = spawnBossWave(asChapterNumber(5));
    const totalCount = result.minions.reduce((s, x) => s + x.count, 0);
    expect(totalCount).toBe(8);
    expect(result.phase).toEqual({ R: 150, omega: 1.6 });
  });

  // [Error] 부재 사유: Port 무관 + ChapterNumber 컴파일러 보장 (getPhaseConfig가 invalid chapter throw)
});
