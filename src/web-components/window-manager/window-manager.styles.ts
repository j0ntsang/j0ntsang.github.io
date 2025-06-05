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
    grid-template-rows: auto auto 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 16px;
    grid-template-areas:
    "waybar waybar"
    "master slaves";
    width: 100%;
    height: 100%;
    padding: 24px;
  }

  @media (min-width: 768px) {
    .container {
      grid-template-columns: minmax(auto, max-content) auto;
      grid-template-rows: auto 1fr;
    }
  }

  .waybar {
    display: flex;
    grid-area: waybar;
    height: 32px;
    background-color: currentColor;
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
    overflow: hidden;
  }

  .slaves {
    grid-area: slaves;
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
