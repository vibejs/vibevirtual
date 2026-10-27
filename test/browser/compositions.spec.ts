import { expect, test } from '@playwright/test';
import { settle, trackResources, visibleAnchor } from './support.ts';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(trackResources);
});

test('chat follows latest, preserves prepends, respects reading history and streaming growth', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=chat');
  const viewport = page.getByTestId('chat');
  await expect(page.getByTestId('jump-latest')).toHaveText('At latest');
  expect(await viewport.locator('[data-message-id]').count()).toBeLessThan(35);
  await viewport.evaluate((el) => {
    el.scrollTop = 1200;
  });
  await expect(page.getByTestId('jump-latest')).toContainText('Jump to latest');
  await settle(page);
  const anchor = await visibleAnchor(page, 'chat', '[data-message-id]', 'data-message-id');
  await page.getByRole('button', { name: 'Load older 20', exact: true }).click();
  await expect
    .poll(
      async () => (await visibleAnchor(page, 'chat', '[data-message-id]', 'data-message-id')).id,
    )
    .toBe(anchor.id);
  expect(
    Math.abs(
      (await visibleAnchor(page, 'chat', '[data-message-id]', 'data-message-id')).top - anchor.top,
    ),
  ).toBeLessThan(2);
  const oldOffset = await viewport.evaluate((el) => el.scrollTop);
  await page.getByRole('button', { name: 'New message', exact: true }).click();
  await settle(page);
  expect(Math.abs((await viewport.evaluate((el) => el.scrollTop)) - oldOffset)).toBeLessThan(2);
  await page.getByTestId('jump-latest').click();
  await expect(page.getByTestId('jump-latest')).toHaveText('At latest');
  await page.getByRole('button', { name: 'Stream response', exact: true }).click();
  const stream = viewport.locator('[data-message-id^="stream-"]');
  await expect(stream).toBeVisible();
  await stream.evaluate((el) => {
    el.setAttribute('data-preserved', 'yes');
  });
  await expect(stream).toContainText('Measured segment 3');
  await expect(stream).toHaveAttribute('data-preserved', 'yes');
  await expect
    .poll(() =>
      viewport.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop)),
    )
    .toBeLessThan(3);
  await viewport.evaluate((el) => {
    el.scrollTop -= 800;
  });
  await expect(page.getByTestId('jump-latest')).toContainText('Jump to latest');
  const readingOffset = await viewport.evaluate((el) => el.scrollTop);
  const stepsBefore = Number((await page.getByRole('status').textContent())?.match(/\d+/)?.[0]);
  await expect
    .poll(async () => Number((await page.getByRole('status').textContent())?.match(/\d+/)?.[0]))
    .toBeGreaterThan(stepsBefore + 3);
  expect(Math.abs((await viewport.evaluate((el) => el.scrollTop)) - readingOffset)).toBeLessThan(2);
  expect(errors).toEqual([]);
});

test('chat handles delayed attachments, deletion, empty state and reconnects', async ({ page }) => {
  await page.goto('/?demo=chat');
  const viewport = page.getByTestId('chat');
  await expect(page.getByTestId('jump-latest')).toHaveText('At latest');
  await page.getByRole('button', { name: 'Load attachment', exact: true }).click();
  await expect(viewport.getByRole('img')).toBeVisible();
  await expect
    .poll(() =>
      viewport.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop)),
    )
    .toBeLessThan(3);
  await page.getByRole('button', { name: 'Delete last', exact: true }).click();
  await expect(viewport.getByRole('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(viewport.locator('[data-message-id]')).toHaveCount(0);
  await expect(viewport).toContainText('No messages yet');
  await page.getByRole('button', { name: 'New message', exact: true }).click();
  await expect(viewport.locator('[data-message-id]')).toHaveCount(1);
  await page.getByRole('button', { name: '100K row explorer', exact: true }).click();
  await page.getByRole('button', { name: 'Chat & AI streaming', exact: true }).click();
  await expect(page.getByTestId('jump-latest')).toHaveText('At latest');
});

test('VibeTable virtualizes both models, sorts, filters, selects and measures expanded rows', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=table');
  const viewport = page.getByTestId('table-viewport');
  await expect(viewport.locator('[data-row-id="record-0"]')).toBeVisible();
  expect(await viewport.locator('[data-row-id]').count()).toBeLessThan(40);
  expect(await viewport.getByRole('cell').count()).toBeLessThan(500);
  await page.getByRole('checkbox', { name: 'Select Customer 0', exact: true }).check();
  await expect(page.getByTestId('selected-count')).toHaveText('1 selected');
  await page.getByRole('button', { name: 'Customer 0', exact: true }).click();
  await expect
    .poll(async () => (await viewport.locator('[data-row-id="record-0"]').boundingBox())!.height)
    .toBe(112);
  await page.getByRole('button', { name: 'Sort by score', exact: true }).click();
  await settle(page);
  const scores = await viewport.locator('[role="cell"][aria-colindex="2"]').allTextContents();
  expect(scores.map(Number)).toEqual(scores.map(Number).toSorted((a, b) => a - b));
  await page.getByLabel('Filter table', { exact: true }).fill('Customer 9999');
  await page.getByRole('button', { name: 'Filter', exact: true }).click();
  await expect(page.getByRole('table')).toHaveAttribute('aria-rowcount', '12');
  await expect(viewport.locator('[data-row-id="record-9999"]')).toBeVisible();
  await page.getByLabel('Filter table', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Filter', exact: true }).click();
  await page.getByRole('button', { name: 'Row 90K · Column 20', exact: true }).click();
  await expect(viewport.locator('[data-index="90000"] [aria-colindex="21"]')).toBeVisible();
  const headerTop = (await viewport.locator('.table-sticky-head').boundingBox())!.y;
  const viewportTop = (await viewport.boundingBox())!.y;
  expect(Math.abs(headerTop - viewportTop)).toBeLessThan(2);
  expect(errors).toEqual([]);
});

test('VibeQuery loads at the boundary, gates errors, retries, refetches and resets query identity', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?demo=infinite');
  const viewport = page.getByTestId('infinite');
  await expect(page.getByTestId('requests')).toHaveText('1 requests');
  await expect(viewport).toContainText('Result 0');
  await page.getByRole('button', { name: 'Fail next request', exact: true }).click();
  await viewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(page.getByRole('alert')).toContainText('Simulated page failure');
  await expect(page.getByTestId('requests')).toHaveText('2 requests');
  await viewport.evaluate(async (el) => {
    for (let i = 0; i < 5; i++) {
      el.scrollTop -= 2;
      await new Promise(requestAnimationFrame);
    }
  });
  await expect(page.getByTestId('requests')).toHaveText('2 requests');
  await page.getByRole('button', { name: 'Retry page', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('requests')).toHaveText('3 requests');
  const before = await viewport.evaluate((el) => el.scrollTop);
  await page.getByRole('button', { name: 'Background refetch', exact: true }).click();
  await expect(page.getByTestId('requests')).toHaveText('5 requests');
  await settle(page);
  expect(Math.abs((await viewport.evaluate((el) => el.scrollTop)) - before)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Dataset: all', exact: true }).click();
  await expect(viewport).toContainText('engineering-0');
  await expect(page.getByTestId('offset')).toHaveText('0 px');
  expect(await viewport.locator('[data-index]').count()).toBeLessThan(35);
  expect(errors).toEqual([]);
});

test('documentation search, code highlighting, theme and responsive controls work', async ({
  page,
  browserName,
}) => {
  await page.goto('/?demo=docs');
  await expect(page.getByRole('heading', { name: 'Getting started', exact: true })).toBeVisible();
  await expect(page.locator('.shiki span').first()).toBeVisible();
  await page.getByLabel('Search documentation', { exact: true }).fill('restoration');
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('button', { name: 'Advanced scrolling', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Advanced scrolling', exact: true }),
  ).toBeVisible();
  if (browserName === 'chromium') {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy code', exact: true }).first().click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('<script setup');
  }
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
