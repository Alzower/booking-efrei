import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  globalTeardown: "./tests/global-teardown.ts",

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
      name: "create-room-tests",
      testMatch: /create-room\.spec\.ts/,
    },
    {
      name: "dashboard-tests",
      testMatch: /dashboard\.spec\.ts/,
      dependencies: ["setup", "create-room-tests"],
      use: {
        storageState: ".auth/user.json",
      },
    },
    {
      name: "update-tests",
      testMatch: /update\.spec\.ts/,
      dependencies: [
        "setup",
        "auth-tests",
        "create-room-tests",
        "dashboard-tests",
      ],
      use: {
        storageState: ".auth/user.json",
      },
    },
    {
      name: "delete-tests",
      testMatch: /delete-user\.spec\.ts/,
      dependencies: [
        "setup",
        "auth-tests",
        "create-room-tests",
        "dashboard-tests",
        "update-tests",
      ],
    },
    {
      name: "authenticated-tests",
      testMatch: /.*\.spec\.ts/,
      testIgnore: [
        /auth\.spec\.ts/,
        /create-room\.spec\.ts/,
        /dashboard\.spec\.ts/,
        /update\.spec\.ts/,
        /delete-user\.spec\.ts/,
      ],
      dependencies: ["setup"],
      use: {
        storageState: ".auth/user.json",
      },
    },
  ],

  use: {
    browserName: "firefox",
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
  },
});
