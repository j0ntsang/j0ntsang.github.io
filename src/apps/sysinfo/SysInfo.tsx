import React, { useMemo, useState } from "react";
import { SystemInfo } from "./SystemInfo";
import { ConnectionInfo } from "./ConnectionInfo";

const TABS = [
  { id: "system", label: "System" },
  { id: "connection", label: "Connection" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const SysInfo: React.VFC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("system");

  const content = useMemo(() => {
    switch (activeTab) {
      case "connection":
        return <ConnectionInfo />;
      case "system":
      default:
        return <SystemInfo />;
    }
  }, [activeTab]);

  const sidebar = (
    <div className="sidebar-system-info__wrapper" tabIndex={0}>
      <div className="sidebar-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`sidebar-tabpanel-${tab.id}`}
            id={`sidebar-tab-${tab.id}`}
            className={
              activeTab === tab.id ? "sidebar-tab active" : "sidebar-tab"
            }
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
        {content}
      </div>
    </div>
  );

  return sidebar;
};
