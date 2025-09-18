import { test, expect } from "@playwright/test";

test("Concrete computes > 0", async ({ page }) => {
  await page.goto("https://costflowai.com/calculators/");
  await page.getByLabel(/length/i).fill("20");
  await page.getByLabel(/width/i).fill("10");
  await page.getByLabel(/thickness\s*\(in\)/i).fill("4");
  await page.getByRole("button", { name: /calculate/i }).click();
  await expect(page.getByTestId("result-volume")).not.toHaveText(/0(\.0+)?/);
});
