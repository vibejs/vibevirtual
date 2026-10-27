import { MaybeRefOrGetter } from "@usevibejs/ui";
type EventTargetInput<T extends EventTarget = EventTarget> = MaybeRefOrGetter<T | null | undefined>;
type EventMap<T> = T extends Window ? WindowEventMap : T extends Document ? DocumentEventMap : T extends HTMLElement ? HTMLElementEventMap : Record<string, Event>;
declare function useEventListener<T extends EventTarget, K extends keyof EventMap<T> & string>(target: EventTargetInput<T>, event: K, listener: (event: EventMap<T>[K]) => void, options?: AddEventListenerOptions | boolean): {
  stop(): void;
};
declare function useEventListener(target: EventTargetInput, event: string, listener: EventListener, options?: AddEventListenerOptions | boolean): {
  stop(): void;
};
type ElementTarget<T extends Element = Element> = import('@usevibejs/ui').MaybeRefOrGetter<T | null | undefined>;
export { EventTargetInput as n, useEventListener as r, ElementTarget as t };
//# sourceMappingURL=resource-CPI6-01n.d.ts.map