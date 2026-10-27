import { ComputedRef, MaybeRefOrGetter, Ref, WritableComputedRef } from "@usevibejs/ui";
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}
/** Scheduled calls return void; flush returns the most recent callback result. */
export declare function useDebounceFn<A extends unknown[], R>(fn: (...args: A) => R, ms?: MaybeRefOrGetter<number>, options?: DebounceOptions): {
  call: (...next: A) => void;
  cancel: () => void;
  flush: () => R | undefined;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useThrottleFn<A extends unknown[], R>(fn: (...args: A) => R, ms?: MaybeRefOrGetter<number>, options?: ThrottleOptions): {
  call: (...next: A) => void;
  cancel: () => void;
  flush: () => R | undefined;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useDebounce<T>(source: MaybeRefOrGetter<T>, ms?: MaybeRefOrGetter<number>, options?: DebounceOptions): {
  value: Readonly<import("@usevibejs/ui").Ref<any, any> extends T ? T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T> : import("@usevibejs/ui").ShallowRef<T, T>>;
  cancel: () => void;
  flush: () => void | undefined;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useThrottle<T>(source: MaybeRefOrGetter<T>, ms?: MaybeRefOrGetter<number>, options?: ThrottleOptions): {
  value: Readonly<import("@usevibejs/ui").Ref<any, any> extends T ? T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T> : import("@usevibejs/ui").ShallowRef<T, T>>;
  cancel: () => void;
  flush: () => void | undefined;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function usePrevious<T>(source: MaybeRefOrGetter<T>, initial?: T): {
  previous: Readonly<import("@usevibejs/ui").Ref<any, any> extends T | undefined ? import("@usevibejs/ui").ShallowRef<undefined, undefined> | (T extends T & import("@usevibejs/ui").Ref<any, any> ? 0 extends 1 & T ? import("@usevibejs/ui").ShallowRef<T, T> : T : import("@usevibejs/ui").ShallowRef<T, T>) : import("@usevibejs/ui").ShallowRef<T | undefined, T | undefined>>;
} & {
  stop(): void;
};
export interface CounterOptions {
  min?: number;
  max?: number;
}
export declare function useCounter(initial?: number, { min, max }?: CounterOptions): {
  count: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  set: (value: number) => void;
  inc: (delta?: number) => void;
  dec: (delta?: number) => void;
  reset: () => void;
};
export declare function useToggle(initial?: boolean): {
  value: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  set: (next: boolean) => void;
  toggle: () => boolean;
};
export declare function useCycle<T>(values: MaybeRefOrGetter<readonly T[]>, initialIndex?: number): {
  state: import("@usevibejs/ui").ComputedRef<T | undefined>;
  index: import("@usevibejs/ui").ComputedRef<number>;
  next: (delta?: number) => void;
  prev: (delta?: number) => void;
  reset: () => void;
};
/** Each call creates an isolated bus. Share this returned object explicitly or via provide/inject. */
export declare function useEventBus<T>(): {
  on: (listener: (event: T) => void) => () => void;
  emit: (event: T) => void;
  clear: () => void;
} & {
  stop(): void;
};
export interface RefHistoryOptions<T> {
  /** Required: choose identity for immutable values, structuredClone for cloneable values, or a domain-specific copy. */
  clone: (value: T) => T;
  /** Maximum retained snapshots, including the current snapshot. */
  capacity?: number;
  deep?: boolean | number;
}
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => (T extends Y ? 1 : 2)) ? true : false;
type Writable<R extends Ref> = R extends ComputedRef ? R extends WritableComputedRef<unknown> ? R : never : Equal<Pick<R, 'value'>, { -readonly [K in keyof Pick<R, 'value'>]: R[K]; }> extends true ? R : never;
export declare function useRefHistory<R extends Ref>(source: R & Writable<R>, options: RefHistoryOptions<R['value']>): {
  history: Readonly<import("@usevibejs/ui").ShallowRef<readonly R["value"][], readonly R["value"][]>>;
  position: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  isPaused: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  commit: () => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  pause: () => void;
  resume: () => void;
} & {
  stop(): void;
};
export {};
//# sourceMappingURL=reactivity.d.ts.map