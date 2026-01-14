import { test, expect, firefox } from "@playwright/test";
import { sharedTestCredentials } from "./test-helpers";

const { email, password } = sharedTestCredentials;

test("homepage loads", async () => {
  const browser = await firefox.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/login");

  await page.getByPlaceholder("Email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  await page.getByTestId("menue-button").click();
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL("http://localhost:5173/");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByPlaceholder("Email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  await browser.close();
});
