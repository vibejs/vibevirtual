import { expect, test } from '@playwright/test';
import { settle, trackResources, visibleAnchor } from './support.ts';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(trackResources);
});

test('resizing an overscanned row above the viewport preserves the reading anchor', async ({
  page,
}) => {
  await page.goto('/?demo=dynamic');
  const viewport = page.getByTestId('dynamic');
  await expect(viewport.locator('[data-index="0"]')).toBeVisible();
  await viewport.evaluate((element) => {
    element.scrollTop = 650;
  });
  await settle(page);
  const anchor = await visibleAnchor(page, 'dynamic', '[data-index]', 'data-index');
  const first = viewport.locator('[data-index="0"]');
  await expect(first).toHaveCount(1);
  const top = (await viewport.boundingBox())!.y;
  expect((await first.boundingBox())!.y + (await first.boundingBox())!.height).toBeLessThan(top);
  await first.getByRole('button', { name: 'Expand details' }).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect
    .poll(async () => (await visibleAnchor(page, 'dynamic', '[data-index]', 'data-index')).id)
    .toBe(anchor.id);
  await expect
    .poll(async () =>
      Math.abs(
        (await visibleAnchor(page, 'dynamic', '[data-index]', 'data-index')).top - anchor.top,
      ),
    )
    .toBeLessThan(2);
});

test('a million compact logical rows reach the final record with bounded DOM', async ({ page }) => {
  await page.goto('/?demo=million');
  await expect(page.locator('[data-id="0"]')).toBeVisible();
  await page.getByRole('button', { name: 'End', exact: true }).click();
  await expect(page.locator('[data-id="999999"]')).toBeVisible();
  expect(await page.getByTestId('record').count()).toBeLessThan(90);
});

test('destroying and recreating the entire Vibe app releases active streaming resources', async ({
  page,
}) => {
  await page.goto('/lifecycle.html');
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId('jump-latest')).toHaveText('At latest');
    await page.getByRole('button', { name: 'Stream response', exact: true }).click();
    await expect(page.getByTestId('chat').locator('[data-message-id^="stream-"]')).toBeVisible();
    await page.getByRole('button', { name: 'Unmount app', exact: true }).click();
    await expect(page.getByTestId('chat')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.__resources()))
      .toEqual({
        resizeTargets: 0,
        detachedResizeTargets: 0,
        scrollListeners: 0,
        detachedScrollListeners: 0,
      });
    await page.getByRole('button', { name: 'Mount app', exact: true }).click();
  }
});
