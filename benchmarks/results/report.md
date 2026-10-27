# Measured browser benchmark

Recorded 2026-10-26T21:01:15.385Z. Apple M4, 10 logical CPUs, 24 GiB RAM, darwin 25.6.0, Node v24.22.1. Viewport 1440 × 1000. Browser versions and raw samples are in [latest.json](latest.json).

One cold page per engine/count, production workbench, no generated source objects. Mount includes navigation, fonts and first range. Five UI-driven distant jumps. 89 rAF intervals during incremental scroll. Heap is Chromium Runtime.getHeapUsage without forced GC, including the entire page. Long tasks are Chromium-only where supported. DOM and observers are actual. One run per cell; no universal timing guarantee.

| Engine   | Logical rows | Mounted rows | Total elements | Mount ms | Frame interval p95 ms | JS heap MiB |
| -------- | -----------: | -----------: | -------------: | -------: | --------------------: | ----------: |
| chromium |        1,000 |           18 |            281 |    112.8 |                 16.80 |         7.5 |
| chromium |       10,000 |           18 |            281 |     87.8 |                 16.80 |         8.4 |
| chromium |      100,000 |           18 |            281 |     95.5 |                 16.70 |        10.6 |
| chromium |    1,000,000 |           39 |            449 |    331.1 |                 16.80 |        33.2 |
| firefox  |        1,000 |           18 |            281 |    225.8 |                 17.30 | Unavailable |
| firefox  |       10,000 |           18 |            281 |     86.1 |                 17.64 | Unavailable |
| firefox  |      100,000 |           18 |            281 |    106.2 |                 17.64 | Unavailable |
| firefox  |    1,000,000 |           39 |            449 |    449.8 |                 17.46 | Unavailable |
| webkit   |        1,000 |           18 |            281 |    140.1 |                 18.00 | Unavailable |
| webkit   |       10,000 |           18 |            281 |     86.0 |                 18.00 | Unavailable |
| webkit   |      100,000 |           18 |            281 |     93.0 |                 18.00 | Unavailable |
| webkit   |    1,000,000 |           39 |            449 |    198.5 |                 18.00 | Unavailable |

All samples reached the final logical row. One million uses 16px compact rows (16 million pixels), keeping this demo below tested browser extent limits. Other counts use 44px rows. Metadata memory still grows with count. All observed resize targets and scroll listeners returned to zero after unmounting each example. The observer instrumentation itself records empty observer objects, so these numbers are resource accounting, not a retained heap proof.
