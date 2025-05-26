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
            </nav>
            <main class="master window">
                <slot></slot>
            </main>
            <sidebar class="slaves"></sidebar>
        </div>
      `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    console.log("WindowManager connected");
  }
}

customElements.define("window-manager", WindowManager);
