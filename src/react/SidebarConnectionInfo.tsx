import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ConnectionInfo = {
  supported: boolean;
  effectiveType: string;
  downlink: number | "unknown";
  rtt: number | "unknown";
  saveData: boolean | "unknown";
  type: string;
};

type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener?: (
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
};

function formatConnectionValue(value: number | boolean | string | "unknown") {
  if (value === "unknown") return "unknown";
  return String(value);
}

function SidebarFieldRow({
  label,
  value,
}: {
  label?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="sidebar-row" tabIndex={0} role="row" aria-label={label}>
      {label ? <div className="sidebar-row__label">{label}</div> : null}
      <div className="sidebar-row__value">{value}</div>
    </div>
  );
}

export const SidebarConnectionInfo: React.VFC<{ usePortal?: boolean }> = ({
  usePortal = true,
}) => {
  const [connection, setConnection] = useState<ConnectionInfo>(() => ({
    supported: typeof (navigator as any).connection !== "undefined",
    effectiveType: "unknown",
    downlink: "unknown",
    rtt: "unknown",
    saveData: "unknown",
    type: "unknown",
  }));

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: NetworkInformation };
    const conn = nav.connection;

    if (!conn) return;

    const update = () => {
      setConnection({
        supported: true,
        effectiveType: conn.effectiveType || "unknown",
        downlink: typeof conn.downlink === "number" ? conn.downlink : "unknown",
        rtt: typeof conn.rtt === "number" ? conn.rtt : "unknown",
        saveData:
          typeof conn.saveData === "boolean" ? conn.saveData : "unknown",
        type: (conn as any).type || "unknown",
      });
    };

    update();
    conn.addEventListener?.("change", update, { passive: true });

    return () => {
      conn.removeEventListener?.("change", update);
    };
  }, []);

  const content = useMemo(() => {
    return (
      <div tabIndex={0}>
        <section className="sidebar-section" key="connection">
          <div className="sidebar-section__heading">Connection</div>
          <div className="sidebar-section__list">
            <SidebarFieldRow
              label="Supported"
              value={connection.supported ? "Yes" : "No"}
            />
            <SidebarFieldRow
              label="Effective Type"
              value={formatConnectionValue(connection.effectiveType)}
            />
            <SidebarFieldRow
              label="Downlink (Mbps)"
              value={formatConnectionValue(connection.downlink)}
            />
            <SidebarFieldRow
              label="RTT (ms)"
              value={formatConnectionValue(connection.rtt)}
            />
            <SidebarFieldRow
              label="Save Data"
              value={formatConnectionValue(connection.saveData)}
            />
            <SidebarFieldRow
              label="Type"
              value={formatConnectionValue(connection.type)}
            />
          </div>
        </section>
      </div>
    );
  }, [connection]);

  if (!usePortal) return content;

  const portalRoot =
    typeof document !== "undefined" ? document.getElementById("sidebar") : null;
  if (!portalRoot) return null;
  return createPortal(content, portalRoot);
};
