import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: { baseURL: 'http://127.0.0.1:43791', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm exec vite preview examples/playground --host 127.0.0.1 --port 43791',
    url: 'http://127.0.0.1:43791',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
