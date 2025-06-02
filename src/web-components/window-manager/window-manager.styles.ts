// window-manager.styles.ts
export const styles = `
  .container {
    display: grid;
    grid-template-columns: minmax(50%, auto) auto;
    grid-template-rows: auto 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 16px;
    grid-template-areas:
    "waybar waybar"
    "master slaves";
    height: 100%;
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
