import { computed, ref } from '@usevibejs/ui';
import { useVirtualizer, useVirtualGrid, useWindowVirtualizer } from './index.ts';
import type { VirtualItem, Virtualizer, VibeVirtualizer } from './index.ts';

function accepts<T>(_value: T): void {}
const element = ref<HTMLDivElement | null>(null);
const list = useVirtualizer<HTMLDivElement, HTMLLIElement>(() => ({
  count: 100,
  getScrollElement: () => element.value,
  estimateSize: () => 40,
  anchorTo: 'end',
  followOnAppend: 'smooth',
  laneAssignmentMode: 'measured',
}));
accepts<Virtualizer<HTMLDivElement, HTMLLIElement>>(list.virtualizer);
accepts<readonly VirtualItem[]>(list.virtualItems.value);
accepts<VibeVirtualizer<Window, HTMLDivElement>>(
  useWindowVirtualizer({ count: 20, estimateSize: () => 10 }),
);
useVirtualGrid({
  getScrollElement: () => element.value,
  rows: computed(() => ({ count: 100, estimateSize: () => 50 })),
  columns: { count: 20, estimateSize: () => 80 },
}).scrollToCell(2, 3, { align: 'center' });
// @ts-expect-error Nullable elements are required by the Core contract.
useVirtualizer({ count: 1, getScrollElement: () => undefined, estimateSize: () => 40 });
// @ts-expect-error Engine class is not deeply reactive or assignable to an item.
accepts<VirtualItem>(list.virtualizer);
// @ts-expect-error State is readonly.
list.totalSize.value = 4;
// @ts-expect-error Window virtualizers cannot target element containers.
useWindowVirtualizer({ count: 1, getScrollElement: () => element.value, estimateSize: () => 20 });
