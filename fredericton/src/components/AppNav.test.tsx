// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "@/router";
import { SiteMenu } from "./AppNav";

beforeEach(() => window.history.replaceState(null, "", "/news/"));
afterEach(cleanup);

const renderMenu = () =>
  render(
    <Router>
      <SiteMenu />
      <a href="#after">After the menu</a>
    </Router>,
  );
const menuButton = () => screen.getByRole("button", { name: "Navigation" });
const drawer = () => document.getElementById("site-menu")!;

describe("SiteMenu", () => {
  it("is an icon button named Navigation that controls the drawer", () => {
    renderMenu();
    expect(menuButton().getAttribute("aria-expanded")).toBe("false");
    expect(menuButton().getAttribute("aria-controls")).toBe("site-menu");
    expect(drawer().hasAttribute("data-open")).toBe(false);
  });

  it("slides out the site navigation with every section, the current one marked", async () => {
    renderMenu();
    await userEvent.click(menuButton());
    expect(menuButton().getAttribute("aria-expanded")).toBe("true");
    expect(drawer().hasAttribute("data-open")).toBe(true);
    const nav = screen.getByRole("navigation", { name: "Site" });
    expect(within(nav).getAllByRole("link")).toHaveLength(9);
    expect(within(nav).getByRole("link", { current: "page" }).textContent).toBe("News");
  });

  it("follows the button in the Tab order", async () => {
    renderMenu();
    await userEvent.click(menuButton());
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("Today");
  });

  it("closes on Escape and gives focus back to the button", async () => {
    renderMenu();
    await userEvent.click(menuButton());
    await userEvent.tab();
    await userEvent.keyboard("{Escape}");
    expect(drawer().hasAttribute("data-open")).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(menuButton()));
  });

  it("closes when focus leaves it", async () => {
    renderMenu();
    await userEvent.click(menuButton());
    // Tab through the nine sections and out of the drawer.
    for (let i = 0; i < 10; i++) await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("After the menu");
    expect(drawer().hasAttribute("data-open")).toBe(false);
  });

  it("closes once a section is chosen", async () => {
    renderMenu();
    await userEvent.click(menuButton());
    await userEvent.click(within(drawer()).getByRole("link", { name: "Transportation" }));
    expect(drawer().hasAttribute("data-open")).toBe(false);
    expect(window.location.pathname).toMatch(/getting-around\/$/);
  });
});
