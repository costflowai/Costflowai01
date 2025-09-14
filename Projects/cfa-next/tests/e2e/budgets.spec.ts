import { test, expect } from '@playwright/test';

test('meets simple resource budgets', async ({ page }) => {
  await page.goto('/');
  const perf = await page.evaluate(() =>
    performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      type: r.initiatorType,
      size: r.transferSize || 0
    }))
  );

  const counts = perf.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as any);

  const total = perf.reduce((sum, resource) => sum + resource.size, 0);

  expect(Object.values(counts).reduce((sum: any, count: any) => sum + count, 0)).toBeLessThanOrEqual(25);
  expect((counts['script'] || 0)).toBeLessThanOrEqual(8);
  expect(total).toBeLessThanOrEqual(350000);
});