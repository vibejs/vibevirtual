# Accessibility

Virtualization removes offscreen content from the DOM and accessibility tree. It does not make an entire million-item collection available to screen readers at once. Provide search, filtered views, pagination or an export/nonvirtualized bounded alternative when full sequential reading is important.

## Semantic lists and tables

Prefer native list/table markup when the positioning layout permits it. Otherwise, use the corresponding roles deliberately. List items can expose aria-posinset and aria-setsize. Virtual tables expose aria-rowcount/aria-colcount on the table, and one-based aria-rowindex/aria-colindex on the relevant row/cell. Include header rows when calculating totals/indexes. Do not add aria-selected to a plain listitem without a compatible widget role.

## Keyboard navigation

A focusable scroll region enables native scrolling. The explorer adds ArrowUp/ArrowDown/PageUp/PageDown/Home/End logical navigation through Core scroll commands. Its focus stays on the viewport while the active logical record is highlighted. Individual Inspect buttons remain normal controls.

## Focus preservation

The explorer's rangeExtractor retains the currently focused row until focus leaves its scroll region. This can mount an extra offscreen item. Stable domain keys preserve that control's local state. Before filtering/removing a focused record, move focus to an appropriate surviving control or viewport. For a table with horizontal virtualization, pin both focused row and column, or put focus on a stable viewport/active-descendant controller.

ARIA active descendants must reference an actually mounted DOM node. Scroll to it, wait for nextTick and measurement as needed, and only then change the accessible active descendant. Never maintain an ID pointing into an unmounted range. The workbench does not advertise a virtual combobox: the existing Vibecn collection navigator only knows mounted items and requires a logical-navigation adapter before it can safely handle this.

## Loading, motion and announcements

Use role=status for loading state and a retryable role=alert for page errors. Avoid announcing every scroll range or streamed token. Focus outlines and contrast work in both themes. Choose instant scrolling under reduced motion; inner Motion surfaces avoid entrance animations whenever a row re-enters the viewport.

Browser tests exercise keyboard navigation and retained focus. Automated DOM assertions do not substitute for manual screen-reader verification with the devices your application supports.
