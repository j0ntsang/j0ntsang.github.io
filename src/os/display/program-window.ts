// display/program-window — the window decoration the compositor draws around
// every surface (the "server-side decorations" in Wayland terms).
//
// The chrome lives in Shadow DOM so its styles can't leak; the program's
// surface is slotted light DOM, so page-level CSS (e.g. october.css) applies.

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: var(--background-color);
      color: var(--text-color);
      border: 1px solid currentColor;
      border-radius: 4px;
      outline: none;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 12px;
      border-bottom: 1px solid currentColor;
      font-weight: 700;
      letter-spacing: 0.025em;
    }
    button {
      font: inherit;
      color: inherit;
      background: none;
      border: 1px solid transparent;
      padding: 0 4px;
      cursor: pointer;
    }
    button:hover,
    button:focus-visible {
      border-color: currentColor;
      outline: none;
    }
    .body {
      flex: 1 1 0;
      min-height: 0;
      overflow: auto;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host {
        animation: open 120ms ease-out;
      }
      @keyframes open {
        from {
          opacity: 0;
          transform: scale(0.98);
        }
      }
    }
  </style>
  <header>
    <span part="title"></span>
    <button type="button" aria-label="Quit program" title="Quit (q / Esc)">[quit]</button>
  </header>
  <div class="body"><slot></slot></div>
`;

export class ProgramWindow extends HTMLElement {
  private titleEl: HTMLElement;
  /** Fired when the user asks to close (button, Esc, q). */
  onRequestClose: () => void = () => {};

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    this.titleEl = root.querySelector("[part=title]")!;
    root.querySelector("button")!.addEventListener("click", () => this.onRequestClose());
  }

  // Custom elements may not add attributes in the constructor, so do it on connect.
  connectedCallback() {
    this.setAttribute("role", "dialog");
    this.tabIndex = -1;
  }

  set heading(text: string) {
    this.titleEl.textContent = text;
    this.setAttribute("aria-label", text);
  }
}

if (!customElements.get("program-window")) {
  customElements.define("program-window", ProgramWindow);
}
