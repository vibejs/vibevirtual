# VibeVirtual

**Render Millions. Mount Only What Matters.**

Native, headless virtualization for Vibe.js, powered by **TanStack Virtual Core 3.19.8**. Vibe owns the DOM; Core owns ranges, coordinates, measurements and scroll correction.

```sh
pnpm add @usevibejs/virtual @usevibejs/ui
```

The package is prepared locally for release; no npm publication has been performed.
Vibe.js runtime and compiler must have matching versions. VibeVirtual's peer is `@usevibejs/ui ^0.1.0`.

```vibe
<script setup lang="ts">
import { useTemplateRef } from '@usevibejs/ui';
import { useVirtualizer } from '@usevibejs/virtual';
const scroll = useTemplateRef<HTMLDivElement>('scroll');
const v = useVirtualizer({ count: 100_000, getScrollElement: () => scroll.value, estimateSize: () => 40, overscan: 5 });
const items = v.virtualItems;
const total = v.totalSize;
</script>
<template>
  <div ref="scroll" tabindex="0" aria-label="Records" style="height: 400px; overflow: auto; overflow-anchor: none;">
    <div role="list" :style="{ height: `${total}px`, position: 'relative' }">
      <div v-for="item in items" :key="String(item.key)" role="listitem" :aria-posinset="item.index + 1" aria-setsize="100000"
        :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40px', transform: `translateY(${item.start}px)` }">
        Row {{ item.index }}
      </div>
    </div>
  </div>
</template>
```

For measured rows, add `:data-index="item.index"` and `:ref="v.measureElement"`, remove the fixed height, and let content determine size. For mutable datasets, set `getItemKey` to the record's stable domain ID and use its corresponding virtual key in `v-for`.

Public APIs: `useVirtualizer`, `useWindowVirtualizer`, `useVirtualGrid`. Each axis exposes the raw `virtualizer`, computed state, a measurement ref callback and an idempotent `stop()`. Use an options getter for reactive configuration. Call during component setup or an active effect scope.

The [documentation](docs/getting-started.md) covers [configuration](docs/virtualizers.md), [layouts](docs/layouts.md), [chat and restoration](docs/advanced.md), [accessibility](docs/accessibility.md), [ecosystem compositions](docs/ecosystem.md), [API reference](docs/reference.md), [limitations](docs/troubleshooting.md), and [performance](docs/performance.md). [Source investigation](docs/research.md) records runtime and engine decisions.

## Workbench

```sh
pnpm install
pnpm dev
```

Eleven interactive examples and searchable documentation share a Vibe.js/Vite application. Try 100K rows, one million logical items, measured masonry, RTL timelines, grids, VibeTable, VibeQuery, streaming chat, sticky headings, restoration and window scrolling. The diagnostic panel uses live Core state and observed DOM counts.

Optional ecosystem integrations use licensed private workspace fixtures because these packages have not yet been published. See [integrations](integrations/README.md). VibeDND is unavailable; no drag-and-drop support is claimed. No `virtual-*` Vibecn registry commands are advertised.

## Verification

```sh
pnpm check
pnpm test:browser
pnpm test:package
pnpm bench
```

Browser tests run in Chromium, Firefox and WebKit. Benchmarks derive records from indexes and distinguish bounded DOM from Core's O(count) coordinate metadata. A million logical items is neither a constant-memory claim nor a guarantee for every device. Native browser scroll extents can limit a million large rows.

MIT. See [third-party notices](THIRD-PARTY-NOTICES.md).
