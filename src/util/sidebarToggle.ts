import { TemplateManager } from "./templateManager";

type WindowManagerElement = HTMLElement & {
  readonly sidebarHasContent: boolean;
  readonly sidebarOpen: boolean;
  toggleSidebar(open?: boolean): void;
};

/**
 * Waybar button that shows/hides the sidebar. It's only there while
 * something (like the sysinfo daemon's panel) is in the sidebar.
 */
export function initializeSidebarToggle(windowManager: WindowManagerElement, container: HTMLElement) {
  let button: HTMLButtonElement | null = null;

  function mount() {
    TemplateManager.mount(TemplateManager.create("sidebar-toggle"), container);
    button = container.querySelector<HTMLButtonElement>("#sidebarToggle");
    button?.addEventListener("click", () => windowManager.toggleSidebar());
  }

  function sync() {
    if (windowManager.sidebarHasContent && !button) mount();
    if (!windowManager.sidebarHasContent && button) {
      container.replaceChildren();
      button = null;
    }
    if (!button) return;
    const open = windowManager.sidebarOpen;
    button.setAttribute("aria-pressed", String(open));
    button.title = open ? "Hide sidebar" : "Show sidebar";
    // State is shown by shape (◨ open, ◻ hidden), not by fading: dimming fails WCAG non-text contrast.
    const icon = button.querySelector(".sidebar-toggle-icon");
    if (icon) icon.textContent = open ? "\u25E8" : "\u25FB";
  }

  windowManager.addEventListener("sidebarchange", sync);
  sync();
}
