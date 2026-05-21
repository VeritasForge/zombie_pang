// LocalStorageSaveStore — ISaveStore 구현체 (Web Storage 어댑터).
//
// 책임:
//   - JSON 직렬화/역직렬화 캡슐화
//   - localStorage quota 초과 시 graceful degrade (warn + no-op)
//   - 키 prefix 부여 ("zombie-pang:v1:" 등은 use case 측이 명시)
//
// Bible / Master Plan §C-5:
//   - iOS Safari Private 모드: setItem이 QuotaExceededError throw → in-memory fallback 안 함 (no-op).
//     (in-memory fallback은 별도 InMemorySaveStore 클래스가 담당. 본 어댑터는 quota 시 silent skip.)
//   - JSON.parse 실패 시 null 반환 (corrupted 데이터 graceful).
//   - empty string은 null과 구분: 값이 존재하면 ""도 그대로 파싱 시도 후 실패 → null.

import type { ISaveStore } from "@domain/ports/save-store";

/* eslint-disable no-console */

export class LocalStorageSaveStore implements ISaveStore {
  constructor(private readonly storage: Storage) {}

  get<T>(key: string): T | null {
    let raw: string | null;
    try {
      raw = this.storage.getItem(key);
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(`[LocalStorageSaveStore] getItem failed for key "${key}":`, err);
      return null;
    }
    if (raw === null) return null;
    if (raw === "") return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(`[LocalStorageSaveStore] JSON.parse failed for key "${key}":`, err);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(`[LocalStorageSaveStore] JSON.stringify failed for key "${key}":`, err);
      return;
    }
    // JSON.stringify는 undefined / 함수만 직렬화 못함 (undefined 반환). 명시적 가드.
    if (typeof serialized !== "string") {
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(
        `[LocalStorageSaveStore] value for key "${key}" not serializable (got ${typeof serialized})`,
      );
      return;
    }
    try {
      this.storage.setItem(key, serialized);
    } catch (err) {
      // QuotaExceededError, SecurityError (Private mode) 등.
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(`[LocalStorageSaveStore] setItem failed for key "${key}":`, err);
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: graceful degrade 경고는 사용자 디버깅용 출력.
      console.warn(`[LocalStorageSaveStore] removeItem failed for key "${key}":`, err);
    }
  }
}
