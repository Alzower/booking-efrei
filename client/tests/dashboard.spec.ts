import { test, expect, firefox } from "@playwright/test";
import { sharedRoomName } from "./test-helpers";

test("create reservation, verify in history, and delete", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    storageState: ".auth/user.json",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/dashboard");
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  await page.waitForSelector(".fc-daygrid-day");

  await page.locator(".fc-daygrid-day").last().click();

  await page.waitForTimeout(2000);

  await page.waitForSelector("label", { timeout: 10000 });

  console.log("Recherche de la salle avec nom:", sharedRoomName);

  const allLabels = await page.locator("label").allTextContents();
  console.log("Salles disponibles:", allLabels);

  const salleLabel = page
    .locator(`label:has-text("${sharedRoomName}")`)
    .first();
  await salleLabel.waitFor({ state: "visible", timeout: 10000 });
  await salleLabel.click();

  await page.getByTestId("reservation-submit-button").click();

  await page.waitForTimeout(3000);

  const calendarEvent = page.locator(".fc-event").first();
  await calendarEvent.waitFor({ state: "visible", timeout: 10000 });
  await calendarEvent.click();

  await page.waitForTimeout(1000);

  page.on("dialog", (dialog) => dialog.accept());

  const deleteButton = page.getByTestId("delete-reservation-button");
  await deleteButton.waitFor({ state: "visible", timeout: 5000 });
  await deleteButton.click();

  await page.waitForTimeout(2000);

  await browser.close();
});
