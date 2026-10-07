import { styles } from "./window-manager.styles.ts";

class WindowManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const template = document.createElement("template");
    template.innerHTML = `
        <style>${styles}</style>
        <div class="container">
            <nav class="waybar">
              <div class="waybar--left">
                <slot name="waybar-left"></slot>
              </div>
              <div class="waybar--right">
                <slot name="waybar-right"></slot>
              </div>
            </nav>
            <main class="main window">
              <slot name="main"></slot>
              <slot name="overlay"></slot>
            </main>
            <sidebar class="sidebar">
              <slot name="sidebar"></slot>
            </sidebar>
        </div>
      `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // The sidebar only takes up room while a panel (e.g. sysinfo) is in it
    // and the user hasn't hidden it. Hiding is the window manager's business:
    // the program keeps running, its panel just isn't shown.
    this.container = this.shadowRoot.querySelector(".container");
    this.sidebarSlot = this.shadowRoot.querySelector('slot[name="sidebar"]');
    this.sidebarHidden = false;
    this.sidebarSlot.addEventListener("slotchange", () => {
      // An emptied sidebar forgets it was hidden, so the next panel shows.
      if (!this.sidebarHasContent) this.sidebarHidden = false;
      this.syncSidebar();
    });
    this.syncSidebar();
  }

  get sidebarHasContent() {
    return this.sidebarSlot.assignedElements().length > 0;
  }

  get sidebarOpen() {
    return this.sidebarHasContent && !this.sidebarHidden;
  }

  toggleSidebar(open = !this.sidebarOpen) {
    this.sidebarHidden = !open;
    this.syncSidebar();
  }

  syncSidebar() {
    this.container.classList.toggle("container--no-sidebar", !this.sidebarOpen);
    this.dispatchEvent(new Event("sidebarchange"));
  }

  connectedCallback() {
    console.log("WindowManager connected");
  }
}

customElements.define("window-manager", WindowManager);
