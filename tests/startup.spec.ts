import {
  boot,
  expect,
  octoberWindow,
  openOctober,
  run,
  sidebarColumn,
  sidebarPanel,
  sidebarToggle,
  startSysinfo,
  terminalText,
  test,
} from "./helpers";

// Records when the sidebar's tablist and the toggle first appear in the DOM.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const seen: Record<string, number> = {};
    (window as any).__seen = seen;
    const checks: Record<string, () => boolean> = {
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

test("main window loads the terminal before boot, with no sidebar or icon yet", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('window-manager > [slot="main"] .xterm')).toBeVisible();
  await expect(terminalText(page)).toContainText("Press any key to boot");
  await expect(sidebarPanel(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarToggle(page)).toHaveCount(0);
});

test("boot leaves sysinfo off, with no sidebar or icon", async ({ page }) => {
  await page.goto("/");
  await boot(page);

  await run(page, "sysinfo status");
  await expect(terminalText(page)).toContainText("sysinfo: stopped");
  await expect(sidebarPanel(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarToggle(page)).toHaveCount(0);
});

test("sysinfo start fills the sidebar in the same task that shows the icon", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);

  await expect(sidebarPanel(page).getByRole("tab", { name: "System" })).toBeVisible();
  await expect(sidebarToggle(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");

  // Guards the flushSync in the react toolkit: without it the tablist renders after the icon.
  const seen = await page.evaluate(() => (window as any).__seen as Record<string, number>);
  expect(seen.sidebar).toBeDefined();
  expect(seen.sidebar).toBeLessThanOrEqual(seen.icon);
});

test("the icon hides and shows the sidebar while sysinfo keeps running", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);
  await sidebarPanel(page).getByRole("tab", { name: "Connection" }).click();

  await sidebarToggle(page).click();
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "false");
  await run(page, "sysinfo status");
  await expect(terminalText(page)).toContainText("sysinfo: running");

  await sidebarToggle(page).click();
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(sidebarPanel(page).getByRole("tab", { name: "Connection" })).toHaveAttribute("aria-selected", "true");
});

test("stopping sysinfo empties the sidebar and removes the icon; starting brings both back", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);

  await run(page, "sysinfo stop");
  await expect(sidebarPanel(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarToggle(page)).toHaveCount(0);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("a sidebar hidden before sysinfo stops is open again when it restarts", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);

  await sidebarToggle(page).click();
  await expect(sidebarColumn(page)).toBeHidden();
  await run(page, "sysinfo stop");
  await expect(sidebarToggle(page)).toHaveCount(0);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("opening october hides the sidebar, and closing it brings the sidebar back", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);

  await openOctober(page, "");
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Escape");
  await expect(octoberWindow(page)).toHaveCount(0);
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("a sidebar that was hidden before october stays hidden after it closes", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await startSysinfo(page);
  await sidebarToggle(page).click();
  await expect(sidebarColumn(page)).toBeHidden();

  await openOctober(page, "");
  await page.keyboard.press("Escape");
  await expect(octoberWindow(page)).toHaveCount(0);
  await expect(sidebarColumn(page)).toBeHidden();
  await expect(sidebarPanel(page)).toHaveCount(1);
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("sysinfo start after october was opened and closed with no sidebar still shows the sidebar", async ({ page }) => {
  await page.goto("/");
  await boot(page);

  await openOctober(page);
  await page.keyboard.press("Escape");
  await expect(octoberWindow(page)).toHaveCount(0);

  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarPanel(page).getByRole("tab", { name: "System" })).toBeVisible();
  await expect(sidebarColumn(page)).toBeVisible();
  await expect(sidebarToggle(page)).toHaveAttribute("aria-pressed", "true");
});
