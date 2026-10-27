import { MaybeRefOrGetter } from "@usevibejs/ui";
export interface StorageSerializer<T> {
  read(raw: string): T;
  write(value: T): string;
}
export interface StorageOptions<T> {
  storage?: Storage;
  window?: Window;
  serializer?: StorageSerializer<T>;
  /** Defaults to synchronous writes. Manual mode persists only on write(). */
  flush?: 'sync' | 'pre' | 'post' | 'manual';
  writeDefaults?: boolean;
  listenToStorageChanges?: boolean;
  onError?: (error: unknown) => void;
}
export declare function useStorage<T>(key: MaybeRefOrGetter<string>, defaults: T, options?: StorageOptions<T>): {
  data: import("@usevibejs/ui").Ref<any, any> extends T ? T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T> : import("@usevibejs/ui").ShallowRef<T, T>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>>;
  isSupported: boolean;
  write: () => void;
  read: () => void;
  remove: () => void;
  reset: () => void;
} & {
  stop(): void;
};
export declare function useLocalStorage<T>(key: MaybeRefOrGetter<string>, defaults: T, options?: StorageOptions<T>): {
  data: import("@usevibejs/ui").Ref<any, any> extends T ? T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T> : import("@usevibejs/ui").ShallowRef<T, T>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>>;
  isSupported: boolean;
  write: () => void;
  read: () => void;
  remove: () => void;
  reset: () => void;
} & {
  stop(): void;
};
export declare function useSessionStorage<T>(key: MaybeRefOrGetter<string>, defaults: T, options?: StorageOptions<T>): {
  data: import("@usevibejs/ui").Ref<any, any> extends T ? T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T> : import("@usevibejs/ui").ShallowRef<T, T>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>>;
  isSupported: boolean;
  write: () => void;
  read: () => void;
  remove: () => void;
  reset: () => void;
} & {
  stop(): void;
};
//# sourceMappingURL=storage.d.ts.map