// window-manager.styles.ts
export const styles = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  @supports not selector(::-webkit-scrollbar) {
    html {
      scrollbar-width: thin;
      scrollbar-color: var(--scrollbar-thumb-color) transparent;
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
    border-radius: 0;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover);
  }

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
      "master"
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
        "master sidebar";
      column-gap: 16px;
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

  .master {
    grid-area: master;
    padding: 0 16px 8px 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .master ::slotted(*) {
    flex: 1 1 0;
    min-height: 0;
  }

  .sidebar {
    grid-area: sidebar;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 280px;
    min-height: 0;
    border-width: 1px;
    border-color: transparent;
    border-style: solid;
  }

  .sidebar:focus-within {
    border-color: currentColor;
    border-radius: 4px;
  }

  .sidebar ::slotted(*) {
    flex: 1 1 0;
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
