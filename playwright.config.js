import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4319",
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-light",
      use: { viewport: { width: 1440, height: 1000 }, colorScheme: "light" },
    },
    {
      name: "desktop-dark",
      use: { viewport: { width: 1440, height: 1000 }, colorScheme: "dark" },
    },
    {
      name: "mobile-light",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        colorScheme: "light",
      },
    },
    {
      name: "mobile-dark",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: "node tests/browser-server.js",
    url: "http://127.0.0.1:4319/api/health",
    reuseExistingServer: true,
  },
});
