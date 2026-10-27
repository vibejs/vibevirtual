import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const artifacts = resolve('artifacts');
await mkdir(artifacts, { recursive: true });
execFileSync('pnpm', ['pack', '--pack-destination', artifacts], { stdio: 'inherit' });
const tarball = join(artifacts, 'usevibejs-virtual-0.1.0.tgz');
const members = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
assert(members.every((name) => !/vendor|examples|node_modules/.test(name)));
const consumer = await mkdtemp(join(tmpdir(), 'vibevirtual-consumer-'));
try {
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'independent-virtual-consumer',
        private: true,
        type: 'module',
        dependencies: { '@usevibejs/virtual': `file:${tarball}`, '@usevibejs/ui': '0.1.0' },
        devDependencies: {
          '@usevibejs/compiler': '0.1.0',
          '@usevibejs/language-tools': '0.1.0',
          typescript: '7.1.0-dev.20261015.1',
          vite: '8.3.4',
        },
      },
      null,
      2,
    ),
  );
  execFileSync('pnpm', ['install', '--ignore-scripts'], { cwd: consumer, stdio: 'inherit' });
  const manifest = JSON.parse(
    await readFile(join(consumer, 'node_modules/@usevibejs/virtual/package.json'), 'utf8'),
  ) as {
    dependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    exports: Record<string, unknown>;
  };
  assert.deepEqual(manifest.dependencies, { '@tanstack/virtual-core': '3.19.8' });
  assert.deepEqual(manifest.peerDependencies, { '@usevibejs/ui': '^0.1.0' });
  assert.deepEqual(Object.keys(manifest.exports), ['.', './package.json']);
  const loaded = (await import(
    pathToFileURL(join(consumer, 'node_modules/@usevibejs/virtual/dist/index.js')).href
  )) as Record<string, unknown>;
  for (const name of ['useVirtualizer', 'useWindowVirtualizer', 'useVirtualGrid', 'Virtualizer'])
    assert.equal(typeof loaded[name], 'function');
  const code = await readFile('dist/index.js', 'utf8');
  assert(!/node:|@usevibejs\/ui\/internal|from ["'](?:react|vue|solid-js)/.test(code));
  await writeFile(
    join(consumer, 'App.vibe'),
    await readFile('examples/playground/src/QuickStart.vibe', 'utf8'),
  );
  await writeFile(
    join(consumer, 'main.ts'),
    "import { createApp } from '@usevibejs/ui';\nimport App from './App.vibe';\nconst host = document.querySelector('#app');\nif (host) createApp(App).mount(host);\n",
  );
  await writeFile(
    join(consumer, 'types.ts'),
    `import { useVirtualizer, useVirtualGrid, useWindowVirtualizer } from '@usevibejs/virtual';
import type { VibeVirtualizer, Virtualizer, VirtualItem } from '@usevibejs/virtual';
import { effectScope, shallowRef } from '@usevibejs/ui';
function accepts<T>(_value: T): void {}
effectScope().run(() => {
  const element = shallowRef<HTMLDivElement | null>(null);
  const v = useVirtualizer<HTMLDivElement, HTMLLIElement>(() => ({ count: 20, getScrollElement: () => element.value, estimateSize: () => 32, anchorTo: 'end', followOnAppend: true }));
  accepts<Virtualizer<HTMLDivElement, HTMLLIElement>>(v.virtualizer);
  accepts<readonly VirtualItem[]>(v.virtualItems.value);
  accepts<VibeVirtualizer<Window, HTMLDivElement>>(useWindowVirtualizer({ count: 20, estimateSize: () => 40 }));
  useVirtualGrid({ getScrollElement: () => element.value, rows: { count: 2, estimateSize: () => 20 }, columns: { count: 4, estimateSize: () => 30 } }).scrollToCell(1, 2);
  // @ts-expect-error No writable state escapes the adapter.
  v.totalSize.value = 4;
});
`,
  );
  await writeFile(
    join(consumer, 'index.html'),
    '<div id="app"></div><script type="module" src="/main.ts"></script>',
  );
  await writeFile(
    join(consumer, 'vite.config.ts'),
    "import { defineConfig } from 'vite';\nimport { vibe } from '@usevibejs/compiler/vite';\nexport default defineConfig({ plugins: [vibe()] });\n",
  );
  await writeFile(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2022',
        lib: ['es2024', 'dom'],
        module: 'preserve',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        allowImportingTsExtensions: true,
        composite: true,
        emitDeclarationOnly: true,
        outDir: '.types',
      },
      contentMappers: [{ package: '@usevibejs/language-tools', extensions: ['.vibe'] }],
      include: ['*.ts', '*.vibe'],
    }),
  );
  execFileSync('pnpm', ['exec', 'tsc', '-b', '--runExternalCode'], {
    cwd: consumer,
    stdio: 'inherit',
  });
  execFileSync('pnpm', ['exec', 'vite', 'build'], { cwd: consumer, stdio: 'inherit' });
  await writeFile(
    join(consumer, 'helper.ts'),
    "import { defaultRangeExtractor } from '@usevibejs/virtual'; console.log(defaultRangeExtractor({ startIndex: 2, endIndex: 4, overscan: 1, count: 100 }));",
  );
  const result = await build({
    root: consumer,
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: true,
      lib: { entry: join(consumer, 'helper.ts'), formats: ['es'] },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => {
    assert('output' in output);
    return output.output;
  });
  const helperCode = chunks
    .filter((item) => item.type === 'chunk')
    .map((item) => item.code)
    .join('');
  assert(
    helperCode.length < 5000,
    'Helper-only consumer must tree-shake the adapter and framework',
  );
  assert(!helperCode.includes('VibeVirtual requires'));
  const report = {
    tarballFiles: members,
    manifest,
    nodeImport: 'passed',
    independentTypecheck: 'passed',
    independentVibeBuild: 'passed',
    libraryBytes: Buffer.byteLength(code),
    libraryGzipBytes: gzipSync(code).length,
    helperBundleBytes: Buffer.byteLength(helperCode),
    helperGzipBytes: gzipSync(helperCode).length,
    consumerAssets: await readdir(join(consumer, 'dist/assets')),
  };
  await writeFile(join(artifacts, 'package-report.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} finally {
  await rm(consumer, { recursive: true, force: true });
}
