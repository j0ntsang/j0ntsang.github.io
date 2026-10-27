import { expect, Page, test as base } from "@playwright/test";

// ---------------------------------------------------------------------------
// Locators
// ---------------------------------------------------------------------------

export const terminalText = (page: Page) => page.locator(".xterm-rows");
export const terminalInput = (page: Page) => page.locator(".xterm-helper-textarea");
export const mainSlot = (page: Page) => page.locator('window-manager > [slot="main"]');
export const sidebarPanel = (page: Page) => page.locator('window-manager > [slot="sidebar"]');
// An internal shadow-DOM element; startSysinfo proves it matches before tests rely on toBeHidden.
export const sidebarColumn = (page: Page) => page.locator("window-manager .sidebar");
export const sidebarToggle = (page: Page) => page.getByRole("button", { name: "Sidebar", exact: true });
export const octoberWindow = (page: Page) => page.getByRole("dialog", { name: /^october/ });
export const settingsMenu = (page: Page) => page.locator("details.settings");
export const settingsSummary = (page: Page) => page.getByLabel("Settings", { exact: true });

// ---------------------------------------------------------------------------
// Wikipedia and poster stub
// ---------------------------------------------------------------------------

export interface WikiReply {
  status?: number;
  body?: unknown;
}

export interface SearchHit {
  title: string;
  description?: string;
  poster?: boolean;
}

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const CORS = { "access-control-allow-origin": "*" };

export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

/** Answers en.wikipedia.org/w/api.php and upload.wikimedia.org so no test touches the network. */
export class WikiStub {
  /** Titles asked about in each `titles=` request. */
  lookups: string[][] = [];
  /** `gsrsearch` of each search request. */
  searches: string[] = [];
  posterRequests = 0;
  /** What a search returns, in rank order. Empty means "no results". */
  searchResults: SearchHit[] = [];
  /** Override a lookup reply; return undefined to use the default. */
  onLookup?: (titles: string[]) => WikiReply | Promise<WikiReply | undefined> | undefined;
  onSearch?: (query: string) => WikiReply | Promise<WikiReply | undefined> | undefined;

  private page(title: string, index = 1, poster = true) {
    return {
      pageid: index,
      index,
      title,
      fullurl: wikiUrl(title),
      ...(poster ? { thumbnail: { source: `https://upload.wikimedia.org/stub/${encodeURIComponent(title)}.png` } } : {}),
    };
  }

  async install(page: Page) {
    await page.route("https://upload.wikimedia.org/**", (route) => {
      this.posterRequests++;
      return route.fulfill({
        body: PIXEL,
        contentType: "image/png",
        headers: { ...CORS, "cross-origin-resource-policy": "cross-origin" },
      });
    });
    await page.route("https://en.wikipedia.org/w/api.php?**", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      let reply: WikiReply | undefined;
      if (params.get("generator") === "search") {
        const query = params.get("gsrsearch") ?? "";
        this.searches.push(query);
        reply = await this.onSearch?.(query);
        reply ??= {
          body: this.searchResults.length
            ? {
                batchcomplete: "",
                query: {
                  pages: Object.fromEntries(
                    this.searchResults.map((r, i) => [
                      String(i + 1),
                      { ...this.page(r.title, i + 1, r.poster !== false), description: r.description },
                    ]),
                  ),
                },
              }
            : { batchcomplete: "" },
        };
      } else {
        const titles = (params.get("titles") ?? "").split("|");
        this.lookups.push(titles);
        reply = await this.onLookup?.(titles);
        reply ??= {
          body: {
            batchcomplete: "",
            query: { pages: Object.fromEntries(titles.map((t, i) => [String(i + 1), this.page(t, i + 1)])) },
          },
        };
      }
      const body = reply.body;
      await route.fulfill({
        status: reply.status ?? 200,
        contentType: "application/json",
        body: typeof body === "string" ? body : JSON.stringify(body),
        headers: CORS,
      });
    });
  }

  get lookedUpTitles() {
    return this.lookups.flat();
  }
}

// ---------------------------------------------------------------------------
// Fixtures: error guard, pinned clock, offline-proof network
// ---------------------------------------------------------------------------

/** october opens the 2026 calendar when the clock says October 2026. */
export const PINNED_TIME = new Date("2026-10-26T12:00:00");

type Allowed = string | RegExp;
type AllowErrors = ((...patterns: Allowed[]) => void) & { patterns: Allowed[] };

export const test = base.extend<{
  /** Console and page errors a test deliberately provokes; matched by substring or regex. */
  allowErrors: AllowErrors;
  wiki: WikiStub;
}>({
  allowErrors: async ({}, use) => {
    const patterns: Allowed[] = [];
    await use(Object.assign((...more: Allowed[]) => void patterns.push(...more), { patterns }));
  },
  page: async ({ page, allowErrors }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

    // Anything that is neither the dev server nor a routed Wikimedia host fails loudly.
    await page.route(
      (url) => !["localhost", "127.0.0.1"].includes(url.hostname) && !/^(data|blob):$/.test(url.protocol),
      (route) => {
        errors.push(`unstubbed request: ${route.request().url()}`);
        return route.abort();
      },
    );
    await page.clock.install({ time: PINNED_TIME });
    await use(page);

    const unexpected = errors.filter(
      (e) => !allowErrors.patterns.some((p) => (typeof p === "string" ? e.includes(p) : p.test(e))),
    );
    expect(unexpected).toEqual([]);
  },
  wiki: [
    async ({ page }, use) => {
      const stub = new WikiStub();
      await stub.install(page);
      await use(stub);
    },
    { auto: true },
  ],
});

export { expect };

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

/** Press a key to boot, then wait for the shell prompt. Call after page.goto. */
export async function boot(page: Page) {
  await expect(terminalText(page)).toContainText("Press any key to boot");
  await terminalInput(page).press("Enter");
  await expect(terminalText(page)).toContainText("guest@", { timeout: 10_000 });
}

export async function bootFresh(page: Page) {
  await page.goto("/");
  await boot(page);
}

/** Type a command at the prompt and press Enter. Focuses the terminal first. */
export async function run(page: Page, command: string) {
  await terminalInput(page).focus();
  await page.keyboard.type(command);
  await page.keyboard.press("Enter");
}

export async function startSysinfo(page: Page) {
  await run(page, "sysinfo start");
  await expect(sidebarPanel(page)).toBeVisible();
  await expect(sidebarColumn(page)).toBeVisible();
}

/** Everything the terminal currently shows, as one string. */
export const screen = (page: Page) => terminalText(page).innerText();

export interface Ran {
  /** What the command printed, between its own line and the next prompt. */
  output: string;
  /** The status shown in the next prompt (0 when it has none). */
  status: number;
}

const NEXT_PROMPT = /^\n([\s\S]*?)(?:\[(\d+)\] )?guest@\S*\$\s*$/;

/**
 * Run a command and wait for the prompt that follows it. Reads only what is
 * on screen after the command's own line, so earlier output can't match.
 */
export async function runCapture(page: Page, command: string): Promise<Ran> {
  const before = await screen(page);
  await run(page, command);
  let ran: Ran | null = null;
  await expect
    .poll(async () => {
      const text = await screen(page);
      if (text === before) return false; // Not drawn yet: an older identical command must not match.
      const at = text.lastIndexOf(`$ ${command}`);
      const match = at < 0 ? null : text.slice(at + 2 + command.length).match(NEXT_PROMPT);
      ran = match ? { output: match[1], status: Number(match[2] ?? 0) } : null;
      return ran !== null;
    }, { message: `no prompt after "${command}"` })
    .toBe(true);
  return ran!;
}

/** Run `october [args]` and wait for the calendar to finish loading. */
export async function openOctober(page: Page, args = "2026") {
  await run(page, `october ${args}`.trim());
  await expect(octoberWindow(page)).toBeVisible();
  await expect(page.getByRole("list", { name: /^October \d+$/ })).toHaveAttribute("aria-busy", "false");
}

export const dayToggle = (page: Page, day: number, title?: string | RegExp) =>
  page.getByRole("button", { name: title instanceof RegExp ? title : new RegExp(`October ${day}: ${title ?? ""}`) });

// ---------------------------------------------------------------------------
// Storage seeding
// ---------------------------------------------------------------------------

/**
 * Seed localStorage before the first page script runs. A sessionStorage flag
 * keeps a reload from overwriting what the app saved since.
 */
export async function seedStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
  }, entries);
}

export const readStorage = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

export const OCTOBER_COPY = "fs:/home/guest/october/2026.json";
export const OCTOBER_LEGACY = "fs:/home/guest/october/2026.legacy.json";
