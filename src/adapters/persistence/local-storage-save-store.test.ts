import type { ISaveStore } from "@domain/ports/save-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageSaveStore } from "./local-storage-save-store";

/** 메모리 기반 Storage 구현 (브라우저 Storage 인터페이스 호환). */
class FakeStorage implements Storage {
  private store = new Map<string, string>();
  /** quota 초과 시뮬레이션 플래그. */
  public throwOnSet = false;
  public throwOnGet = false;
  public throwOnRemove = false;

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    if (this.throwOnGet) {
      throw new DOMException("SecurityError", "SecurityError");
    }
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    }
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    if (this.throwOnRemove) {
      throw new DOMException("SecurityError", "SecurityError");
    }
    this.store.delete(key);
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

describe("LocalStorageSaveStore", () => {
  let storage: FakeStorage;
  let saveStore: LocalStorageSaveStore;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    storage = new FakeStorage();
    saveStore = new LocalStorageSaveStore(storage);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("Contract: ISaveStore", () => {
    it("get / set / remove 시그니처 준수", () => {
      const store: ISaveStore = saveStore;
      expect(typeof store.get).toBe("function");
      expect(typeof store.set).toBe("function");
      expect(typeof store.remove).toBe("function");
    });
  });

  it("[Happy] set + get round-trip 동일성 (primitive)", () => {
    saveStore.set("num", 42);
    saveStore.set("str", "hello");
    saveStore.set("bool", true);
    expect(saveStore.get<number>("num")).toBe(42);
    expect(saveStore.get<string>("str")).toBe("hello");
    expect(saveStore.get<boolean>("bool")).toBe(true);
  });

  it("[Happy] nested object round-trip", () => {
    const payload = {
      runId: "r1",
      meta: { deck: ["DAMAGE_T1", "CRIT_T1"], coin: 1500 },
      streak: { days: 3, lastVisitedDate: "2026-05-17" },
    };
    saveStore.set("save", payload);
    const loaded = saveStore.get<typeof payload>("save");
    expect(loaded).toEqual(payload);
  });

  it("[Happy] remove → 이후 get은 null", () => {
    saveStore.set("temp", { x: 1 });
    saveStore.remove("temp");
    expect(saveStore.get("temp")).toBeNull();
  });

  it("[Boundary] 빈 객체 직렬화", () => {
    saveStore.set("empty", {});
    expect(saveStore.get("empty")).toEqual({});
  });

  it("[Boundary] 빈 배열 직렬화", () => {
    saveStore.set("empty-arr", []);
    expect(saveStore.get("empty-arr")).toEqual([]);
  });

  it("[Boundary] null 값 직렬화 (literal null)", () => {
    saveStore.set("nullVal", null);
    // JSON.stringify(null) === "null" → 저장되고 "null"로 파싱되어 null 반환
    expect(saveStore.get("nullVal")).toBeNull();
  });

  it("[Boundary] 존재하지 않는 key → null", () => {
    expect(saveStore.get("missing")).toBeNull();
  });

  it("[Boundary] 빈 문자열로 직접 저장된 키 → null (empty vs null 구분)", () => {
    storage.setItem("emptyStr", "");
    expect(saveStore.get("emptyStr")).toBeNull();
  });

  it("[Boundary] 0과 false 같은 falsy 값 round-trip", () => {
    saveStore.set("zero", 0);
    saveStore.set("flag", false);
    expect(saveStore.get<number>("zero")).toBe(0);
    expect(saveStore.get<boolean>("flag")).toBe(false);
  });

  it("[Boundary] 큰 nested 배열 (1000 entry) round-trip", () => {
    const big = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
    saveStore.set("big", big);
    const loaded = saveStore.get<typeof big>("big");
    expect(loaded?.length).toBe(1000);
    expect(loaded?.[999]).toEqual({ id: 999, name: "item-999" });
  });

  it("[Error] 손상된 JSON (parse 실패) → null + warn", () => {
    storage.setItem("corrupt", "{not json}");
    expect(saveStore.get("corrupt")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("[Error] localStorage quota 초과 (setItem throw) → graceful no-op + warn", () => {
    storage.throwOnSet = true;
    saveStore.set("anything", { x: 1 });
    expect(warnSpy).toHaveBeenCalled();
    storage.throwOnSet = false;
    expect(storage.getItem("anything")).toBeNull();
  });

  it("[Error] getItem throw (SecurityError) → null + warn", () => {
    storage.throwOnGet = true;
    expect(saveStore.get("any")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("[Error] removeItem throw → graceful no-op + warn", () => {
    storage.throwOnRemove = true;
    expect(() => saveStore.remove("x")).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("[Error] 순환 참조 객체 → JSON.stringify 실패 시 graceful no-op + warn", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    saveStore.set("cyclic", cyclic);
    expect(warnSpy).toHaveBeenCalled();
    expect(storage.getItem("cyclic")).toBeNull();
  });

  it("[Error] undefined 값 직렬화 시 graceful no-op + warn", () => {
    saveStore.set("u", undefined);
    // JSON.stringify(undefined) === undefined → 가드에서 막힘
    expect(warnSpy).toHaveBeenCalled();
    expect(storage.getItem("u")).toBeNull();
  });
});
