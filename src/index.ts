export { useVirtualizer, useWindowVirtualizer } from './virtualizer.ts';
export { useVirtualGrid } from './grid.ts';
export type { UseVirtualGridOptions, VirtualGrid } from './grid.ts';
export type {
  MeasureElementRef,
  UseVirtualizerOptions,
  UseWindowVirtualizerOptions,
  VibeVirtualizer,
  VirtualizerSource,
} from './types.ts';
// Deliberate public exports; no private engine testing helpers.
export {
  Virtualizer,
  defaultKeyExtractor,
  defaultRangeExtractor,
  elementScroll,
  windowScroll,
  measureElement,
  observeElementRect,
  observeElementOffset,
  observeWindowRect,
  observeWindowOffset,
} from '@tanstack/virtual-core';
export type {
  PartialKeys,
  Range,
  Rect,
  ScrollToOptions,
  VirtualItem,
  VirtualizerOptions,
} from '@tanstack/virtual-core';
