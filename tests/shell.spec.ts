import {
  boot,
  bootFresh,
  expect,
  octoberWindow,
  openOctober,
  readStorage,
  run,
  runCapture,
  screen,
  sidebarPanel,
  sidebarToggle,
  terminalInput,
  terminalText,
  test,
} from "./helpers";
import type { Page } from "@playwright/test";

async function pidOf(page: Page, pattern: RegExp) {
  const match = (await screen(page)).match(pattern);
  expect(match, `no process matching ${pattern} in:\n${await screen(page)}`).not.toBeNull();
  return Number(match![1]);
}

test.describe("prompt and exit codes", () => {
  test("an unknown command says not found and shows [127] in the next prompt", async ({ page }) => {
    await bootFresh(page);
    const ran = await runCapture(page, "nosuchcmd");
    expect(ran.output).toContain("sh: nosuchcmd: not found");
    expect(ran.status).toBe(127);
  });

  test("a later successful command clears the status from the prompt", async ({ page }) => {
    await bootFresh(page);
    expect((await runCapture(page, "nosuchcmd")).status).toBe(127);
    const ran = await runCapture(page, "pwd");
    expect(ran.output).toBe("/home/guest\n");
    expect(ran.status).toBe(0);
  });

  test("exit starts a fresh shell instead of ending the session", async ({ page }) => {
    await bootFresh(page);
    await runCapture(page, "exit");
    expect((await runCapture(page, "pwd")).output).toBe("/home/guest\n");
  });

  test("sysinfo with a bad subcommand exits 2, and stop while stopped exits 1", async ({ page }) => {
    await bootFresh(page);
    const bogus = await runCapture(page, "sysinfo bogus");
    expect(bogus.output).toContain("sysinfo: unknown command 'bogus'");
    expect(bogus.status).toBe(2);

    const stop = await runCapture(page, "sysinfo stop");
    expect(stop.output).toContain("sysinfo: not running");
    expect(stop.status).toBe(1);
  });
});

test.describe("coreutils errors name absolute paths", () => {
  test("cat of a missing file", async ({ page }) => {
    await bootFresh(page);
    const ran = await runCapture(page, "cat nope");
    expect(ran.output).toBe("cat: /home/guest/nope: No such file or directory\n");
    expect(ran.status).toBe(1);
  });

  test("cat of a directory and of /proc entries", async ({ page }) => {
    await bootFresh(page);
    expect((await runCapture(page, "cat ~/october")).output).toContain("cat: /home/guest/october: Is a directory");
    expect((await runCapture(page, "cat /proc/42/status")).output).toContain(
      "cat: /proc/42/status: No such file or directory",
    );
    expect((await runCapture(page, "cat /proc/1")).output).toContain("cat: /proc/1: Is a directory");
  });

  test("ls of a missing path", async ({ page }) => {
    await bootFresh(page);
    const ran = await runCapture(page, "ls nope");
    expect(ran.output).toBe("ls: nope: No such file or directory\n");
    expect(ran.status).toBe(1);
  });

  test("cd into a file or a missing directory fails and keeps the directory", async ({ page }) => {
    await bootFresh(page);
    const file = await runCapture(page, "cd /etc/motd");
    expect(file.output).toContain("cd: /etc/motd: Not a directory");
    expect(file.status).toBe(1);
    const missing = await runCapture(page, "cd /nope");
    expect(missing.output).toContain("cd: /nope: No such file or directory");
    expect(missing.status).toBe(1);
    expect((await runCapture(page, "pwd")).output).toBe("/home/guest\n");
  });

  test("rm with no arguments prints usage", async ({ page }) => {
    await bootFresh(page);
    const ran = await runCapture(page, "rm");
    expect(ran.output).toContain("usage: rm <file>...");
    expect(ran.status).toBe(1);
  });

  test("rm refuses shipped read-only files, directories and /proc entries", async ({ page }) => {
    await bootFresh(page);
    expect((await runCapture(page, "rm /etc/motd")).output).toContain("rm: /etc/motd: Read-only file system");
    expect((await runCapture(page, "rm ~/october")).output).toContain("rm: /home/guest/october: Is a directory");
    expect((await runCapture(page, "rm /proc/1/status")).output).toContain("rm: /proc/1/status: Read-only file system");
    expect((await runCapture(page, "rm ~/nothere")).output).toContain(
      "rm: /home/guest/nothere: No such file or directory",
    );
  });

  test("rm of a shipped home file hides it across a reload, and a second rm says it is gone", async ({ page }) => {
    await bootFresh(page);
    expect((await runCapture(page, "ls ~/october")).output).toContain("README");

    expect((await runCapture(page, "rm ~/october/README")).status).toBe(0);
    expect((await runCapture(page, "ls ~/october")).output).not.toContain("README");
    expect((await runCapture(page, "cat ~/october/README")).output).toContain(
      "cat: /home/guest/october/README: No such file or directory",
    );
    expect(await readStorage(page, "fs:/home/guest/october/README")).toBe("\u0000whiteout");

    await page.reload();
    await boot(page);
    expect((await runCapture(page, "ls ~/october")).output).not.toContain("README");
    const again = await runCapture(page, "rm ~/october/README");
    expect(again.output).toContain("rm: /home/guest/october/README: No such file or directory");
    expect(again.status).toBe(1);
  });

  test("a full disk makes rm of a shipped file fail with a no-space error", async ({ page }) => {
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith("fs:")) throw new DOMException("full", "QuotaExceededError");
        return setItem.call(this, key, value);
      };
    });
    await bootFresh(page);
    const ran = await runCapture(page, "rm ~/october/README");
    expect(ran.output).toContain("rm: /home/guest/october/README: No space left on device");
  });
});

test.describe("paths and completion", () => {
  test("cd normalises dots and the tilde in the prompt and pwd", async ({ page }) => {
    await bootFresh(page);
    await run(page, "cd ~/october/../october/");
    await expect(terminalText(page)).toContainText("guest@localhost:~/october$");
    expect((await runCapture(page, "pwd")).output).toBe("/home/guest/october\n");

    await run(page, "cd ../../..");
    await expect(terminalText(page)).toContainText("guest@localhost:/$");
    expect((await runCapture(page, "pwd")).output).toBe("/\n");
  });

  test("Tab completes a directory path and appends a slash", async ({ page }) => {
    await bootFresh(page);
    await terminalInput(page).focus();
    await page.keyboard.type("cd ~/oc");
    await page.keyboard.press("Tab");
    await expect(terminalText(page)).toContainText("cd ~/october/");
  });

  test("Tab completes a command name from PATH", async ({ page }) => {
    await bootFresh(page);
    await terminalInput(page).focus();
    await page.keyboard.type("sysi");
    await page.keyboard.press("Tab");
    await expect(terminalText(page)).toContainText("$ sysinfo");
  });
});

test.describe("signals", () => {
  test("Ctrl-C at an idle prompt prints ^C and gives one new prompt", async ({ page }) => {
    await bootFresh(page);
    await terminalInput(page).focus();
    await page.keyboard.press("Control+c");
    await expect(terminalText(page)).toContainText("^C");
    await runCapture(page, "pwd");
    // Exactly one prompt between the ^C and the next command.
    expect(await screen(page)).toMatch(/\^C\s*\nguest@\S*\$ pwd\n/);
  });

  test("Ctrl-C stops a foreground program, closes its panel and shows [130]", async ({ page }) => {
    await bootFresh(page);
    await run(page, "sysinfo --daemon");
    await expect(sidebarPanel(page)).toBeVisible();

    await page.keyboard.press("Control+c");
    await expect(terminalText(page)).toContainText("^C");
    await expect(terminalText(page)).toContainText("[130] guest@");
    await expect(sidebarPanel(page)).toHaveCount(0);
    await expect(sidebarToggle(page)).toHaveCount(0);
  });

  test("Ctrl-C inside a program window closes it and the terminal takes input without a click", async ({ page }) => {
    await bootFresh(page);
    await openOctober(page);

    await page.keyboard.press("Control+c");
    await expect(octoberWindow(page)).toHaveCount(0);
    await expect(terminalText(page)).toContainText("[130] guest@");

    // No focus call: the terminal must already have focus.
    await page.keyboard.type("pwd");
    await page.keyboard.press("Enter");
    await expect(terminalText(page)).toContainText("/home/guest\n");
  });

  test("kill on the sysinfo daemon empties the sidebar; ps shows it re-parented to init", async ({ page }) => {
    await bootFresh(page);
    await run(page, "sysinfo start");
    await expect(sidebarPanel(page)).toBeVisible();

    const ps = await runCapture(page, "ps");
    const daemon = Number(ps.output.match(/(\d+)\s+1\s+sysinfo --daemon/)?.[1]);
    expect(daemon).toBeGreaterThan(1);

    expect((await runCapture(page, `kill ${daemon}`)).status).toBe(0);
    await expect(sidebarPanel(page)).toHaveCount(0);
    await expect(sidebarToggle(page)).toHaveCount(0);
    expect((await runCapture(page, "sysinfo status")).output).toContain("sysinfo: stopped");
  });

  test("kill -INT also stops the daemon", async ({ page }) => {
    await bootFresh(page);
    await run(page, "sysinfo start");
    await expect(sidebarPanel(page)).toBeVisible();
    const status = await runCapture(page, "sysinfo status");
    const daemon = Number(status.output.match(/\(pid (\d+)\)/)?.[1]);
    expect(daemon).toBeGreaterThan(1);

    expect((await runCapture(page, `kill -INT ${daemon}`)).status).toBe(0);
    await expect(sidebarPanel(page)).toHaveCount(0);
  });

  test("kill with a missing pid, a bad signal or no arguments fails with the right status", async ({ page }) => {
    await bootFresh(page);
    const missing = await runCapture(page, "kill 999");
    expect(missing.output).toContain("kill: (999) - No such process");
    expect(missing.status).toBe(1);

    expect((await runCapture(page, "kill abc")).output).toContain("kill: (abc) - No such process");

    const badSignal = await runCapture(page, "kill -9 5");
    expect(badSignal.output).toContain("kill: 9: invalid signal");
    expect(badSignal.status).toBe(2);

    const bare = await runCapture(page, "kill");
    expect(bare.output).toContain("usage: kill");
    expect(bare.status).toBe(2);
  });

  test("kill 1 does nothing: init is still listed", async ({ page }) => {
    await bootFresh(page);
    await runCapture(page, "kill 1");
    const ps = await runCapture(page, "ps");
    expect(ps.output).toMatch(/\b1\s+0\s+init/);
  });

  test("killing the shell gives a single new prompt that owns the terminal", async ({ page }) => {
    await bootFresh(page);
    const ps = await runCapture(page, "ps");
    const shell = Number(ps.output.match(/(\d+)\s+1\s+sh\b/)?.[1]);
    expect(shell).toBeGreaterThan(1);

    await run(page, `kill ${shell}`);
    await expect(async () => {
      expect(await screen(page)).toMatch(new RegExp(`\\$ kill ${shell}\\s*\\nguest@\\S*\\$\\s*$`));
    }).toPass();

    const pwd = await runCapture(page, "pwd");
    expect(pwd.output).toBe("/home/guest\n");
    // The text since the kill holds exactly two prompts: the new shell's, then the next one.
    const text = await screen(page);
    const sinceKill = text.slice(text.lastIndexOf(`$ kill ${shell}`));
    expect(sinceKill.split("guest@").length - 1).toBe(2);

    const after = await runCapture(page, "ps");
    expect(after.output).not.toMatch(new RegExp(`^${shell}\\s`, "m"));
    expect(after.output).toMatch(/\d+\s+1\s+sh\b/);
  });
});

test.describe("boot", () => {
  test("a missing SharedArrayBuffer warns and still reaches the prompt", async ({ page }) => {
    await page.addInitScript(() => {
      delete (globalThis as any).SharedArrayBuffer;
      // init clears the boot log, so catch the WARN line while it is on screen.
      const log: string[] = ((window as any).__bootLog = []);
      new MutationObserver(() => {
        const text = document.querySelector(".xterm-rows")?.textContent ?? "";
        if (text.includes("[ WARN ]") && !log.length) log.push(text);
        if (text.includes("Boot failed")) log.push("Boot failed");
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    await page.goto("/");
    await boot(page);
    const log = await page.evaluate(() => (window as any).__bootLog as string[]);
    expect(log[0]).toContain("[ WARN ] Checking SharedArrayBuffer support");
    expect(log[0]).toContain("SharedArrayBuffer unavailable");
    expect(log).not.toContain("Boot failed");
  });

  test("ps after boot lists init, the shell and ps itself", async ({ page }) => {
    await bootFresh(page);
    const { output } = await runCapture(page, "ps");
    expect(output).toMatch(/\b1\s+0\s+init/);
    expect(output).toMatch(/\b2\s+1\s+sh/);
    expect(output).toMatch(/\b3\s+2\s+ps/);
  });
});
