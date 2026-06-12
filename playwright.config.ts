import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  retries: 1,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "node_modules/.bin/next start",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60000,
      },
})
