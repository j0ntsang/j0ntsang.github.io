export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getBodyStyles() {
  const bodyStyle = getComputedStyle(document.body);
  return {
    fontFamily: bodyStyle.fontFamily,
    fontSize: bodyStyle.fontSize,
    fontWeight: bodyStyle.fontWeight,
    fontStyle: bodyStyle.fontStyle,
  };
}

export function getPrompt({ user = "guest", isAdmin = false } = {}) {
  const host = window.location.hostname || "localhost";
  const path = window.location.pathname ? `~${window.location.pathname}` : "~";
  const symbol = isAdmin ? "#" : "$";
  return `${user}@${host}:${path}${symbol}`;
}
