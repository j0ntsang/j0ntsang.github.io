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
    grid-template-columns: minmax(50%, auto) auto;
    grid-template-rows: auto 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 16px;
    grid-template-areas:
    "waybar waybar"
    "master slaves";
    width: 100%;
    height: 100%;
    padding: 24px;
  }

  .waybar {
    grid-area: waybar;
    height: 32px;
    background-color: currentColor;
  }

  .master {
    grid-area: master;
    padding-top: 24px;
    overflow-y: auto;
  }

  @media screen and (min-width: 320px) {
    .master {
      padding: 24px;
    }
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
