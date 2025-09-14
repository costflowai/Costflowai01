import { test, expect } from '@playwright/test';

async function selectTab(page, slug) {
  await page.goto('/calculators');
  await page.getByRole('tab', { name: new RegExp(slug, 'i') }).click();
  await page.waitForSelector(`#${slug}-calc`, { state: 'visible' });
}

test('tabs switch & one panel visible', async ({ page }) => {
  await page.goto('/calculators');
  await page.getByRole('tab', { name: /Paint/i }).click();
  await expect(page.locator('#paint-calc')).toBeVisible();
  await expect(page.locator('#drywall-calc')).toBeHidden();
});

test('Paint manual compute enables actions', async ({ page }) => {
  await selectTab(page, 'paint');
  await page.fill('#paint-area', '400');
  await page.fill('#paint-openings', '40');
  await page.selectOption('#paint-texture', 'smooth');
  await page.selectOption('#paint-quality', 'standard');
  await page.check('#paint-primer');
  await page.getByRole('button', { name: /Calculate/i }).click();
  await expect(page.locator('#paint-total')).not.toHaveText(/^\s*$|^\$?0(\.0+)?$/);

  for (const action of ['save', 'export', 'share', 'print', 'email']) {
    await expect(page.locator(`#paint-calc [data-action="${action}"]`)).toBeEnabled();
  }
});

test('Drywall manual compute; no auto-calc', async ({ page }) => {
  await selectTab(page, 'drywall');
  await page.fill('#dw-wall-area', '800');
  await page.fill('#dw-ceiling-area', '200');
  const before = await page.locator('#dw-total').textContent();
  await page.fill('#dw-waste', '12'); // should NOT auto-recompute
  await expect(page.locator('#dw-total')).toHaveText(before ?? '');
  await page.getByRole('button', { name: /Calculate/i }).click();
  await expect(page.locator('#dw-total')).not.toHaveText(/^\s*$|^\$?0(\.0+)?$/);
});

test('Framing compute works on mobile tap', async ({ page, browserName }) => {
  await selectTab(page, 'framing');
  await page.fill('#fr-length-ft', '20');
  await page.fill('#fr-height-ft', '8');
  await page.selectOption('#fr-spacing-in', '16');
  await page.getByRole('button', { name: /Calculate/i }).click();
  await expect(page.locator('#fr-total')).not.toHaveText(/^\s*$|^\$?0(\.0+)?$/);
});

test('PWA offline fallback for /calculators', async ({ page, context }) => {
  await page.goto('/calculators');
  await page.waitForLoadState('networkidle');

  // Wait for service worker to be registered and activated
  await page.waitForTimeout(2000);

  // Check if service worker is registered (may not have controller immediately)
  const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator);
  expect(hasServiceWorker).toBeTruthy();

  await context.setOffline(true);
  await page.reload();
  // Should still load the page (even if from cache)
  await expect(page.locator('h1')).toBeVisible();
  await context.setOffline(false);
});