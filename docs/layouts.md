# Layouts

## Vertical lists

Fixed rows use absolute positioning inside a total-height sizer. Anchor absolute rows with top: 0 and left: 0 before applying translateY. Keep exact fixed box sizes, including borders through box-sizing. Avoid browser overflow anchoring competing with Core: the examples use overflow-anchor: none.

## Dynamic heights

Measured rows use their natural block height. Avoid placing layout effects and virtual positioning on the same transform. A translated contiguous rendered block is an alternative when normal document flow helps smooth target correction; it requires a contiguous range and cannot represent arbitrary sticky/pinned extracted indexes without separate treatment. VibeVirtual imposes no universal positioning strategy.

The tested Dynamic example uses measured absolute rows and inner content surfaces. Expansion, wrapping and lane changes are interactive.

<!-- example:Dynamic -->

## Horizontal lists

Set horizontal: true, provide width estimates, a total-width sizer, and translateX. Set isRtl along with the actual DOM dir. In the tested modern engines Core normalizes negative RTL scrollLeft; position from the right edge and negate the virtual coordinate. Do not implement another RTL coordinate engine.

<!-- example:Horizontal -->

## Virtual grids

`useVirtualGrid` coordinates two ordinary virtualizers against one scroll element. Rows own vertical offsets/heights; columns own horizontal offsets/widths. Render the product of their **visible windows**, never the logical matrix. `scrollToCell(row, column, options)` sends independent Core commands. There are two axis subscriptions, as in Core's grid examples.

Known variable row/column dimensions can be supplied through estimates and invalidated with measure. For measured variable row heights, measure the row wrapper, and ensure its tallest relevant content determines height. Measuring only a horizontal subset cannot discover taller offscreen cells. Fully automatic spreadsheet layout and global column autosizing are outside this library.

<!-- example:Grid -->

## Masonry

Use lanes and laneAssignmentMode. Estimate mode assigns using known estimates; measured mode settles with actual mounted measurements. Apply cross-axis lane positions yourself. Core resets lane measurements when the lane count changes. Unknown sizes can change placement; perfectly stable unmeasured masonry is not promised. The Dynamic example's lane control exercises reconfiguration.

## Sticky items

Use rangeExtractor to retain the active section header, deduplicate indexes and sort them in logical order. The retained heading uses position: sticky; other items use their virtual offsets. Give it an opaque background and stacking order. Do not duplicate an interactive header in an overlay.

<!-- example:Sticky -->

## Tables

Keep row models separate from viewport math. The DataTable composition uses semantic table roles, total row/column counts, absolute virtual rows/cells and a sticky header. A native table with spacer rows is another appropriate layout when it better preserves browser table semantics. Choose a layout that the target browsers and assistive technologies support, and test it with real users.
