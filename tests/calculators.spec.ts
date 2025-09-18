import { test, expect, type Page } from '@playwright/test';

const concreteUrl = '/calculators/concrete-slab-pro.html';

async function completeConcreteForm(page: Page) {
  await page.goto(concreteUrl);
  await page.locator('#length_ft').fill('20');
  await page.locator('#width_ft').fill('10');
  await page.locator('#thickness_in').fill('4');
  await page.locator('#waste_percent').fill('5');
  await page.locator('#rebar_grid_in').selectOption('12');
  await page.locator('#rebar_lap_in').fill('24');
  await page.locator('#productivity_yd3_hr').fill('3');
  await expect(page.locator('[data-action="calculate"]')).toBeEnabled();
}

test.describe('Concrete Slab Pro calculator', () => {
  test('computes positive total and renders results', async ({ page }) => {
    await completeConcreteForm(page);
    await page.getByRole('button', { name: 'Calculate' }).click();

    const summaryValue = page.locator('[data-result="summary"] .summary-box__value');
    await expect(summaryValue).toContainText('$');

    const numericText = await summaryValue.textContent();
    expect(numericText).not.toBeNull();
    const numeric = Number.parseFloat(numericText?.replace(/[^0-9.]/g, '') ?? '0');
    expect(numeric).toBeGreaterThan(0);

    await expect(page.locator('[data-result="table"] table')).toBeVisible();
    await expect(page.locator('[data-result="assumptions"] li').first()).toBeVisible();
  });

  test('export buttons trigger downloads', async ({ page }) => {
    await completeConcreteForm(page);
    await page.getByRole('button', { name: 'Calculate' }).click();

    const modes = [
      { label: 'Export CSV', extension: '.csv' },
      { label: 'Export XLSX', extension: '.xlsx' },
      { label: 'Export PDF', extension: '.pdf' }
    ];

    for (const mode of modes) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: mode.label }).click()
      ]);
      const suggested = download.suggestedFilename();
      expect(suggested).toContain('concrete-slab-pro');
      expect(suggested).toContain(mode.extension);
      await download.path();
    }
  });

  test('supports keyboard navigation order', async ({ page }) => {
    await completeConcreteForm(page);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#length_ft')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#width_ft')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#thickness_in')).toBeFocused();
  });
});
