import { expect, test } from '@playwright/test';
import { settle, trackResources, verifyRecords, visibleAnchor } from './support.ts';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(trackResources);
});
test.afterEach(async ({ page }) => {
  const leaks = await page.evaluate(() => window.__resources());
  expect(leaks.detachedResizeTargets).toBe(0);
  expect(leaks.detachedScrollListeners).toBe(0);
});

test('fixed rows retain identity across rapid jumps, mutations, events, resizing and unrelated state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=explorer');
  await expect(page.locator('[data-id="0"]')).toBeVisible();
  for (const index of [90_000, 200, 76_543, 1000]) {
    await page.getByLabel('Target index', { exact: true }).fill(String(index));
    await page.getByRole('button', { name: 'Go ↗', exact: true }).click();
    await expect(page.locator(`[data-index="${index}"]`)).toBeVisible();
    await verifyRecords(page);
  }
  const anchor = await visibleAnchor(page, 'explorer', '[data-testid="record"]', 'data-id');
  await page.getByRole('button', { name: 'Prepend 5', exact: true }).click();
  await expect
    .poll(
      async () => (await visibleAnchor(page, 'explorer', '[data-testid="record"]', 'data-id')).id,
    )
    .toBe(anchor.id);
  expect(
    Math.abs(
      (await visibleAnchor(page, 'explorer', '[data-testid="record"]', 'data-id')).top - anchor.top,
    ),
  ).toBeLessThan(2);
  await page.getByRole('button', { name: 'Remove first 5', exact: true }).click();
  await expect
    .poll(
      async () => (await visibleAnchor(page, 'explorer', '[data-testid="record"]', 'data-id')).id,
    )
    .toBe(anchor.id);
  await page.getByRole('button', { name: 'Reverse', exact: true }).click();
  await settle(page);
  await verifyRecords(page);
  await page.getByRole('button', { name: /Unrelated update/ }).click();
  await verifyRecords(page);
  await page.setViewportSize({ width: 1050, height: 760 });
  await verifyRecords(page);
  await page.getByRole('button', { name: 'Filter even IDs' }).click();
  await expect(page.getByTestId('offset')).toHaveText('0 px');
  await verifyRecords(page);
  await page.getByRole('button', { name: 'Replace dataset' }).click();
  await expect(page.locator('[data-id="0"]')).toBeVisible();
  const inspect = page.getByRole('button', { name: 'Inspect record 0', exact: true });
  await inspect.click();
  await expect(inspect).toContainText('1');
  await page.getByRole('button', { name: /Unrelated update/ }).click();
  await expect(inspect).toContainText('1');
  await verifyRecords(page);
  expect(errors).toEqual([]);
});

test('keyboard navigation preserves a focused interactive row while scrolling', async ({
  page,
}) => {
  await page.goto('/?demo=explorer');
  const viewport = page.getByTestId('explorer');
  await viewport.focus();
  await viewport.press('End');
  await expect(page.locator('[data-id="99999"]')).toBeVisible();
  await viewport.press('Home');
  await expect(page.locator('[data-id="0"]')).toBeVisible();
  const button = page.getByRole('button', { name: 'Inspect record 0', exact: true });
  await button.focus();
  await viewport.evaluate((element) => {
    element.scrollTop = 44_000;
  });
  await expect(page.locator('[data-id="1000"]')).toBeVisible();
  await expect(button).toBeFocused();
  expect(await page.getByTestId('record').count()).toBeLessThan(55);
  await page.getByLabel('Target index', { exact: true }).focus();
  await expect(button).toHaveCount(0);
});

test('native wheel, incremental scrolling and fractional coordinates update the window', async ({
  page,
}) => {
  await page.goto('/?demo=explorer');
  const viewport = page.getByTestId('explorer');
  await viewport.hover();
  await page.mouse.wheel(0, 900);
  await expect
    .poll(async () => Number(await viewport.evaluate((el) => el.scrollTop)))
    .toBeGreaterThan(400);
  await viewport.evaluate(async (el) => {
    for (let i = 0; i < 15; i++) {
      el.scrollTop += 13.25;
      await new Promise(requestAnimationFrame);
    }
  });
  await verifyRecords(page);
});

test('dynamic rows measure growth, width changes, far navigation and lane changes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=dynamic');
  const row = page.locator('[data-testid="dynamic"] [data-index="0"]');
  await expect(row).toBeVisible();
  const before = (await row.boundingBox())!.height;
  await row.getByRole('button', { name: 'Expand details' }).click();
  await expect.poll(async () => (await row.boundingBox())!.height).toBeGreaterThan(before + 100);
  const next = page.locator('[data-testid="dynamic"] [data-index="1"]');
  await expect
    .poll(async () => (await next.boundingBox())!.y - (await row.boundingBox())!.y)
    .toBeGreaterThan(before + 100);
  await page.getByLabel('Feed width', { exact: true }).fill('55');
  await settle(page);
  await page.getByLabel('Lane count', { exact: true }).selectOption('3');
  await settle(page);
  expect(await page.locator('.dynamic-card').count()).toBeLessThan(70);
  await page.getByRole('button', { name: 'Jump to 5,000' }).click();
  await expect(page.locator('[data-testid="dynamic"] [data-index="5000"]')).toBeVisible();
  await page.getByLabel('Lane count', { exact: true }).selectOption('1');
  await settle(page);
  expect(errors).toEqual([]);
});

test('horizontal measured widths, RTL normalization, smooth scroll cancellation', async ({
  page,
}) => {
  await page.goto('/?demo=horizontal');
  const viewport = page.getByTestId('horizontal');
  await expect(viewport.locator('[data-index="0"]')).toBeVisible();
  const card = viewport.locator('[data-index="0"]');
  await card.getByRole('button', { name: 'Widen event' }).click();
  await expect.poll(async () => (await card.boundingBox())!.width).toBe(340);
  for (const direction of ['RTL', 'LTR', 'RTL']) {
    await page.getByRole('button', { name: 'Go to event 10,000' }).click();
    await expect(viewport.locator('[data-index="10000"]')).toBeVisible();
    await page.getByRole('button', { name: `Use ${direction}`, exact: true }).click();
    await expect(viewport.locator('[data-index="0"]')).toBeVisible();
    await expect.poll(() => viewport.evaluate((el) => Math.abs(el.scrollLeft))).toBeLessThan(1);
  }
  await viewport.focus();
  await viewport.press('ArrowLeft');
  await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeLessThan(-50);
  await page.getByRole('button', { name: 'Smooth to end' }).click();
  await page.getByRole('button', { name: 'Cancel scroll' }).click();
  expect(await viewport.locator('[data-index]').count()).toBeLessThan(30);
});

test('grid constructs only visible cells and navigates both axes', async ({ page }) => {
  await page.goto('/?demo=grid');
  const viewport = page.getByTestId('grid');
  await expect(viewport.locator('[data-row="0"] [data-column="0"]')).toBeVisible();
  expect(await viewport.getByRole('cell').count()).toBeLessThan(600);
  await page.getByRole('button', { name: 'Go to cell 50,000 × 500' }).click();
  await expect(viewport.locator('[data-row="50000"] [data-column="500"]')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle variable dimensions' }).click();
  await viewport.focus();
  await viewport.press('Home');
  await expect(viewport.locator('[data-row="0"] [data-column="0"]')).toBeVisible();
  await expect
    .poll(async () => (await viewport.locator('[data-row="0"]').boundingBox())!.height)
    .toBe(72);
});

test('sticky groups keep one active header and correct ordering at boundaries', async ({
  page,
}) => {
  await page.goto('/?demo=sticky');
  const viewport = page.getByTestId('sticky');
  await page.getByRole('button', { name: 'Jump to M' }).click();
  await expect(viewport.locator('[data-active="true"] h3')).toContainText('M');
  await viewport.evaluate((el) => {
    el.scrollTop = 1212 * 40 + 250;
  });
  await expect(viewport.locator('[data-active="true"]')).toHaveCount(1);
  const top = (await viewport.boundingBox())!.y;
  await expect
    .poll(async () =>
      Math.abs((await viewport.locator('[data-active="true"]').boundingBox())!.y - top),
    )
    .toBeLessThan(2);
  expect(await viewport.locator('[data-index="1212"]').count()).toBe(1);
});

test('restoration unmounts the list and re-seeds its position', async ({ page }) => {
  await page.goto('/?demo=restoration');
  await page.getByLabel('Target index', { exact: true }).fill('32100');
  await page.getByRole('button', { name: 'Go ↗', exact: true }).click();
  await expect(page.locator('[data-id="32100"]')).toBeVisible();
  await page.getByRole('button', { name: 'Save location' }).click();
  await expect(page.getByTestId('record')).toHaveCount(0);
  expect((await page.evaluate(() => window.__resources())).scrollListeners).toBe(0);
  await page.getByRole('button', { name: 'Back to saved location' }).click();
  await expect(page.locator('[data-id="32100"]')).toBeVisible();
  await verifyRecords(page);
});

test('window virtualization uses document scroll and accounts for the header', async ({ page }) => {
  await page.goto('/?demo=window');
  await expect(page.getByTestId('window-row').first()).toBeVisible();
  await page.getByRole('button', { name: 'Jump to article 5,000' }).click();
  await expect(page.locator('[data-testid="window-row"][data-index="5000"]')).toBeVisible();
  expect(await page.getByTestId('window-row').count()).toBeLessThan(40);
  await page.setViewportSize({ width: 900, height: 900 });
  await settle(page);
  expect(await page.getByTestId('window-row').count()).toBeLessThan(45);
});

test('repeated navigation releases real observers and scroll listeners', async ({ page }) => {
  await page.goto('/?demo=explorer');
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Dynamic & masonry', exact: true }).click();
    await expect(page.locator('.dynamic-card').first()).toBeVisible();
    await page.getByRole('button', { name: 'Chat & AI streaming', exact: true }).click();
    await expect(page.getByTestId('chat')).toBeVisible();
    await page.getByRole('button', { name: /Documentation/ }).click();
    await expect(page.getByRole('heading', { name: 'Getting started', exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__resources()))
      .toEqual({
        resizeTargets: 0,
        detachedResizeTargets: 0,
        scrollListeners: 0,
        detachedScrollListeners: 0,
      });
    await page.getByRole('button', { name: '100K row explorer', exact: true }).click();
    await expect(page.locator('[data-id="0"]')).toBeVisible();
  }
});
