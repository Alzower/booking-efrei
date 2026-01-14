import { test as setup, expect } from "@playwright/test";
import { sharedTestCredentials } from "./test-helpers";

const { email, password } = sharedTestCredentials;
const authFile = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  // Inscription
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

  // Sauvegarder l'état de connexion
  await page.context().storageState({ path: authFile });
});
