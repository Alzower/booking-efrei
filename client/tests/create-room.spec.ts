import { test, expect, firefox } from "@playwright/test";
import { sharedRoomName } from "./test-helpers";

test("create room for user", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:5173");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByPlaceholder("Email").fill(process.env.ADMIN_EMAIL || "");
  await page.getByTestId("password").fill(process.env.ADMIN_PASSWORD || "");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL("http://localhost:5173/admin");

  await page.waitForLoadState("networkidle");
  const existingRooms = page.locator(`text="${sharedRoomName}"`);
  const count = await existingRooms.count();

  for (let i = 0; i < count; i++) {
    const deleteButtons = page.locator('button:has-text("Supprimer")');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(500);
    }
  }

  await page.waitForTimeout(1000);

  const createButton = page.getByTestId("create-room-button");
  await expect(createButton).toBeVisible();

  await createButton.click();

  const modal = page.getByTestId("room-modal");
  await expect(modal).toBeVisible({ timeout: 5000 });

  await page.getByTestId("room-name-input").fill(sharedRoomName);
  await page.getByTestId("room-capacity-input").fill("20");

  await page.getByTestId("submit-room-button").click();

  await browser.close();
});

test("edit room", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:5173");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByPlaceholder("Email").fill(process.env.ADMIN_EMAIL || "");
  await page.getByTestId("password").fill(process.env.ADMIN_PASSWORD || "");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL("http://localhost:5173/admin");

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const editButton = page.locator('[data-testid^="edit-room-"]').first();
  await expect(editButton).toBeVisible();
  await editButton.click();

  const modal = page.getByTestId("room-modal");
  await expect(modal).toBeVisible({ timeout: 5000 });

  const nameInput = page.getByTestId("room-name-input");
  await nameInput.clear();
  await nameInput.fill("Salle Modifiée");

  const capacityInput = page.getByTestId("room-capacity-input");
  await capacityInput.clear();
  await capacityInput.fill("30");

  await page.getByTestId("submit-room-button").click();

  await expect(page.getByText("Salle mise à jour avec succès!")).toBeVisible();

  await browser.close();
});
