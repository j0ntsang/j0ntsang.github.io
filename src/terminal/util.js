export function getPrompt({ user = "guest", isAdmin = false } = {}) {
  const host = window.location.hostname || "localhost";
  const path = window.location.pathname ? `~${window.location.pathname}` : "~";
  const symbol = isAdmin ? "#" : "$";
  return `${user}@${host}:${path}${symbol}`;
}
