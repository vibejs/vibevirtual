# Getting started

VibeVirtual renders a small window over a large logical collection. It uses Vibe.js fine-grained reactivity and compiled DOM updates, with TanStack Virtual Core 3.19.8 handling the virtualization engine.

The library is headless. You choose semantics, row components, layout, colors and data sources. It does not supply a table model, fetch cache, drag engine, or UI toolkit.

## Installation

```sh
pnpm add @usevibejs/virtual @usevibejs/ui
```

This is the intended release installation command. The current repository is locally prepared and unpublished. To test it before publication, run `pnpm build` then `pnpm pack`, and install the generated tarball in your application. No sibling repository is required by the packed library.

Use matching Vibe.js runtime and compiler versions. The tested runtime/compiler version is 0.1.0. Node tooling targets Node ^24.15.0 or >=26, ESM and strict TypeScript.

## Quick start

This complete `.vibe` component renders 100,000 logical rows without creating an application array. Use the 100K explorer to inspect actual mounted counts.

<!-- example:QuickStart -->

## Core concepts

The scroll element needs a bounded viewport and overflow scrolling. The inner sizer represents Core's total extent. The template renders only `virtualItems`, using positions from Core. Overscan renders a small buffer around the visible range.

Top-level setup refs unwrap in templates. Nested refs in a plain object do not: use `v.isScrolling.value`, or assign `const scrolling = v.isScrolling` and render `scrolling`.

Fixed sizes are estimates that must match your CSS. Dynamic rows omit a fixed height, set `data-index`, and register `:ref="v.measureElement"`. That adapter callback delays measurement until the node is inserted.

## Data and identity

An index tells you where to read a record **now**. A key tells Core and Vibe which logical record this is **across updates**. For mutable lists, capture the current array in an options getter and return `getItemKey: index => current[index].id`. Use `String(item.key)` as the `.vibe` key for a homogeneous string or number ID domain. Mixed ID types that stringify identically must be normalized to distinct, prefixed domain IDs before passing them to Core.

Index keys are appropriate for immutable, index-derived demonstrations. They are unsuitable for prepending, reordering and mutable chat history.

## Next steps

Open the live workbench examples for dynamic sizes, two axes and chat. Read Reactive configuration before adapting a mutable dataset, and Accessibility before shipping interactive virtual rows.
