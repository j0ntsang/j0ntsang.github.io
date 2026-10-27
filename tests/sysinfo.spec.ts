import { bootFresh, expect, sidebarPanel, startSysinfo, test } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bootFresh(page);
  await startSysinfo(page);
});

test("the panel is a labelled complementary landmark holding one region with a single tab stop", async ({ page }) => {
  const panel = sidebarPanel(page);
  await expect(page.getByRole("complementary", { name: "sysInfo" })).toBeVisible();
  await expect(panel.getByRole("region", { name: "System info" })).toBeVisible();
  await expect(panel.locator("[tabindex]")).toHaveCount(1);
  await expect(panel.locator('[role="row"]')).toHaveCount(0);
});

test("Tab goes from the region to each tab and then out of the panel", async ({ page }) => {
  const panel = sidebarPanel(page);
  await panel.getByRole("region", { name: "System info" }).focus();

  await page.keyboard.press("Tab");
  await expect(panel.getByRole("tab", { name: "System" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("tab", { name: "Connection" })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[slot="sidebar"]'))).toBe(false);
});

test("exactly one tab is selected, and selecting another swaps the tabpanel", async ({ page }) => {
  const panel = sidebarPanel(page);
  const system = panel.getByRole("tab", { name: "System" });
  const connection = panel.getByRole("tab", { name: "Connection" });

  await expect(system).toHaveAttribute("aria-selected", "true");
  await expect(connection).toHaveAttribute("aria-selected", "false");
  await expect(panel.getByRole("tabpanel", { name: "System" })).toBeVisible();

  await connection.focus();
  await page.keyboard.press("Enter");
  await expect(connection).toHaveAttribute("aria-selected", "true");
  await expect(system).toHaveAttribute("aria-selected", "false");
  await expect(panel.getByRole("tabpanel", { name: "Connection" })).toBeVisible();
  await expect(panel.getByRole("term").filter({ hasText: "Effective Type" })).toBeVisible();
  await expect(connection).toHaveCSS("box-shadow", /inset/);
  await expect(system).toHaveCSS("box-shadow", "none");
});

test("rows are definition-list terms and definitions, each term paired with a value", async ({ page }) => {
  const panel = sidebarPanel(page);
  await expect(panel.getByRole("heading", { level: 2, name: "Time" })).toBeVisible();

  const terms = await panel.getByRole("term").count();
  expect(terms).toBeGreaterThan(5);
  await expect(panel.getByRole("definition")).toHaveCount(terms);
  await expect(panel.getByRole("term").filter({ hasText: "Status" })).toBeVisible();
  await expect(panel.getByRole("definition").filter({ hasText: /^(Online|Offline)$/ })).toHaveCount(1);
});
