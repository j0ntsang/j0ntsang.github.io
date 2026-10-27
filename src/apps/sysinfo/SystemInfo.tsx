import React, { useEffect, useState } from "react";

import { SidebarSection } from "./SidebarSection";
import "./sysinfo.css";

type BrowserInfo = {
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
};

type HardwareInfo = {
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
  system: HardwareInfo;
  display: DisplayInfo;
  viewport: ViewportInfo;
  network: NetworkInfo;
  page: PageInfo;
  features: FeatureInfo;
  navigation: NavigationInfo;
  time: TimeInfo;
};

const GROUPS = [
  {
    id: "network",
    title: "Network",
    fields: [{ key: "network.online", label: "Status" }],
  },
  {
    id: "time",
    title: "Time",
    fields: [
      { key: "time.timezone", label: "Timezone" },
      { key: "time.iso", label: "ISO" },
      { key: "time.local", label: "Local" },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    fields: [
      { key: "navigation.referrer", label: "Referrer" },
      { key: "navigation.historyLength", label: "History Length" },
    ],
  },
  {
    id: "system",
    title: "System",
    fields: [
      { key: "system.cpuCores", label: "CPU Cores" },
      { key: "system.touchPoints", label: "Touch Points" },
    ],
  },
  {
    id: "display",
    title: "Display",
    fields: [
      { key: "display.resolution", label: "Screen" },
      { key: "display.availableResolution", label: "Available" },
      { key: "display.pixelRatio", label: "Pixel Ratio" },
      { key: "display.colorDepth", label: "Color Depth" },
    ],
  },
  {
    id: "viewport",
    title: "Viewport",
    fields: [
      { key: "viewport.inner", label: "Inner" },
      { key: "viewport.outer", label: "Outer" },
    ],
  },
  {
    id: "browser",
    title: "Browser",
    fields: [
      { key: "browser.platform", label: "Platform" },
      { key: "browser.vendor", label: "Vendor" },
      { key: "browser.userAgent", label: "User Agent" },
      { key: "browser.language", label: "Language" },
    ],
  },
  {
    id: "features",
    title: "Features",
    fields: [
      { key: "features.cookiesEnabled", label: "Cookies" },
      { key: "features.doNotTrack", label: "Do Not Track" },
    ],
  },
  {
    id: "page",
    title: "Page",
    fields: [
      { key: "page.protocol", label: "Protocol" },
      { key: "page.hostname", label: "Hostname" },
      { key: "page.path", label: "Path" },
      { key: "page.url", label: "URL" },
      { key: "page.query", label: "Query" },
      { key: "page.hash", label: "Hash" },
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

  const stringValue = String(value);
  if (stringValue.length > 1 && stringValue.endsWith("/")) {
    return stringValue.slice(0, -1);
  }

  return stringValue;
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
  };
}

function readSystemInfo(): HardwareInfo {
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

function readDisplayInfo(): DisplayInfo {
  const { width, height, availWidth, availHeight, colorDepth } =
    window.screen || ({} as Screen);
  return {
    resolution: `${width || 0}x${height || 0}`,
    availableResolution: `${availWidth || 0}x${availHeight || 0}`,
    colorDepth: typeof colorDepth === "number" ? colorDepth : 0,
    pixelRatio:
      typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1,
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
    protocol: location.protocol.replace(/:$/, ""),
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
    network: readNetworkInfo(),
    page: readPageInfo(),
    features: readFeatureInfo(),
    navigation: readNavigationInfo(),
    time: readTimeInfo(),
  };
}

function mergeState(
  current: SidebarState,
  partial: Partial<SidebarState>,
): SidebarState {
  const result: any = { ...current };
  for (const groupKey of Object.keys(partial) as Array<keyof SidebarState>) {
    result[groupKey] = { ...result[groupKey], ...partial[groupKey] };
  }
  return result;
}

export const SystemInfo: React.VFC = () => {
  const [state, setState] = useState<SidebarState>(() => getInitialState());

  useEffect(() => {
    function updateDisplayAndViewport() {
      setState((prev) =>
        mergeState(prev, {
          display: readDisplayInfo(),
          viewport: readViewportInfo(),
        }),
      );
    }

    function updatePageAndNavigation() {
      setState((prev) =>
        mergeState(prev, {
          page: readPageInfo(),
          navigation: readNavigationInfo(),
        }),
      );
    }

    function updateNetwork() {
      setState((prev) => mergeState(prev, { network: readNetworkInfo() }));
    }

    function updateClock() {
      setState((prev) => mergeState(prev, { time: readTimeInfo() }));
    }

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

  return (
    <>
      {GROUPS.map((group) => (
        <SidebarSection
          key={group.id}
          title={group.title}
          rows={group.fields.map((field) => {
            const value = getValueFromState(state, field.key);
            return [
              field.label,
              field.key === "network.online" ? (
                <NetworkStatus online={Boolean(value)} />
              ) : (
                formatValue(value)
              ),
            ];
          })}
        />
      ))}
    </>
  );
};

function NetworkStatus({ online }: { online: boolean }) {
  return (
    <span className={`network-status ${online ? "online" : "offline"}`}>
      {online ? "Online" : "Offline"}
    </span>
  );
}
