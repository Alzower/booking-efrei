import { test, expect, firefox } from "@playwright/test";
import { sharedRoomId, sharedTestCredentials } from "./test-helpers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("admin deletes room and user", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/login");

  await page.getByPlaceholder("Email").fill(process.env.ADMIN_EMAIL || "");
  await page.getByTestId("password").fill(process.env.ADMIN_PASSWORD || "");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/admin");

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const sharedDataFile = path.join(__dirname, ".shared-test-data.json");
  let createdRoomId = sharedRoomId;

  if (fs.existsSync(sharedDataFile)) {
    const data = JSON.parse(fs.readFileSync(sharedDataFile, "utf-8"));
    createdRoomId = data.createdRoomId || sharedRoomId;
  }

  console.log("Suppression de la salle avec ID:", createdRoomId);
  const deleteRoomButton = page.getByTestId(`delete-room-${createdRoomId}`);
  if (await deleteRoomButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await deleteRoomButton.click();
    await page.waitForTimeout(1000);
  } else {
    console.log("Salle non trouvée, elle a peut-être déjà été supprimée");
  }

  await page.getByRole("link", { name: "Utilisateurs" }).click();
  await expect(page).toHaveURL("http://localhost:5173/admin/users");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  let createdUserId = "";

  if (fs.existsSync(sharedDataFile)) {
    const data = JSON.parse(fs.readFileSync(sharedDataFile, "utf-8"));
    createdUserId = data.createdUserId || "";
  }

  console.log("Suppression de l'utilisateur:", sharedTestCredentials.email);
  if (createdUserId) {
    const deleteUserButton = page.getByTestId(`delete-user-${createdUserId}`);
    if (
      await deleteUserButton.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await deleteUserButton.click();
      await page.waitForTimeout(1000);
      console.log("Utilisateur supprimé avec succès");
    } else {
      console.log(
        "Utilisateur non trouvé par ID, tentative de recherche par email"
      );
    }
  }

  if (
    !createdUserId ||
    !(await page
      .getByTestId(`delete-user-${createdUserId}`)
      .isVisible()
      .catch(() => false))
  ) {
    const userRow = page.locator(`text="${sharedTestCredentials.email}"`);
    if (await userRow.isVisible()) {
      const deleteUserButton = userRow
        .locator("xpath=ancestor::tr")
        .locator('button:has-text("Supprimer")');
      if (await deleteUserButton.isVisible()) {
        await deleteUserButton.click();
        await page.waitForTimeout(1000);
        console.log("Utilisateur supprimé avec succès via fallback");
      }
    }
  }

  await browser.close();
});
