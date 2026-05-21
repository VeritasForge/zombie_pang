// Domain Port: ISaveStore
// 저장소 추상화 (localStorage / IndexedDB 둘 다 대응).

export interface ISaveStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
