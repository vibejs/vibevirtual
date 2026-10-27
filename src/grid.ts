import { toValue } from '@usevibejs/ui';
import type { MaybeRefOrGetter } from '@usevibejs/ui';
import type { ScrollToOptions } from '@tanstack/virtual-core';
import { useVirtualizer } from './virtualizer.ts';
import type { UseVirtualizerOptions, VibeVirtualizer } from './types.ts';

export interface UseVirtualGridOptions<
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
> {
  readonly getScrollElement: () => TScrollElement | null;
  readonly rows: MaybeRefOrGetter<
    Omit<UseVirtualizerOptions<TScrollElement, TItemElement>, 'getScrollElement' | 'horizontal'>
  >;
  readonly columns: MaybeRefOrGetter<
    Omit<UseVirtualizerOptions<TScrollElement, TItemElement>, 'getScrollElement' | 'horizontal'>
  >;
}
export interface VirtualGrid<TScrollElement extends Element, TItemElement extends Element> {
  readonly rows: VibeVirtualizer<TScrollElement, TItemElement>;
  readonly columns: VibeVirtualizer<TScrollElement, TItemElement>;
  readonly scrollToCell: (rowIndex: number, columnIndex: number, options?: ScrollToOptions) => void;
  readonly stop: () => void;
}

/** Two independent Core axes; never materializes the logical cell matrix. */
export function useVirtualGrid<
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
>(
  options: UseVirtualGridOptions<TScrollElement, TItemElement>,
): VirtualGrid<TScrollElement, TItemElement> {
  const rows = useVirtualizer<TScrollElement, TItemElement>(() => ({
    ...toValue(options.rows),
    getScrollElement: options.getScrollElement,
    horizontal: false,
  }));
  const columns = useVirtualizer<TScrollElement, TItemElement>(() => ({
    ...toValue(options.columns),
    getScrollElement: options.getScrollElement,
    horizontal: true,
  }));
  return {
    rows,
    columns,
    scrollToCell: (row, column, scrollOptions) => {
      rows.virtualizer.scrollToIndex(row, scrollOptions);
      columns.virtualizer.scrollToIndex(column, scrollOptions);
    },
    stop: () => {
      rows.stop();
      columns.stop();
    },
  };
}
