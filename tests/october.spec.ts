import {
  boot,
  dayToggle,
  expect,
  mainSlot,
  OCTOBER_COPY,
  OCTOBER_LEGACY,
  octoberWindow,
  openOctober,
  readStorage,
  run,
  screen,
  seedStorage,
  settingsSummary,
  terminalInput,
  terminalText,
  test,
} from "./helpers";

const editorButton = (page: import("@playwright/test").Page, day: number) =>
  page.getByRole("button", { name: new RegExp(`Add or remove movies, \\w+, October ${day}$`) });
const calendarAlert = (page: import("@playwright/test").Page) => octoberWindow(page).getByRole("alert");
const resetButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^Click (again )?to reset$/ });

const v2Copy = (days: Record<string, unknown>) => JSON.stringify({ version: 2, year: 2026, days });
const CLUE = { title: "Clue", wiki: "Clue (film)" };

test.describe("window and terminal", () => {
  test("the terminal is inert while october is open and gets focus back after it closes", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await expect(mainSlot(page)).toHaveAttribute("inert", "");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("program-window"))).toBe(true);

    // Tabbing around never reaches the terminal underneath.
    for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+Tab");
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[slot="main"]'))).toBe(false);

    await octoberWindow(page).getByRole("button", { name: "Quit program" }).click();
    await expect(octoberWindow(page)).toHaveCount(0);
    await expect(mainSlot(page)).not.toHaveAttribute("inert");
    await expect(terminalInput(page)).toBeFocused();

    // No explicit focus here: the terminal must already have it.
    await page.keyboard.type("pwd");
    await page.keyboard.press("Enter");
    await expect(terminalText(page)).toContainText("/home/guest");
  });

  test("Escape inside the day editor closes only the editor", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await editorButton(page, 28).click();
    const editor = page.getByRole("dialog", { name: /October 28/ });
    await expect(editor).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
    await expect(octoberWindow(page)).toBeVisible();
  });

  test("october --list prints the calendar as terminal text with no window", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await run(page, "october 2026 --list");
    await expect(terminalText(page)).toContainText("HALLOWEEN");
    await expect(terminalText(page)).toContainText("Clue");
    await expect(octoberWindow(page)).toHaveCount(0);
  });

  test("october with a bad year exits 2 and shows usage", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await run(page, "october abc");
    await expect(terminalText(page)).toContainText("october: invalid year 'abc'");
    await expect(terminalText(page)).toContainText("[2]");
  });
});

test.describe("your copy of the calendar", () => {
  test("removing a shipped movie persists across reload, and Reset brings it back", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);
    await expect(dayToggle(page, 28, "Clue")).toBeVisible();

    await editorButton(page, 28).click();
    await page.getByRole("button", { name: "Remove Clue" }).click();
    await page.keyboard.press("Escape");
    await expect(dayToggle(page, 28, "Clue")).toHaveCount(0);
    await expect.poll(() => readStorage(page, OCTOBER_COPY)).toContain('"removed"');

    await page.reload();
    await boot(page);
    await openOctober(page);
    await expect(dayToggle(page, 28, "Clue")).toHaveCount(0);

    await resetButton(page).click();
    await expect(resetButton(page)).toHaveText("Click again to reset");
    await resetButton(page).click();
    await expect(dayToggle(page, 28, "Clue")).toBeVisible();
    await expect(resetButton(page)).toBeDisabled();
    expect(await readStorage(page, OCTOBER_COPY)).toBeNull();
  });

  test("a v2 copy applies its edits on top of the shipped calendar", async ({ page }) => {
    await seedStorage(page, {
      [OCTOBER_COPY]: v2Copy({
        "25": { added: [{ title: "Crystal Lake", wiki: "Crystal Lake (TV series)" }] },
        "27": { crossedOff: [{ title: "The Cycle", wiki: "The Cycle (2026 film)" }] },
        "28": { added: [{ title: "Beetlejuice", wiki: "Beetlejuice" }] },
      }),
    });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await expect(dayToggle(page, 25, "Crystal Lake")).toBeVisible();
    await expect(page.getByText("Missed", { exact: true })).toHaveCount(2); // days 20 and 21
    await expect(dayToggle(page, 27, "The Cycle")).toHaveAttribute("aria-pressed", "true");
    await expect(dayToggle(page, 28, "Clue")).toBeVisible();
    await expect(dayToggle(page, 28, "Beetlejuice")).toBeVisible();
    await expect(octoberWindow(page)).toContainText("2 missed");
  });

  test("a legacy copy is converted in memory and backed up before the first save", async ({ page }) => {
    const legacy = JSON.stringify({
      year: 2026,
      days: {
        "24": [
          { title: "Obsession", wiki: "Obsession (2025 film)", watched: true },
          { title: "Other Mommy", wiki: "Other Mommy" },
        ],
        "25": { title: "Crystal Lake", wiki: "Crystal Lake (TV series)" },
        "28": { title: "Clue", wiki: "Clue (film)", watched: true },
      },
    });
    await seedStorage(page, { [OCTOBER_COPY]: legacy });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await expect(dayToggle(page, 24, "Obsession")).toBeVisible();
    await expect(dayToggle(page, 24, "Other Mommy")).toHaveCount(0);
    await expect(dayToggle(page, 25, "Crystal Lake")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /October 25: missed/ })).toBeVisible();
    await expect(dayToggle(page, 28, "Clue")).toHaveAttribute("aria-pressed", "true");
    // Loading alone leaves the old file untouched.
    expect(await readStorage(page, OCTOBER_LEGACY)).toBeNull();

    await dayToggle(page, 29, "Ginger Snaps").click();
    await expect.poll(() => readStorage(page, OCTOBER_LEGACY)).toBe(legacy);
    await expect.poll(async () => JSON.parse((await readStorage(page, OCTOBER_COPY))!).version).toBe(2);
  });

  test("a corrupt copy shows an error alert instead of a broken calendar, and Reset recovers", async ({ page }) => {
    await seedStorage(page, { [OCTOBER_COPY]: "{oops" });
    await page.goto("/");
    await boot(page);
    await run(page, "october 2026");
    await expect(octoberWindow(page)).toBeVisible();

    const alert = calendarAlert(page);
    await expect(alert).toContainText("Couldn't load October 2026");
    await expect(alert).toContainText("~/october/2026.json: invalid JSON");
    await expect(alert).toContainText("That's your copy");
    await expect(page.getByRole("list", { name: "October 2026" })).toHaveCount(0);

    await resetButton(page).click();
    await resetButton(page).click();
    await expect(alert).toHaveCount(0);
    await expect(dayToggle(page, 28, "Clue")).toBeVisible();
    expect(await readStorage(page, OCTOBER_COPY)).toBeNull();
  });

  test("a copy that is JSON but not a calendar is reported the same way", async ({ page }) => {
    await seedStorage(page, { [OCTOBER_COPY]: '{"year":2026}' });
    await page.goto("/");
    await boot(page);
    await run(page, "october 2026");
    await expect(calendarAlert(page)).toContainText("not an october");
  });

  test("october --list names a corrupt copy and exits 1", async ({ page, allowErrors }) => {
    allowErrors("YearFileError");
    await seedStorage(page, { [OCTOBER_COPY]: "{oops" });
    await page.goto("/");
    await boot(page);
    await run(page, "october 2026 --list");
    await expect(terminalText(page)).toContainText("~/october/2026.json: invalid JSON");
  });

  test("a full disk shows the save-failed alert, in the calendar and in the editor", async ({ page }) => {
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith("fs:")) throw new DOMException("full", "QuotaExceededError");
        return setItem.call(this, key, value);
      };
    });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await dayToggle(page, 27, "The Cycle").click();
    const alert = calendarAlert(page);
    await expect(alert).toContainText("Couldn't save your changes");
    await expect(alert).toContainText("/home/guest/october/2026.json: No space left on device");
    // The change still shows for this session.
    await expect(dayToggle(page, 27, "The Cycle")).toHaveAttribute("aria-pressed", "true");

    await editorButton(page, 27).click();
    const editor = page.getByRole("dialog", { name: /October 27/ });
    await expect(editor.getByRole("alert")).toContainText("Couldn't save your changes");
  });

  test("Export downloads the merged year as october-2026.json", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);
    await dayToggle(page, 27, "The Cycle").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("october-2026.json");
    const stream = await download.createReadStream();
    let text = "";
    for await (const chunk of stream) text += chunk;
    const year = JSON.parse(text);
    expect(year.days["27"]).toMatchObject({ title: "The Cycle", watched: true });
    expect(year.days["28"]).toMatchObject({ title: "Clue" });
  });
});

test.describe("Wikipedia", () => {
  test("posters and links come from one batched lookup of the year's titles", async ({ page, wiki }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await expect(octoberWindow(page).getByRole("link", { name: "Clue" })).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Clue_(film)",
    );
    await expect.poll(() => wiki.posterRequests).toBeGreaterThan(0);
    expect(wiki.lookups.length).toBe(1);
    expect(wiki.lookups[0]).toContain("Clue (film)");
  });

  test("searching, arrowing to a result and pressing Enter adds it with a link, and it is never looked up again", async ({ page, wiki }) => {
    wiki.searchResults = [
      { title: "Clue (franchise)", description: "Board game franchise" },
      { title: "Clue (1985 film)", description: "1985 American comedy film" },
    ];
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await editorButton(page, 28).click();
    await page.getByLabel("Search Wikipedia titles").fill("cl");
    const options = page.getByRole("listbox", { name: "Wikipedia articles" }).getByRole("option");
    await expect(options.first()).toContainText("Clue (1985 film)"); // film-first ordering
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");

    await page.keyboard.press("Escape");
    await expect(dayToggle(page, 28, "Clue")).toHaveCount(2);

    // The picked title was cached with its page, so it is never asked about again.
    await expect.poll(() => readStorage(page, "fs:/var/cache/october/wiki.json")).toContain("Clue (1985 film)");
    expect(wiki.lookedUpTitles.filter((t) => t === "Clue (1985 film)")).toHaveLength(0);
    await page.reload();
    await boot(page);
    await openOctober(page);
    await expect(octoberWindow(page).getByRole("link", { name: "Clue" })).toHaveCount(2);
    expect(wiki.lookedUpTitles.filter((t) => t === "Clue (1985 film)")).toHaveLength(0);
  });

  test("no search results offers a plain title, saved with no Wikipedia lookup", async ({ page, wiki }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await editorButton(page, 28).click();
    await page.getByLabel("Search Wikipedia titles").fill("Zzzz Nothing");
    await expect(page.getByRole("option", { name: /No titles matched/ })).toBeVisible();
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.keyboard.press("Escape");

    await expect(dayToggle(page, 28, "Zzzz Nothing")).toBeVisible();
    await expect.poll(() => readStorage(page, OCTOBER_COPY)).toContain('"wiki": null');
    expect(wiki.lookedUpTitles).not.toContain("Zzzz Nothing");
  });

  test("a search that fails says so", async ({ page, wiki, allowErrors }) => {
    allowErrors("status of 500");
    wiki.onSearch = () => ({ status: 500, body: "nope" });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await editorButton(page, 28).click();
    await page.getByLabel("Search Wikipedia titles").fill("clue");
    await expect(page.getByText("Search failed. Check your connection and try again.")).toBeVisible();
  });

  test("a MediaWiki error body (HTTP 200 with an error) is treated as a failure", async ({ page, wiki }) => {
    wiki.onSearch = () => ({ body: { error: { code: "badvalue", info: "bad" } } });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await editorButton(page, 28).click();
    await page.getByLabel("Search Wikipedia titles").fill("clue");
    await expect(page.getByText("Search failed.")).toBeVisible();
  });

  test("a lookup that fails shows the posters-unavailable footer without page errors", async ({ page, wiki, allowErrors }) => {
    allowErrors("status of 500");
    wiki.onLookup = () => ({ status: 500, body: "nope" });
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    await expect(octoberWindow(page)).toContainText("posters unavailable (offline?)");
    await expect(dayToggle(page, 28, "Clue")).toBeVisible();
  });

  test("a lookup answered with an error body also shows the footer", async ({ page, wiki }) => {
    wiki.onLookup = () => ({ body: { error: { code: "ratelimited" } } });
    await page.goto("/");
    await boot(page);
    await openOctober(page);
    await expect(octoberWindow(page)).toContainText("posters unavailable (offline?)");
  });

  test("a corrupt wiki cache falls back to a fresh lookup", async ({ page, wiki }) => {
    await seedStorage(page, { "fs:/var/cache/october/wiki.json": "nope" });
    await page.goto("/");
    await boot(page);
    await openOctober(page);
    await expect(octoberWindow(page).getByRole("link", { name: "Clue" })).toBeVisible();
    expect(wiki.lookups.length).toBe(1);
  });
});

test.describe("Animation setting", () => {
  test("turning Animation off stops the blood drops and drips", async ({ page }) => {
    await page.goto("/");
    await boot(page);
    await openOctober(page);

    const drop = octoberWindow(page).locator(".october__drop").first();
    const drip = octoberWindow(page).locator(".october__drip").first();
    await expect(drop).not.toHaveCSS("display", "none");
    await expect(drip).not.toHaveCSS("animation-name", "none");

    await page.keyboard.press("Escape");
    await expect(octoberWindow(page)).toHaveCount(0);
    await settingsSummary(page).click();
    await page.getByRole("checkbox", { name: "Animation" }).uncheck();
    await run(page, "october 2026");
    await expect(drop).toHaveCSS("display", "none");
    await expect(drip).toHaveCSS("animation-name", "none");
  });

  test("a stored Animation=false is honoured on load", async ({ page }) => {
    await seedStorage(page, { animation: "false" });
    await page.goto("/");
    await boot(page);
    await openOctober(page);
    await expect(octoberWindow(page).locator(".october__drop").first()).toHaveCSS("display", "none");
  });
});
