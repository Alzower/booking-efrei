import { test, expect, firefox } from "@playwright/test";

test("dashboard is accessible when logged in", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 5000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:5173/dashboard");
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  await page.waitForSelector(".fc-daygrid-day");

  await page.locator(".fc-daygrid-day").first().click();

  await browser.close();
});
