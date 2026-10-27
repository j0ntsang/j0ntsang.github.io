import type { Page } from "@playwright/test";
import {
  bootFresh,
  expect,
  octoberWindow,
  openOctober,
  readStorage,
  seedStorage,
  settingsMenu,
  settingsSummary,
  terminalInput,
  test,
} from "./helpers";

const html = (page: Page) => page.locator("html");
const themeSelect = (page: Page) => page.getByRole("combobox", { name: /Theme/ });
const animationCheckbox = (page: Page) => page.getByRole("checkbox", { name: "Animation" });
const fullscreenButton = (page: Page) => page.getByRole("button", { name: "Fullscreen" });
const themeColor = (page: Page) => page.locator('meta[name="theme-color"]');

async function openSettings(page: Page) {
  await settingsSummary(page).click();
  await expect(settingsMenu(page)).toHaveAttribute("open", "");
}

const backgroundColor = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background-color").trim());

test.describe("theme", () => {
  test("a chosen theme applies, is stored and survives a reload", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "default");
    await openSettings(page);
    await themeSelect(page).selectOption("fallout");

    await expect(html(page)).toHaveAttribute("data-theme", "fallout");
    expect(await readStorage(page, "theme")).toBe("fallout");

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "fallout");
    await openSettings(page);
    await expect(themeSelect(page)).toHaveValue("fallout");
  });

  test("an unknown stored theme falls back to the default", async ({ page }) => {
    await seedStorage(page, { theme: "neon" });
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "default");
    await openSettings(page);
    await expect(themeSelect(page)).toHaveValue("default");
  });

  test("the browser theme-color settles to the theme's background", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => themeColor(page).getAttribute("content")).toBe("rgb(30, 30, 30)");
    await openSettings(page);

    await themeSelect(page).selectOption("fallout");
    await expect.poll(() => themeColor(page).getAttribute("content")).toBe("rgb(7, 20, 11)");
    // Not a mid-transition blend: it matches what the page finally paints.
    await expect.poll(() => backgroundColor(page)).toBe("rgb(7, 20, 11)");

    await themeSelect(page).selectOption("default");
    await expect.poll(() => themeColor(page).getAttribute("content")).toBe("rgb(30, 30, 30)");
  });

  test("a window's theme overrides the preference while open and hands it back on close", async ({ page }) => {
    await seedStorage(page, { theme: "fallout" });
    await bootFresh(page);
    await expect(html(page)).toHaveAttribute("data-theme", "fallout");

    await openOctober(page);
    await expect(html(page)).toHaveAttribute("data-theme", "october");
    expect(await readStorage(page, "theme")).toBe("fallout");

    await page.keyboard.press("Escape");
    await expect(octoberWindow(page)).toHaveCount(0);
    await expect(html(page)).toHaveAttribute("data-theme", "fallout");
  });
});

test.describe("animation", () => {
  test("is on by default and stays off once switched off, across a reload", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveClass(/\banimation\b/);
    await openSettings(page);
    await expect(animationCheckbox(page)).toBeChecked();

    await animationCheckbox(page).uncheck();
    await expect(html(page)).not.toHaveClass(/\banimation\b/);
    expect(await readStorage(page, "animation")).toBe("false");

    await page.reload();
    await expect(html(page)).not.toHaveClass(/\banimation\b/);
    await openSettings(page);
    await expect(animationCheckbox(page)).not.toBeChecked();
  });

  test.describe("with reduced motion preferred", () => {
    test.use({ reducedMotion: "reduce" });

    test("starts off, and turning it on is remembered over the preference", async ({ page }) => {
      await page.goto("/");
      await expect(html(page)).not.toHaveClass(/\banimation\b/);
      await openSettings(page);
      await expect(animationCheckbox(page)).not.toBeChecked();
      await animationCheckbox(page).check();
      await expect(html(page)).toHaveClass(/\banimation\b/);

      await page.reload();
      await expect(html(page)).toHaveClass(/\banimation\b/);
      await openSettings(page);
      await expect(animationCheckbox(page)).toBeChecked();
    });
  });

  test("the terminal cursor blinks only while Animation is on", async ({ page }) => {
    await bootFresh(page);
    await terminalInput(page).focus();
    const blinking = page.locator(".xterm-rows .xterm-cursor-blink");
    await expect(blinking).toHaveCount(1);

    await openSettings(page);
    await animationCheckbox(page).uncheck();
    await terminalInput(page).focus();
    await expect(blinking).toHaveCount(0);
  });
});

test.describe("menu dismissal", () => {
  test("Escape closes the menu and returns focus to the gear", async ({ page }) => {
    await page.goto("/");
    await openSettings(page);
    await themeSelect(page).focus();
    await page.keyboard.press("Escape");

    await expect(settingsMenu(page)).not.toHaveAttribute("open");
    await expect(settingsSummary(page)).toBeFocused();
  });

  test("a click outside closes it, even on the terminal in the shadow DOM layout", async ({ page }) => {
    await page.goto("/");
    await openSettings(page);
    await page.locator("window-manager > [slot='main'] .xterm").click();
    await expect(settingsMenu(page)).not.toHaveAttribute("open");
  });

  test("a click on plain text inside the menu keeps it open", async ({ page }) => {
    await page.goto("/");
    await openSettings(page);
    await page.getByText("Theme:").click();
    await expect(settingsMenu(page)).toHaveAttribute("open", "");
  });

  test("tabbing out past the last control closes it", async ({ page }) => {
    await page.goto("/");
    await openSettings(page);
    await themeSelect(page).focus();
    await page.keyboard.press("Tab");
    await expect(settingsMenu(page)).not.toHaveAttribute("open");
  });

  test("the placeholder controls are gone", async ({ page }) => {
    await page.goto("/");
    await openSettings(page);
    await expect(settingsMenu(page).getByRole("checkbox")).toHaveCount(1);
    for (const gone of ["Performance Mode", "Disable JavaScript", "Layout"]) {
      await expect(settingsMenu(page).getByText(gone)).toHaveCount(0);
    }
  });
});

test.describe("when localStorage is blocked", () => {
  test("nothing throws, and settings still apply for the page", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await bootFresh(page);

    await openSettings(page);
    await animationCheckbox(page).uncheck();
    await expect(html(page)).not.toHaveClass(/\banimation\b/);
    await themeSelect(page).selectOption("october");
    await expect(html(page)).toHaveAttribute("data-theme", "october");
  });
});

test.describe("fullscreen button", () => {
  test("has an accessible name and starts un-pressed", async ({ page }) => {
    await page.goto("/");
    await expect(fullscreenButton(page)).toBeVisible();
    await expect(fullscreenButton(page)).toHaveAttribute("aria-pressed", "false");
    await expect(fullscreenButton(page)).toHaveAttribute("title", "Enter fullscreen");
  });

  test("is left out when the browser can't do fullscreen", async ({ page }) => {
    await page.addInitScript(() => {
      for (const name of ["fullscreenEnabled", "webkitFullscreenEnabled"]) {
        Object.defineProperty(Document.prototype, name, { get: () => false });
      }
    });
    await bootFresh(page);
    await expect(fullscreenButton(page)).toHaveCount(0);
    await expect(settingsSummary(page)).toBeVisible();
  });
});
