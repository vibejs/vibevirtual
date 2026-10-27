import { n as EventTargetInput, t as ElementTarget } from "./resource-CPI6-01n.js";
import { MaybeRefOrGetter } from "@usevibejs/ui";
export declare function useResizeObserver(target: ElementTarget, callback: ResizeObserverCallback, options?: ResizeObserverOptions): {
  isSupported: boolean;
  isActive: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  pause: () => void;
  resume: () => void;
} & {
  stop(): void;
};
export declare function useIntersectionObserver(target: ElementTarget, callback: IntersectionObserverCallback, options?: IntersectionObserverInit): {
  isSupported: boolean;
  isActive: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  pause: () => void;
  resume: () => void;
} & {
  stop(): void;
};
export declare function useMutationObserver(target: MaybeRefOrGetter<Node | null | undefined>, callback: MutationCallback, options?: MutationObserverInit): {
  isSupported: boolean;
  isActive: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  pause: () => void;
  resume: () => void;
} & {
  stop(): void;
};
/** Content-box size in CSS pixels; disconnected elements reset to zero. */
export declare function useElementSize(target: ElementTarget, initial?: {
  width: number;
  height: number;
}): {
  width: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  height: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
} & {
  stop(): void;
};
export declare function useElementBounding(target: ElementTarget, options?: {
  window?: Window;
  windowScroll?: boolean;
  windowResize?: boolean;
}): {
  x: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  y: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  width: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  height: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  top: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  right: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  bottom: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  left: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  update: () => void;
} & {
  stop(): void;
};
export declare function useFocus(target: ElementTarget<HTMLElement>, options?: {
  initialValue?: boolean;
  preventScroll?: boolean;
}): {
  focused: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  set: (value: boolean) => void;
} & {
  stop(): void;
};
export interface ClickOutsideOptions {
  document?: Document;
  ignore?: readonly ElementTarget[];
  /** Observe focus entering an outside element in addition to pointer clicks. */
  detectFocus?: boolean;
}
export declare function useClickOutside(target: ElementTarget, handler: (event: MouseEvent | FocusEvent) => void, options?: ClickOutsideOptions): {
  stop(): void;
};
export interface ScrollOptions {
  offset?: number;
  behavior?: MaybeRefOrGetter<ScrollBehavior>;
  window?: Window;
}
export declare function useScroll(target: EventTargetInput<Element | Window>, options?: ScrollOptions): {
  x: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  y: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  maxX: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  maxY: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  arrivedState: import("@usevibejs/ui").ComputedRef<{
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  }>;
  measure: () => void;
  scrollTo: (position: {
    x?: number;
    y?: number;
    behavior?: ScrollBehavior;
  }) => void;
} & {
  stop(): void;
};
//# sourceMappingURL=elements.d.ts.map