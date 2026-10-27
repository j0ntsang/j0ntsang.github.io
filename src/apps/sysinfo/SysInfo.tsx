import React, { useState } from "react";
import { SystemInfo } from "./SystemInfo";
import { ConnectionInfo } from "./ConnectionInfo";

const TABS = [
  { id: "system", label: "System" },
  { id: "connection", label: "Connection" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const SysInfo: React.VFC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("system");

  // Focusable so the keyboard can scroll it: the only tab stop besides the tabs.
  return (
    <div
      className="sidebar-system-info__wrapper"
      role="region"
      aria-label="System info"
      tabIndex={0}
    >
      <div className="sidebar-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`sidebar-tabpanel-${tab.id}`}
            id={`sidebar-tab-${tab.id}`}
            className="sidebar-tab"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="sidebar-tabpanel"
        role="tabpanel"
        id={`sidebar-tabpanel-${activeTab}`}
        aria-labelledby={`sidebar-tab-${activeTab}`}
      >
        {activeTab === "connection" ? <ConnectionInfo /> : <SystemInfo />}
      </div>
    </div>
  );
};
