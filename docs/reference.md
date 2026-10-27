# Public API reference

## Composables

| Export               | Signature / purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------- |
| useVirtualizer       | options: MaybeRefOrGetter of UseVirtualizerOptions → VibeVirtualizer                          |
| useWindowVirtualizer | options: MaybeRefOrGetter of UseWindowVirtualizerOptions → VibeVirtualizer with Window target |
| useVirtualGrid       | getScrollElement plus reactive rows/columns options → rows, columns, scrollToCell, stop       |

There is one package entry. No internal implementation paths are exported. A separate useVirtualList wrapper is omitted because it would duplicate count/key configuration without improving ownership or lifecycle.

## VibeVirtualizer result

| Property        | Type / contract                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| virtualizer     | Raw stable Virtualizer<TScrollElement,TItemElement>; access Core commands directly |
| virtualItems    | ComputedRef of readonly VirtualItem[]; Core memoized visible items                 |
| virtualIndexes  | ComputedRef of readonly number[]                                                   |
| totalSize       | ComputedRef<number>; current estimated/measured total                              |
| range           | ComputedRef of readonly startIndex/endIndex or null; excludes overscan             |
| isScrolling     | ComputedRef<boolean>                                                               |
| scrollOffset    | ComputedRef<number>; current layout offset, including Core corrections             |
| scrollDirection | ComputedRef of forward/backward/null                                               |
| isAtEnd         | ComputedRef<boolean> using scrollEndThreshold                                      |
| measureElement  | (element: TItemElement or null) → void; Vibe function-ref bridge                   |
| stop            | () → void; idempotent early disposal, also scope-owned                             |

Readonly types prevent consumer writes; Core objects are not frozen or copied. Treat VirtualItem metadata as read-only. The raw Core fields are not independently reactive; read the computed refs in reactive code.

## Configuration options

UseVirtualizerOptions preserves Core's complete options type while making observeElementRect, observeElementOffset and scrollToFn optional. Window options also make getScrollElement optional. These low-level defaults can be overridden.

Required: count, estimateSize, and getScrollElement for element virtualizers. Supported Core options include getItemKey, overscan, horizontal, enabled, initialRect, initialOffset, initialMeasurementsCache, paddingStart, paddingEnd, scrollPaddingStart, scrollPaddingEnd, gap, scrollMargin, indexAttribute, measureElement, rangeExtractor, onChange, lanes, laneAssignmentMode, anchorTo, followOnAppend, scrollEndThreshold, isRtl, useAnimationFrameWithResizeObserver, useScrollendEvent, isScrollingResetDelay, useCachedMeasurements and debug. Exact types/defaults come from pinned Core 3.19.8.

Callback options are not invoked as reactive value getters. Use the whole-options getter to read reactive scalar configuration. `shouldAdjustScrollPositionOnItemSizeChange` is assigned to the raw instance separately.

## Core methods and types

Virtualizer is exported as its original value/type. VirtualItem, VirtualizerOptions, Range, Rect, ScrollToOptions and PartialKeys are type exports. defaultKeyExtractor, defaultRangeExtractor, measureElement, elementScroll, windowScroll and all four official rect/offset observers are re-exported.

The exported standalone measureElement is Core's low-level size function, not the composable's lifecycle-aware ref callback. Use the result's measureElement for `.vibe` refs.

Core methods remain unchanged: getVirtualItems, getVirtualIndexes, getTotalSize, calculateRange, measure, resizeItem, scrollToIndex, scrollToOffset, scrollBy, scrollToEnd, cancelScroll, isAtEnd, getDistanceFromEnd and takeSnapshot. Consult the [versioned Core source](https://github.com/TanStack/virtual/tree/%40tanstack%2Fvirtual-core%403.19.8/packages/virtual-core) for engine semantics.

## TypeScript

Explicit element generics type nullable scroll refs and measured item refs. Plain options, computed options and getters infer normally. No public API introduces any; Core retains its own upstream types. Runtime and `.vibe` templates are checked separately, and the packed consumer is checked using the emitted declarations.
