import { test, expect } from '@playwright/test';

const concreteUrl = '/calculators/concrete-slab-pro.html';

test('results panel exposes live region details', async ({ page }) => {
  await page.goto(concreteUrl);
  const liveRegion = page.locator('.results-live-region');
  await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  const errorSummary = page.locator('.error-summary');
  await expect(errorSummary).toHaveAttribute('role', 'alert');
});

test('home search input wired with accessible help text', async ({ page }) => {
  await page.goto('/index.html');
  const searchInput = page.locator('#search');
  await expect(searchInput).toHaveAttribute('type', 'search');
  await expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
  await expect(page.locator('#search-help')).toHaveText(/Search runs locally/);
});

test('blog index renders posts and feeds are generated', async ({ page }) => {
  await page.goto('/blog/index.html');
  await expect(page.getByRole('heading', { level: 1, name: 'CostFlowAI Insights' })).toBeVisible();
  await expect(page.locator('.card').first()).toBeVisible();

  const rss = await page.request.get('/rss.xml');
  expect(rss.ok()).toBeTruthy();
  const rssBody = await rss.text();
  expect(rssBody).toContain('<rss');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('<urlset');
});
