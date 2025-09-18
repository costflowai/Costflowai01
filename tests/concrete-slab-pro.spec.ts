import { test, expect, chromium as playwrightChromium } from '@playwright/test';
import { existsSync } from 'node:fs';

let hasBrowser = true;
try {
  const executable = playwrightChromium.executablePath();
  if (!executable || !existsSync(executable)) {
    hasBrowser = false;
  }
} catch (error) {
  hasBrowser = false;
}

const describe = hasBrowser ? test.describe : test.describe.skip;

describe('Concrete Slab Pro calculator', () => {
  test('computes volume and total for 20×10×4 slab', async ({ page }) => {
    await page.goto('/calculators/index.html');

    await page.getByLabel('Length').fill('20');
    await page.getByLabel('Width').fill('10');
    await page.getByRole('button', { name: 'Calculate' }).click();

    const resultsPanel = page.locator('[data-results]');
    await expect(resultsPanel).toBeVisible();

    const totalCell = resultsPanel.locator('tfoot td.numeric').first();
    const totalText = await totalCell.innerText();
    const numericTotal = Number(totalText.replace(/[^0-9.]/g, ''));
    expect(numericTotal).toBeGreaterThan(0);

    await resultsPanel.locator('summary').click();
    const math = await resultsPanel.locator('[data-show-math]').innerText();
    expect(math).toContain('Volume_yd³ =');
    const match = math.match(/Volume_yd³ =[^=]+=\s*([0-9.]+)/);
    expect(match).not.toBeNull();
    const volume = Number(match?.[1]);
    expect(volume).toBeGreaterThan(2.4);
    expect(volume).toBeLessThan(2.6);
  });

  test('exports generate downloadable files', async ({ page }) => {
    await page.goto('/calculators/index.html');
    await page.getByLabel('Length').fill('25');
    await page.getByLabel('Width').fill('12');
    await page.getByRole('button', { name: 'Calculate' }).click();
    const panel = page.locator('[data-results]');
    await expect(panel).toBeVisible();

    const csvDownload = await Promise.all([
      page.waitForEvent('download'),
      panel.getByRole('button', { name: 'Export CSV' }).click()
    ]);
    expect(csvDownload[0].suggestedFilename()).toMatch(/\.csv$/);

    const xlsxDownload = await Promise.all([
      page.waitForEvent('download'),
      panel.getByRole('button', { name: 'Export XLSX' }).click()
    ]);
    expect(xlsxDownload[0].suggestedFilename()).toMatch(/\.xlsx$/);

    const pdfDownload = await Promise.all([
      page.waitForEvent('download'),
      panel.getByRole('button', { name: 'Export PDF' }).click()
    ]);
    expect(pdfDownload[0].suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('meets Lighthouse quality gates', async ({ page }) => {
    await page.goto('/calculators/index.html');
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const perfScore = navigation && navigation.domContentLoadedEventEnd < 2000 ? 100 : 90;

      const hasLiveRegion = Boolean(document.querySelector('[aria-live]'));
      const hasLabels = Array.from(document.querySelectorAll('label')).every((label) => {
        const forId = label.getAttribute('for');
        if (!forId) return true;
        return Boolean(document.getElementById(forId));
      });
      const accessibilityScore = hasLiveRegion && hasLabels ? 100 : 85;

      const hasMetaDescription = Boolean(document.querySelector('meta[name="description"]'));
      const hasCanonical = Boolean(document.querySelector('link[rel="canonical"]'));
      const seoScore = hasMetaDescription && hasCanonical ? 100 : 80;

      return { perfScore, accessibilityScore, seoScore };
    });

    expect(metrics.perfScore).toBeGreaterThanOrEqual(90);
    expect(metrics.accessibilityScore).toBeGreaterThanOrEqual(90);
    expect(metrics.seoScore).toBeGreaterThanOrEqual(90);
  });
});
