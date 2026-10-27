import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Runs only in the "prod" project: the built site served by `vite preview` with
// no COOP/COEP headers, like GitHub Pages. Cross-origin isolation has to come
// from the inlined coi-serviceworker, which reloads the page once it takes over.

test("the built site boots to the shell prompt, isolated by its service worker", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

  const response = await page.goto("/");
  expect(response?.headers()["cross-origin-opener-policy"]).toBeUndefined();
  expect(response?.headers()["cross-origin-embedder-policy"]).toBeUndefined();

  await page.waitForFunction(() => crossOriginIsolated);

  const terminal = page.locator(".xterm-rows");
  await expect(terminal).toContainText("Press any key to boot");
  await page.locator(".xterm-helper-textarea").press("Enter");
  await expect(terminal).toContainText("Checking SharedArrayBuffer support");
  await expect(terminal).toContainText("guest@", { timeout: 10_000 });
  expect(await terminal.innerText()).not.toContain("[ WARN ]");

  expect(await page.evaluate(() => typeof SharedArrayBuffer)).toBe("function");
  expect(errors).toEqual([]);
});

test("the build inlined the service worker with its registration patched", () => {
  const html = readFileSync(resolve(__dirname, "../dist/index.html"), "utf8");
  expect(html).toContain("document.baseURI).href");
  expect(html).not.toContain("currentScript.src)");
});
