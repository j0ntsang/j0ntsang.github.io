// window-manager.styles.ts
import scrollbarStyles from "../../styles/scrollbar.css?inline";

export const styles = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  ${scrollbarStyles}

  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr 1fr;
    grid-column-gap: 0;
    grid-row-gap: 16px;
    grid-template-areas:
      "waybar"
      "main"
      "sidebar";
    width: 100%;
    height: 100%;
    padding: 24px;
  }

  @media (min-width: 768px) {
    .container {
      grid-template-columns: minmax(320px, 1fr) minmax(280px, 320px);
      grid-template-rows: auto 1fr;
      grid-template-areas:
        "waybar waybar"
        "main sidebar";
      column-gap: 16px;
    }
  }

  /* Zero the track, don't drop it: grid tracks only animate between same-shaped lists. */
  .container--no-sidebar {
    grid-template-rows: auto 1fr 0fr;
  }

  @media (min-width: 768px) {
    .container--no-sidebar {
      grid-template-columns: minmax(320px, 1fr) minmax(0px, 0px);
      grid-template-rows: auto 1fr;
      column-gap: 0;
    }
  }

  .container--no-sidebar .sidebar {
    visibility: hidden;
    border-width: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .container {
      transition-property: grid-template-columns, grid-template-rows, column-gap;
      transition-duration: 250ms;
      transition-timing-function: ease-out;
    }
  }

  .waybar {
    display: flex;
    grid-area: waybar;
    height: 32px;
    margin-bottom: 16px;
    background-color: currentColor;
    border-radius: 4px;
  }

  .waybar--right {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    margin-right: 0;
    margin-left: auto;
  }

  .main {
    position: relative;
    grid-area: main;
    padding: 0 16px 8px 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .main ::slotted(*) {
    flex: 1 1 0;
    min-height: 0;
  }

  /* Program windows from the compositor float above the terminal. */
  .main ::slotted([slot="overlay"]) {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .main ::slotted([slot="overlay"][hidden]) {
    display: none;
  }

  .sidebar {
    grid-area: sidebar;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    border-width: 1px;
    border-color: transparent;
    border-style: solid;
  }

  .sidebar:focus-within {
    border-color: currentColor;
    border-radius: 4px;
  }

  /* Full width from the start, so the growing column reveals the panel instead of reflowing it. */
  .sidebar ::slotted(*) {
    flex: 1 1 0;
    min-width: 280px;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .window {
    border-width: 1px;
    border-color: transparent;
    border-style: solid;
    border-radius: 0;
  }

  .window:focus-within {
    border-color: currentColor;
    border-radius: 4px;
  }
`;
