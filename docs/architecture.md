# Architecture

## Four layers

| Layer                    | Ownership                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| TanStack Virtual Core    | Ranges, coordinates, estimates, caches, overscan, scroll commands, correction and end anchoring           |
| VibeVirtual adapter      | Reactive options, scoped lifecycle, post-commit attachment, ref measurement bridge and state invalidation |
| Headless compositions    | Independent grid axes, application-owned list/table/chat layouts, loading and restoration patterns        |
| Optional UI compositions | Vibecn source components in the workbench; no UI dependency in the library                                |

## Reactive bridge

One raw Core instance lives for the active scope. A small shallow revision signal invalidates computed views of Core's current data. Visible arrays are read directly from Core's memoized API, without copying them on each scroll. Precise offset/end state has a separate signal driven through Core's existing offset and viewport observers; scrolling or resizing inside the same range does not reconcile the list.

An untracked watch callback applies shallow, getter-resolved options before Vibe renders. It does not deep-watch datasets. Core onChange invalidates state and forwards the current user callback. A coalesced post-flush watch calls the official `_willUpdate` adapter protocol after the sizer and keyed rows commit, before consumers resume from nextTick.

## Lifecycle

The instance starts before a DOM ref exists. The getter is tracked independently, so a ref appearing, changing or becoming null updates attachment. Only connected elements attach. Observer replacement and disabled transitions go through Core cleanup. The cleanup returned by `_didMount` runs on scope disposal. Pending measurements and element associations are cleared, and queued adapter callbacks check disposal before doing work.

The underscored lifecycle methods are exported, typed integration methods used by the official React, Vue, Solid and Svelte adapters. VibeVirtual calls no other underscored Core methods and no private Vibe runtime/compiler helpers.

Vibe calls function refs before insertion and with null before removal. VibeVirtual batches non-null nodes until commit and asks Core to prune disconnected associations after removal. Vibe's keyed reconciliation is the sole creator, mover and remover of row components and DOM nodes.

## Public boundaries

Read reactive state through the adapter refs. The `virtualizer` field remains available for Core methods and advanced options such as the instance-level `shouldAdjustScrollPositionOnItemSizeChange` predicate. Treat reactive options as the source of configuration; calling Core setOptions yourself bypasses the bridge and may be overwritten.

The package is importable by Node tooling without allocating browser observers. This does not provide server rendering or hydration; Vibe.js currently supports client rendering.
