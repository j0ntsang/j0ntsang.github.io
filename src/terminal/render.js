export function renderTerminal(container, styles) {
  container.innerHTML = `
      <div id="terminal-output" aria-live="polite" style="
        font-family: ${styles.fontFamily};
        font-size: ${styles.fontSize};
        font-weight: ${styles.fontWeight};
        font-style: ${styles.fontStyle};
        color: ${styles.color};
        background-color: ${styles.backgroundColor};
        white-space: pre-wrap;
        overflow-y: auto;
        max-height: 300px;
        padding: 10px;
        border: 1px solid #444;
        border-radius: 4px;
        box-sizing: border-box;
        user-select: text;
      "></div>
      <div style="
        display: flex;
        font-family: ${styles.fontFamily};
        font-size: ${styles.fontSize};
        font-weight: ${styles.fontWeight};
        font-style: ${styles.fontStyle};
        color: ${styles.color};
        margin-top: 5px;
        ">
        <span aria-hidden="true" style="user-select:none;">$&nbsp;</span>
        <div id="input-wrapper" style="flex: 1;">
          <div id="terminal-input" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="false" aria-label="Terminal input" style="
            outline: none;
            white-space: pre-wrap;
            caret-color: ${styles.color};
            color: ${styles.color};
            background: transparent;
            min-height: 1em;
            user-select: text;
            "></div>
        </div>
      </div>
    `;
}
