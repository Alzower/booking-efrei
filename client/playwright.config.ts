import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "auth-tests",
      testMatch: /auth\.spec\.ts/,
    },
    {
      name: "authenticated-tests",
      testMatch: /.*\.spec\.ts/,
      testIgnore: /auth\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: ".auth/user.json",
      },
    },
  ],

  use: {
    browserName: "firefox",
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
  },
});
