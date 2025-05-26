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
  }

  .waybar {
    grid-area: waybar;
    height: 32px;
    background-color: currentColor;
  }

  .master {
    grid-area: master;
    padding-top: 24px;
    border-width: 0;
    border-color: currentColor;
    border-style: solid;
    border-top-width: 1px;
  }

  @media screen and (min-width: 320px) {
    .master {
      padding: 24px;
    }
  }

  .slaves {
    grid-area: slaves;
  }
`;
