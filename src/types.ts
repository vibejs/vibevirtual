import type { ComputedRef, MaybeRefOrGetter } from '@usevibejs/ui';
import type {
  PartialKeys,
  VirtualItem,
  Virtualizer,
  VirtualizerOptions,
} from '@tanstack/virtual-core';

type PlatformOptions = 'observeElementRect' | 'observeElementOffset' | 'scrollToFn';

/** Typed direct calls plus Vibe's public function-ref ABI (unknown value, refs). */
export interface MeasureElementRef<TItemElement extends Element> {
  (element: TItemElement | null): void;
  (value: unknown, refs: Record<string, unknown>): void;
}

/** Scalar options are reactive through a whole-options getter/ref; callbacks stay callbacks. */
export type UseVirtualizerOptions<
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
> = PartialKeys<VirtualizerOptions<TScrollElement, TItemElement>, PlatformOptions>;

export type UseWindowVirtualizerOptions<TItemElement extends Element = HTMLElement> = PartialKeys<
  VirtualizerOptions<Window, TItemElement>,
  PlatformOptions | 'getScrollElement'
>;

/** Read state through these refs; the raw engine itself is deliberately not reactive. */
export interface VibeVirtualizer<
  TScrollElement extends Element | Window,
  TItemElement extends Element,
> {
  readonly virtualizer: Virtualizer<TScrollElement, TItemElement>;
  readonly virtualItems: ComputedRef<readonly VirtualItem[]>;
  readonly virtualIndexes: ComputedRef<readonly number[]>;
  readonly totalSize: ComputedRef<number>;
  readonly range: ComputedRef<Readonly<{ startIndex: number; endIndex: number }> | null>;
  readonly isScrolling: ComputedRef<boolean>;
  readonly scrollOffset: ComputedRef<number>;
  readonly scrollDirection: ComputedRef<
    Virtualizer<TScrollElement, TItemElement>['scrollDirection']
  >;
  readonly isAtEnd: ComputedRef<boolean>;
  /** Function-ref bridge: registers after insertion, prunes after removal. Set data-index. */
  readonly measureElement: MeasureElementRef<TItemElement>;
  /** Idempotently dispose early. Also runs automatically with the owning scope. */
  readonly stop: () => void;
}

export type VirtualizerSource<
  TScrollElement extends Element,
  TItemElement extends Element,
> = MaybeRefOrGetter<UseVirtualizerOptions<TScrollElement, TItemElement>>;
