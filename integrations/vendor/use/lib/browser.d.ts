import { n as EventTargetInput, r as useEventListener, t as ElementTarget } from "./resource-CPI6-01n.js";
import { MaybeRefOrGetter } from "@usevibejs/ui";
export declare function useWindowSize(options?: {
  window?: Window;
  initialWidth?: number;
  initialHeight?: number;
}): {
  width: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
  height: Readonly<import("@usevibejs/ui").ShallowRef<number, number>>;
} & {
  stop(): void;
};
export declare function useMediaQuery(query: MaybeRefOrGetter<string>, options?: {
  window?: Window;
  initialValue?: boolean;
}): {
  matches: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  isSupported: boolean;
} & {
  stop(): void;
};
export declare function usePreferredDark(options?: {
  window?: Window;
  initialValue?: boolean;
}): {
  matches: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  isSupported: boolean;
} & {
  stop(): void;
};
export declare function useDocumentVisibility(doc?: Document | undefined): {
  visibility: Readonly<import("@usevibejs/ui").ShallowRef<DocumentVisibilityState, DocumentVisibilityState>>;
} & {
  stop(): void;
};
export declare function useOnline(win?: Window | undefined): {
  isOnline: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function useSupported(check: () => boolean): {
  isSupported: import("@usevibejs/ui").ComputedRef<boolean>;
};
export declare function useClipboard(options?: {
  navigator?: Navigator;
}): {
  copy: (value: string) => Promise<boolean>;
  isSupported: boolean;
  text: Readonly<import("@usevibejs/ui").ShallowRef<string, string>>;
  copied: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>>;
  isPending: Readonly<import("@usevibejs/ui").ShallowRef<boolean, boolean>>;
} & {
  stop(): void;
};
export declare function usePermission(descriptor: PermissionDescriptor, options?: {
  navigator?: Navigator;
}): {
  state: Readonly<import("@usevibejs/ui").ShallowRef<"unknown" | "unsupported" | PermissionState, "unknown" | "unsupported" | PermissionState>>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>>;
  isSupported: boolean;
  query: () => Promise<void>;
} & {
  stop(): void;
};
export type ColorPreference = 'auto' | 'light' | 'dark';
export interface DarkOptions {
  /** No element is changed unless a target is explicitly provided. */
  target?: ElementTarget;
  className?: string;
  initialValue?: ColorPreference;
  /** Persistence is opt-in. */
  storageKey?: string;
  storage?: Storage;
  window?: Window;
}
export declare function useDark(options?: DarkOptions): {
  preference: import("@usevibejs/ui").ShallowRef<ColorPreference, ColorPreference>;
  isDark: import("@usevibejs/ui").ComputedRef<boolean>;
  error: Readonly<import("@usevibejs/ui").ShallowRef<unknown, unknown>> | undefined;
  set: (value: ColorPreference) => void;
  toggle: () => void;
} & {
  stop(): void;
};
export declare function useTitle(title: MaybeRefOrGetter<string>, options?: {
  document?: Document;
  restoreOnStop?: boolean;
}): {
  stop(): void;
};
export declare function useFavicon(href: MaybeRefOrGetter<string | null>, options?: {
  document?: Document;
  rel?: string;
}): {
  stop(): void;
};
export { EventTargetInput, useEventListener };
//# sourceMappingURL=browser.d.ts.map