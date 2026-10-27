# Troubleshooting & limitations

## Blank rows or no visible items

Check the actual scrolling element, its nonzero client height/width, overflow CSS, enabled state and item count. Anchor absolute rows to top/left zero. The sizer needs Core's total size. A window item transform subtracts scrollMargin. Disconnected elements intentionally do not attach.

## Stale data after sorting

Use stable domain keys, replace data arrays, and capture the current collection in the reactive options getter. The `.vibe` key must match the virtual item's logical identity, not its current index. Normalize bigint IDs to stable string domain keys: Vibe's template types accept PropertyKey, while Core also accepts bigint. Avoid mixed IDs whose string forms collide.

## Wrong sizes after responsive changes

Mounted items remeasure through Core. New estimates for unmounted items require measure(). Measurements are keyed to records, not to every possible responsive layout. Restore snapshots only for compatible dataset and layout identities.

## Unexpected reset or jumping

Avoid two independent scroll compensation systems. Disable browser overflow-anchor in managed viewports. Call scrollToEnd only at initial open or explicit user request; let followOnAppend gate ongoing output. Do not seed initialOffset repeatedly to navigate. Native scroll commands have browser rounding, clamping and asynchronous events.

## Resource ownership

Call composables in component setup or an active effect scope, and release that scope. Set a manually owned scroll ref to null when its element is removed; ordinary Vibe template refs do this automatically. Externally removing a DOM node while retaining an unchanged custom getter is outside Vibe's lifecycle and is not detected by a global document MutationObserver.

## Browser constraints

Current Chromium, Firefox and WebKit are the test targets. Real-device iOS momentum, rubber-band overscroll, assistive technology behavior and all historical RTL scrollLeft models are not exhaustively certified. Core 3.19.8 contains iOS gesture deferral; no custom browser scrolling engine is added. Programmatic scroll corrections may be deferred while touch momentum owns the viewport.

Browsers cap scrollable element extents. A million 44px rows can exceed an engine's maximum scroll range; test far-end reachability on your target engine. Segment/page exceptionally large datasets when necessary. A bounded DOM does not imply bounded Core metadata memory.

## Scope of support

No SSR/hydration, spreadsheet engine, full markdown renderer, fetch cache, virtual DND, virtual Combobox keyboard adapter or Vibecn registry extension is supplied. The headless adapter does not manage application focus, query identity or dataset-specific restoration automatically. Screen-reader/device verification remains application work.
