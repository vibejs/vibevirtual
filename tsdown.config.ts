import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  tsconfig: 'tsconfig.build.json',
  dts: { generator: 'tsgo' },
  sourcemap: true,
  clean: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  deps: { neverBundle: ['@usevibejs/ui', '@tanstack/virtual-core'] },
});
