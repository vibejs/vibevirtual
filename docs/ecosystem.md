# Ecosystem integrations

All integrations are optional application compositions. The published library depends only on TanStack Virtual Core and the Vibe.js peer runtime.

## VibeTable

The tested fixture uses the actual public VibeTable API and TanStack Table 9.3.1. VibeTable owns sorting, filtering, stable row IDs, column sizes and selection; VibeVirtual reads its current row/column models. The workbench renders 100,000 customers with both axes virtualized, a sticky header, expandable rows, search, score sorting and row navigation.

<!-- example:DataTable -->

## VibeQuery

The Infinite results example installs createVibeQueryPlugin with an explicit QueryClient and calls useInfiniteQuery. Its query function consumes AbortSignal; pages, deduplication, retry/error state, refetch and query-key updates belong to Query Core. Viewport boundary detection gates additional requests. Filter changes reset to top; background refetch preserves location.

The deterministic fixture is a bounded 500-result source with a 50-row page. It can simulate failure/cancellation and demonstrate manual retry; it does not claim to be a production endpoint.

## VibeDND

The provided VibeDND directory was empty during investigation. No drag, overlay, autoscroll, offscreen collision, cross-container or keyboard-sorting API could be verified. There is no supported Kanban demo. A future integration must retain the dragged ID, use the engine's supported overlay and virtual collision mechanisms, and verify offscreen autoscroll/reordering before claiming support.

## VibeUse

The diagnostic panel uses its scoped useMutationObserver to count descendant elements. The window composition uses useResizeObserver only for content **above** the Core viewport. Core's own ResizeObserver remains responsible for virtualization and item measurement.

## VibeMotion

Dynamic cards reuse useMotion on an inner wrapper. The virtual template owns the outer translateY. Motion changes the inner surface's opacity, without re-running an entrance animation on every viewport remount. Layout animations that write the virtual positioning transform would conflict and are not a supported composition.

## Vibecn

The workbench copies and reuses the registry's Button, Input, Badge and Skeleton sources and includes their license. It does not make Vibecn a runtime dependency or recreate those controls. The virtual table uses a custom role-based layout because the existing Table wraps a native table with its own overflow container; nested scrolling would give the virtualizers the wrong viewport.

ScrollArea's inner scroll-area-viewport is the actual scroller; a ref to its wrapper is insufficient. The current Command/Combobox collection helpers query mounted descendants and cannot automatically navigate virtualized indexes. A large virtual selector needs a logical keyboard/focus controller before it can safely be exposed. No `add virtual-list` or similar registry command exists in this project.

## Reproducible fixtures

These ecosystem packages were available locally but not published to npm. Private workspace snapshots record source commits and licenses in integrations/vendor. They are excluded from the npm tarball. Replace them with published dependencies when the ecosystem releases them; there are no external filesystem dependencies in the library package.
