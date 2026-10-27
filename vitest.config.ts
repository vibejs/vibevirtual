import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test-d.ts'],
      thresholds: { 100: true, perFile: true },
    },
  },
});
