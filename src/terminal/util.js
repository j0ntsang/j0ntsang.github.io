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
    color: bodyStyle.color,
    backgroundColor: bodyStyle.backgroundColor,
  };
}
