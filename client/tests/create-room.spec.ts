import { test, expect, firefox } from "@playwright/test";
import { sharedRoomName } from "./test-helpers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("create room for user", async () => {
  const browser = await firefox.launch({ headless: true });
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

  await page.waitForTimeout(2000);

  const newRoomCard = page.locator(`text="${sharedRoomName}"`).first();
  if (await newRoomCard.isVisible()) {
    const deleteButton = page.locator(`[data-testid^="delete-room-"]`).first();
    const testId = await deleteButton.getAttribute("data-testid");
    if (testId) {
      const roomId = testId.replace("delete-room-", "");
      console.log("ID de la salle créée:", roomId);

      const sharedDataFile = path.join(__dirname, ".shared-test-data.json");
      if (fs.existsSync(sharedDataFile)) {
        const data = JSON.parse(fs.readFileSync(sharedDataFile, "utf-8"));
        data.createdRoomId = roomId;
        fs.writeFileSync(sharedDataFile, JSON.stringify(data, null, 2));
      }
    }
  }

  await browser.close();
});

test("edit room", async () => {
  const browser = await firefox.launch({ headless: true });
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

  const editButton = page.locator(`button[data-testid^="edit-room-"]`).first();
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

  // Revert changes to not break other tests that expect sharedRoomName
  await editButton.click();
  await expect(modal).toBeVisible({ timeout: 5000 });
  await nameInput.clear();
  await nameInput.fill(sharedRoomName);
  await page.getByTestId("submit-room-button").click();
  await expect(page.getByText("Salle mise à jour avec succès!")).toBeVisible();

  await browser.close();
});
