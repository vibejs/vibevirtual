import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { vibe } from '@usevibejs/compiler/vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [vibe(), tailwindcss()],
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        lifecycle: fileURLToPath(new URL('./lifecycle.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: { '@usevibejs/virtual': fileURLToPath(new URL('../../src/index.ts', import.meta.url)) },
    dedupe: ['@usevibejs/ui'],
  },
});
