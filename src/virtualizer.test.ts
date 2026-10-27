import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, isProxy, nextTick, ref, shallowRef } from '@usevibejs/ui';
import type { EffectScope } from '@usevibejs/ui';
import {
  defaultRangeExtractor,
  useVirtualizer,
  useWindowVirtualizer,
  useVirtualGrid,
} from './index.ts';
import type { UseVirtualizerOptions, VirtualizerOptions } from './index.ts';

const scopes: EffectScope[] = [];
function scoped<T>(fn: () => T): { value: T; scope: EffectScope } {
  const scope = effectScope();
  scopes.push(scope);
  return { value: scope.run(fn)!, scope };
}
async function flush() {
  await nextTick();
  await nextTick();
  await nextTick();
}
function element() {
  const node = document.createElement('div');
  Object.defineProperties(node, {
    clientWidth: { value: 200 },
    clientHeight: { value: 100 },
    scrollHeight: { value: 10_000_000 },
    scrollWidth: { value: 10_000_000 },
  });
  document.body.append(node);
  node.scrollTo = vi.fn<() => void>();
  return node;
}
function harness(extra: Partial<UseVirtualizerOptions<HTMLDivElement, HTMLDivElement>> = {}) {
  const target = shallowRef<HTMLDivElement | null>(null);
  const count = ref(100);
  const enabled = ref(true);
  const overscan = ref(2);
  const horizontal = ref(false);
  let offset: (offset: number, scrolling: boolean) => void = () => {};
  let rect: (rect: { width: number; height: number }) => void = () => {};
  const disconnectRect = vi.fn<() => void>();
  const disconnectOffset = vi.fn<() => void>();
  const observeRect: VirtualizerOptions<HTMLDivElement, HTMLDivElement>['observeElementRect'] = (
    _instance,
    callback,
  ) => {
    rect = callback;
    callback({ width: 200, height: 100 });
    return disconnectRect;
  };
  const observeOffset: VirtualizerOptions<
    HTMLDivElement,
    HTMLDivElement
  >['observeElementOffset'] = (_instance, callback) => {
    offset = callback;
    callback(0, false);
    return disconnectOffset;
  };
  const onChange = vi.fn<() => void>();
  const { value: v, scope } = scoped(() =>
    useVirtualizer<HTMLDivElement, HTMLDivElement>(() => ({
      count: count.value,
      enabled: enabled.value,
      overscan: overscan.value,
      horizontal: horizontal.value,
      getScrollElement: () => target.value,
      estimateSize: () => 20,
      observeElementRect: observeRect,
      observeElementOffset: observeOffset,
      onChange,
      ...extra,
    })),
  );
  return {
    v,
    scope,
    target,
    count,
    enabled,
    overscan,
    horizontal,
    onChange,
    disconnectRect,
    disconnectOffset,
    offset: (n: number, scrolling = true) => offset(n, scrolling),
    rect: (width: number, height: number) => rect({ width, height }),
  };
}
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('native reactive bridge', () => {
  it('requires an active scope', () => {
    expect(() =>
      useVirtualizer({ count: 0, getScrollElement: () => null, estimateSize: () => 20 }),
    ).toThrow('active component or effect scope');
    const stopped = effectScope();
    stopped.stop();
    expect(stopped.active).toBe(false);
  });
  it('attaches before the first nextTick so initial scroll commands reach the viewport', async () => {
    const scrollToFn = vi.fn<() => void>();
    const h = harness({ scrollToFn });
    h.target.value = element();
    await nextTick();
    expect(h.v.virtualizer.scrollElement).toBe(h.target.value);
    expect(h.v.virtualItems.value.length).toBeGreaterThan(0);
    h.v.virtualizer.scrollToIndex(50, { align: 'start' });
    expect(scrollToFn).toHaveBeenCalledWith(1000, expect.anything(), h.v.virtualizer);
  });
  it('cancels the initial commit when its scope stops before the first flush', async () => {
    const h = harness();
    h.target.value = element();
    h.scope.stop();
    await nextTick();
    expect(h.v.virtualizer.scrollElement).toBeNull();
    expect(h.disconnectRect).not.toHaveBeenCalled();
    expect(h.disconnectOffset).not.toHaveBeenCalled();
  });
  it('creates once without an element, attaches, replaces, disappears, and disposes', async () => {
    const h = harness();
    const engine = h.v.virtualizer;
    expect(isProxy(engine)).toBe(false);
    expect(h.v.virtualItems.value).toEqual([]);
    expect(h.v.scrollOffset.value).toBe(0);
    await flush();
    expect(engine.scrollElement).toBeNull();
    h.target.value = element();
    await flush();
    expect(engine.scrollElement).toBe(h.target.value);
    expect(h.v.virtualItems.value.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(h.v.virtualIndexes.value).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(h.v.range.value).toEqual({ startIndex: 0, endIndex: 4 });
    expect(h.v.totalSize.value).toBe(2000);
    h.target.value = element();
    await flush();
    expect(h.disconnectRect).toHaveBeenCalledTimes(1);
    h.target.value = null;
    await flush();
    expect(h.disconnectOffset).toHaveBeenCalledTimes(2);
    expect(engine.scrollElement).toBeNull();
    h.target.value = element();
    await flush();
    h.scope.stop();
    h.v.stop();
    await flush();
    expect(h.disconnectRect).toHaveBeenCalledTimes(3);
    expect(engine.scrollElement).toBeNull();
    expect(engine.targetWindow).toBeNull();
    expect(engine.elementsCache.size).toBe(0);
    h.count.value = 500;
    h.offset(50);
    await flush();
    expect(engine.options.enabled).toBe(false);
    expect(h.v.virtualItems.value).toEqual([]);
    expect(h.v.virtualizer).toBe(engine);
  });
  it('reacts to count, empty states, enabled, overscan, dimensions and orientation', async () => {
    const h = harness();
    h.target.value = element();
    await flush();
    h.count.value = 1000;
    h.overscan.value = 4;
    await flush();
    expect(h.v.totalSize.value).toBe(20_000);
    expect(h.v.virtualItems.value).toHaveLength(9);
    h.rect(200, 200);
    await flush();
    expect(h.v.range.value?.endIndex).toBe(9);
    h.horizontal.value = true;
    await flush();
    expect(h.v.virtualizer.options.horizontal).toBe(true);
    h.enabled.value = false;
    await flush();
    expect(h.v.virtualItems.value).toEqual([]);
    expect(h.v.isScrolling.value).toBe(false);
    h.enabled.value = true;
    await flush();
    expect(h.v.virtualItems.value.length).toBeGreaterThan(0);
    h.count.value = 0;
    await flush();
    expect(h.v.totalSize.value).toBe(0);
    expect(h.v.range.value).toBeNull();
    h.count.value = 3;
    await flush();
    expect(h.v.virtualItems.value).toHaveLength(3);
  });
  it('updates precise offsets without reconciling the same virtual window', async () => {
    const h = harness();
    h.target.value = element();
    await flush();
    h.offset(5);
    await flush();
    expect(h.v.isScrolling.value).toBe(true);
    const items = h.v.virtualItems.value;
    const changed = h.onChange.mock.calls.length;
    h.offset(6);
    await flush();
    expect(h.v.scrollOffset.value).toBe(6);
    expect(h.onChange).toHaveBeenCalledTimes(changed);
    expect(h.v.virtualItems.value).toBe(items);
    expect(h.v.scrollDirection.value).toBe('forward');
    h.offset(4);
    expect(h.v.scrollDirection.value).toBe('backward');
    h.offset(4, false);
    expect(h.v.isScrolling.value).toBe(false);
  });
  it('supports ref/computed options and callback replacement without feedback', async () => {
    const node = element();
    const changed = vi.fn<() => void>();
    const options = shallowRef<UseVirtualizerOptions<HTMLDivElement>>({
      count: 50,
      getScrollElement: () => node,
      estimateSize: () => 10,
      initialRect: { width: 100, height: 100 },
    });
    const { value: v } = scoped(() => useVirtualizer(computed(() => options.value)));
    await flush();
    options.value = { ...options.value, count: 80, onChange: changed, overscan: 5 };
    await flush();
    expect(v.totalSize.value).toBe(800);
    v.virtualizer.resizeItem(0, 25);
    expect(changed).toHaveBeenCalled();
    options.value = { ...options.value, onChange: undefined };
    await flush();
    const calls = changed.mock.calls.length;
    v.virtualizer.resizeItem(1, 30);
    expect(changed).toHaveBeenCalledTimes(calls);
  });
  it('cleans before reconnecting observer configuration', async () => {
    const node = element();
    const disconnected = vi.fn<() => void>();
    const callback = shallowRef<
      VirtualizerOptions<HTMLDivElement, HTMLDivElement>['observeElementOffset']
    >(() => disconnected);
    const { value: v } = scoped(() =>
      useVirtualizer({
        count: 2,
        getScrollElement: () => node,
        estimateSize: () => 20,
        get observeElementOffset() {
          return callback.value;
        },
      }),
    );
    await flush();
    callback.value = () => disconnected;
    await flush();
    expect(disconnected).toHaveBeenCalledTimes(1);
    expect(v.virtualizer.scrollElement).toBe(node);
  });
  it('ignores detached candidates and queued work after disposal', async () => {
    const h = harness();
    h.target.value = document.createElement('div');
    await flush();
    expect(h.v.virtualizer.scrollElement).toBeNull();
    h.v.stop();
    h.v.measureElement(document.createElement('div'));
    await flush();
    expect(h.v.virtualizer.elementsCache.size).toBe(0);
  });
});

describe('Core calculations remain authoritative', () => {
  it.each([100, 1000, 10_000, 100_000, 1_000_000])(
    'bounds visible items for %i logical rows',
    async (count) => {
      const h = harness();
      h.count.value = count;
      h.target.value = element();
      await flush();
      expect(h.v.virtualItems.value.length).toBeLessThan(15);
      h.offset((count - 10) * 20);
      await flush();
      expect(h.v.virtualItems.value.some((x) => x.index === count - 10)).toBe(true);
      expect(h.v.totalSize.value).toBe(count * 20);
    },
  );
  it('supports padding, gap, sticky extraction and custom keys', async () => {
    const h = harness({
      paddingStart: 10,
      paddingEnd: 15,
      gap: 2,
      getItemKey: (index) => `id-${index}`,
      rangeExtractor: (range) =>
        [...new Set([0, ...defaultRangeExtractor(range)])].sort((a, b) => a - b),
    });
    h.target.value = element();
    await flush();
    h.offset(1000);
    await flush();
    expect(h.v.virtualItems.value[0].key).toBe('id-0');
    expect(h.v.virtualItems.value[0].start).toBe(10);
    expect(h.v.totalSize.value).toBe(2223);
  });
  it('defers measurement, handles removal/null refs and exports snapshots', async () => {
    const measured = vi.fn<(node: HTMLDivElement) => number>((node) => Number(node.dataset.size));
    const h = harness({ measureElement: measured });
    h.target.value = element();
    await flush();
    const row = element();
    row.dataset.index = '0';
    row.dataset.size = '50';
    h.v.measureElement(row);
    expect(measured).not.toHaveBeenCalled();
    await flush();
    expect(measured).toHaveBeenCalled();
    expect(h.v.totalSize.value).toBe(2030);
    expect(h.v.virtualizer.takeSnapshot()[0]).toMatchObject({ key: 0, size: 50 });
    row.remove();
    h.v.measureElement(null);
    await flush();
    expect(h.v.virtualizer.elementsCache.size).toBe(0);
    const detached = document.createElement('div');
    h.v.measureElement(detached);
    await flush();
    expect(h.v.virtualizer.elementsCache.size).toBe(0);
    h.v.measureElement(row);
    h.v.stop();
    await flush();
    expect(h.v.virtualizer.elementsCache.size).toBe(0);
  });
  it('keeps keyed sizes through reorder, insertion, deletion and replacement', async () => {
    const data = shallowRef(['a', 'b', 'c']);
    const node = element();
    const { value: v } = scoped(() =>
      useVirtualizer(() => {
        const items = data.value;
        return {
          count: items.length,
          getItemKey: (index: number) => items[index],
          getScrollElement: () => node,
          estimateSize: () => 20,
          initialRect: { width: 100, height: 100 },
        };
      }),
    );
    await flush();
    v.virtualizer.resizeItem(1, 80);
    data.value = ['b', 'a', 'c'];
    await flush();
    expect(v.virtualItems.value[0]).toMatchObject({ key: 'b', size: 80 });
    data.value = ['x', 'b', 'a', 'c', 'z'];
    await flush();
    expect(v.virtualItems.value[1].size).toBe(80);
    data.value = ['b', 'c'];
    await flush();
    expect(v.totalSize.value).toBe(100);
    data.value = ['new'];
    await flush();
    expect(v.totalSize.value).toBe(20);
  });
  it('uses Core for lane changes and restoration seeds', async () => {
    const h = harness({
      lanes: 2,
      laneAssignmentMode: 'measured',
      initialOffset: 100,
      initialMeasurementsCache: [{ key: 0, index: 0, size: 70, start: 0, end: 70, lane: 0 }],
    });
    h.target.value = element();
    await flush();
    expect(h.v.virtualizer.itemSizeCache.get(0)).toBe(70);
    expect(h.v.virtualizer.options.laneAssignmentMode).toBe('measured');
  });
});

describe('window defaults', () => {
  it('is safe without browser globals', async () => {
    vi.stubGlobal('window', undefined);
    const { value: v } = scoped(() => useWindowVirtualizer({ count: 10, estimateSize: () => 40 }));
    await flush();
    expect(v.virtualizer.scrollElement).toBeNull();
    expect(v.virtualItems.value).toEqual([]);
    expect(v.scrollOffset.value).toBe(0);
  });
  it('attaches to the window and releases it', async () => {
    vi.stubGlobal('scrollTo', vi.fn<() => void>());
    const { value: v, scope } = scoped(() =>
      useWindowVirtualizer({ count: 100, estimateSize: () => 30 }),
    );
    await flush();
    expect(v.virtualizer.scrollElement).toBe(window);
    expect(v.virtualItems.value.length).toBeGreaterThan(0);
    scope.stop();
    expect(v.virtualizer.scrollElement).toBeNull();
  });
  it('allows an explicit window target and initial offset override', async () => {
    const { value: v } = scoped(() =>
      useWindowVirtualizer({
        count: 10,
        getScrollElement: () => null,
        estimateSize: () => 30,
        initialOffset: 50,
      }),
    );
    await flush();
    expect(v.virtualizer.scrollElement).toBeNull();
    expect(v.scrollOffset.value).toBe(0);
  });
});

it('invalidates end state precisely and ignores a stale subscriber after disposal', async () => {
  const h = harness();
  h.target.value = element();
  await flush();
  expect(h.v.isAtEnd.value).toBe(false);
  const oldNotify = h.v.virtualizer.options.onChange;
  h.v.stop();
  oldNotify(h.v.virtualizer, false);
  expect(h.v.virtualizer.options.getScrollElement()).toBeNull();
  expect(h.v.isAtEnd.value).toBe(true);
});

it('checks Vibe function-ref values without reading browser constructors', () => {
  const h = harness();
  expect(() => h.v.measureElement('not an element', {})).toThrow('DOM element or null');
  expect(() => h.v.measureElement({}, {})).toThrow('DOM element or null');
  expect(() => h.v.measureElement(document.createTextNode('text'), {})).toThrow(
    'DOM element or null',
  );
});

it('normalizes default RTL programmatic writes and adjustments at the Core boundary', async () => {
  const node = element();
  const { value: v } = scoped(() =>
    useVirtualizer<HTMLDivElement>({
      count: 100,
      getScrollElement: () => node,
      estimateSize: () => 50,
      horizontal: true,
      isRtl: true,
    }),
  );
  await flush();
  v.virtualizer.scrollToOffset(200);
  expect(node.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: -200 }));
  v.virtualizer.options.scrollToFn(300, { adjustments: 10 }, v.virtualizer);
  expect(node.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: -310 }));
});

it('reconnects changed observer timing and skips disabled pending measurements', async () => {
  const timing = ref(150);
  const endEvent = ref(false);
  const enabled = ref(true);
  const node = element();
  const { value: v } = scoped(() =>
    useVirtualizer(() => ({
      count: 10,
      getScrollElement: () => node,
      estimateSize: () => 20,
      isScrollingResetDelay: timing.value,
      useScrollendEvent: endEvent.value,
      enabled: enabled.value,
    })),
  );
  await flush();
  timing.value = 50;
  await flush();
  endEvent.value = true;
  await flush();
  const row = element();
  row.dataset.index = '0';
  enabled.value = false;
  v.measureElement(row);
  await flush();
  expect(v.virtualizer.elementsCache.size).toBe(0);
});

it('coordinates two grid axes and cell navigation without a cell matrix', async () => {
  const node = element();
  const count = ref(100_000);
  const { value: grid } = scoped(() =>
    useVirtualGrid({
      getScrollElement: () => node,
      rows: () => ({ count: count.value, estimateSize: () => 20 }),
      columns: { count: 1000, estimateSize: () => 100 },
    }),
  );
  await flush();
  expect(grid.rows.virtualItems.value.length).toBeLessThan(15);
  expect(grid.columns.virtualItems.value.length).toBeLessThan(10);
  grid.scrollToCell(5000, 500, { align: 'start' });
  expect(node.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 100_000 }));
  expect(node.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 50_000 }));
  count.value = 10;
  await flush();
  expect(grid.rows.totalSize.value).toBe(200);
  grid.stop();
  expect(grid.rows.virtualizer.scrollElement).toBeNull();
  expect(grid.columns.virtualizer.scrollElement).toBeNull();
});
