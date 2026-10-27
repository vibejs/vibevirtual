import { toValue } from '@usevibejs/ui';
import type { MaybeRefOrGetter } from '@usevibejs/ui';
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
} from '@tanstack/virtual-core';
import { createAdapter } from './adapter.ts';
import type { UseWindowVirtualizerOptions, VibeVirtualizer, VirtualizerSource } from './types.ts';

/** One stable Core instance with Vibe state and automatic scoped cleanup. */
export function useVirtualizer<
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
>(
  options: VirtualizerSource<TScrollElement, TItemElement>,
): VibeVirtualizer<TScrollElement, TItemElement> {
  return createAdapter(() => ({
    observeElementRect,
    observeElementOffset,
    // Core 3.19.8 normalizes RTL reads, but its default writer passes positive
    // scrollLeft through. Normalize only this I/O boundary for modern browsers.
    scrollToFn: (offset, scrollOptions, instance) => {
      const direction = instance.options.horizontal && instance.options.isRtl ? -1 : 1;
      elementScroll(
        offset * direction,
        { ...scrollOptions, adjustments: (scrollOptions.adjustments ?? 0) * direction },
        instance,
      );
    },
    ...toValue(options),
  }));
}

/** Uses the owning window's scroll/resize observers. Safe to import in Node. */
export function useWindowVirtualizer<TItemElement extends Element = HTMLElement>(
  options: MaybeRefOrGetter<UseWindowVirtualizerOptions<TItemElement>>,
): VibeVirtualizer<Window, TItemElement> {
  return createAdapter(() => ({
    getScrollElement: () => (typeof window === 'undefined' ? null : window),
    observeElementRect: observeWindowRect,
    observeElementOffset: observeWindowOffset,
    scrollToFn: windowScroll,
    initialOffset: () => (typeof window === 'undefined' ? 0 : window.scrollY),
    ...toValue(options),
  }));
}
