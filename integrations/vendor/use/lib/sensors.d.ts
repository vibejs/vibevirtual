import { n as EventTargetInput, t as ElementTarget } from "./resource-CPI6-01n.js";
export interface MouseOptions {
  target?: EventTargetInput;
  type?: 'client' | 'page';
  initialX?: number;
  initialY?: number;
}
export declare function useMouse(options?: MouseOptions): {
  x: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  y: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  hasPosition: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useMouseInElement(target: ElementTarget, options?: Omit<MouseOptions, 'type'>): {
  stop(): void;
  x: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  y: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  hasPosition: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  elementX: import("@usevibejs/ui").ComputedRef<number>;
  elementY: import("@usevibejs/ui").ComputedRef<number>;
  isOutside: import("@usevibejs/ui").ComputedRef<boolean>;
} & {
  stop(): void;
};
export interface KeyOptions {
  target?: EventTargetInput;
  window?: Window;
  includeInputs?: boolean;
}
export declare function useKeyPressed(key: string, options?: KeyOptions): {
  pressed: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export type KeyModifier = 'Alt' | 'Control' | 'Meta' | 'Shift';
export declare function useKeyModifier(modifier: KeyModifier, options?: KeyOptions): {
  active: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useDevicePixelRatio(options?: {
  window?: Window;
}): {
  pixelRatio: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
} & {
  stop(): void;
};
//# sourceMappingURL=sensors.d.ts.map