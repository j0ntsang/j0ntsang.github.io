import type { Page } from "@playwright/test";
import { boot, expect, mainSlot, run, screen, test } from "./helpers";

// The real app is a separate build that fetches live data, so a stand-in page answers for
// /fredericton/. It sends COEP like the real one does here: the terminal is isolated, and an
// iframe without it would be blocked.
async function stubApp(page: Page) {
  const requested: string[] = [];
  await page.route("**/fredericton/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    requested.push(path);
    return route.fulfill({
      contentType: "text/html",
      headers: { "Cross-Origin-Embedder-Policy": "require-corp", "Cross-Origin-Resource-Policy": "same-origin" },
      body: `<!doctype html><title>News · Fredericton today</title><input aria-label="Search"><button>Rename</button>
        <script>document.querySelector("button").onclick = () => (document.title = "City Watch · Fredericton today");</script>`,
    });
  });
  return requested;
}

const frederictonWindow = (page: Page) => page.getByRole("dialog", { name: /Fredericton today$/ });
const app = (page: Page) => page.frameLocator('program-window iframe');

test("opens the app at a page in a window, titled after the app's page", async ({ page }) => {
  const requested = await stubApp(page);
  await page.goto("/");
  await boot(page);
  await run(page, "fredericton news");

  await expect(frederictonWindow(page)).toHaveAccessibleName("News · Fredericton today");
  expect(requested).toContain("/fredericton/news/");
  await expect(mainSlot(page)).toHaveAttribute("inert", "");

  await app(page).getByRole("button", { name: "Rename" }).click();
  await expect(frederictonWindow(page)).toHaveAccessibleName("City Watch · Fredericton today");
});

test("Escape inside the app closes the window, but not while typing", async ({ page }) => {
  await stubApp(page);
  await page.goto("/");
  await boot(page);
  await run(page, "fredericton");
  await expect(frederictonWindow(page)).toBeVisible();

  await app(page).getByRole("textbox", { name: "Search" }).press("Escape");
  await expect(frederictonWindow(page)).toBeVisible();

  await app(page).getByRole("button", { name: "Rename" }).press("Escape");
  await expect(frederictonWindow(page)).toBeHidden();
  await expect(mainSlot(page)).not.toHaveAttribute("inert", "");
});

test("rejects an unknown page", async ({ page }) => {
  await page.goto("/");
  await boot(page);
  await run(page, "fredericton nowhere");

  await expect.poll(() => screen(page)).toContain("fredericton: no page 'nowhere'");
  await expect(frederictonWindow(page)).toHaveCount(0);
});
