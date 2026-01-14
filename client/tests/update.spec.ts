import { test, expect, firefox } from "@playwright/test";

test("update user profile", async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    storageState: ".auth/user.json",
  });
  const page = await context.newPage();

  await page.goto("http://localhost:5173/dashboard");
  await expect(page).toHaveURL("http://localhost:5173/dashboard");

  await page.getByTestId("menue-button").click();
  await page.getByRole("link", { name: "Modifier le profil" }).click();
  await expect(page).toHaveURL("http://localhost:5173/profile/edit");

  const nameInput = page.getByTestId("profile-name-input");
  await nameInput.clear();
  await nameInput.fill("Test User Updated");

  await page.getByTestId("profile-save-button").click();

  await page.waitForTimeout(1000);

  await browser.close();
});
