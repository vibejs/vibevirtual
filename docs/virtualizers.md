# Virtualizers

## Element virtualizer

`useVirtualizer<TScrollElement, TItemElement>(options)` supplies element rect/offset observers and elementScroll. Defaults use HTMLElement types; explicit HTMLDivElement or HTMLLIElement generics improve template-ref checking. The getter returns the actual scrolling element, or null. A wrapper surrounding a scroll viewport is not necessarily the scroll element.

## Window virtualizer

`useWindowVirtualizer<TItemElement>(options)` uses Core's window rect/offset observers and windowScroll. Its default getter is browser-safe. Supply scrollMargin for content above the list; item transforms subtract that margin. The Window feed measures its header separately, without duplicating Core's viewport observer. Use scrollPaddingStart for a fixed header.

<!-- example:WindowFeed -->

## Reactive configuration

Pass a plain options object, a ref/computed of the whole options object, or a getter returning it. Read reactive scalar values in that getter: count, overscan, horizontal, enabled, gap, lanes and padding. The adapter also tracks reads inside getScrollElement.

Changing horizontal reconnects the axis observers and reads the new axis's current native scroll position. Switching axes does not reuse the previous axis's offset or reapply initialOffset.

Callbacks remain callbacks. An estimateSize closure that reads a reactive row-height value does not itself cause Core to invalidate cached coordinates. After changing the estimation policy or known responsive size model, call `virtualizer.measure()` from a post-flush watch. Dynamic mounted elements normally remeasure through ResizeObserver automatically.

For collection changes, read the array in the options getter and close getItemKey over that snapshot. A stable callback reading a mutable array behind Core's back can leave memoized identity mappings stale. Do not mutate previously captured arrays in place; replace the array reference.

## Item keys

Data ID, virtual key and `.vibe` key must identify the same record. `VirtualItem.index` and `data-index` identify its current position. DOM nodes retain keys while their index attributes update during reconciliation. Measurements are keyed by domain identity; a row moved to another index retains its own measured size.

## Measurements

Estimate a plausible size before mount. Add `data-index` (or your custom indexAttribute), `:ref="v.measureElement"`, and remove fixed-height CSS. Core shares an item ResizeObserver and handles expansion, wrapping, images and font changes. Use border-box sizes; represent inter-item spacing with gap instead of margins outside the measured box.

Use `resizeItem(index, size)` for known sizes. Avoid driving the same item with both resizeItem and DOM measurement. `measure()` discards measured sizes and recalculates from estimates. Snapshots are measured metadata, not a second application cache.

`useAnimationFrameWithResizeObserver` defers observer work to animation frames. It is available but adds latency; enable only for a measured need. No RO feedback loop should write row dimensions from the measurement it just read.

## Overscan

Overscan trades extra DOM and computation for a buffer during fast scrolling. Start with 3–6. For lanes, Core counts overscan in rows of lanes. Focus preservation or sticky range extraction can legitimately add items beyond the normal buffer.

## Scroll controls

Call `v.virtualizer.scrollToIndex(index, { align: 'start' })`, `scrollToOffset`, `scrollBy`, `scrollToEnd` and `cancelScroll`. Start means offset zero. Core clamps index navigation to its valid range; an empty range has no index target. Alignments are start, center, end and auto.

Smooth browser scrolling is best effort, especially with unknown sizes and far targets. Core reconciles moving targets and can finish with instant corrections. Cancellation is not a promise that already delivered browser scroll events disappear. Respect reduced-motion preferences when choosing behavior.
