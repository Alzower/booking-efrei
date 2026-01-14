import { test as setup, expect } from "@playwright/test";
import { sharedTestCredentials } from "./test-helpers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { email, password } = sharedTestCredentials;
const authFile = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/login");
  await page.getByText("Créer un compte").click();
  await expect(page).toHaveURL("http://localhost:5173/signup");
  await page.getByPlaceholder("Votre nom").fill("Test User");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "S'inscrire" }).click();
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  const userJson = await page.evaluate(() => localStorage.getItem("user"));
  if (userJson) {
    const user = JSON.parse(userJson);
    const sharedDataFile = path.join(__dirname, ".shared-test-data.json");
    if (fs.existsSync(sharedDataFile)) {
      const data = JSON.parse(fs.readFileSync(sharedDataFile, "utf-8"));
      data.createdUserId = user.id;
      fs.writeFileSync(sharedDataFile, JSON.stringify(data, null, 2));
    }
  }

  await page.context().storageState({ path: authFile });
});
