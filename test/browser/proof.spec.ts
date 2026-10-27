import { expect, test } from '@playwright/test';
import { trackResources } from './support.ts';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(trackResources);
});
test('100,000 real .vibe rows: bounded DOM, distant scrolling, back, detach and reattach', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=proof');
  const rows = page.getByTestId('row');
  await expect(rows.first()).toHaveText('Row 0');
  expect(await rows.count()).toBeLessThan(30);
  await page.getByRole('button', { name: 'Jump to 90,000' }).click();
  await expect(page.locator('[data-index="90000"]')).toHaveText('Row 90000');
  await page.getByTestId('viewport').evaluate((el) => {
    el.scrollTop = 400;
  });
  await expect(page.locator('[data-index="10"]')).toHaveText('Row 10');
  const pairs = await rows.evaluateAll((nodes) =>
    nodes.map((node) => [node.getAttribute('data-index'), node.textContent?.trim()]),
  );
  for (const [index, content] of pairs) expect(content).toBe(`Row ${index}`);
  expect(new Set(pairs.map(([index]) => index)).size).toBe(pairs.length);
  await page.getByRole('button', { name: 'Toggle container' }).click();
  await expect(rows).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__resources().scrollListeners)).toBe(0);
  await page.getByRole('button', { name: 'Toggle container' }).click();
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeLessThan(30);
  expect(errors).toEqual([]);
});
