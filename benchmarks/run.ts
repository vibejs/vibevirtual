import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { chromium, firefox, webkit } from '@playwright/test';
import { preview } from 'vite';
import { trackResources } from '../test/browser/support.ts';

const server = await preview({
  root: 'examples/playground',
  preview: { host: '127.0.0.1', port: 43795, strictPort: true },
});
const rows: Record<string, unknown>[] = [];
try {
  for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await launcher.launch();
    try {
      for (const count of [1000, 10000, 100000, 1000000]) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        await page.addInitScript(trackResources);
        await page.addInitScript(() => {
          const tasks: number[] = [];
          if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
            new PerformanceObserver((entries) => {
              for (const entry of entries.getEntries()) tasks.push(entry.duration);
            }).observe({ type: 'longtask', buffered: true });
          Object.defineProperty(window, 'benchmarkLongTasks', { value: tasks });
        });
        const start = performance.now();
        await page.goto(`http://127.0.0.1:43795/?demo=explorer&count=${count}`);
        await page.locator('[data-id="0"]').waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        const mountMs = performance.now() - start;
        const initialDom = await page.evaluate(() => ({
          mounted: document.querySelectorAll('[data-testid="record"]').length,
          elements: document.querySelectorAll('*').length,
        }));
        assert(initialDom.mounted < 90);
        const latencies = [];
        for (const fraction of [0.9, 0.1, 0.65, 0.3, 0.99]) {
          const index = Math.floor((count - 1) * fraction);
          await page.getByLabel('Target index', { exact: true }).fill(String(index));
          const before = performance.now();
          await page.getByRole('button', { name: 'Go ↗', exact: true }).click();
          await page
            .locator(`[data-testid="record"][data-id="${index}"]`)
            .waitFor({ state: 'visible' });
          latencies.push(performance.now() - before);
        }
        const frames = await page.getByTestId('explorer').evaluate(async (element) => {
          const intervals: number[] = [];
          let previous = performance.now();
          for (let i = 0; i < 90; i++) {
            await new Promise<void>((resolveFrame) =>
              requestAnimationFrame((time) => {
                intervals.push(time - previous);
                previous = time;
                element.scrollTop -= 37.25;
                resolveFrame();
              }),
            );
          }
          return intervals.slice(1);
        });
        await page.getByRole('button', { name: 'End', exact: true }).click();
        await page.locator(`[data-id="${count - 1}"]`).waitFor({ state: 'visible' });
        const final = await page.getByTestId('explorer').evaluate((element) => ({
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          scrollTop: element.scrollTop,
          mounted: element.querySelectorAll('[data-testid="record"]').length,
        }));
        let heap: number | null = null;
        if (engine === 'chromium') {
          const cdp = await page.context().newCDPSession(page);
          const metrics = await cdp.send('Runtime.getHeapUsage');
          heap = metrics.usedSize;
          await cdp.detach();
        }
        const reactiveUpdates = Number(await page.getByTestId('reactive-updates').textContent());
        const resources = await page.evaluate(() => window.__resources());
        const longTasks = await page.evaluate(
          () => Reflect.get(window, 'benchmarkLongTasks') as number[],
        );
        await page.getByRole('button', { name: /Documentation/ }).click();
        await page.getByRole('heading', { name: 'Getting started', exact: true }).waitFor();
        const afterUnmount = await page.evaluate(() => window.__resources());
        assert.equal(afterUnmount.scrollListeners, 0);
        assert.equal(afterUnmount.resizeTargets, 0);
        const sorted = [...frames].sort((a, b) => a - b);
        rows.push({
          engine,
          browserVersion: browser.version(),
          count,
          rowHeight: count >= 1000000 ? 16 : 44,
          mountMs,
          initialDom,
          jumpLatenciesMs: latencies,
          frameIntervalP50Ms: sorted[Math.floor(sorted.length * 0.5)],
          frameIntervalP95Ms: sorted[Math.floor(sorted.length * 0.95)],
          framesOver25ms: frames.filter((value) => value > 25).length,
          sampledFrames: frames.length,
          longTasksMs: longTasks,
          heapUsedBytes: heap,
          resources,
          reactiveUpdates,
          afterUnmount,
          endReachable: true,
          final,
        });
        process.stdout.write(
          `${engine} ${count}: ${initialDom.mounted} mounted, ${mountMs.toFixed(1)}ms mount, end reachable\n`,
        );
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise<void>((done) => {
    server.httpServer.close(() => done());
  });
}
const report = {
  recordedAt: new Date().toISOString(),
  environment: {
    platform: platform(),
    release: release(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    memoryBytes: totalmem(),
    node: process.version,
    viewport: { width: 1440, height: 1000 },
  },
  methodology:
    'One cold page per engine/count, production workbench, no generated source objects. Mount includes navigation, fonts and first range. Five UI-driven distant jumps. 89 rAF intervals during incremental scroll. Heap is Chromium Runtime.getHeapUsage without forced GC, including the entire page. Long tasks are Chromium-only where supported. DOM and observers are actual. One run per cell; no universal timing guarantee.',
  rows,
};
await mkdir('benchmarks/results', { recursive: true });
await writeFile('benchmarks/results/latest.json', JSON.stringify(report, null, 2) + '\n');
const table = rows
  .map((row) => {
    const dom = row.initialDom as { mounted: number; elements: number };
    return `| ${row.engine} | ${Number(row.count).toLocaleString('en-US')} | ${dom.mounted} | ${dom.elements} | ${Number(row.mountMs).toFixed(1)} | ${Number(row.frameIntervalP95Ms).toFixed(2)} | ${row.heapUsedBytes === null ? 'Unavailable' : (Number(row.heapUsedBytes) / 1048576).toFixed(1)} |`;
  })
  .join('\n');
await writeFile(
  'benchmarks/results/report.md',
  `# Measured browser benchmark\n\nRecorded ${report.recordedAt}. ${report.environment.cpu}, ${report.environment.logicalCpus} logical CPUs, ${(report.environment.memoryBytes / 1073741824).toFixed(0)} GiB RAM, ${report.environment.platform} ${report.environment.release}, Node ${report.environment.node}. Viewport 1440 × 1000. Browser versions and raw samples are in [latest.json](latest.json).\n\n${report.methodology}\n\n| Engine | Logical rows | Mounted rows | Total elements | Mount ms | Frame interval p95 ms | JS heap MiB |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${table}\n\nAll samples reached the final logical row. One million uses 16px compact rows (16 million pixels), keeping this demo below tested browser extent limits. Other counts use 44px rows. Metadata memory still grows with count. All observed resize targets and scroll listeners returned to zero after unmounting each example. The observer instrumentation itself records empty observer objects, so these numbers are resource accounting, not a retained heap proof.\n`,
);
