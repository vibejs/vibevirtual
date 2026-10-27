# Advanced scrolling

## Infinite loading

Networking belongs to your query client. Observe the last virtual index relative to loaded data length; request a page near the boundary. Gate requests by fetching/error/hasNextPage state and a page-length or cursor token. An error requires explicit retry. Empty pages must terminate or advance the server cursor, not form an automatic retry loop.

Known totals may render estimated placeholders for unloaded indexes. Unknown totals can use one loader row. Keep keys distinct for placeholders and loaded domain records. Reset to top for an unrelated query-key/filter change; retain position for a background refresh of the same logical dataset.

<!-- example:Infinite -->

## Chat and reverse feeds

Core 3.19.8 supports anchorTo: 'end', followOnAppend, scrollEndThreshold, scrollToEnd, isAtEnd and getDistanceFromEnd. Open at the latest message with scrollToEnd after mount. Use normal chronological DOM order, stable message IDs, measured heights, and no inverted transforms.

Prepending history preserves a retained keyed reading anchor. Appending follows only when the previous viewport was within scrollEndThreshold. Measured growth of the final item stays pinned when already at the end. When reading older messages, growth below the viewport must not force a jump. Expose a jump-to-latest action.

The chat fixture includes empty history, prepends, appends, deletion, delayed image loading, markdown paragraphs/headings/code blocks and deterministic simulated streaming. Streaming changes one shallow text ref, preserving message component instances and avoiding array replacement per token. Networking and full markdown rendering policy remain application concerns.

<!-- example:Chat -->

## Scroll anchoring

Core owns correction for measured-size deltas. Its default policy distinguishes first measurements above the fold from later growth of an item spanning the fold, and protects backward scrolling and smooth commands. The optional instance property shouldAdjustScrollPositionOnItemSizeChange can override this policy; it is not an options field.

Use end anchoring for same-dataset prepend/remove operations where preserving a retained key is desirable. When replacing an unrelated dataset, filtering a search or changing a query identity, explicitly reset or choose a new target. Arbitrary reorder/filter/delete operations can remove the anchor; no adapter can preserve a record that no longer exists. Do not add unconditional scrollTop += delta compensation.

## Scroll restoration

Save `scrollOffset.value` and `virtualizer.takeSnapshot()` in route-owned state. Restore with initialOffset and initialMeasurementsCache on a **new** composable instance. Initial options are seeds, not a command to overwrite an existing instance.

Snapshots contain measured keys and sizes only; unmeasured records use estimates. Associate state with dataset/query identity and layout policy. Invalidate it for unrelated data or incompatible responsive dimensions. Store no list content, and bound persistence yourself. A global registry is unnecessary.

<!-- example:Restoration -->

## Responsive resizing

Core observes the viewport and mounted item boxes. Wrapping and image/font changes trigger measurement. For changes to known estimates or dimensions of unmounted items, invalidate with measure, accepting estimate-based correction until those items mount. Recompute page scrollMargin when content above a window list changes.
