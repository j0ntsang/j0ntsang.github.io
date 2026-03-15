import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import "./SidebarSystemInfo.css";

type BrowserInfo = {
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
  languages: string[];
};

type SystemInfo = {
  cpuCores: number;
  touchPoints: number;
};

type DisplayInfo = {
  resolution: string;
  availableResolution: string;
  colorDepth: number;
  pixelRatio: number;
};

type ViewportInfo = {
  inner: string;
  outer: string;
};

type PageInfo = {
  url: string;
  protocol: string;
  hostname: string;
  path: string;
  query: string;
  hash: string;
};

type NetworkInfo = {
  online: boolean;
};

type TimeInfo = {
  timezone: string;
  iso: string;
  local: string;
};

type FeatureInfo = {
  cookiesEnabled: boolean;
  doNotTrack: string | null;
};

type NavigationInfo = {
  referrer: string;
  historyLength: number;
};

type SidebarState = {
  browser: BrowserInfo;
  system: SystemInfo;
  display: DisplayInfo;
  viewport: ViewportInfo;
  locale: unknown;
  network: NetworkInfo;
  page: PageInfo;
  features: FeatureInfo;
  navigation: NavigationInfo;
  time: TimeInfo;
};

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

function formatValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function getValueFromState(state: SidebarState, key: string) {
  const parts = key.split(".");
  let cursor: any = state;
  for (const part of parts) {
    if (cursor == null) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function readBrowserInfo(): BrowserInfo {
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

function readSystemInfo(): SystemInfo {
  return {
    cpuCores:
      typeof navigator.hardwareConcurrency === "number"
        ? navigator.hardwareConcurrency
        : -1,
    touchPoints:
      typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0,
  };
}

function readDisplayInfo(): DisplayInfo {
  const { width, height, availWidth, availHeight, colorDepth } =
    window.screen || ({} as Screen);
  return {
    resolution: `${width || 0}x${height || 0}`,
    availableResolution: `${availWidth || 0}x${availHeight || 0}`,
    colorDepth: typeof colorDepth === "number" ? colorDepth : 0,
    pixelRatio:
      typeof window.devicePixelRatio === "number"
        ? window.devicePixelRatio
        : 1,
  };
}

function readViewportInfo(): ViewportInfo {
  return {
    inner: `${window.innerWidth}x${window.innerHeight}`,
    outer: `${window.outerWidth}x${window.outerHeight}`,
  };
}

function readPageInfo(): PageInfo {
  return {
    url: location.href,
    protocol: location.protocol,
    hostname: location.hostname,
    path: location.pathname,
    query: location.search,
    hash: location.hash,
  };
}

function readNetworkInfo(): NetworkInfo {
  return {
    online: navigator.onLine,
  };
}

function readTimeInfo(): TimeInfo {
  const now = new Date();
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    iso: now.toISOString(),
    local: now.toLocaleString(),
  };
}

function readFeatureInfo(): FeatureInfo {
  return {
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
  };
}

function readNavigationInfo(): NavigationInfo {
  return {
    referrer: document.referrer || "",
    historyLength: history.length,
  };
}

function getInitialState(): SidebarState {
  return {
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
}

function mergeState(current: SidebarState, partial: Partial<SidebarState>): SidebarState {
  const result: any = { ...current };
  for (const groupKey of Object.keys(partial) as Array<keyof SidebarState>) {
    const incoming = partial[groupKey];
    if (typeof incoming !== "object" || incoming === null) {
      (result as any)[groupKey] = incoming;
      continue;
    }
    (result as any)[groupKey] = {
      ...(result as any)[groupKey],
      ...incoming,
    };
  }
  return result;
}

export const SidebarSystemInfo: React.VFC = () => {
  const [state, setState] = useState<SidebarState>(() => getInitialState());

  useEffect(() => {
    function updateDisplayAndViewport() {
      setState((prev) =>
        mergeState(prev, {
          display: readDisplayInfo(),
          viewport: readViewportInfo(),
        })
      );
    }

    function updatePageAndNavigation() {
      setState((prev) => mergeState(prev, {
        page: readPageInfo(),
        navigation: readNavigationInfo(),
      }));
    }

    function updateNetwork() {
      setState((prev) => mergeState(prev, { network: readNetworkInfo() }));
    }

    function updateClock() {
      setState((prev) => mergeState(prev, { time: readTimeInfo() }));
    }

    window.addEventListener("resize", updateDisplayAndViewport, { passive: true });
    window.addEventListener("popstate", updatePageAndNavigation, { passive: true });
    window.addEventListener("hashchange", updatePageAndNavigation, { passive: true });
    window.addEventListener("online", updateNetwork, { passive: true });
    window.addEventListener("offline", updateNetwork, { passive: true });

    const intervalId = window.setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener("resize", updateDisplayAndViewport);
      window.removeEventListener("popstate", updatePageAndNavigation);
      window.removeEventListener("hashchange", updatePageAndNavigation);
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      window.clearInterval(intervalId);
    };
  }, []);

  const content = useMemo(() => {
    return (
      <div className="sidebar-system-info__wrapper">
        {GROUPS.map((group) => (
          <section className="sidebar-section" key={group.id}>
            <div className="sidebar-section__heading">{group.title}</div>
            <div className="sidebar-section__list">
              {group.fields.map((field) => (
                <React.Fragment key={field.key}>
                  <div className="sidebar-row__label">{field.label}</div>
                  <div className="sidebar-row__value">
                    {formatValue(getValueFromState(state, field.key))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }, [state]);

  const portalRoot = typeof document !== "undefined" ? document.getElementById("sidebar") : null;
  if (!portalRoot) return null;
  return createPortal(content, portalRoot);
};
