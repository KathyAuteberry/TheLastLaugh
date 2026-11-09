import { defineConfig, devices } from "@playwright/test";

// Browser smoke tests: build-free, against the Vite dev server on its own port (so a running preview isn't touched).
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: "http://localhost:5179", trace: "retain-on-failure" },
  webServer: { command: "npx vite --port 5179 --strictPort", url: "http://localhost:5179", reuseExistingServer: false, timeout: 60_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
