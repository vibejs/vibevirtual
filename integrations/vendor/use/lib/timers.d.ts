import { MaybeRefOrGetter } from "@usevibejs/ui";
export interface IntervalOptions {
  immediate?: boolean;
  immediateCallback?: boolean;
}
export declare function useIntervalFn(callback: () => void, ms?: MaybeRefOrGetter<number>, options?: IntervalOptions): {
  isActive: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
} & {
  stop(): void;
};
export declare function useTimeoutFn(callback: () => void, ms?: MaybeRefOrGetter<number>, options?: {
  immediate?: boolean;
}): {
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  start: () => void;
  cancel: () => void;
} & {
  stop(): void;
};
export interface RafFrame {
  timestamp: number;
  delta: number;
}
export declare function useRafFn(callback: (frame: RafFrame) => void, options?: {
  immediate?: boolean;
  window?: Window;
}): {
  isSupported: boolean;
  isActive: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
} & {
  stop(): void;
};
export declare function useIdleCallback(callback: IdleRequestCallback, options?: {
  immediate?: boolean;
  timeout?: number;
  window?: Window;
}): {
  isSupported: boolean;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  start: () => void;
  cancel: () => void;
} & {
  stop(): void;
};
//# sourceMappingURL=timers.d.ts.map