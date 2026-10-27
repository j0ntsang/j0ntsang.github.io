import { boot, expect, run, settingsSummary, sidebarPanel, sidebarToggle, terminalText, test } from "./helpers";

// Each test breaks one template on purpose, so the browser's own "Failed to load resource" log is expected.
const FAILED_RESOURCE = /Failed to load resource/;

test("a missing settings template leaves the gear out and the terminal still boots", async ({ page, allowErrors }) => {
  allowErrors(FAILED_RESOURCE);
  await page.route("**/templates/settings-menu.html", (route) => route.abort());
  await page.goto("/");

  await expect(terminalText(page)).toContainText("Press any key to boot");
  await expect(settingsSummary(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fullscreen" })).toBeVisible();
  await boot(page);
});

test("a missing fullscreen template leaves its button out and the terminal still boots", async ({ page, allowErrors }) => {
  allowErrors(FAILED_RESOURCE);
  await page.route("**/templates/fullscreen-toggle.html", (route) => route.fulfill({ status: 404, body: "nope" }));
  await page.goto("/");

  await expect(terminalText(page)).toContainText("Press any key to boot");
  await expect(page.getByRole("button", { name: "Fullscreen" })).toHaveCount(0);
  await expect(settingsSummary(page)).toBeVisible();
});

test("a missing sidebar-toggle template still lets sysinfo fill the sidebar, without an icon", async ({ page, allowErrors }) => {
  allowErrors(FAILED_RESOURCE);
  await page.route("**/templates/sidebar-toggle.html", (route) => route.abort());
  await page.goto("/");
  await boot(page);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveCount(0);
});

test("a missing terminal template shows an alert instead of an empty window", async ({ page, allowErrors }) => {
  allowErrors(FAILED_RESOURCE, "Initialization failed");
  await page.route("**/templates/terminal.html", (route) => route.fulfill({ status: 404, body: "nope" }));
  await page.goto("/");

  await expect(page.getByRole("alert")).toHaveText("The terminal failed to load. Check your connection and reload.");
  await expect(page.locator(".xterm")).toHaveCount(0);
});

test("a terminal script that fails to load shows the same alert", async ({ page, allowErrors }) => {
  allowErrors(FAILED_RESOURCE, "Initialization failed", /dynamically imported module|Failed to fetch/);
  await page.route("**/src/terminal/index.js*", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText("The terminal failed to load");
});
