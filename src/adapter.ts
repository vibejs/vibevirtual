import {
  computed,
  getCurrentScope,
  markRaw,
  onScopeDispose,
  shallowRef,
  watch,
} from '@usevibejs/ui';
import type { ComputedRef, WatchHandle } from '@usevibejs/ui';
import { Virtualizer } from '@tanstack/virtual-core';
import type { VirtualizerOptions } from '@tanstack/virtual-core';
import type { VibeVirtualizer } from './types.ts';

/** Internal bridge; Core owns calculations and observers, Vibe owns the DOM. */
export function createAdapter<
  TScrollElement extends Element | Window,
  TItemElement extends Element,
>(
  readOptions: () => VirtualizerOptions<TScrollElement, TItemElement>,
): VibeVirtualizer<TScrollElement, TItemElement> {
  if (!getCurrentScope()?.active)
    throw new Error('VibeVirtual requires an active component or effect scope.');

  const revision = shallowRef(0);
  const positionRevision = shallowRef(0);
  const commitRevision = shallowRef(0);
  let commitVersion = 0;
  const pending = new Set<TItemElement>();
  let disposed = false;
  let scheduled = false;
  let reconnect = false;

  // Watch callbacks run untracked: engine reads must not subscribe the options watcher
  // to its own invalidation signal or to unrelated consumer effects.
  const read = () => {
    const options = readOptions();
    const element = options.getScrollElement();
    return {
      ...options,
      getScrollElement: () =>
        element && (!('isConnected' in element) || element.isConnected) ? element : null,
    };
  };
  const initial = read();
  let observeOffset = initial.observeElementOffset;
  const observeElementOffset: typeof observeOffset = (instance, callback) =>
    observeOffset(instance, (offset, scrolling) => {
      if (disposed) return;
      callback(offset, scrolling);
      // Core only calls onChange when its range/scrolling state changes. Piggyback
      // on its existing observer for precise offset/end-state, without another listener.
      positionRevision.value += 1;
    });
  const virtualizer = markRaw(
    new Virtualizer<TScrollElement, TItemElement>({
      ...initial,
      observeElementOffset,
      onChange: changed,
    }),
  );
  let onChange = initial.onChange;
  const cleanup = virtualizer._didMount();

  function scheduleCommit(): void {
    if (scheduled || disposed) return;
    scheduled = true;
    // A post watcher belongs to the same flush as options and DOM updates,
    // so the viewport is attached before consumers resume from nextTick.
    commitRevision.value = ++commitVersion;
  }

  const stopCommit = watch(
    commitRevision,
    () => {
      scheduled = false;
      if (reconnect) {
        reconnect = false;
        cleanup();
      }
      // Supported framework-adapter protocol, after the sizer and rows commit.
      virtualizer._willUpdate();
      virtualizer.measureElement(null);
      for (const element of pending) {
        if (element.isConnected && virtualizer.options.enabled) virtualizer.measureElement(element);
      }
      pending.clear();
    },
    { flush: 'post' },
  );

  function changed(instance: Virtualizer<TScrollElement, TItemElement>, sync: boolean): void {
    if (disposed) return;
    revision.value += 1;
    scheduleCommit();
    onChange?.(instance, sync);
  }

  let stopOptions: WatchHandle | null = watch(read, (options) => {
    const previous = virtualizer.options;
    reconnect ||=
      options.observeElementOffset !== observeOffset ||
      options.observeElementRect !== previous.observeElementRect ||
      (options.useScrollendEvent ?? false) !== previous.useScrollendEvent ||
      (options.isScrollingResetDelay ?? 150) !== previous.isScrollingResetDelay;
    const orientationChanged = !!options.horizontal !== previous.horizontal;
    observeOffset = options.observeElementOffset;
    onChange = options.onChange;
    virtualizer.setOptions({ ...options, observeElementOffset, onChange: changed });
    if (orientationChanged) virtualizer.measure();
    revision.value += 1;
    scheduleCommit();
  });

  const state = <T>(get: () => T): ComputedRef<T> =>
    computed(() => {
      void revision.value;
      return get();
    });
  const position = <T>(get: () => T): ComputedRef<T> =>
    state(() => {
      void positionRevision.value;
      return get();
    });

  const stop = () => {
    if (disposed) return;
    disposed = true;
    stopOptions!();
    stopOptions = null;
    stopCommit();
    pending.clear();
    cleanup();
    virtualizer.elementsCache.clear();
    onChange = undefined;
    // Release the captured scroll element and block accidental reconnection via Core.
    virtualizer.setOptions({
      ...virtualizer.options,
      enabled: false,
      getScrollElement: () => null,
      onChange: undefined,
    });
    revision.value += 1;
  };
  onScopeDispose(stop);
  scheduleCommit();

  return {
    virtualizer,
    virtualItems: state(() => virtualizer.getVirtualItems()),
    virtualIndexes: state(() => virtualizer.getVirtualIndexes()),
    totalSize: state(() => virtualizer.getTotalSize()),
    range: state(() => virtualizer.calculateRange()),
    isScrolling: state(() => virtualizer.isScrolling),
    scrollOffset: position(() => virtualizer.scrollOffset ?? 0),
    scrollDirection: position(() => virtualizer.scrollDirection),
    isAtEnd: position(() => virtualizer.isAtEnd()),
    measureElement: (element: unknown) => {
      if (disposed) return;
      if (element !== null) {
        if (typeof element !== 'object' || !('nodeType' in element) || element.nodeType !== 1)
          throw new TypeError('VibeVirtual measureElement expects a DOM element or null.');
        pending.add(element as TItemElement);
      }
      scheduleCommit();
    },
    stop,
  };
}
