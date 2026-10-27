# Performance

## What scales

DOM rows scale with viewport size, overscan, lanes and explicitly retained sticky/focused indexes. Application data generation is separate: the million-item explorer derives record content from indexes and allocates no million-object source array until the user explicitly invokes a dataset mutation.

Core 3.19.8 stores coordinate/key metadata proportional to logical count. Its measured-key cache grows with measured records; it does not measure every unmounted row. No constant-memory or universal frame-rate promise is made.

## Reproducing measurements

Run `pnpm bench` against the production build. The benchmark records hardware/OS/browser versions, viewport, mount/navigation time, DOM element and mounted row counts, scroll-settle latency, frame intervals, long tasks where available, observer targets, and Chromium heap metrics where available. It tests 1K, 10K, 100K and one million logical rows without generating source records. JSON artifacts are written under artifacts; checked-in reports are under benchmarks/results.

Mount timing includes the workbench, font and script startup and first virtual range. It is not a microbenchmark of one function. Heap metrics include the browser page and ecosystem code, are collected without forcing GC, and should not be treated as retained-size proofs. Observer counters count live observed targets, not browser internal allocations. Frame intervals include test automation and scheduler load.

See the [measured report](../../benchmarks/results/report.md) for actual results. Timing tests have no brittle performance pass threshold. Correctness tests require bounded rows, correct identity, cleanup and reachable supported ranges.

## Tuning

Start with realistic estimates and small overscan. Keep expensive work out of row templates and scroll callbacks. Do not clone datasets on scroll. Stabilize domain IDs and avoid deeply reactive huge arrays. Use lightweight placeholders for expensive content and reserve image dimensions where possible. Measure user-visible latency on target devices before choosing animation-frame RO batching.

Do not run an entrance animation every time a row scrolls back into view. Virtual positioning and animation transforms need separate DOM owners. For extremely large extents, use pagination/segmentation before hitting browser layout limits.
