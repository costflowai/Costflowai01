import { test, expect } from '@playwright/test';
import { startStaticServer } from './utils/server.js';

const PORT = 4177;
let server;

test.use({ baseURL: `http://127.0.0.1:${PORT}` });

test.beforeAll(async () => {
  server = await startStaticServer({ port: PORT });
});

test.afterAll(async () => {
  if (server) {
    await server.close();
  }
});

test('concrete calculator computes volume and supports exports', async ({ page }) => {
  await page.goto('/calculators/');

  await page.evaluate(() => {
    window.__calls = [];
    const originalCompute = window.compute;
    window.compute = (...args) => {
      window.__calls.push(args);
      return originalCompute(...args);
    };
  });

  await page.fill('#length', '20');
  await page.fill('#width', '10');
  await page.fill('#thickness', '6');
  await page.fill('#waste', '5');

  await page.getByRole('button', { name: 'Calculate', exact: true }).click();

  await expect(page.locator('[data-results="concrete"]')).toBeVisible();
  const volumeText = await page.locator('[data-results="concrete"] table').first().locator('tr').first().locator('td').textContent();
  const volumeValue = Number.parseFloat(volumeText);
  expect(volumeValue).toBeGreaterThan(0);

  const callArgs = await page.evaluate(() => window.__calls);
  expect(callArgs.at(-1)?.[0]).toBe('concrete');

  const mathLocator = page.locator('[data-results="concrete"] [data-math]');
  await page.getByRole('button', { name: 'Show Math' }).click();
  await expect(mathLocator).toBeVisible();

  const csvPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const csvDownload = await csvPromise;
  expect(csvDownload.suggestedFilename()).toContain('concrete');
  await csvDownload.delete();

  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const pdfDownload = await pdfPromise;
  expect(pdfDownload.suggestedFilename()).toContain('concrete');
  await pdfDownload.delete();

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Print' }).click();
  const popup = await popupPromise;
  await popup.close();
});

test('framing calculator handles metric inputs and reveals math', async ({ page }) => {
  await page.goto('/calculators/');

  await page.selectOption('#framing-unit-system', 'metric');
  await page.fill('#wall-length', '5');
  await page.fill('#wall-height', '3');
  await page.fill('#stud-spacing', '40');
  await page.fill('#plates', '3');

  await page.locator('[data-calculator="framing"] [data-action="calculate"]').click();

  await expect(page.locator('[data-results="framing"]')).toBeVisible();
  const studs = await page.locator('[data-results="framing"] table').first().locator('tr').first().locator('td').textContent();
  expect(Number.parseInt(studs, 10)).toBeGreaterThan(0);

  await page.locator('[data-results="framing"] [data-action="show-math"]').click();
  await expect(page.locator('[data-results="framing"] [data-math]')).toBeVisible();
});
