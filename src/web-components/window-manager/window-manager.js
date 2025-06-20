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
            <main class="master window">
              <slot name="master"></slot>
            </main>
            <sidebar class="sidebar">
              <slot name="sidebar"></slot>
            </sidebar>
        </div>
      `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    console.log("WindowManager connected");
  }
}

customElements.define("window-manager", WindowManager);
