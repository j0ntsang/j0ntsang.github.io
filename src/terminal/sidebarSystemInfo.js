// SidebarSystemInfo: Live updating browser/system metadata panel.

// This module maintains a central state object, listens to relevant browser events, and updates
// only rows that have changed using requestAnimationFrame batching.

/**
 * @typedef {{
 *   userAgent: string;
 *   platform: string;
 *   vendor: string;
 *   language: string;
 *   languages: string[];
 * }} BrowserInfo;
 *
 * @typedef {{
 *   cpuCores: number;
 *   touchPoints: number;
 * }} SystemInfo;
 *
 * @typedef {{
 *   resolution: string;
 *   availableResolution: string;
 *   colorDepth: number;
 *   pixelRatio: number;
 * }} DisplayInfo;
 *
 * @typedef {{
 *   inner: string;
 *   outer: string;
 * }} ViewportInfo;
 *
 * @typedef {{
 *   url: string;
 *   protocol: string;
 *   hostname: string;
 *   path: string;
 *   query: string;
 *   hash: string;
 * }} PageInfo;
 *
 * @typedef {{
 *   online: boolean;
 * }} NetworkInfo;
 *
 * @typedef {{
 *   timezone: string;
 *   iso: string;
 *   local: string;
 * }} TimeInfo;
 *
 * @typedef {{
 *   cookiesEnabled: boolean;
 *   doNotTrack: string | null;
 * }} FeatureInfo;
 *
 * @typedef {{
 *   referrer: string;
 *   historyLength: number;
 * }} NavigationInfo;
 *
 * @typedef {{
 *   browser: BrowserInfo;
 *   system: SystemInfo;
 *   display: DisplayInfo;
 *   viewport: ViewportInfo;
 *   locale: unknown; // unused placeholder (kept for shape compatibility)
 *   network: NetworkInfo;
 *   page: PageInfo;
 *   features: FeatureInfo;
 *   navigation: NavigationInfo;
 *   time: TimeInfo;
 * }} SidebarState;
 */

function readBrowserInfo() {
  return {
    userAgent: navigator.userAgent || "",
    platform: navigator.platform || "",
    vendor: navigator.vendor || "",
    language: navigator.language || "",
    languages: Array.isArray(navigator.languages)
      ? navigator.languages
      : [navigator.language || ""],
  };
}

function readSystemInfo() {
  return {
    cpuCores:
      typeof navigator.hardwareConcurrency === "number"
        ? navigator.hardwareConcurrency
        : -1,
    touchPoints:
      typeof navigator.maxTouchPoints === "number"
        ? navigator.maxTouchPoints
        : 0,
  };
}

function readDisplayInfo() {
  const { width, height, availWidth, availHeight, colorDepth } =
    window.screen || {};
  return {
    resolution: `${width || 0}x${height || 0}`,
    availableResolution: `${availWidth || 0}x${availHeight || 0}`,
    colorDepth: typeof colorDepth === "number" ? colorDepth : 0,
    pixelRatio:
      typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1,
  };
}

function readViewportInfo() {
  return {
    inner: `${window.innerWidth}x${window.innerHeight}`,
    outer: `${window.outerWidth}x${window.outerHeight}`,
  };
}

function readPageInfo() {
  return {
    url: location.href,
    protocol: location.protocol,
    hostname: location.hostname,
    path: location.pathname,
    query: location.search,
    hash: location.hash,
  };
}

function readNetworkInfo() {
  return {
    online: navigator.onLine,
  };
}

function readTimeInfo() {
  const now = new Date();
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    iso: now.toISOString(),
    local: now.toLocaleString(),
  };
}

function readFeatureInfo() {
  return {
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
  };
}

function readNavigationInfo() {
  return {
    referrer: document.referrer || "",
    historyLength: history.length,
  };
}

function formatValue(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function createRow(label, key, value) {
  const row = document.createElement("div");
  row.className = "sidebar-row";

  const labelEl = document.createElement("div");
  labelEl.className = "sidebar-row__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.className = "sidebar-row__value";
  valueEl.dataset.key = key;
  valueEl.textContent = formatValue(value);

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return { row, valueEl };
}

function createSection(title, fields, state, valueMap) {
  const section = document.createElement("div");
  section.className = "sidebar-section";

  const heading = document.createElement("div");
  heading.className = "sidebar-section__heading";
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sidebar-section__list";

  for (const { key, label } of fields) {
    const initialValue = getValueFromState(state, key);
    const { row, valueEl } = createRow(label, key, initialValue);
    valueMap.set(key, valueEl);
    list.appendChild(row);
  }

  section.appendChild(list);
  return section;
}

const GROUPS = [
  {
    id: "network",
    title: "NETWORK",
    fields: [{ key: "network.online", label: "Online" }],
  },
  {
    id: "time",
    title: "TIME",
    fields: [
      { key: "time.timezone", label: "Timezone" },
      { key: "time.iso", label: "ISO" },
      { key: "time.local", label: "Local" },
    ],
  },
  {
    id: "navigation",
    title: "NAVIGATION",
    fields: [
      { key: "navigation.referrer", label: "Referrer" },
      { key: "navigation.historyLength", label: "History Length" },
    ],
  },

  {
    id: "system",
    title: "SYSTEM",
    fields: [
      { key: "system.cpuCores", label: "CPU Cores" },
      { key: "system.touchPoints", label: "Touch Points" },
    ],
  },
  {
    id: "display",
    title: "DISPLAY",
    fields: [
      { key: "display.resolution", label: "Screen" },
      { key: "display.availableResolution", label: "Available" },
      { key: "display.pixelRatio", label: "Pixel Ratio" },
      { key: "display.colorDepth", label: "Color Depth" },
    ],
  },
  {
    id: "viewport",
    title: "VIEWPORT",
    fields: [
      { key: "viewport.inner", label: "Inner" },
      { key: "viewport.outer", label: "Outer" },
    ],
  },
  {
    id: "browser",
    title: "BROWSER",
    fields: [
      { key: "browser.vendor", label: "Vendor" },
      { key: "browser.language", label: "Language" },
      { key: "browser.userAgent", label: "User Agent" },
      { key: "browser.platform", label: "Platform" },
      { key: "browser.languages", label: "Languages" },
    ],
  },
  {
    id: "features",
    title: "FEATURES",
    fields: [
      { key: "features.cookiesEnabled", label: "Cookies" },
      { key: "features.doNotTrack", label: "Do Not Track" },
    ],
  },

  {
    id: "page",
    title: "PAGE",
    fields: [
      { key: "page.hostname", label: "Hostname" },
      { key: "page.path", label: "Path" },
      { key: "page.url", label: "URL" },
      { key: "page.query", label: "Query" },
      { key: "page.hash", label: "Hash" },
      { key: "page.protocol", label: "Protocol" },
    ],
  },
];

function pathToKey(path) {
  return path;
}

function getValueFromState(state, key) {
  const parts = key.split(".");
  let cursor = state;
  for (const part of parts) {
    if (cursor == null) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function diffState(currentState, partialState) {
  const changedKeys = [];

  for (const groupKey of Object.keys(partialState)) {
    const groupValue = partialState[groupKey];
    if (typeof groupValue !== "object" || groupValue === null) {
      const currentValue = currentState[groupKey];
      if (currentValue !== groupValue) {
        changedKeys.push(groupKey);
      }
      continue;
    }

    for (const fieldKey of Object.keys(groupValue)) {
      const fullKey = `${groupKey}.${fieldKey}`;
      const currentValue = getValueFromState(currentState, fullKey);
      const nextValue = groupValue[fieldKey];
      if (currentValue !== nextValue) {
        changedKeys.push(fullKey);
      }
    }
  }

  return changedKeys;
}

/**
 * Initialize a live-updating sidebar showing system/browser information.
 */
export function initializeSidebarSystemInfo(container) {
  if (!container) return;

  const valueMap = new Map();
  let state = {
    browser: readBrowserInfo(),
    system: readSystemInfo(),
    display: readDisplayInfo(),
    viewport: readViewportInfo(),
    locale: {},
    network: readNetworkInfo(),
    page: readPageInfo(),
    features: readFeatureInfo(),
    navigation: readNavigationInfo(),
    time: readTimeInfo(),
  };

  const wrapper = document.createElement("div");
  wrapper.className = "sidebar-system-info__wrapper";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.flex = "1 1 0";
  wrapper.style.minHeight = "0";
  wrapper.style.overflow = "auto";

  for (const group of GROUPS) {
    const section = createSection(group.title, group.fields, state, valueMap);
    wrapper.appendChild(section);
  }

  const style = document.createElement("style");
  style.textContent = `
    .sidebar-system-info__wrapper {
      padding: 12px 10px;
    }

    .sidebar-section {
      margin-bottom: 16px;
    }

    .sidebar-section__heading {
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      opacity: 0.75;
    }

    .sidebar-section__list {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 8px;
      align-items: flex-start;
    }

    .sidebar-row {
      display: contents;
    }

    .sidebar-row__label {
      opacity: 0.85;
      font-size: 16px;
      padding-right: 4px;
      text-align: left;
      white-space: nowrap;
    }

    .sidebar-row__value {
      font-size: 14px;
      word-break: break-word;
      white-space: pre-wrap;
    }
  `;

  container.appendChild(style);
  container.appendChild(wrapper);

  let pendingState = {};
  let scheduled = false;

  function scheduleUpdate(partial) {
    pendingState = { ...pendingState, ...partial };
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyUpdates);
  }

  function applyUpdates() {
    scheduled = false;
    const changedKeys = diffState(state, pendingState);
    if (changedKeys.length === 0) {
      pendingState = {};
      return;
    }

    // Merge state
    state = mergeState(state, pendingState);
    pendingState = {};

    for (const key of changedKeys) {
      const valueEl = valueMap.get(key);
      if (!valueEl) continue;
      const nextValue = getValueFromState(state, key);
      valueEl.textContent = formatValue(nextValue);
    }
  }

  function mergeState(current, partial) {
    const result = { ...current };
    for (const groupKey of Object.keys(partial)) {
      const incoming = partial[groupKey];
      if (typeof incoming !== "object" || incoming === null) {
        result[groupKey] = incoming;
        continue;
      }
      result[groupKey] = { ...result[groupKey], ...incoming };
    }
    return result;
  }

  function updateDisplayAndViewport() {
    scheduleUpdate({
      display: readDisplayInfo(),
      viewport: readViewportInfo(),
    });
  }

  function updatePageAndNavigation() {
    scheduleUpdate({ page: readPageInfo(), navigation: readNavigationInfo() });
  }

  function updateNetwork() {
    scheduleUpdate({ network: readNetworkInfo() });
  }

  function updateClock() {
    scheduleUpdate({ time: readTimeInfo() });
  }

  // Event driven updates
  window.addEventListener("resize", updateDisplayAndViewport, {
    passive: true,
  });
  window.addEventListener("popstate", updatePageAndNavigation, {
    passive: true,
  });
  window.addEventListener("hashchange", updatePageAndNavigation, {
    passive: true,
  });
  window.addEventListener("online", updateNetwork, { passive: true });
  window.addEventListener("offline", updateNetwork, { passive: true });

  const intervalId = setInterval(updateClock, 1000);

  // Cleanup is optional but helpful for SPA-like navigation.
  return () => {
    window.removeEventListener("resize", updateDisplayAndViewport);
    window.removeEventListener("popstate", updatePageAndNavigation);
    window.removeEventListener("hashchange", updatePageAndNavigation);
    window.removeEventListener("online", updateNetwork);
    window.removeEventListener("offline", updateNetwork);
    clearInterval(intervalId);
  };
}
