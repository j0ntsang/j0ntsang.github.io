import { expect, Page, test } from "@playwright/test";

// Startup order: the main window (terminal) loads with the page; booting
// starts init, which starts the sysinfo daemon in the sidebar; the waybar
// sidebar icon appears once the sidebar has something in it.

const terminalText = (page: Page) => page.locator(".xterm-rows");
const sidebarPanel = (page: Page) => page.locator('window-manager > [slot="sidebar"]');
const sidebarColumn = (page: Page) => page.locator("window-manager .sidebar");
const sidebarIcon = (page: Page) => page.locator("#sidebarToggle");

async function boot(page: Page) {
  await expect(terminalText(page)).toContainText("Press any key to boot");
  await page.locator(".xterm-helper-textarea").press("Enter");
  await expect(terminalText(page)).toContainText("guest@", { timeout: 10_000 });
}

async function run(page: Page, command: string) {
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type(command);
  await page.keyboard.press("Enter");
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  (page as Page & { errors: string[] }).errors = errors;

  // Record when each piece first shows up, to check the order later.
  await page.addInitScript(() => {
    const seen: Record<string, number> = {};
    (window as any).__seen = seen;
    const checks: Record<string, () => boolean> = {
      main: () => !!document.querySelector('window-manager > [slot="main"] .xterm'),
      sidebar: () => !!document.querySelector('window-manager > [slot="sidebar"] [role="tablist"]'),
      icon: () => !!document.getElementById("sidebarToggle"),
    };
    new MutationObserver(() => {
      for (const [name, check] of Object.entries(checks)) {
        if (!(name in seen) && check()) seen[name] = performance.now();
      }
    }).observe(document, { childList: true, subtree: true });
  });
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { errors: string[] }).errors).toEqual([]);
});

test("main window loads the terminal before boot, with no sidebar or icon yet", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('window-manager > [slot="main"] .xterm')).toBeVisible();
  await expect(terminalText(page)).toContainText("Press any key to boot");
  await expect(sidebarPanel(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarIcon(page)).toHaveCount(0);
});

test("boot runs sysinfo in the sidebar after main, then shows the icon", async ({ page }) => {
  await page.goto("/");
  await boot(page);

  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarPanel(page).getByRole("tab", { name: "System" })).toBeVisible();
  await expect(sidebarIcon(page)).toBeVisible();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "true");

  const seen = await page.evaluate(() => (window as any).__seen as Record<string, number>);
  expect(seen.main).toBeLessThan(seen.sidebar);
  expect(seen.sidebar).toBeLessThanOrEqual(seen.icon);
});

test("the icon hides and shows the sidebar while sysinfo keeps running", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await expect(sidebarPanel(page)).toBeVisible();
  await sidebarPanel(page).getByRole("tab", { name: "Connection" }).click();

  await sidebarIcon(page).click();
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "false");
  await run(page, "sysinfo status");
  await expect(terminalText(page)).toContainText("sysinfo: running");

  await sidebarIcon(page).click();
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "true");
  // Same process, same panel: the tab it was left on is still selected.
  await expect(sidebarPanel(page).getByRole("tab", { name: "Connection" })).toHaveAttribute("aria-selected", "true");
});

test("stopping sysinfo empties the sidebar and removes the icon; starting brings both back", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await expect(sidebarIcon(page)).toBeVisible();

  await run(page, "sysinfo stop");
  await expect(sidebarPanel(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarIcon(page)).toHaveCount(0);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "true");
});

test("a sidebar hidden before sysinfo stops is open again when it restarts", async ({ page }) => {
  await page.goto("/");
  await boot(page);

  await sidebarIcon(page).click();
  await expect(sidebarColumn(page)).toBeHidden();
  await run(page, "sysinfo stop");
  await expect(sidebarIcon(page)).toHaveCount(0);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "true");
});

test("opening october hides the sidebar, and closing it brings the sidebar back", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await expect(sidebarPanel(page)).toBeVisible();

  await run(page, "october");
  await expect(page.locator(".october")).toBeVisible();
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Escape");
  await expect(page.locator(".october")).toHaveCount(0);
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarIcon(page)).toHaveAttribute("aria-pressed", "true");
});

test("a sidebar that was hidden before october stays hidden after it closes", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await sidebarIcon(page).click();
  await expect(sidebarColumn(page)).toBeHidden();

  await run(page, "october");
  await expect(page.locator(".october")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".october")).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
});
