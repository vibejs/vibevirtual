# Source investigation

Investigated 2026-10-26 before implementation. Exact engine: **@tanstack/virtual-core 3.19.8**, npm stable dist-tag confirmed through the registry, then its published `src/index.ts`, ESM declarations, and package exports inspected. Runtime/compiler: **@usevibejs/ui 0.1.0** / **@usevibejs/compiler 0.1.0**.

## Vibe.js findings

Read AGENTS.md, CONTRACTS.md, decisions 0001/0004/0005/0006, public index/component types, reactivity refs/computed/effectScope, runtime templateRef/scheduler/watch/lifecycle/inject/component/block/for/renderEffect/events, compiler codegen/transforms and behavior tests, keyed reconciliation tests, fidelity browser tests, compile benchmarks, and ecosystem `.vibe` applications.

- Template refs are shallow readonly refs, initially null. String refs require useTemplateRef. Function refs receive the node during render **before insertion**, then null during scope disposal **before removal**. Measurement must wait for the DOM commit.
- Setup executes once per component instance in its effect scope. onMounted runs after insertion. Scope disposal stops effects and invokes cleanups; disposed scheduler jobs do not run. Child scopes own keyed item effects.
- Ref/computed dependencies drive individual compiled DOM effects. watch callbacks are untracked. A pre watcher can apply Core options without accidentally subscribing to Core's reactive consumers; a post watcher/nextTick observes committed DOM.
- nextTick resolves after main and post queues drain. Updates batch in microtasks, with parent jobs before children. No public synchronous render flush exists.
- v-for always uses keyed reconciliation. Retained keys preserve blocks and components and update the item/index shallow refs in place. Removed keys dispose scopes, listeners, refs, and component instances. v-if disposes its old branch. Runtime insertion/removal owns the DOM; adapters must not remove rows.
- Templates unwrap setup refs; nested refs in a plain object need `.value`. Events compile through runtime handlers with cleanup. Props and slot props are getters. Mutable datasets need domain IDs for both getItemKey and :key.
- Client rendering only; no SSR/hydration claims. Public APIs suffice; no imports from ui/internal are needed.

## Engine findings

[Virtualizer reference](https://tanstack.com/virtual/latest/docs/api/virtualizer), [chat guide](https://tanstack.com/virtual/latest/docs/chat), [source](https://github.com/TanStack/virtual/tree/main/packages/virtual-core), and official React, Vue, Solid and Svelte adapters were inspected. The published package, rather than moving main, controls our API contract.

All requested standard options and methods exist, including anchorTo, followOnAppend, scrollEndThreshold, isAtEnd, getDistanceFromEnd, takeSnapshot, cancelScroll and scrollToEnd. shouldAdjustScrollPositionOnItemSizeChange is an **instance property**, not an options field. Lanes support `laneAssignmentMode: 'estimate' | 'measured'`; changing lane count invalidates Core measurements. `useAnimationFrameWithResizeObserver`, `isRtl`, and `useCachedMeasurements` exist. Snapshot contains only measured items; the engine still stores O(count) coordinate metadata. Browser scroll extents impose limits.

Official adapter protocol: construct once, setOptions before the render that consumes new measurements, call _willUpdate **after DOM commit** to attach/replace/detach observers and synchronize anchors, and invoke the cleanup returned by _didMount on disposal. Although underscored, these exported declaration methods are the protocol used by every official framework adapter, not private engine algorithms. No other underscored engine method is used.

Core measureElement(null) prunes disconnected associations. ResizeObserver owns repeated measurement, batching, correction and queued animation frame cancellation. The Vibe adapter delays function-ref measurements until insertion and prunes after removal. Core owns all positioning math and scroll correction.

## Ecosystem findings

- VibeTable is functional and uses TanStack Table **9.3.1**, `tableFeatures` and `useTable`; do not assume v8 `getCoreRowModel` configuration.
- VibeQuery is functional: `createVibeQueryPlugin`, `QueryClient`, `useInfiniteQuery` with reactive property getters and cancellable queryFn signal. Network/cache state stays there.
- VibeDND directory is empty. No tested integration is possible; no virtual Kanban claim or replacement drag engine.
- VibeUse exposes scoped browser and element utilities. Core observers already cover virtualization; avoid duplicates.
- VibeMotion exposes vanilla Motion-backed composables. Animate an inner content wrapper, keeping the virtual row's position transform exclusively owned by the template.
- Vibecn ships copy-and-own `.vibe` sources and a trusted bundled registry. Existing Button/Card/Table/Input/Skeleton/Badge components can be copied with their license into examples. No virtual-* command is advertised because its registry has no such entry.
